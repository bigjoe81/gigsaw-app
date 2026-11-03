# Codice condiviso

- `models/src`: contratti TypeScript estratti da Web, accessibili con `@gigsaw/models`.
- `domain/src`: funzioni indipendenti dalla piattaforma, accessibili con `@gigsaw/domain`.
- `api`: spazio per la futura estrazione dei servizi HTTP.

Le app native riusano specifiche e contratti come riferimento, non eseguono queste librerie TypeScript. Le librerie non devono importare codice dalle app.
