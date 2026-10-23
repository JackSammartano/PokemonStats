# PokemonStats

Frontend React + Vite per consultare Regulation Set M-C, con roster e dati essenziali da Pokémon Showdown e immagini e dati aggiuntivi da PokeAPI.

## Funzionalita

- Roster Regulation Set M-C generato da Pokémon Showdown, con Pokémon base, forme funzionali e Mega Evolutions.
- Ricerca testuale, filtro per tipo e filtro per categoria.
- Stats base, tipi, debolezze difensive e abilita con descrizione.
- Team builder con analisi difensiva.
- Viste dedicate Catalogo, Il mio team e Damage calculator, con navigazione avanti/indietro.
- Passaggio dal team al calcolatore con attaccante, avversario e quattro mosse per ciascuno già impostati e ritorno contestuale al team.
- Tab Confronta per vedere due card Pokemon complete affiancate.
- Damage calculator Champions con selezione attacker/defender, mosse, item, abilita, nature, SP, boost e condizioni di campo.
- Otto risultati simultanei (quattro per lato), dettaglio della mossa selezionata e SP/boost indipendenti per statistica.
- Optimizer `Find KO` / `Find Survival` con ranking `Minimum investment` o `Practical build`.
- Dati essenziali disponibili anche per le forme non esposte da PokeAPI o in caso di errore di rete.
- Corrispondenze esplicite per le forme, senza sostituire una Mega mancante con un'altra.

## Comandi

```bash
npm install
npm run dev
npm run lint
npm test
npm run build
```

## Dati

Il roster M-C è generato in `src/data/regulationMc.js` da un commit fissato del repository `smogon/pokemon-showdown`.
Contiene 351 voci, comprese 82 forme Mega; le forme equivalenti per tipi, statistiche, abilità e mosse apprendibili non vengono duplicate.

Per rigenerarlo (Node.js 24):

```bash
npm run data:regulation-mc
```

Dettagli su fonti, forme e verifiche in [docs/regulation-mc.md](docs/regulation-mc.md).
Flusso delle viste e trasferimento dati in [docs/team-workspace.md](docs/team-workspace.md).
Dettagli sui quattro slot, risultati nelle due direzioni e copertura delle mosse in [docs/four-move-calculator.md](docs/four-move-calculator.md).
La vecchia lista `src/data/regulationMb.js` resta come riferimento storico e non viene caricata dall'app.

Tipi, statistiche base e identità delle abilità provengono dallo snapshot Showdown.
Immagini, mosse e descrizioni localizzate vengono arricchite a runtime tramite:

- `https://pokeapi.co/api/v2/pokemon/{name}`
- `https://pokeapi.co/api/v2/type/{type}`
- `https://pokeapi.co/api/v2/ability/{ability}`

Se una forma ammessa non è presente in PokeAPI, rimane consultabile con i dati Showdown verificati.
Il caricamento non sostituisce una forma mancante con un'altra Mega o con il Pokémon base.
