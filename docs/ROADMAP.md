# Priorità del progetto

Ordine concordato il 23 ottobre 2026. Questo documento registra le attività;
le specifiche dettagliate verranno definite prima dell'implementazione.

## 1. Regulation M-C

- Implementata sul branch `feature/next-updates`: roster generato dal repository Pokémon Showdown.
- Importazione di 351 voci con tipi, statistiche e abilità verificati, anche senza PokeAPI; escluse le forme solo cosmetiche tramite confronto dei learnset Showdown.
- Dettagli e criteri in [regulation-mc.md](regulation-mc.md). Pubblicazione su `main` da effettuare.

## 2. Il mio team: confronto tra due team

- Implementate viste dedicate per team e calcolatore, con passaggio della coppia e di quattro mosse per ciascun Pokémon e ritorno contestuale. Dettagli in [team-workspace.md](team-workspace.md).
- Ampliare la gestione de "Il mio team" per confrontare due team.
- Mostrare i tipi dei Pokémon e delle loro mosse.
- Consentire di affiancare i Pokémon dei due team a due a due.
- Evidenziare debolezze e resistenze in base ai tipi dei Pokémon e alle mosse selezionate.
- Prevedere selezione manuale e importazione da una stringa Pokémon Showdown.
- Ambito: confronto tra team; funzionalità precise e interazioni da discutere.

## 3. Damage calculator

- Implementati quattro slot per lato, otto risultati simultanei, statistiche configurabili in entrambe le direzioni e optimizer sulla mossa selezionata. Dettagli in [four-move-calculator.md](four-move-calculator.md).
- Completare il calcolatore esistente.
- Attività rimandata rispetto a Regulation M-C e confronto tra team.
- Definire successivamente le funzionalità mancanti e i criteri di completamento.
