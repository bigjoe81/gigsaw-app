# Gigsaw Live — Fastlane e CircleCI

La configurazione punta esclusivamente a **Ionic/Capacitor in `apps/live`**. Attualmente la cartella contiene solo un README: il deploy diventerà eseguibile dopo la generazione dell'app e dei progetti Capacitor. Il preflight fallisce intenzionalmente se manca il progetto Live; non compila mai la Web come ripiego.

## Destinazioni

| Parametro `mobile_destination` | iOS | Android |
| --- | --- | --- |
| `test` | Upload TestFlight, tester interni | Google Play, track internal |
| `prod` | Upload App Store; review opzionale | Google Play, track production, release completa |

Test significa distribuzione ai tester, **non backend staging**: entrambe le lane compilano la configurazione Angular `production`. Per usare un altro backend aggiungere una configurazione Angular e impostare `LIVE_ANGULAR_CONFIGURATION`. Stesso bundle/package per test e prod: non sono due app installabili affiancate.

Su iOS il caricamento non implica pubblicazione: per default review e rilascio restano manuali in App Store Connect. Con `IOS_SUBMIT_FOR_REVIEW=true` si invia in review; `IOS_AUTOMATIC_RELEASE=true` abilita il rilascio dopo approvazione. Metadata, privacy, export compliance e screenshot devono essere già pronti sullo store. Google Play può richiedere review anche per una release completata.

## Prerequisiti una tantum

1. Registrare il progetto Angular `live` nel workspace, root `apps/live`, con configurazione `production` e output dedicato. Non utilizzare l'output della Web.
2. Aggiungere versioni compatibili di Ionic, `@capacitor/ios` e `@capacitor/android` al package.json **radice**, aggiornando package-lock.json. Il workflow usa `npm ci` dalla radice (anche per registry privati Font Awesome: configurare il relativo token richiesto da `.npmrc`).
3. Creare `apps/live/capacitor.config.ts` con appId definitivo e `webDir` che risolva l'output Angular Live rispetto ad `apps/live`. Eseguire la CLI Capacitor della radice dalla cartella Live e generare `ios` e `android`; versionare entrambi, incluso Gradle wrapper e scheme iOS condiviso. Verificare build Release, icone e provisioning sul dispositivo.
4. Creare le schede app negli store. Per Google Play completare il primo caricamento e la configurazione iniziale dalla console, collegare il service account con i permessi di pubblicazione e predisporre Play App Signing/upload key. Per TestFlight abilitare il gruppo interno con distribuzione automatica; gli esterni non sono gestiti da questa configurazione.
5. Su Mac inizializzare un repository privato Fastlane Match e creare/importare certificato Apple Distribution e profilo App Store per il bundle reale. La CI usa sempre Match readonly, senza generare certificati. Esempio locale: `bundle exec fastlane match appstore --app_identifier IL_BUNDLE_REALE --team_id IL_TEAM --git_url URL_REPO_MATCH`.
6. Collegare `gigsaw-app` a CircleCI e creare il context **gigsaw-mobile** con le variabili sotto. Per Match aggiungere una user SSH key autorizzata sul repository privato e configurare known_hosts per il relativo host (github.com è già gestito dal checkout CircleCI). Il workflow `add_ssh_keys` carica le chiavi aggiunte al progetto. Limitare l'accesso al context alle persone e ai branch autorizzati al rilascio.

## Variabili del context CircleCI

| Variabile | Contenuto |
| --- | --- |
| `IOS_BUNDLE_ID` | Bundle reale dell'app Ionic, senza valore presunto |
| `APPLE_TEAM_ID` | Team Apple Developer |
| `ASC_KEY_ID`, `ASC_ISSUER_ID` | API key App Store Connect con permessi adeguati |
| `ASC_KEY_CONTENT_BASE64` | Contenuto del file .p8 codificato Base64 |
| `MATCH_GIT_URL` | URL SSH del repository Match |
| `MATCH_PASSWORD` | Password di cifratura Match |
| `ANDROID_PACKAGE_NAME` | Application ID reale dell'app Ionic |
| `GOOGLE_PLAY_JSON_KEY_BASE64` | JSON service account Google Play in Base64 |
| `ANDROID_KEYSTORE_BASE64` | Keystore della upload key in Base64 |
| `ANDROID_KEYSTORE_PASSWORD` | Password keystore |
| `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` | Alias e password upload key |

Configurare solo le variabili della piattaforma scelta. Base64 non è cifratura: inserire i valori nel context, mai nei commit. I file Android sono scritti con permessi limitati in `/tmp` e rimossi anche in caso di errore. Non sono inclusi negli artifact.

## Avviare da CircleCI

In **Run pipeline**, selezionare il branch e passare:

```json
{
  "mobile_deploy": true,
  "mobile_platform": "ios",
  "mobile_destination": "test",
  "mobile_version": "0.1.0"
}
```

`mobile_platform`: `ios`, `android`, `both`. Per produzione scegliere `prod` sul branch `main`. I normali push non eseguono deploy. Non c'è un'approvazione aggiuntiva in pipeline: l'avvio esplicito con `prod` richiede la pubblicazione sullo store Android e il caricamento della versione App Store iOS.

`CIRCLE_BUILD_NUM` diventa il build number iOS/versionCode Android; per un nuovo tentativo usare una nuova pipeline, evitando di riutilizzare il numero già caricato. Se esistono build precedenti con numeri maggiori, impostare `BUILD_NUMBER` a un intero globalmente crescente per ogni upload (anche fra test e prod). Una variabile fissa deve essere aggiornata a ogni release. I job `both` possono avere numeri differenti: non occorre che coincidano fra store. Concorrenza: attendere il completamento di un deploy prima di avviarne un altro sulla stessa piattaforma, per non caricare versionCode fuori ordine.

iOS gira su macOS con Xcode e Ruby 3.3.6; Android sulla machine image Android con SDK/JDK, Ruby e Node 24. Le versioni delle immagini sono dichiarate in `.circleci/config.yml`; vanno aggiornate al variare delle immagini CircleCI e dei requisiti Capacitor. Gli artifact sono in `build/mobile`.

## Esecuzione locale

Installare Ruby >= 3.1, Bundler, Node 24 e i tool della piattaforma. Dalla radice:

```sh
npm ci
bundle install
# Configurare le variabili della piattaforma e i percorsi locali alle chiavi.
APP_VERSION=0.1.0 BUILD_NUMBER=101 bundle exec fastlane ios beta
APP_VERSION=0.1.0 BUILD_NUMBER=102 bundle exec fastlane ios production
APP_VERSION=0.1.0 BUILD_NUMBER=103 bundle exec fastlane android beta
APP_VERSION=0.1.0 BUILD_NUMBER=104 bundle exec fastlane android production
```

Per Android locale usare `GOOGLE_PLAY_JSON_KEY_PATH` e `ANDROID_KEYSTORE_PATH`, oltre alle password. Per iOS locale la API key resta Base64 e Match deve avere accesso al repository. Versionare `Gemfile.lock` generato dalla prima installazione sull'ambiente di build per bloccare anche le dipendenze transitive; non incluso finché non viene risolto con Bundler.

## Passaggio futuro al nativo

Impostare `LIVE_NATIVE=true` per saltare compilazione Angular e Capacitor sync, poi `IOS_PROJECT_DIR=apps/ios-native`, `IOS_PROJECT_NAME=GigSawLive.xcodeproj`, `IOS_SCHEME=GigSawLive`, `IOS_TARGET=GigSawLive` e `ANDROID_PROJECT_DIR=apps/android-native`. I percorsi relativi sono risolti dalla radice.

Il progetto SwiftUI attuale genera Info.plist durante la build: prima di riutilizzare questa lane occorrerà adattare il versionamento (oggi scrive `App/Info.plist` di Capacitor), icone e signing. Anche task/flavor Android andranno verificati sul progetto completo. `IOS_WORKSPACE_NAME` e `IOS_INFO_PLIST` sono configurabili per progetti Capacitor con struttura diversa. I runner restano gli stessi; non cambiare questi valori finché le app native non saranno complete.

## Verifica

Controlli locali: sintassi JavaScript, YAML e rami di errore del preflight. Build firmate, accesso agli store e validazione remota CircleCI richiedono progetto Ionic generato, account e segreti; non sono ancora eseguiti. Non è stato effettuato alcun deploy.

Riferimenti: [Fastlane CircleCI](https://docs.fastlane.tools/best-practices/continuous-integration/circle-ci/), [TestFlight](https://docs.fastlane.tools/actions/upload_to_testflight/), [App Store](https://docs.fastlane.tools/actions/upload_to_app_store/), [Google Play](https://docs.fastlane.tools/actions/upload_to_play_store/), [Gradle](https://docs.fastlane.tools/actions/gradle/), [CircleCI macOS](https://circleci.com/docs/guides/execute/using-macos/).
