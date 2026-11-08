# Web workspace UI

Home, repertorio e prove usano lo stile backstage dei prototipi approvati.

## Fine tuning

- `src/styles/backstage.css`: spaziatura, larghezza sidebar, pannelli, campi, CTA e layout dei form. Le regole sono limitate a `.backstage-page`.
- `../../shared/theme/gigsaw-tokens.css`: palette canonica condivisa con Live. Per modifiche solo web, usare gli alias in `backstage.css`.
- `src/app/layouts/band-layout.page.*`: navigazione e selettore band.
- `src/app/shared/ui/form-page-header.component.ts`: intestazione e avanzamento; il nuovo aspetto è attivato da `[backstage]="true"`.
- Gli SCSS delle singole pagine contengono i layout specifici.

Il repertorio usa il ciano per le azioni principali; home e prove usano il viola. Titoli ed etichette non hanno sovratitoli maiuscoli con spaziatura aggiuntiva.

La home usa la copertina della band, con `src/assets/backstage-stage.webp` come alternativa locale (immagine generata per questo progetto). Non dipende da immagini remote esterne.

## Comportamento

Le schermate usano i servizi e i contratti API esistenti. La ricerca e i filtri sono locali alle liste già caricate. La selezione multipla del repertorio agisce sui risultati filtrati e mantiene le selezioni nascoste; il conteggio mostra il totale selezionato.

Il calendario delle prove parte dal lunedì. Le prove completate, annullate o trascorse sono nell'archivio. La creazione della sala rimane disponibile dal form, anche quando non esistono sale.

I dati dei prototipi e del server usato per la verifica visiva non sono inclusi nell'applicazione.
