# Convenzioni del monorepo

- Backend Laravel separato; tutte le app usano le sue API reali.
- Ionic + Angular come prima versione operativa; SwiftUI e Kotlin/Compose come implementazioni native indipendenti.
- Servizi API, autenticazione, logica applicativa e accesso al dispositivo separati dalle schermate.
- Web e Live condividono workspace Angular, dipendenze e lockfile npm nella radice; le app native mantengono i propri strumenti.
- Contratti API, flussi e criteri di verifica in `docs/`; codice TypeScript, Swift e Kotlin specifico per piattaforma.
- Asset originali condivisi in `assets/branding/`; risorse generate e cataloghi specifici nelle rispettive app.
- Nessun segreto nel repository. Versionare solo esempi di configurazione senza credenziali.
- Aggiornare i percorsi dei workflow quando si sposta un progetto.

## Passaggio al nativo

Implementare un flusso alla volta usando schermate Ionic, contratti API e criteri di verifica come riferimento. Validare gli stessi stati e comportamenti sulle due implementazioni prima di sostituire la versione in uso.

Il prototipo SwiftUI attuale usa fixture locali: non implica che login, API o cache offline siano già pronti.
