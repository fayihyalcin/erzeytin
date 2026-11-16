import { test, expect } from '@playwright/test';

test('customer completes checkout with bank transfer and uploads receipt', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('http://127.0.0.1:8000', { waitUntil: 'networkidle' });

    await page.locator('.product-section').scrollIntoViewIfNeeded();
    await page.locator('.product-card .add-cart-button').first().click();
    await expect(page).toHaveURL(/\/sepet$/);

    await page.locator('.cart-checkout').click();
    await expect(page).toHaveURL(/\/odeme$/);

    const email = `checkout-${Date.now()}@example.com`;
    await page.locator('input[name="name"]').fill('Test Musteri');
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="phone"]').fill('05305554433');
    await page.locator('input[name="city"]').fill('Bursa');
    await page.locator('textarea[name="address"]').fill('Cepni mahallesi test adresi');
    await page.locator('input[name="password"]').fill('Test-Sifre-2026');
    await page.locator('input[name="password_confirmation"]').fill('Test-Sifre-2026');
    await page.locator('input[name="payment_method"][value="transfer"]').check();
    await page.locator('button[type="submit"].cart-checkout').click();

    await expect(page).toHaveURL(/\/odeme\/havale\/\d+$/);
    await expect(page.locator('.checkout-panel-head')).toContainText('Siparişiniz oluşturuldu');

    await page.locator('a.checkout-link-button').click();
    await expect(page).toHaveURL(/\/hesabim\/siparisler\/\d+$/);

    await page.locator('input[name="receipt"]').setInputFiles({
        name: 'dekont.png',
        mimeType: 'image/png',
        buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=', 'base64'),
    });
    await page.locator('.receipt-upload button[type="submit"]').click();
    await expect(page.locator('.cart-alert')).toContainText('Dekont yüklendi');
});
