<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class AdminAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_is_redirected_to_login(): void
    {
        $this->get('/dashboard')->assertRedirect(route('login'));
        $this->get(route('admin.products.index'))->assertRedirect(route('login'));
    }

    public function test_regular_user_cannot_see_admin_panel(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->get('/dashboard')
            ->assertRedirect(route('customer.dashboard'));

        $this->actingAs($user)->get(route('admin.products.index'))
            ->assertRedirect(route('customer.dashboard'));

        $this->actingAs($user)->get(route('admin.settings.edit'))
            ->assertRedirect(route('customer.dashboard'));
    }

    public function test_regular_user_cannot_upload_admin_images(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->postJson(route('admin.images.store'), [
                'type' => 'product',
                'image' => UploadedFile::fake()->create('x.jpg', 10, 'image/jpeg'),
            ])
            ->assertForbidden();

        $this->actingAs($user)
            ->post(route('admin.images.store'), ['type' => 'product'])
            ->assertRedirect(route('customer.dashboard'));
    }

    public function test_admin_can_see_admin_panel(): void
    {
        $admin = User::factory()->admin()->create();

        // /dashboard ana sayfası MySQL'e özgü YEAR()/MONTH() kullandığından sqlite testinde
        // render edilemez; ara katmanın yöneticiyi geçirdiği admin.* rotalarıyla doğrulanır.
        $this->actingAs($admin)->get(route('admin.products.index'))->assertOk();
        $this->actingAs($admin)->get(route('admin.settings.edit'))->assertOk();
    }

    public function test_admin_is_redirected_to_panel_after_login(): void
    {
        $admin = User::factory()->admin()->create();

        $this->post('/login', ['email' => $admin->email, 'password' => 'password'])
            ->assertRedirect(route('dashboard', absolute: false));
    }

    public function test_registration_cannot_set_is_admin(): void
    {
        $this->post('/register', [
            'name' => 'Saldirgan',
            'email' => 'attacker@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'is_admin' => 1,
        ])->assertRedirect(route('customer.dashboard', absolute: false));

        $this->assertFalse(User::where('email', 'attacker@example.com')->first()->is_admin);
    }

    public function test_profile_update_cannot_set_is_admin(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->patch('/profile', [
            'name' => 'Yeni Ad',
            'email' => $user->email,
            'is_admin' => 1,
        ])->assertSessionHasNoErrors();

        $this->actingAs($user)->patch(route('customer.settings.update'), [
            'name' => 'Yeni Ad',
            'email' => $user->email,
            'is_admin' => 1,
        ])->assertSessionHasNoErrors();

        $user->refresh();
        $this->assertSame('Yeni Ad', $user->name);
        $this->assertFalse($user->is_admin);
    }

    public function test_admin_grant_and_revoke_commands(): void
    {
        $user = User::factory()->create(['email' => 'yonetici@example.com']);

        $this->artisan('admin:grant', ['email' => 'yonetici@example.com'])->assertSuccessful();
        $this->assertTrue($user->fresh()->is_admin);

        $this->artisan('admin:revoke', ['email' => 'yonetici@example.com'])->assertSuccessful();
        $this->assertFalse($user->fresh()->is_admin);

        $this->artisan('admin:grant', ['email' => 'yok@example.com'])->assertFailed();
    }
}
