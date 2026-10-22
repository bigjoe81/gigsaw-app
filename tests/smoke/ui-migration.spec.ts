import { expect, test } from '@playwright/test';

const band = { id: 7, name: 'Demo Band', genres: [], members: [], joinCode: 'DEMO' };
const song = { id: 2, title: 'Native Blues', performedBy: 'Demo Artist', status: 'active', key: 'G', bpm: 120 };
test.beforeEach(async ({ page }) => {
  await page.route('**/api/v1/**', async route => {
    const path = new URL(route.request().url()).pathname;
    const data = path.endsWith('/me') ? { id: 1, name: 'Demo', email: 'demo@example.test' }
      : path.endsWith('/bands/user') ? [band]
      : /\/bands\/7$/.test(path) ? band
      : path.endsWith('/songs/2') ? song
      : path.endsWith('/songs') ? [song]
      : path.endsWith('/rehearsal-rooms') ? [{ id: 5, name: 'Sala Demo' }]
      : path.endsWith('/registration-challenge') ? { token: 'demo', waitSeconds: 0 }
      : [];
    await route.fulfill({ json: data });
  });
  await page.route('https://www.clarity.ms/**', route => route.abort());
});

test('DaisyUI band modal cancels with Escape and reopens', async ({ page }) => {
  await page.goto('/band');
  await page.getByRole('button', { name: /Crea una band/ }).first().click();
  const dialog = page.locator('dialog[open]'); await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape'); await expect(dialog).toHaveCount(0);
  await page.getByRole('button', { name: /Crea una band/ }).first().click(); await expect(dialog).toBeVisible();
});

test('song details open in a DaisyUI dialog and return to the repertoire', async ({ page }) => {
  await page.goto('/band/7/repertorio');
  await page.getByRole('heading', { name: 'Native Blues', exact: true }).click();
  const dialog = page.locator('dialog[open]'); await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('Demo Artist');
  await dialog.getByRole('button', { name: 'Chiudi dettagli' }).click(); await expect(dialog).toHaveCount(0);
  await expect(page).toHaveURL(/repertorio$/);
});

test('native song select updates medley and form tabs', async ({ page }) => {
  await page.goto('/band/7/repertorio/nuovo');
  await page.getByLabel('Titolo', { exact: true }).fill('Native Blues');
  await page.getByRole('button', { name: 'Inserisci manualmente' }).click();
  await page.getByLabel('Durata in minuti e secondi', { exact: true }).fill('3:20');
  await page.getByRole('tab', { name: /Organizza/ }).click();
  await page.getByLabel('Medley', { exact: true }).selectOption('__new__');
  await expect(page.getByText('Nome del nuovo medley', { exact: true })).toBeVisible();
});

test('native rehearsal fields populate and update the suggested title', async ({ page }) => {
  await page.goto('/band/7/prove/nuova');
  await page.getByLabel('Data', { exact: true }).fill('2026-11-05');
  await expect(page.getByLabel('Titolo', { exact: true })).toHaveValue('Prove del 5 novembre 2026');
  await page.getByLabel('Sala prove', { exact: true }).selectOption('5');
  await expect(page.getByLabel('Sala prove', { exact: true })).toHaveValue('5');
});

test('mobile navigation opens and closes after choosing a route', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile drawer');
  await page.goto('/band/7/repertorio');
  await page.getByRole('button', { name: 'Apri navigazione' }).click();
  const menu = page.locator('.band-menu'); await expect(menu).toBeVisible();
  await menu.getByText('Concerti', { exact: true }).click();
  await expect(page).toHaveURL(/concerti$/); await expect(menu).toBeHidden();
});
