# Caricamento locale del roster M-C

Stato: implementato. L'apertura del sito non richiede più risposte da PokéAPI.

## Dati disponibili subito

`src/lib/pokemonDataset.js` costruisce il dataset in modo sincrono dallo snapshot
Showdown già versionato nel repository: identità delle 351 forme, statistiche,
tipi, abilità e descrizioni, learnset Champions. La tabella dei tipi locale
calcola debolezze e resistenze con le stesse regole del calcolatore.

`App.jsx` usa il dataset al primo render. Sono stati rimossi il client HTTP
globale, i gruppi sequenziali e la schermata di attesa. Nessun servizio esterno
decide quando catalogo, team e calcolatore diventano utilizzabili. Le chiavi
localStorage di squadre, build e mosse restano quelle esistenti.

Le descrizioni delle abilità sono quelle Showdown, in inglese. Non viene fatto
un arricchimento automatico con PokéAPI. Eventuali traduzioni potranno essere
aggiunte al processo di aggiornamento dati, mantenendo l'avvio privo di richieste API.

## Immagini locali

- 351 WebP, una per forma esatta, complessivamente 4.466.408 byte.
- Dimensioni massime 256 × 256, trasparenza conservata, qualità 82.
- Fonte: `PokeAPI/sprites`, commit `97a7832d307311c0e1c6ea9035308bf80cc94f81`.
- Mappa delle risorse: `src/data/pokemonImages.js`.
- Indice nomi/ID versionato: `scripts/data/pokeapi-image-index.json`.
- Nessun rimpiazzo di una forma con un'altra; se manca un'immagine viene usato
  un segnaposto neutro, anche in caso di errore di caricamento.

`PokemonImage` usa caricamento lazy, decodifica asincrona e dimensioni fisse.
Le immagini sono servite dallo stesso sito, con il base path di Vite; non
sono incluse nel JavaScript e non vengono scaricate tutte all'apertura.

Per rigenerare le immagini dal mapping versionato:

```powershell
npm run assets:pokemon
```

Dopo un aggiornamento del roster, aggiornare deliberatamente l'indice se necessario:

```powershell
npm run assets:pokemon -- --refresh-index
```

Lo script usa al massimo sei download contemporanei. Per ogni ID prova prima
Home, poi artwork e sprite, sempre della stessa identità. Un errore di rete
interrompe la generazione senza pubblicare una mappa incompleta. Le sole
assenze confermate da HTTP 404 sono registrate nel manifest come mancanti.
Il normale comando di build non richiede PokéAPI né rigenera gli asset.

## Verifica

Test unitari: dataset sincrono con fetch che non risponde, corrispondenza di
statistiche/tipi/abilità con lo snapshot, forme distinte e presenza degli asset.

Verifica browser sulla build di produzione, Edge headless, localhost, cache
disabilitata e servizi esterni bloccati: 351 card disponibili a circa 463 ms
dalla navigazione, sei immagini Pokémon richieste inizialmente, zero richieste
esterne. È una misura locale, non una garanzia sui tempi di hosting o dispositivi.

Verificati inoltre fallback immagine, squadre/build già salvate, modifiche alle
mosse e ritorno dal calcolatore, copertura offensiva in entrambe le direzioni e
assenza di overflow su smartphone. Per l'uso senza connessione dal primo accesso
resta necessario poter scaricare i file del sito: non è stato introdotto un service worker.
