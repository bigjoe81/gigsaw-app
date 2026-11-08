# Gigsaw Live — base Ionic + Angular

App autonoma nello stesso workspace Angular, con identità e UX Live: **Sono in prova** e **Sono sul palco**. Nessuna schermata gestionale Web viene importata. Contratti locali in `@gigsaw/models`.

## Avvio e build

Dalla radice del repository, con Node compatibile con Angular 22:

```sh
npm ci
npm run start:live
npm run build:live
npm run test:live:e2e
npm run preview:live
```

La build viene emessa in `apps/live/www`, separata da `www` del Web. `test:live:e2e` usa la build di produzione, Chromium Playwright e il server locale `serve.mjs` (installare il browser con `npx playwright install chromium`). Configurazione Capacitor in `apps/live/capacitor.config.ts`. I contenitori ibridi sono già generati in `apps/live/ios` (Swift Package Manager) e `apps/live/android`; dopo ogni build eseguire `npm run cap:live -- sync`. Aprire con `npm run cap:live -- open ios` oppure `open android`. Sono inclusi permesso microfono Android e descrizione d’uso iOS. Esportazioni native via share sheet e apertura PDF nel lettore di sistema. Non sono i progetti nativi futuri di `apps/ios-native` / `apps/android-native`. Per compilare/firmare servono macOS + Xcode o Android SDK/JDK; le build native non sono state eseguite in questo ambiente.

`apps/live/package.json` è un membro del workspace npm, necessario al CLI Capacitor: installare sempre dalla radice, con un solo lockfile. Per le dipendenze Web Pro resta necessario `FONTAWESOME_NPM_TOKEN`, come nel progetto esistente.

## Interfaccia Live

Il concept approvato usa superfici antracite, testo chiaro, accenti lime per navigazione e azioni principali e corallo per la registrazione. Home compatta con i due ingressi, navigazione inferiore con stato attivo e scaletta dedicata in `/setlist` prima della lettura in `/stage`.

Sul telefono la modalità palco nasconde la navigazione generale e mantiene i pulsanti precedente/prossimo separati dall’area di lettura scorrevole. Su tablet affianca scaletta e lettore; da 1100 px aggiunge note e collegamenti ai materiali. Testo e accordi personali e note sono in schede accessibili anche da tastiera; cambiare scheda non avanza il brano. I contenuti vuoti invitano ad aggiungere il proprio materiale. La band è indicata come demo, non come selettore funzionante, e la disponibilità offline dipende dal salvataggio effettivo.

## Funzioni utilizzabili

- Sessione esplicitamente **demo**, band di esempio CBT. Tonalità, BPM e indicazioni sono fixture, non informazioni confermate della band. Il servizio sessione costituisce il punto di sostituzione futuro con dati API.
- Palco: corrente/prossimo, set, bis, pausa e intermezzo; navigazione a pulsanti, swipe orizzontale o frecce; testo 18–48 px; modalità concentrata; ripristino posizione e dimensione; Screen Wake Lock con stato reale e fallback esplicito.
- Prova: registrazione reale via MediaRecorder, REC/STOP, marker “Nuovo brano”, note, take locali, riascolto e seek ai marker, download ed eliminazione confermata. La registrazione continua durante la navigazione interna, con banner persistente.
- Parti e note personali, import PDF locale (massimo 25 MB), visualizzazione e download; gli stessi materiali sono accessibili dal palco. Preferenza strumento locale: non simula assegnazioni multiutente.
- IndexedDB per scaletta, preferenze, testi, PDF e audio. Salvataggi confermati solo dopo commit; checkpoint audio ogni secondo e recupero delle take interrotte al riavvio. Download d’emergenza se il salvataggio finale fallisce; i chunk già scritti restano recuperabili.
- Shell offline con Angular Service Worker, solo nella build production via HTTPS/localhost. Aprire una prima volta online e attendere il completamento della registrazione/cache prima di chiudere; salvare la scaletta e verificare la riapertura in modalità aereo sul dispositivo. Non serve la rete per riascoltare take o leggere materiali già locali.

## Limiti espliciti di questa prima base

Login, scelta di band/sessioni reali, API, upload differito, conflitti e avanzamento leader/follower **non implementati**. Non vengono mostrati stati fittizi di sincronizzazione. Press Kit e Tech Kit hanno una schermata esplicita di non disponibilità, in attesa degli endpoint reali. Non ci sono metronomo, MIDI, DMX o integrazioni Camelot.

I dati appartengono all’origine e al dispositivo corrente: cancellare i dati del sito/disinstallare può perderli; esportare le take importanti. La persistenza dello storage viene richiesta al salvataggio della scaletta ma il browser può negarla. In assenza di storage non viene dichiarato riuscito alcun salvataggio. Gli audio correnti restano anche in memoria fino al commit: verificare durata/spazio su dispositivo prima di prove lunghe. Al riavvio l’ultimo chunk non ancora scritto può andare perso; le take recuperate sono segnalate come parziali. Interruzioni telefoniche, background, permessi microfono e comportamento dei PDF richiedono collaudo su iOS/Android reali: non è una garanzia di registrazione in background. Nelle WebView native va collaudato MediaRecorder. Quando l’app nativa passa in background, la take viene fermata e contrassegnata come parziale.

## Collaudo

`npm run build:live` e compilazione TypeScript delle specifiche verificati. Sono presenti test Playwright contro produzione per: navigazione palco e pause, persistenza di note/parti/PDF, audio reale e marker, permesso negato e shell/scaletta dopo reload offline e nuova pagina, su viewport desktop, tablet e telefono, incluse le schede del lettore. In questo ambiente Chromium non si avvia per restrizioni di sistema sui socket, quindi i test di interfaccia non sono stati eseguiti con successo. La copertura desktop non sostituisce il collaudo hardware.
