import { test, expect } from '@playwright/test';

test('storefront cart adds updates and removes products', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('http://127.0.0.1:8000', { waitUntil: 'networkidle' });

    await page.locator('.product-section').scrollIntoViewIfNeeded();
    const firstProductTitle = await page.locator('.product-card h3').first().innerText();

    await page.locator('.product-card .add-cart-button').first().click();
    await expect(page).toHaveURL(/\/sepet$/);
    await expect(page.locator('.cart-row-info h2')).toContainText(firstProductTitle);
    await expect(page.locator('.cart-badge')).toContainText('1');

    await page.locator('.cart-quantity-form button[aria-label="Adedi artır"]').first().click();
    await expect(page.locator('.cart-badge')).toContainText('2');

    await page.locator('.cart-remove').first().click();
    await expect(page.locator('.cart-empty')).toBeVisible();
});
