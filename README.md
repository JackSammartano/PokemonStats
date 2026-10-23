# PokemonStats

Frontend React + Vite per consultare Regulation Set M-C, con dati Pokémon Showdown e immagini locali versionate. Il catalogo completo è disponibile senza attendere PokéAPI.

## Funzionalita

- Roster Regulation Set M-C generato da Pokémon Showdown, con Pokémon base, forme funzionali e Mega Evolutions.
- Ricerca testuale, filtro per tipo e filtro per categoria.
- Pulsante `Aggiungi` su ogni Pokémon per scegliere Mia squadra, Squadra avversaria o il primo slot libero di Confronta.
- Stats base, tipi, debolezze difensive e abilita con descrizione.
- Due squadre da sei Pokémon, import Showdown dagli appunti e confronto laterale dei tipi.
- Configurazioni complete per Pokémon condivise con il calcolatore e salvate localmente nel browser.
- Card uniformi con quattro slot mosse; i nickname importati vengono ignorati.
- Pulsanti `M`/`m` su card e modale per cambiare forma con la megapietra corretta, comprese le Mega Z, mantenendo la configurazione.
- Modale `i` con copertura in entrambe le direzioni e deduzioni per il singolo Pokémon; riepilogo dei matchup delle due squadre.
- Viste dedicate Catalogo, Il mio team e Damage calculator, con navigazione avanti/indietro.
- Passaggio dal team al calcolatore con attaccante, avversario e quattro mosse per ciascuno già impostati e ritorno contestuale al team.
- Tab Confronta per vedere due card Pokemon complete affiancate.
- Damage calculator Champions con selezione attacker/defender, mosse, item, abilita, nature, SP, boost e condizioni di campo.
- Otto risultati simultanei (quattro per lato), dettaglio della mossa selezionata e SP/boost indipendenti per statistica.
- Danno mostrato in percentuale e tabella Velocità con scenari per i soli due Pokémon selezionati.
- Mosse di stato, abilità e oggetti importati conservati anche quando il motore danni non ne implementa gli effetti.
- Optimizer `Find KO` / `Find Survival` con ranking `Minimum investment` o `Practical build`.
- Tutti i dati competitivi e le immagini provengono da file locali; nessuna richiesta API all'avvio.
- Corrispondenze esplicite per le forme, senza sostituire una Mega mancante con un'altra.

## Comandi

```bash
npm ci
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
Importazione, persistenza e riepilogo delle due squadre in [docs/showdown-team-import.md](docs/showdown-team-import.md).
Dettagli sui quattro slot, risultati nelle due direzioni e copertura delle mosse in [docs/four-move-calculator.md](docs/four-move-calculator.md).
La vecchia lista `src/data/regulationMb.js` resta come riferimento storico e non viene caricata dall'app.

Tipi, statistiche base e identità delle abilità provengono dallo snapshot Showdown.
Anche mosse e descrizioni delle abilità sono locali. Le 351 immagini WebP sono generate da una versione fissata di `PokeAPI/sprites`, caricate progressivamente e non richiedono accesso all'API durante la navigazione.

Per rigenerare le immagini: `npm run assets:pokemon`. Per le versioni responsive dello sfondo: `npm run assets:background -- "percorso-originale.jpg"`.
Dettagli in [docs/pokemon-loading-rework.md](docs/pokemon-loading-rework.md), [docs/team-mega-evolutions.md](docs/team-mega-evolutions.md) e [docs/background-assets.md](docs/background-assets.md).

## Pubblicazione

Il push su `main` avvia `.github/workflows/pages.yml`: installazione riproducibile con `npm ci`, lint, test, build e pubblicazione su GitHub Pages. Il deploy procede solo se tutti i controlli hanno successo.

Sito: [jacksammartano.github.io/PokemonStats](https://jacksammartano.github.io/PokemonStats/).
