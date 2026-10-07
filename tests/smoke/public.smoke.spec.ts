import { expect, test } from '@playwright/test';

const publicRoutes = [
  { path: '/accedi', marker: /Invia codice/i },
  { path: '/registrati', marker: /Crea|Registr/i },
  { path: '/password-dimenticata', marker: /password|codice|email/i },
];

for (const route of publicRoutes) {
  test(`${route.path} renders`, async ({ page }) => {
    const response = await page.goto(route.path, { waitUntil: 'domcontentloaded' });

    expect(response, `No document response for ${route.path}`).not.toBeNull();
    expect(response!.status(), `${route.path} returned an HTTP error`).toBeLessThan(400);
    await expect(page.locator('body')).toContainText(route.marker);
    await expect(page.locator('ion-content')).toBeVisible();
  });
}

test('legacy login URL redirects to the Italian route', async ({ page }) => {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/accedi(?:[?#].*)?$/);
  await expect(page.getByText('Invia codice', { exact: false })).toBeVisible();
});

test('unknown route does not leave a blank application shell', async ({ page }) => {
  await page.goto('/smoke-route-that-does-not-exist', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('ion-app')).toBeVisible();
  await expect(page.locator('body')).not.toBeEmpty();
});
