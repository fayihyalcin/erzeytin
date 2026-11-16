<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class CheckoutPasswordTest extends TestCase
{
    use RefreshDatabase;

    private function cartWithProduct(): array
    {
        $category = Category::forceCreate(['name' => 'Zeytinyağı', 'slug' => 'zeytinyagi']);
        $product = Product::forceCreate([
            'category_id' => $category->id,
            'name' => 'Erken Hasat',
            'slug' => 'erken-hasat',
            'sku' => 'EH-1',
            'price' => 250,
            'stock' => 10,
        ]);

        return ['cart' => [$product->id => 2]];
    }

    private function orderData(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Test Müşteri',
            'email' => 'musteri@example.com',
            'phone' => '05305554433',
            'city' => 'Bursa',
            'address' => 'Test adresi',
            'payment_method' => 'transfer',
        ], $overrides);
    }

    public function test_guest_checkout_without_password_fails_validation(): void
    {
        $this->withSession($this->cartWithProduct())
            ->post(route('checkout.store'), $this->orderData())
            ->assertSessionHasErrors('password');

        $this->assertGuest();
        $this->assertDatabaseMissing('users', ['email' => 'musteri@example.com']);
        $this->assertDatabaseCount('orders', 0);
    }

    public function test_guest_checkout_with_password_creates_account_with_that_password(): void
    {
        $response = $this->withSession($this->cartWithProduct())
            ->post(route('checkout.store'), $this->orderData([
                'password' => 'Guclu-Sifre-2026',
                'password_confirmation' => 'Guclu-Sifre-2026',
            ]));

        $response->assertSessionHasNoErrors();

        $user = User::where('email', 'musteri@example.com')->firstOrFail();
        $this->assertTrue(Hash::check('Guclu-Sifre-2026', $user->password));
        $this->assertFalse($user->is_admin);
        $this->assertAuthenticatedAs($user);
        $this->assertSame(1, $user->orders()->count());
        $response->assertRedirect(route('checkout.transfer', $user->orders()->first()));
    }

    public function test_guest_checkout_requires_matching_confirmation(): void
    {
        $this->withSession($this->cartWithProduct())
            ->post(route('checkout.store'), $this->orderData([
                'password' => 'Guclu-Sifre-2026',
                'password_confirmation' => 'Baska-Sifre-2026',
            ]))
            ->assertSessionHasErrors('password');

        $this->assertDatabaseMissing('users', ['email' => 'musteri@example.com']);
    }

    public function test_logged_in_user_can_checkout_without_password(): void
    {
        $user = User::factory()->create(['email' => 'uye@example.com']);
        $originalHash = $user->password;

        $this->actingAs($user)
            ->withSession($this->cartWithProduct())
            ->post(route('checkout.store'), $this->orderData(['email' => 'uye@example.com']))
            ->assertSessionHasNoErrors()
            ->assertRedirect();

        $this->assertSame(1, $user->orders()->count());
        $this->assertSame($originalHash, $user->fresh()->password);
    }
}
