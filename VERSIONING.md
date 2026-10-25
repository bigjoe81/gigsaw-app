# Versioni della webapp

La versione corrente è in `package.json`, `package-lock.json` e nella release
corrente di `src/assets/changelog.json`. Il changelog alimenta le novità in-app.
Le vecchie voci prive di un numero rimangono identificate dalla data.

Per creare una release, specifica titolo e una o più novità reali:

```sh
npm run version:patch -- "Correzioni calendario" "Corretto il salvataggio degli impegni"
npm run version:minor -- "Nuova funzionalità" "Descrizione della novità"
npm run version:major -- "Nuova versione principale" "Descrizione del cambiamento"
```

Patch incrementa l'ultimo numero, minor incrementa il secondo e azzera patch,
major incrementa il primo e azzera gli altri due. Ogni incremento aggiunge una
release con data UTC e conserva la cronologia. Rivedi summary e label nel JSON
se servono testi più specifici.

Per correggere il numero della release corrente senza cancellarne le note:

```sh
npm run version:down
npm run version:down -- minor
npm run version:down -- major
```

Il decremento sottrae uno alla parte selezionata e azzera le successive;
non ricostruisce una versione precedente. Zero e numeri già presenti nella
cronologia vengono rifiutati. Non usarlo per release già pubblicate: crea una
nuova patch. Gli script non creano commit o tag Git.

`npm run version:check` verifica l'allineamento dei tre file; viene eseguito
automaticamente anche prima di `npm run build`.
