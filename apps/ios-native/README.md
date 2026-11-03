# GigSaw Live

Prototipo **nativo SwiftUI** del companion di GigSaw: scegli la band, apri un concerto, consulta la scaletta ed entra nella lettura sul palco. Tema scuro e ambra, controlli Liquid Glass su iOS 26; fallback Material da iOS 17. Layout adattivo iPhone/iPad, senza dipendenze esterne.

## Aprire l’app

1. Clona il repository sul Mac e apri `GigSawLive.xcodeproj` con **Xcode 26 o successivo**.
2. Seleziona lo scheme **GigSawLive** e un simulatore iPhone, quindi premi Run.
3. Per l’iPhone fisico, imposta il tuo Team in Signing & Capabilities; modifica `it.gigsaw.live` se necessario.

Non servono backend, chiavi o login. L’icona finale e gli asset fotografici delle band sono ancora da aggiungere: le card usano SF Symbols, non foto simulate di musicisti.

## Flusso implementato

- **Band:** CBT e Rockodiles; selezione band e ruolo salvati nelle preferenze locali.
- **Concerti:** Halloween al Nama Brewing, informazioni live, checklist di preparazione (in memoria) e stato vuoto per Rockodiles.
- **Scaletta:** intro, brani, pausa parlata, indicatori sequenze e collegamento Blue Harvey → Fishes.
- **Sul palco:** presentazione a schermo intero, passaggio avanti/indietro anche negli intermezzi, accordi grandi, note, dimensione testo persistente. Lo schermo resta acceso finché la vista è attiva e l’app torna al comportamento precedente quando viene chiusa o passa in background.
- **Profilo:** selettore ruolo e descrizione della modalità demo.

I dati demo sono inclusi nel codice e funzionano senza rete. Non si tratta di una cache offline di dati GigSaw sincronizzati. Il selettore ruolo è predisposto per contenuti diversi, ma nel demo gli accordi sono condivisi. Accordi e durate sono illustrativi; BPM e tonalità non confermati sono omessi. Le sequenze sono semplici indicatori: nessuna riproduzione audio né integrazione Camelot.

## Struttura

`Models.swift` contiene i modelli e le fixture, `Theme.swift` i token e la compatibilità vetro/Material. Ogni schermata ha un file dedicato; `RootView` usa TabView e NavigationStack nativi. La lettura sul palco usa una fullScreenCover per eliminare le tab dalla vista. Sono rispettati safe area, Reduce Transparency e controlli con almeno 44 pt. I testi ordinari seguono Dynamic Type; gli accordi hanno un controllo esplicito della dimensione.

## Verifica

GitHub Actions compila per il simulatore con Xcode e controlla gli invarianti delle fixture (durata, intermezzi, medley e data locale del concerto). Comando locale:

```sh
xcodebuild -project GigSawLive.xcodeproj -scheme GigSawLive -configuration Debug \
  -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build
```

Da verificare sul simulatore/dispositivo: avvio → CBT → live → scaletta → palco; ritorno a band e stato vuoto Rockodiles; cambio ruolo; testo grande; iPhone landscape/iPad; Reduce Transparency; ripristino auto-lock dopo la chiusura del palco.

## Passi successivi

Collegare autenticazione e API di GigSaw usando i contratti reali del backend; sincronizzare concerti e PDF per ruolo; gestire download, aggiornamento e cache offline effettivi; aggiungere asset originali e icona prima della distribuzione. Questa versione è un prototipo navigabile, non una release App Store.
