import { test, expect } from '@playwright/test';

async function registerAdmin(page, prefix) {
    await page.goto('http://127.0.0.1:8000/register', { waitUntil: 'networkidle' });

    await page.getByLabel('Name').fill(`${prefix} Admin`);
    await page.getByLabel('Email').fill(`${prefix}-${Date.now()}@ege.test`);
    await page.getByLabel('Password', { exact: true }).fill('password');
    await page.getByLabel('Confirm Password').fill('password');
    await page.getByRole('button', { name: 'Register' }).click();
}

test('admin dashboard renders after login', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 980 });
    await registerAdmin(page, 'dashboard');

    await expect(page.locator('.admin-shell')).toBeVisible();
    await expect(page.locator('.admin-sidebar')).toBeVisible();
    await expect(page.locator('.metric-card')).toHaveCount(6);
    await page.locator('.admin-user').click();
    await expect(page.locator('.admin-user-menu')).toBeVisible();
    await page.locator('.sidebar-collapse-button').click();
    await expect(page.locator('.admin-shell')).toHaveClass(/sidebar-collapsed/);
    await page.screenshot({ path: 'storage/app/admin-dashboard-desktop.png', fullPage: true });
});

test('admin dashboard mobile layout keeps sidebar behind menu', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 1000 });
    await registerAdmin(page, 'mobile-dashboard');

    await expect(page.locator('.admin-shell')).toBeVisible();
    await page.locator('.admin-menu-button').click();
    await expect(page.locator('.admin-sidebar')).toHaveClass(/is-open/);
    await page.screenshot({ path: 'storage/app/admin-dashboard-mobile.png', fullPage: true });
});

test('category management page lists real database categories and opens edit modal', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await registerAdmin(page, 'category');

    await page.goto('http://127.0.0.1:8000/dashboard/categories', { waitUntil: 'networkidle' });
    await expect(page.locator('.category-admin')).toBeVisible();
    await expect(page.locator('.category-table tbody tr')).toHaveCount(3);
    await expect(page.locator('.category-table')).toContainText('Zeytin');

    await page.locator('.admin-heading-row .category-primary-button').click();
    await expect(page.locator('.category-modal')).toBeVisible();
    await page.locator('.category-modal input[type="file"]').setInputFiles('public/images/hero-olive-grove.jpg');
    await expect(page.locator('.category-modal .upload-preview-image')).toBeVisible();
    await expect(page.locator('.category-modal input[name="image_path"]')).toHaveValue(/categories\//);
    await page.locator('.category-modal .category-modal-actions button').first().click();

    await page.locator('.category-row-actions button[type="button"]').first().click();
    await expect(page.locator('#category-modal-title')).toBeVisible();
    await page.screenshot({ path: 'storage/app/admin-categories-desktop.png', fullPage: true });
});

test('settings page updates real site settings', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1080 });
    await registerAdmin(page, 'settings');

    await page.goto('http://127.0.0.1:8000/dashboard/settings', { waitUntil: 'networkidle' });
    await expect(page.locator('.settings-admin')).toBeVisible();
    await expect(page.locator('.settings-grid')).toBeVisible();

    await page.locator('input[name="site_title"]').fill('Ege Zeytin Test Mağazası');
    await page.locator('input[name="email"]').fill('info@ege.test');
    await page.locator('input[name="whatsapp"]').fill('905551112233');
    await page.locator('input[name="paytr_merchant_id"]').fill('123456');
    await page.locator('input[name="api_base_url"]').fill('https://api.ege.test');
    await page.locator('.settings-logo-uploader input[type="file"]').setInputFiles('public/images/hero-olive-grove.jpg');
    await expect(page.locator('input[name="logo_path"]')).toHaveValue(/settings\//);
    await page.getByRole('button', { name: 'Ayarları Kaydet' }).first().click();
    await expect(page.locator('.settings-alert')).toContainText('Ayarlar');
    await expect(page.locator('input[name="site_title"]')).toHaveValue('Ege Zeytin Test Mağazası');
    await page.screenshot({ path: 'storage/app/admin-settings-desktop.png', fullPage: true });
});

test('slider management page creates edits and deletes a real slider', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1080 });
    await registerAdmin(page, 'slider');

    await page.goto('http://127.0.0.1:8000/dashboard/sliders', { waitUntil: 'networkidle' });
    await expect(page.locator('.slider-admin')).toBeVisible();

    const sliderTitle = `Er Zeytinyağı Test ${Date.now()}`;
    await page.locator('.admin-heading-row .category-primary-button').click();
    await expect(page.locator('.slider-modal')).toBeVisible();
    await page.locator('.slider-modal input[name="title"]').fill(sliderTitle);
    await page.locator('.slider-modal textarea[name="description"]').fill('Mudanya hasadından gelen özel lezzet.');
    await page.locator('.slider-modal input[name="sort_order"]').fill('30');
    await page.locator('.slider-modal input[type="file"]').first().setInputFiles('public/images/hero-olive-grove.jpg');
    await expect(page.locator('.slider-modal input[name="image_path"]')).toHaveValue(/sliders\//);
    await page.locator('.slider-modal .category-modal-actions button').last().click();
    await expect(page.locator('.slider-table')).toContainText(sliderTitle);

    await page.getByRole('button', { name: 'Edit' }).first().click();
    await expect(page.locator('#slider-modal-title')).toBeVisible();
    await page.locator('.slider-modal .category-modal-actions button').first().click();

    await page.locator('.slider-table tbody tr').filter({ hasText: sliderTitle }).getByRole('button', { name: 'Sil' }).click();
    await expect(page.locator('.slider-table')).not.toContainText(sliderTitle);
    await page.screenshot({ path: 'storage/app/admin-sliders-desktop.png', fullPage: true });
});

test('product management page creates edits and deletes a real product', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1040 });
    await registerAdmin(page, 'product');

    await page.goto('http://127.0.0.1:8000/dashboard/products', { waitUntil: 'networkidle' });
    await expect(page.locator('.product-admin')).toBeVisible();

    await page.locator('.admin-heading-row .category-primary-button').click();
    await expect(page.locator('.product-modal')).toBeVisible();
    await page.locator('.product-modal input[type="file"]').setInputFiles('public/images/hero-olive-grove.jpg');
    await expect(page.locator('.product-modal .upload-preview-image')).toBeVisible();
    await expect(page.locator('.product-modal input[name="image_path"]')).toHaveValue(/products\//);
    const productName = `Premium Hasat ${Date.now()}`;
    await page.locator('.product-modal input[name="name"]').fill(productName);
    await page.locator('.product-modal input[name="sku"]').fill(`SKU-${Date.now()}`);
    await page.locator('.product-modal input[name="price"]').fill('499.00');
    await page.locator('.product-modal input[name="stock"]').fill('12');
    await page.locator('.product-modal .category-modal-actions button').last().click();
    await expect(page.locator('.product-table')).toContainText(productName);

    await page.getByRole('button', { name: 'Edit' }).first().click();
    await expect(page.locator('#product-modal-title')).toBeVisible();
    await page.locator('.product-modal .category-modal-actions button').first().click();

    await page.getByRole('button', { name: 'Sil' }).first().click();
    await expect(page.locator('.product-table')).not.toContainText(productName);
    await page.screenshot({ path: 'storage/app/admin-products-desktop.png', fullPage: true });
});

test('product management page stays usable on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 1120 });
    await registerAdmin(page, 'product-mobile');

    await page.goto('http://127.0.0.1:8000/dashboard/products', { waitUntil: 'networkidle' });
    await expect(page.locator('.product-admin')).toBeVisible();
    await expect(page.locator('.product-table-card')).toBeVisible();

    await page.locator('.admin-menu-button').click();
    await expect(page.locator('.admin-sidebar')).toHaveClass(/is-open/);
    await page.screenshot({ path: 'storage/app/admin-products-mobile.png', fullPage: true });
});

test('order management page creates edits and deletes a real order', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1040 });
    await registerAdmin(page, 'order');

    await page.goto('http://127.0.0.1:8000/dashboard/orders', { waitUntil: 'networkidle' });
    await expect(page.locator('.order-admin')).toBeVisible();

    await page.locator('.admin-heading-row .category-primary-button').click();
    await expect(page.locator('.order-modal')).toBeVisible();
    const orderCode = `EZ-${Date.now()}`;
    await page.locator('.order-modal input[name="code"]').fill(orderCode);
    await page.locator('.order-modal input[name="customer_name"]').fill('Ayse Demir');
    await page.locator('.order-modal input[name="item_count"]').fill('2');
    await page.locator('.order-modal input[name="total"]').fill('799.00');
    await page.locator('.order-modal input[name="cargo_status"]').fill('Kargoya Hazir');
    await page.locator('.order-modal .category-modal-actions button').last().click();
    await expect(page.locator('.order-table')).toContainText(orderCode);

    await page.locator('.order-row-actions button[type="button"]').first().click();
    await expect(page.locator('.order-detail-modal')).toBeVisible();
    await page.locator('.order-detail-modal .category-modal-actions button').last().click();

    await expect(page.locator('.order-modal')).toBeVisible();
    await page.locator('.order-modal input[name="customer_name"]').fill('Ayse Demir Guncel');
    await expect(page.locator('.order-modal input[name="customer_name"]')).toHaveValue('Ayse Demir Guncel');
    await page.locator('.order-modal .category-modal-actions button').first().click();

    await page.getByRole('button', { name: 'Sil' }).first().click();
    await expect(page.locator('.order-table')).not.toContainText(orderCode);
    await page.screenshot({ path: 'storage/app/admin-orders-desktop.png', fullPage: true });
});

test('order management page stays usable on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 1120 });
    await registerAdmin(page, 'order-mobile');

    await page.goto('http://127.0.0.1:8000/dashboard/orders', { waitUntil: 'networkidle' });
    await expect(page.locator('.order-admin')).toBeVisible();
    await expect(page.locator('.order-table-card')).toBeVisible();

    await page.locator('.admin-menu-button').click();
    await expect(page.locator('.admin-sidebar')).toHaveClass(/is-open/);
    await page.screenshot({ path: 'storage/app/admin-orders-mobile.png', fullPage: true });
});
