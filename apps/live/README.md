# Gigsaw Live — Ionic + Angular

Destinazione della prima app Live. L'app non è ancora generata né eseguibile.

## Inizializzazione nel workspace

Aggiungere Live come secondo progetto in `angular.json`, con root `apps/live` e sourceRoot `apps/live/src`, quindi integrare Ionic e Capacitor usando versioni compatibili con Angular del workspace. Dipendenze e lockfile npm restano nella radice: non generare un workspace Angular o un repository Git annidato.

La generazione dell'app e l'aggiunta delle dipendenze Ionic saranno una modifica dedicata, con build separata da Web. Non eseguire il generatore standalone Ionic direttamente sopra questa cartella.

## Codice condiviso

Usare `@gigsaw/models` per i contratti e `@gigsaw/domain` per le funzioni comuni. I servizi API saranno estratti progressivamente in `libs/api`, con autenticazione e storage adattati a browser e dispositivo.

Le schermate, la navigazione e l'accesso al dispositivo appartengono a questa app. I futuri progetti Capacitor `ios/` e `android/` resteranno qui dentro, separati da `apps/ios-native` e `apps/android-native`.
