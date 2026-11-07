# Gigsaw Apps

Monorepo di Gigsaw Web e Gigsaw Live. Backend Laravel separato.

| Percorso | Contenuto |
| --- | --- |
| `apps/web` | Gestionale Angular esistente |
| `apps/live` | App Ionic + Angular Live |
| `apps/ios-native` | Prototipo SwiftUI demo esistente |
| `apps/android-native` | Spazio per la futura app Kotlin/Compose |
| `libs/models` | Contratti TypeScript condivisi |
| `libs/domain` | Logica indipendente dalla piattaforma |
| `libs/api` | Spazio per estrarre progressivamente servizi API |
| `docs` | Documentazione comune |
| `assets/branding` | Risorse originali condivise |

## Web

Installazione e comandi dalla radice, con la stessa versione Node supportata dal progetto Angular e il token Font Awesome configurato nell'ambiente:

```sh
npm ci
npm start
npm run build:web
npm run test:web -- --watch=false --browsers=ChromeHeadless
npm run architecture:check
npm run version:check
```

`npm run build`, i comandi di versione e Playwright continuano a funzionare dalla radice. L'output web resta `www/`; `vercel.json` mantiene installazione e build nella radice. Non cambiare la Root Directory Vercel in `apps/web`: dipendenze, workspace Angular e librerie condivise risiedono nella radice.

Il registry privato usa `FONTAWESOME_NPM_TOKEN`, da configurare nell'ambiente locale, nel progetto Vercel e nei secret GitHub Actions. Non inserire token nel repository.

## Live e app native

Vedi `apps/live/README.md` per avviare e compilare Live e `apps/ios-native/README.md` per Xcode. Live contiene una pagina iniziale, senza API o autenticazione; il prototipo iOS usa dati demo, non le API reali.

Le future cartelle Capacitor `apps/live/ios` e `apps/live/android` sono distinte dalle app completamente native. Web e Live hanno build e release indipendenti; condividono contratti e logica dove appropriato. L'autenticazione e lo storage devono avere adattatori per piattaforma.

Il codice iOS è stato importato da `bigjoe81/gigsaw-live`, commit `06a35a481e28029db63b737e909d78708cbb92bb`, senza rimuovere o archiviare il repository originale. Questa importazione conserva i file, non la cronologia Git del repository sorgente.
