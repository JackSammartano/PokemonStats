# Calcolatore con quattro mosse per Pokémon

## Interazione

Il riferimento funzionale è il [calcolatore Pokémon Showdown](https://calc.pokemonshowdown.com/):
quattro risultati per Pokémon e selezione di una mossa per il dettaglio.
L'interfaccia del progetto usa due gruppi di card mossa con risultati inline e un dettaglio condiviso,
riutilizzando colori, navigazione e componenti del sito.

Ogni Pokémon ha quattro slot ordinati. Ogni slot permette di scegliere una mossa o restare vuoto;
non si può selezionare la stessa mossa due volte nello stesso set.
Alla prima apertura vengono proposte fino a quattro mosse disponibili; successivamente
si conservano le scelte esplicite, compresi gli slot vuoti.

Il calcolatore mostra contemporaneamente il danno in HP e percentuale di tutte le mosse:
Pokémon 1 verso Pokémon 2 e Pokémon 2 verso Pokémon 1.
"Dettagli" seleziona la mossa e la direzione per il riepilogo e per Find KO / Find Survival.
L'optimizer viene nascosto quando cambia la configurazione a cui si riferiva, evitando risultati obsoleti.

## Set e trasferimento

Le selezioni sono condivise tra Il mio team e Damage calculator e conservate per coppia
di identità `(lato, nome Pokémon)`. Questo consente di cambiare Pokémon e recuperare le sue mosse,
e di confrontare due esemplari della stessa specie con set diversi.
Il trasferimento non ricostruisce né tronca il set alla sola mossa attiva.
Le modifiche fatte nel calcolatore si ritrovano nel team e viceversa.
Lo stato rimane in memoria nella sessione della pagina, come il resto del team builder attuale.

## Dati e calcoli

Per il roster M-C, le opzioni usano `championsDamageLearnsets.js`, generato dai learnset
del commit Showdown fissato dall'importatore. Si includono tutte le mosse apprendibili
che il motore locale sa calcolare, non soltanto quelle presenti nei vecchi set di esempio.
I vecchi set e PokeAPI rimangono fallback per dati esterni al roster noto.
Quando non si trovano mosse supportate, la modalità manuale è esplicitamente segnalata.
Questa modifica non completa la copertura di mosse di stato, formule speciali o altre meccaniche mancanti.

I due Pokémon hanno configurazioni indipendenti: natura, abilità, oggetto, SP e boost
per statistica, scottatura e schermi sul proprio lato.
Gli SP iniziali sono zero e vengono impostati esplicitamente per ciascuna statistica.
Ogni riga usa Atk/Def per le mosse fisiche e SpA/SpD per le speciali; percentuali riferite
agli HP del bersaglio effettivo. Reflect e Light Screen proteggono il lato su cui sono attivati,
anche quando si calcola nella direzione opposta. Il brutto colpo condiviso si applica alle otto mosse.
La tabella dei valori mostra statistiche con natura e SP; i boost vengono applicati dal motore al danno.

## Organizzazione

- `components/DamageCalculator.jsx`: configurazione dei due Pokémon, risultati e optimizer.
- `components/FourMoveSelector.jsx`: quattro slot e risultati inline, usato anche dal team.
- `components/OptimizerResults.jsx`: tabelle optimizer esistenti estratte da App.
- `lib/damage/championsMoveSets.js`: validazione dei set e aggiornamenti senza mutazioni.
- `lib/damage/championsMatchup.js`: calcolo delle quattro righe e contesto optimizer per direzione.

Il dataset dei learnset è distribuito come asset separato nella build.

## Verifiche

La suite verifica ordine e slot vuoti, duplicati, set distinti nei mirror match,
trasferimento delle otto mosse, statistiche fisiche/speciali indipendenti,
scottatura, schermi nella direzione opposta, immunità e direzione dell'optimizer.
Verifica browser in sviluppo e produzione con Charizard e Venusaur:
quattro selezioni per lato, otto risultati, modifica nel calcolatore e ritorno al team,
slot vuoti conservati, cambio Pokémon, SP separati e layout a 1440, 390 e 320 px.
