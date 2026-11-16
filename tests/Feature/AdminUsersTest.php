<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminUsersTest extends TestCase
{
    use RefreshDatabase;

    private function order(User $user, string $paymentStatus, float $total): Order
    {
        return Order::create([
            'code' => 'ERZ-'.uniqid(),
            'user_id' => $user->id,
            'customer_name' => $user->name,
            'item_count' => 1,
            'total' => $total,
            'payment_status' => $paymentStatus,
            'payment_method' => 'Havale',
            'status' => 'Yeni',
            'cargo_status' => 'Beklemede',
        ]);
    }

    public function test_customer_cannot_access_user_pages_or_actions(): void
    {
        $customer = User::factory()->create();
        $other = User::factory()->create();
        $redirect = route('customer.dashboard');

        $this->actingAs($customer)->get(route('admin.customers.index'))->assertRedirect($redirect);
        $this->actingAs($customer)->get(route('admin.users.index'))->assertRedirect($redirect);
        $this->actingAs($customer)->patch(route('admin.users.password', $other), [
            'password' => 'Yeni-Sifre-2026',
            'password_confirmation' => 'Yeni-Sifre-2026',
        ])->assertRedirect($redirect);
        $this->actingAs($customer)->patch(route('admin.users.grant'), ['email' => $customer->email])->assertRedirect($redirect);
        $this->actingAs($customer)->patch(route('admin.users.revoke', $other))->assertRedirect($redirect);

        $this->assertFalse($customer->fresh()->is_admin);
        $this->assertTrue(Hash::check('password', $other->fresh()->password));
    }

    public function test_guest_is_redirected_to_login(): void
    {
        $this->get(route('admin.customers.index'))->assertRedirect(route('login'));
        $this->get(route('admin.users.index'))->assertRedirect(route('login'));
    }

    public function test_admin_sees_customer_list_with_totals_and_search(): void
    {
        $admin = User::factory()->admin()->create();
        User::factory()->admin()->create(['email' => 'baska-yonetici@example.com']);
        $ayse = User::factory()->create(['name' => 'Ayşe Zeytin', 'email' => 'ayse@example.com', 'phone' => '05321112233']);
        User::factory()->create(['name' => 'Mehmet Bağ', 'email' => 'mehmet@example.com', 'phone' => '05439998877']);

        $this->order($ayse, 'Ödendi', 150);
        $this->order($ayse, 'Ödendi', 100.5);
        $this->order($ayse, 'Bekliyor', 999);

        $this->actingAs($admin)->get(route('admin.customers.index'))
            ->assertOk()
            ->assertSee('ayse@example.com')
            ->assertSee('mehmet@example.com')
            ->assertSee('3 sipariş')
            ->assertSee('₺250,50')
            ->assertDontSee('baska-yonetici@example.com');

        $this->actingAs($admin)->get(route('admin.customers.index', ['q' => 'ayse']))
            ->assertOk()->assertSee('ayse@example.com')->assertDontSee('mehmet@example.com');

        $this->actingAs($admin)->get(route('admin.customers.index', ['q' => '0543999']))
            ->assertOk()->assertSee('mehmet@example.com')->assertDontSee('ayse@example.com');
    }

    public function test_admin_sees_admin_list(): void
    {
        $admin = User::factory()->admin()->create(['email' => 'yonetici@example.com']);
        User::factory()->create(['email' => 'musteri@example.com']);

        $this->actingAs($admin)->get(route('admin.users.index'))
            ->assertOk()
            ->assertSee('yonetici@example.com')
            ->assertDontSee('musteri@example.com');
    }

    public function test_admin_can_set_password_for_customer(): void
    {
        $admin = User::factory()->admin()->create();
        $customer = User::factory()->create();

        $this->actingAs($admin)->patch(route('admin.users.password', $customer), [
            'password' => 'Yeni-Sifre-2026',
            'password_confirmation' => 'Yeni-Sifre-2026',
        ])->assertSessionHasNoErrors()->assertRedirect();

        $this->assertTrue(Hash::check('Yeni-Sifre-2026', $customer->fresh()->password));

        $this->actingAs($admin)->patch(route('admin.users.password', $customer), [
            'password' => 'Baska-Sifre-2026',
            'password_confirmation' => 'Uyusmayan-2026',
        ])->assertSessionHasErrors('password');

        $this->assertTrue(Hash::check('Yeni-Sifre-2026', $customer->fresh()->password));
    }

    public function test_admin_can_grant_by_email(): void
    {
        $admin = User::factory()->admin()->create();
        $customer = User::factory()->create(['email' => 'aday@example.com']);

        $this->actingAs($admin)->patch(route('admin.users.grant'), ['email' => 'aday@example.com'])
            ->assertSessionHasNoErrors();
        $this->assertTrue($customer->fresh()->is_admin);

        $this->actingAs($admin)->patch(route('admin.users.grant'), ['email' => 'yok@example.com'])
            ->assertSessionHasErrors('email');
    }

    public function test_admin_can_revoke_another_admin(): void
    {
        $admin = User::factory()->admin()->create();
        $other = User::factory()->admin()->create();

        $this->actingAs($admin)->patch(route('admin.users.revoke', $other))->assertSessionHasNoErrors();
        $this->assertFalse($other->fresh()->is_admin);
    }

    public function test_admin_cannot_revoke_self(): void
    {
        $admin = User::factory()->admin()->create();
        User::factory()->admin()->create();

        $this->actingAs($admin)->patch(route('admin.users.revoke', $admin))->assertSessionHasErrors('user');
        $this->assertTrue($admin->fresh()->is_admin);
    }

    public function test_last_admin_cannot_be_revoked(): void
    {
        $admin = User::factory()->admin()->create();

        // Tek yönetici kendisi: hem "kendi" hem "son yönetici" korumasına takılır.
        $this->actingAs($admin)->patch(route('admin.users.revoke', $admin))->assertSessionHasErrors('user');
        $this->assertTrue($admin->fresh()->is_admin);

        // Doğrudan "son yönetici" koruması: başka bir yönetici kalmadığında hedef kaldırılamaz.
        $target = User::factory()->admin()->create();
        $admin->forceFill(['is_admin' => false])->save();

        $this->actingAs($admin)->patch(route('admin.users.revoke', $target))->assertRedirect(route('customer.dashboard'));
        $this->assertTrue($target->fresh()->is_admin);

        $this->actingAs($target)->patch(route('admin.users.revoke', $target))->assertSessionHasErrors('user');
        $this->assertTrue($target->fresh()->is_admin);
    }

    public function test_last_admin_guard_blocks_revoking_only_remaining_admin(): void
    {
        $admin = User::factory()->admin()->create();
        $other = User::factory()->admin()->create();

        $this->actingAs($admin)->patch(route('admin.users.revoke', $other))->assertSessionHasNoErrors();
        $this->assertSame(1, User::where('is_admin', true)->count());

        // Kalan tek yönetici, başka oturumdan gelen istekle de kaldırılamaz.
        $this->actingAs($admin)->patch(route('admin.users.revoke', $admin))->assertSessionHasErrors('user');
        $this->assertSame(1, User::where('is_admin', true)->count());
    }

    public function test_is_admin_in_request_body_never_grants_admin(): void
    {
        $admin = User::factory()->admin()->create();
        $customer = User::factory()->create(['email' => 'musteri@example.com']);

        $this->actingAs($admin)->patch(route('admin.users.password', $customer), [
            'password' => 'Yeni-Sifre-2026',
            'password_confirmation' => 'Yeni-Sifre-2026',
            'is_admin' => 1,
        ])->assertSessionHasNoErrors();
        $this->assertFalse($customer->fresh()->is_admin);

        $this->actingAs($admin)->patch(route('admin.users.revoke', $customer), ['is_admin' => 1]);
        $this->assertFalse($customer->fresh()->is_admin);

        $this->actingAs($admin)->get(route('admin.customers.index', ['is_admin' => 1]))->assertOk();
        $this->assertFalse($customer->fresh()->is_admin);

        $this->actingAs($customer)->patch(route('admin.users.grant'), [
            'email' => 'musteri@example.com',
            'is_admin' => 1,
        ])->assertRedirect(route('customer.dashboard'));
        $this->assertFalse($customer->fresh()->is_admin);
    }
}
