<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\AdminImageUploadController;
use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\ContactMessageController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\HomeSectionController;
use App\Http\Controllers\Admin\OrderController;
use App\Http\Controllers\Admin\ProductController;
use App\Http\Controllers\Admin\SettingController;
use App\Http\Controllers\Admin\SliderController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Storefront\CategoryController as StorefrontCategoryController;
use App\Http\Controllers\Storefront\CartController as StorefrontCartController;
use App\Http\Controllers\Storefront\CheckoutController;
use App\Http\Controllers\Storefront\ContactController;
use App\Http\Controllers\Storefront\CustomerAccountController;
use App\Http\Controllers\Storefront\CustomerOrderController;
use App\Http\Controllers\Storefront\PageController as StorefrontPageController;
use App\Http\Controllers\Storefront\PaytrCallbackController;
use App\Http\Controllers\Storefront\ProductController as StorefrontProductController;
use App\Models\HomeSection;
use App\Models\Product;
use App\Models\Slider;
use App\Models\SiteSetting;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    $homeSections = collect();

    if (Schema::hasTable('home_sections') && Schema::hasTable('products')) {
        $homeSections = HomeSection::with('category')
            ->where('status', 'Aktif')
            ->orderBy('sort_order')
            ->get()
            ->map(function (HomeSection $section) {
                $products = Product::with('category')
                    ->where('status', 'Aktif')
                    ->where('visibility', '!=', 'Gizli')
                    ->when($section->category_id, fn ($query) => $query->where('category_id', $section->category_id))
                    ->latest()
                    ->limit($section->product_limit)
                    ->get();

                $section->setRelation('products', $products);

                return $section;
            });
    }

    return view('welcome', [
        'settings' => SiteSetting::current(),
        'sliders' => Schema::hasTable('sliders')
            ? Slider::query()->where('status', 'Aktif')->orderBy('sort_order')->get()
            : collect(),
        'homeSections' => $homeSections,
    ]);
})->name('home');

Route::get('/kategori/{category:slug}', [StorefrontCategoryController::class, 'show'])->name('categories.show');
Route::get('/urun/{product:slug}', [StorefrontProductController::class, 'show'])->name('products.show');
Route::get('/iletisim', [ContactController::class, 'show'])->name('contact.show');
Route::post('/iletisim', [ContactController::class, 'store'])->name('contact.store');
Route::get('/sayfa/{slug}', [StorefrontPageController::class, 'show'])->name('pages.show');
Route::get('/sepet', [StorefrontCartController::class, 'index'])->name('cart.index');
Route::post('/sepet/ekle/{product}', [StorefrontCartController::class, 'store'])->name('cart.store');
Route::patch('/sepet/guncelle/{product}', [StorefrontCartController::class, 'update'])->name('cart.update');
Route::delete('/sepet/sil/{product}', [StorefrontCartController::class, 'destroy'])->name('cart.destroy');
Route::delete('/sepet/temizle', [StorefrontCartController::class, 'clear'])->name('cart.clear');
Route::get('/odeme', [CheckoutController::class, 'show'])->name('checkout.show');
Route::post('/odeme', [CheckoutController::class, 'store'])->name('checkout.store');
Route::post('/paytr/callback', PaytrCallbackController::class)->name('paytr.callback');

Route::get('/dashboard', [DashboardController::class, 'index'])->middleware(['auth', 'admin'])->name('dashboard');

Route::middleware(['auth', 'admin'])->prefix('dashboard')->name('admin.')->group(function () {
    Route::resource('categories', CategoryController::class)->except(['show', 'create', 'edit']);
    Route::resource('products', ProductController::class)->except(['show', 'create', 'edit']);
    Route::resource('orders', OrderController::class)->except(['show', 'create', 'edit']);
    Route::resource('sliders', SliderController::class)->except(['show', 'create', 'edit']);
    Route::resource('home-sections', HomeSectionController::class)->except(['show', 'create', 'edit']);
    Route::resource('contact-messages', ContactMessageController::class)->only(['index', 'update', 'destroy']);
    Route::get('settings', [SettingController::class, 'edit'])->name('settings.edit');
    Route::patch('settings', [SettingController::class, 'update'])->name('settings.update');
    Route::get('customers', [UserController::class, 'customers'])->name('customers.index');
    Route::get('users', [UserController::class, 'admins'])->name('users.index');
    Route::patch('users/grant', [UserController::class, 'grant'])->name('users.grant');
    Route::patch('users/{user}/revoke', [UserController::class, 'revoke'])->name('users.revoke');
    Route::patch('users/{user}/password', [UserController::class, 'password'])->name('users.password');
});

Route::post('/dashboard/uploads/image', [AdminImageUploadController::class, 'store'])
    ->middleware(['auth', 'admin'])
    ->name('admin.images.store');

Route::middleware('auth')->group(function () {
    Route::get('/odeme/paytr/{order}', [CheckoutController::class, 'paytr'])->name('checkout.paytr');
    Route::get('/odeme/havale/{order}', [CheckoutController::class, 'transfer'])->name('checkout.transfer');
    Route::get('/hesabim', [CustomerAccountController::class, 'dashboard'])->name('customer.dashboard');
    Route::get('/hesabim/odemeler', [CustomerAccountController::class, 'payments'])->name('customer.payments');
    Route::get('/hesabim/ayarlar', [CustomerAccountController::class, 'settings'])->name('customer.settings');
    Route::patch('/hesabim/ayarlar', [CustomerAccountController::class, 'updateSettings'])->name('customer.settings.update');
    Route::get('/hesabim/siparisler', [CustomerOrderController::class, 'index'])->name('customer.orders.index');
    Route::get('/hesabim/siparisler/{order}', [CustomerOrderController::class, 'show'])->name('customer.orders.show');
    Route::post('/hesabim/siparisler/{order}/dekont', [CustomerOrderController::class, 'uploadReceipt'])->name('customer.orders.receipt');
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::match(['GET', 'POST'], '/odeme/sonuc/{order}/{result}', [CheckoutController::class, 'result'])
    ->middleware('signed')
    ->name('checkout.result');

require __DIR__.'/auth.php';
