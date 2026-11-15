import { test, expect } from '@playwright/test';

test('contact form submits and admin can see request', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('http://127.0.0.1:8000/iletisim', { waitUntil: 'networkidle' });

    const email = `contact-${Date.now()}@example.com`;
    await page.locator('input[name="name"]').fill('Iletisim Test');
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="phone"]').fill('05301112233');
    await page.locator('input[name="subject"]').fill('Test talebi');
    await page.locator('textarea[name="message"]').fill('Web sitesi iletisim formu test mesaji.');
    await page.locator('.contact-submit').click();

    await expect(page).toHaveURL(/\/iletisim$/);
    await expect(page.locator('.cart-alert')).toContainText('Mesajınız alındı');

    await page.goto('http://127.0.0.1:8000/register', { waitUntil: 'networkidle' });
    await page.getByLabel('Name').fill('Contact Admin');
    await page.getByLabel('Email').fill(`contact-admin-${Date.now()}@ege.test`);
    await page.getByLabel('Password', { exact: true }).fill('password');
    await page.getByLabel('Confirm Password').fill('password');
    await page.getByRole('button', { name: 'Register' }).click();

    await page.goto('http://127.0.0.1:8000/dashboard/contact-messages', { waitUntil: 'networkidle' });
    await expect(page.locator('.contact-message-card').first()).toContainText(email);
});
