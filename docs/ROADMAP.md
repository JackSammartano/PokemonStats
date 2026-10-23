# Priorità del progetto

Ordine concordato il 23 ottobre 2026. Questo documento registra le attività;
le specifiche dettagliate verranno definite prima dell'implementazione.

## 1. Regulation M-C

- Implementata sul branch `feature/next-updates`: roster generato dal repository Pokémon Showdown.
- Importazione di 351 voci con tipi, statistiche e abilità verificati, anche senza PokeAPI; escluse le forme solo cosmetiche tramite confronto dei learnset Showdown.
- Dettagli e criteri in [regulation-mc.md](regulation-mc.md). Pubblicazione su `main` da effettuare.

## 2. Il mio team: confronto tra due team

- Implementate viste dedicate per team e calcolatore, con passaggio della coppia e di quattro mosse per ciascun Pokémon e ritorno contestuale. Dettagli in [team-workspace.md](team-workspace.md).
- Implementate La mia squadra e La squadra avversaria, con gestione manuale e import Showdown dagli appunti.
- Implementati profili condivisi e persistenti per Pokémon: mosse, abilità, oggetto, natura, SP, livello e informazioni aggiuntive.
- Implementato resoconto laterale con distribuzione dei tipi, debolezze condivise, resistenze, immunità e copertura delle mosse nelle due direzioni.
- Il riepilogo dei tipi esclude gli effetti di abilità, oggetti e condizioni di campo; gli affinamenti saranno discussi dopo la prova della prima versione.

## 3. Damage calculator

- Implementati quattro slot per lato, otto risultati simultanei, statistiche configurabili in entrambe le direzioni e optimizer sulla mossa selezionata. Dettagli in [four-move-calculator.md](four-move-calculator.md).
- Completare il calcolatore esistente.
- Attività rimandata rispetto a Regulation M-C e confronto tra team.
- Definire successivamente le funzionalità mancanti e i criteri di completamento.
