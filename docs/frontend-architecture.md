# Organizzazione del frontend

GigSaw è una singola applicazione Angular standalone, suddivisa per funzionalità. Non richiede micro frontend, ulteriori deployment o NgModule per sezione.

## Dove lavorare

- `features/<area>/pages`: pagine e coordinamento della navigazione dell'area.
- `features/<area>/components`: blocchi dell'interfaccia con una responsabilità precisa.
- `features/<area>/services`: accesso API e operazioni della funzionalità.
- `features/<area>/models`: contratti e tipi specifici dell'area.
- `features/<area>/utils`: trasformazioni e regole senza stato.
- `features/<area>/*.routes.ts`: rotte della funzionalità, caricate dall'app quando servono.
- `core`: sessione, band attiva, interceptor, API comuni e navigazione dei percorsi guidati.
- `shared`: componenti grafici, form e utilità riutilizzabili che non dipendono dalle feature.
- `layouts`: struttura esterna dell'app e navigazione tra funzionalità.

## Dipendenze tra aree

Dentro una feature usa import relativi verso i suoi file. Da un'altra feature importa esclusivamente da `api.ts` (servizi e tipi) o `ui.ts` (componenti esplicitamente riutilizzabili). Esporta solo ciò che serve ai consumatori; non esportare pagine o intere cartelle. Le rotte restano collegate direttamente nel punto di composizione dell'app.

`core` e `shared` non importano feature. Le feature non importano layout o rotte globali. I file di test possono accedere ai dettagli interni per verificarli.

`npm run architecture:check` verifica queste regole sugli import statici, dinamici e sulle riesportazioni relative. Viene eseguito prima della build e nei controlli della PR.

## Impostazioni band

`features/bands/pages/band-manage.page` carica la band, seleziona la sezione e gestisce la navigazione. I componenti in `features/bands/components/settings` possiedono separatamente profilo, scheda tecnica, media, membri e inviti.

Ogni componente riceve la band. Profilo, tecnica e media emettono `bandChange` dopo un aggiornamento; membri e inviti possono richiedere `reload`. Non si passano l'intera pagina né form appartenenti ad altre sezioni. I preset tecnici e le regole di rappresentazione del palco sono in `features/bands/utils/band-tech-presets.ts`.

Le sezioni vengono caricate con `@defer` alla prima apertura e restano montate durante il cambio scheda, conservando le modifiche non salvate. Distruggendo la pagina si interrompono le sottoscrizioni e si liberano anteprime e listener di trascinamento.

## Eventi imminenti e percorsi guidati

Card, modal e servizio degli eventi imminenti appartengono a `features/commitments`, con i tipi separati dai componenti. Le altre aree li usano attraverso le API pubbliche. Gli obiettivi e gli URL di completamento dei percorsi guidati sono in `core/navigation`, poiché collegano più funzionalità.

## Verifica

- `npm run architecture:check`
- `npm run build`
- `npx tsc --noEmit -p tsconfig.spec.json`
- `npx playwright test tests/smoke/band-settings.spec.ts` verifica salvataggio, errori, permessi, preset, inviti e conservazione delle bozze con API simulate. Imposta `PLAYWRIGHT_TEST_BASE_URL` per eseguirlo sul frontend da verificare.
