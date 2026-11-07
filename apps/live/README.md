# Gigsaw Live — Ionic + Angular

Live è un'app Ionic standalone nel workspace Angular condiviso. Dipendenze e lockfile npm sono nella radice; non creare un workspace Angular o un repository Git annidato.

## Avvio e verifica

Dalla radice, dopo `npm ci` (con `FONTAWESOME_NPM_TOKEN` configurato per il registry privato):

```sh
npm run start:live
npm run build:live
npm run test:live -- --watch=false --browsers=ChromeHeadless
```

La build Live scrive in `apps/live/www`, separatamente dall'output Web `www/`. La pagina iniziale è uno scheletro: non implementa ancora autenticazione, API o funzionalità Live.

## Capacitor

La configurazione Capacitor è in questa cartella e usa la build Live. L'identificativo `it.gigsaw.live` è iniziale e va verificato prima di pubblicare o creare i progetti nativi. Per aggiungere in futuro una piattaforma, installare prima nella radice la corrispondente dipendenza `@capacitor/ios` o `@capacitor/android` compatibile con Capacitor 8, eseguire la build Live e poi lanciare `npx cap add ios` o `npx cap add android` da `apps/live`. Eseguire `npx cap sync` dalla stessa cartella dopo le build successive.

I progetti `apps/live/ios` e `apps/live/android` saranno separati da `apps/ios-native` e `apps/android-native`.

## Codice condiviso

Usare `@gigsaw/models` per i contratti e `@gigsaw/domain` per le funzioni comuni. I servizi API saranno estratti progressivamente in `libs/api`, con autenticazione e storage adattati a browser e dispositivo. Schermate, navigazione e accesso al dispositivo appartengono a questa app.
