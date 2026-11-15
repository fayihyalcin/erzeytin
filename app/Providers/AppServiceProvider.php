<?php

namespace App\Providers;

use App\Models\Category;
use App\Models\SiteSetting;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\View;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Schema::defaultStringLength(191);

        View::composer(['layouts.storefront', 'storefront.partials.*', 'welcome', 'categories.*', 'products.*', 'pages.*', 'cart.*', 'checkout.*', 'customer.*'], function ($view) {
            $settings = Schema::hasTable('site_settings') ? SiteSetting::current() : new SiteSetting();
            $categories = Schema::hasTable('categories')
                ? Category::query()
                    ->where('status', 'Aktif')
                    ->where('visibility', '!=', 'Gizli')
                    ->orderBy('sort_order')
                    ->get()
                : collect();

            $view->with([
                'settings' => $view->getData()['settings'] ?? $settings,
                'storefrontCategories' => $view->getData()['storefrontCategories'] ?? $categories,
                'cartQuantity' => collect(session('cart', []))->sum(fn ($quantity) => (int) $quantity),
            ]);
        });
    }
}
