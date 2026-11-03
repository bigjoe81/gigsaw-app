import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

const currentRelease: string = JSON.parse(readFileSync('src/assets/changelog.json', 'utf8')).current;

const settings = '/band/7/impostazioni';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(release => localStorage.setItem('gigsaw:last-seen-changelog', release), currentRelease);
  await page.route('https://www.clarity.ms/**', (route) => route.abort());
  await page.route('**/api/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    const band = {
      id: 7,
      name: 'Demo Band',
      currentUserRole: 'ADMIN',
      joinCode: 'DEMO',
      genres: [],
      members: [{ id: 1, name: 'Demo', role: 'ADMIN', instruments: ['Piano'] }],
      invitations: [],
      pressPhotos: [],
      inputChannels: [],
      stagePlotLayout: [],
    };
    await route.fulfill({
      json: path.endsWith('/me')
        ? { id: 1, name: 'Demo' }
        : path.endsWith('/bands/user')
          ? [band]
          : /\/bands\/7$/.test(path)
            ? band
            : [],
    });
  });
});

test('settings sections keep profile edits while navigating and submit the existing API contract', async ({ page }) => {
  await page.goto(`${settings}/profilo`);
  const name = page.getByRole('textbox', { name: 'Nome band', exact: true });
  await name.fill('Band rinominata');
  const sections = page.getByRole('navigation', { name: 'Sezioni impostazioni band' });
  await sections.getByRole('link', { name: 'Media e press kit' }).click();
  await expect(page.getByRole('button', { name: 'Esporta ZIP' })).toBeVisible();
  await expect(name).toBeHidden();
  await sections.getByRole('link', { name: 'Profilo', exact: true }).click();
  await expect(name).toHaveValue('Band rinominata');

  let payload = '';
  await page.route('**/api/v1/bands/7', async (route) => {
    payload = route.request().postData() ?? '';
    await route.fulfill({ json: { id: 7, name: 'Band rinominata', currentUserRole: 'ADMIN', genres: [] } });
  });
  await page.getByRole('button', { name: 'Salva profilo band' }).click();
  await expect(page.getByText('Profilo band salvato.', { exact: true })).toBeVisible();
  expect(payload).toContain('Band rinominata');
  expect(payload).toContain('name="_method"');
  expect(payload).toContain('PUT');
});

test('technical setup presets populate channels and stage and save through the band API', async ({ page }) => {
  await page.goto(`${settings}/scheda-tecnica`);
  await page.getByText('Parti da un setup pronto', { exact: false }).click();
  await page.getByRole('button', { name: 'Power trio', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Nome canale', exact: true })).not.toHaveCount(0);
  await page.getByRole('button', { name: /Palco/ }).click();
  await expect(page.getByText('Palco visto dal pubblico', { exact: true })).toBeVisible();
  await expect(page.locator('.stage-plot-item')).not.toHaveCount(0);

  let payload = '';
  await page.route('**/api/v1/bands/7', async (route) => {
    payload = route.request().postData() ?? '';
    await route.fulfill({ json: { id: 7, name: 'Demo Band', currentUserRole: 'ADMIN' } });
  });
  await page.getByRole('button', { name: 'Salva scheda tecnica' }).click();
  await expect(page.getByText('Scheda tecnica salvata.', { exact: true })).toBeVisible();
  expect(payload).toContain('Kick');
  expect(payload).toContain('stage_plot_layout');
});

test('profile API errors leave edits available for retry', async ({ page }) => {
  await page.goto(`${settings}/profilo`);
  await page.getByRole('textbox', { name: 'Nome band', exact: true }).fill('Da riprovare');
  await page.route('**/api/v1/bands/7', (route) =>
    route.fulfill({ status: 422, json: { message: 'Salvataggio rifiutato' } }),
  );
  await page.getByRole('button', { name: 'Salva profilo band' }).click();
  await expect(page.getByRole('textbox', { name: 'Nome band', exact: true })).toHaveValue('Da riprovare');
  await expect(page.getByRole('button', { name: 'Salva profilo band' })).toBeEnabled();
  await expect(page.getByText('Salvataggio rifiutato', { exact: true }).first()).toBeVisible();
});

test('members can edit their instruments and cannot access admin settings', async ({ page }) => {
  await page.route('**/api/v1/bands/7', (route) =>
    route.fulfill({
      json: {
        id: 7,
        name: 'Demo Band',
        currentUserRole: 'BAND_MEMBER',
        members: [{ id: 1, name: 'Demo', role: 'BAND_MEMBER', instruments: ['Piano'] }],
      },
    }),
  );
  await page.goto(`${settings}/profilo`);
  await expect(page).toHaveURL(new RegExp(`${settings}$`));
  await expect(page.getByRole('navigation', { name: 'Sezioni impostazioni band' }).getByRole('link')).toHaveCount(1);
  await page.goto(`${settings}/membri`);
  const instruments = page.getByRole('textbox', { name: 'Strumenti di Demo', exact: true });
  await instruments.fill('Piano, piano, Hammond');
  let payload: unknown;
  await page.route('**/api/v1/bands/7/user/1/strumenti', async (route) => {
    payload = route.request().postDataJSON();
    await route.fulfill({ json: { id: 1, name: 'Demo', instruments: ['Piano', 'Hammond'] } });
  });
  await page.getByRole('button', { name: 'Salva', exact: true }).click();
  await expect(page.getByText('Strumenti aggiornati.', { exact: true })).toBeVisible();
  expect(payload).toEqual({ instruments: ['Piano', 'Hammond'] });
});

test('preparing an invitation refreshes pending invitations and keeps the share link', async ({ page }) => {
  await page.goto(`${settings}/inviti`);
  const form = page.locator('#personal-invite-card');
  await form.getByRole('textbox', { name: 'Nome', exact: true }).fill('Musicista');
  await form.getByRole('textbox', { name: 'Email', exact: true }).fill('musicista@example.test');
  await page.route('**/api/v1/bands/7/user/invite', (route) =>
    route.fulfill({
      json: {
        id: 9,
        name: 'Musicista',
        email: 'musicista@example.test',
        role: 'BAND_MEMBER',
      },
    }),
  );
  await form.getByRole('button', { name: 'Prepara invito' }).click();
  await expect(page.getByText('Invito pronto per Musicista', { exact: true })).toBeVisible();
  await expect(form.getByRole('button', { name: 'Copia link' })).toBeVisible();
});
