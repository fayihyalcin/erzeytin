import { test, expect } from '@playwright/test';

test('quick view modal opens from product card', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('http://127.0.0.1:8000', { waitUntil: 'networkidle' });
    await page.locator('.product-section').scrollIntoViewIfNeeded();
    const firstProductTitle = await page.locator('.product-card h3').first().innerText();
    await page.locator('.quick-view-button').first().click();
    await expect(page.locator('.quick-view-modal')).toBeVisible();
    await expect(page.locator('#quick-view-title')).toContainText(firstProductTitle);
    await page.waitForTimeout(350);
    await page.screenshot({ path: 'storage/app/quick-view-modal-desktop.png' });
});
