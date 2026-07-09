// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  apiUrl: 'https://gigsaw.test',
  // The Laravel project currently groups its API under /api/v1.
  // Set this to '/api' when the nested band routes are moved out of v1.
  apiPath: '/api/v1',
  // Laravel Socialite redirect endpoint; kept outside the API prefix by convention.
  googleAuthPath: '/auth/google/redirect',
  mapboxAccessToken: '',
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
