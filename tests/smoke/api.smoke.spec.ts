import { expect, test } from '@playwright/test';

test('Laravel API is reachable from the deployed app environment', async ({ request }) => {
  const apiBaseUrl = process.env['GIGSAW_API_URL'] ?? 'https://api.gigsaw.it';
  const response = await request.get(`${apiBaseUrl}/api/v1/user`, {
    failOnStatusCode: false,
  });

  // The endpoint is authenticated: 401 is healthy for an anonymous smoke request.
  // A 2xx is accepted too in case the backend later makes this endpoint public.
  expect([200, 401]).toContain(response.status());
});
