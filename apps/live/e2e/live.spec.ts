import { test, expect } from '@playwright/test';

test('stage traverses songs, pauses and intermezzi, persists position and font', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('link', { name: /Apri il concerto/ }).click();
  await expect(
    page.getByRole('heading', { name: 'Benvenuti al crossroads' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Avanti →', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Straight to Jail' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Ingrandisci testo' }).click();
  await page.getByRole('button', { name: 'Avanti →', exact: true }).click();
  await page.getByRole('button', { name: 'Avanti →', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Pausa', exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Pausa', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.part-content')).toHaveCSS('font-size', '28px');
  await page.getByRole('button', { name: 'Concentrati', exact: true }).click();
  await expect(
    page.getByRole('complementary', { name: 'Scaletta' }),
  ).toBeHidden();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test('notes, personal parts and PDF bytes persist after reload', async ({
  page,
}) => {
  await page.goto('/materials');
  await page.getByLabel('Elemento della scaletta').selectOption('jail');
  await page
    .getByLabel('La tua parte', { exact: true })
    .fill('E7 | A7\nFinale insieme');
  await page.getByRole('button', { name: 'Salva la mia parte' }).click();
  await expect(page.getByRole('status')).toContainText('Salvato');
  await page.getByLabel('Indicazioni personali').fill('Piano brillante');
  await page.getByRole('button', { name: 'Salva nota', exact: true }).click();
  await page.getByLabel('Importa un PDF').setInputFiles({
    name: 'parte.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF'),
  });
  await expect(
    page.getByText('PDF salvato sul dispositivo, disponibile senza rete.'),
  ).toBeVisible();
  await page.reload();
  await page.getByLabel('Elemento della scaletta').selectOption('jail');
  await expect(page.getByLabel('La tua parte', { exact: true })).toHaveValue(
    'E7 | A7\nFinale insieme',
  );
  await expect(page.getByLabel('Indicazioni personali')).toHaveValue(
    'Piano brillante',
  );
  await expect(page.getByText('parte.pdf', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Torna sul palco' }).click();
  await page.getByRole('button', { name: /2 Primo set/ }).click();
  await expect(page.locator('.personal-note')).toContainText('Piano brillante');
});

test('records actual audio with song markers, saves, reloads and plays', async ({
  page,
}) => {
  await page.goto('/rehearsal');
  await page.getByRole('button', { name: /REC · Registra/ }).click();
  await expect(page.getByText('STAI REGISTRANDO')).toBeVisible();
  await page.waitForTimeout(1300);
  await page.getByLabel('Brano su cui state lavorando').selectOption('harvey');
  await page.getByRole('button', { name: '＋ Nuovo brano' }).click();
  await page.getByRole('button', { name: '■ STOP e salva' }).click();
  await expect(
    page.getByText('Salvata sul dispositivo', { exact: true }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Riascolta', exact: true }).click();
  await expect(page.locator('audio')).toHaveJSProperty('readyState', 4);
  await expect(page.locator('.marker-links')).toContainText('Blue Harvey');
  const bytes = await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve) => {
      const r = indexedDB.open('gigsaw-live-v1');
      r.onsuccess = () => resolve(r.result);
    });
    return await new Promise<number>((resolve) => {
      const r = db.transaction('local').objectStore('local').openCursor();
      r.onsuccess = () => {
        const c = r.result;
        if (!c) return resolve(0);
        if (String(c.key).startsWith('audio:'))
          return resolve((c.value as Blob).size);
        c.continue();
      };
    });
  });
  expect(bytes).toBeGreaterThan(100);
});

test('offline app shell and saved session survive a new page', async ({
  page,
  context,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Salva scaletta offline' }).click();
  await expect(
    page.getByRole('heading', { name: 'Scaletta salvata qui' }),
  ).toBeVisible();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText('Senza rete', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: /Apri il concerto/ }).click();
  await expect(
    page.getByRole('heading', { name: 'Benvenuti al crossroads' }),
  ).toBeVisible();
  const other = await context.newPage();
  await other.goto('/');
  await expect(
    other.getByRole('heading', { name: 'Scaletta salvata qui' }),
  ).toBeVisible();
  await context.setOffline(false);
});

test('microphone rejection is actionable and does not create a fake recording', async ({
  page,
}) => {
  await page.goto('/rehearsal');
  await page.evaluate(() => {
    navigator.mediaDevices.getUserMedia = async () => {
      throw new DOMException('Denied', 'NotAllowedError');
    };
  });
  await page.getByRole('button', { name: /REC · Registra/ }).click();
  await expect(page.getByRole('alert')).toContainText(
    'Microfono non autorizzato',
  );
  await expect(page.getByText('STAI REGISTRANDO')).toBeHidden();
  await expect(
    page.getByText('Ancora nessuna take.', { exact: false }),
  ).toBeVisible();
});

test('interrupted recording recovers committed audio on restart', async ({
  page,
}) => {
  await page.goto('/rehearsal');
  await page.getByRole('button', { name: /REC · Registra/ }).click();
  await expect(page.getByText('STAI REGISTRANDO')).toBeVisible();
  await page.waitForTimeout(2200);
  page.on('dialog', (dialog) => dialog.accept());
  await page.reload();
  await expect(
    page.getByText(
      'Take recuperata dopo un’interruzione: audio potenzialmente parziale.',
    ),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Riascolta', exact: true }).click();
  await expect(page.locator('audio')).toHaveJSProperty('readyState', 4);
});

test('failed note commit never reports success', async ({ page }) => {
  await page.goto('/materials');
  await page
    .getByLabel('Indicazioni personali')
    .fill('Non perdere questa nota');
  await page.evaluate(() => {
    IDBObjectStore.prototype.put = function () {
      throw new DOMException('Full', 'QuotaExceededError');
    };
  });
  await page.getByRole('button', { name: 'Salva nota', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Testo non salvato');
  await expect(page.getByLabel('Indicazioni personali')).toHaveValue(
    'Non perdere questa nota',
  );
  await expect(
    page.getByText('Salvato sul dispositivo.', { exact: true }),
  ).toBeHidden();
});
