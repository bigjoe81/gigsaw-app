# Laravel API integration

The Ionic client uses `environment.apiUrl` plus `environment.apiPath`. In development, `environment.apiUrl` is empty so API and Sanctum requests go through the Angular dev proxy and remain same-origin with the frontend. The proxy forwards `/api`, `/sanctum` and `/auth` to `https://gigsaw.test` by default (override with `API_PROXY_TARGET`) and rewrites backend cookie attributes so the browser can use Sanctum cookies on localhost. Production requests use the backend origin configured in `environment.prod.ts` (or supplied at build time).

## Required API contract

The CRUD UI is implemented for these protected routes:

- `GET|POST /api/v1/bands/{band}/songs`
- `GET|PUT|DELETE /api/v1/bands/{band}/songs/{song}`
- the same route pattern for `rehearsal-sessions`, `recording-sessions`, and `gigs`.
- the same route pattern for `venues` and `setlists`.

JSON is accepted in Laravel snake_case and converted to camelCase in the app. `duration` is represented as seconds because the existing Song Laravel validation requires an integer.

## Existing backend discrepancies

The adjacent Laravel project currently exposes only `Route::resource('songs')` at `/api/v1/songs`, filters it with `?bandId=`, and requires `band_id` in the Song payload. It has no controllers/routes for rehearsal sessions, recording sessions, gigs, venues, or persistent setlists. Its session endpoints are `POST /api/v1/login`, `POST /api/v1/logout`, and `GET /api/v1/me` (not `/user`).

To make this client functional, add the nested routes/controllers above and enforce that the authenticated user belongs to the route band. The backend’s `SongResource` should also return `notes` and `band_id` if those values are needed by the app. Do not trust a client-provided `band_id` when the band is already in the URL.

For venues, the existing migration requires `name`, `address`, `city`, `latitude`, and `longitude`, while the current model has neither `band_id` nor `$fillable`. The UI marks the first three as required and accepts optional coordinates; make the backend validation/model semantics match this contract, or make venue a deliberately global catalog and expose non-nested `/venues` routes instead. A persistent setlist needs at least `band_id`, `title`, optional `date`/`notes`, plus a `setlist_song` pivot (`setlist_id`, `song_id`, ordering). The frontend sends `song_ids` as a JSON array.

## Sanctum SPA / CORS

With the development proxy, API calls are same-origin and do not require browser CORS. For stateful Sanctum cookies, Laravel must:

1. Include `localhost:4200` (or the actual Ionic dev host and port) and the Vercel deployment domain in `SANCTUM_STATEFUL_DOMAINS`.
2. If the browser calls the API directly instead of using the proxy, allow the frontend origin in `config/cors.php`, set `supports_credentials` to `true`, and do not use `*` for credentialed origins.
3. Add `GET /sanctum/csrf-cookie` before login if using Laravel's standard XSRF-cookie middleware. The current backend login action is cookie-session based but does not expose this flow explicitly.
4. Set secure cross-site cookie attributes appropriate to direct cross-site deployments (`SameSite=None; Secure` when frontend and API are on different sites).

The auth service also accepts `{ token }` or `{ accessToken }` login responses and persists that bearer token, but the current Laravel login returns `204`, so normal operation is cookie based.

## Google authentication

The app's **Continua con Google** button redirects the browser to `GET {apiUrl}/auth/google/redirect`. After the provider callback Laravel must create the normal Sanctum/session authentication state and redirect to this exact frontend URL:

```
https://your-ionic-origin/auth/google/callback
```

The callback page restores `GET /api/v1/me`, then returns the user to the original protected route. Do not put an OAuth access token in the redirect URL.

The existing Laravel project does not include Socialite. Install it in that backend and add a server-side implementation similar to the following contract:

1. `GET /auth/google/redirect` calls `Socialite::driver('google')->redirect()`.
2. `GET /auth/google/callback` gets the provider user, finds or creates the local user by verified email, calls `Auth::login($user)` and regenerates the session.
3. It redirects only to the preconfigured Ionic callback URL, never to an arbitrary `return_url` query value.

Add `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REDIRECT_URI=https://your-api-origin/auth/google/callback` only in Laravel environment configuration. Register that backend callback URL in Google Cloud Console. The Ionic/Vercel origin must continue to be listed in Sanctum stateful domains and CORS allowed origins with credentials enabled.
