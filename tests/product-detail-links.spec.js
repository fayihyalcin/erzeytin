import { test, expect } from '@playwright/test';

test('product card image and detail links open product detail page', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('http://127.0.0.1:8000', { waitUntil: 'networkidle' });

    await page.locator('.product-section').scrollIntoViewIfNeeded();
    const firstProductTitle = await page.locator('.product-card h3').first().innerText();

    await page.locator('.product-card .product-image-link').first().click();
    await expect(page).toHaveURL(/\/urun\//);
    await expect(page.locator('.product-detail-info h1')).toContainText(firstProductTitle);

    await page.goto('http://127.0.0.1:8000', { waitUntil: 'networkidle' });
    await page.locator('.product-section').scrollIntoViewIfNeeded();
    await page.locator('.product-card .detail-link').first().click();
    await expect(page).toHaveURL(/\/urun\//);
    await expect(page.locator('.product-detail-info h1')).toContainText(firstProductTitle);
});
