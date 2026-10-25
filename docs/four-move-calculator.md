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

Le condizioni della mossa selezionata compaiono solo quando servono input come
numero di colpi, ordine d'azione o condizioni di potenza e validità. Non vengono
mostrati controlli per forzare effetti secondari casuali delle mosse: Moonblast,
per esempio, non apre un pannello per scegliere quando applicare il calo di Att.
Sp. Per un attacco successivo con quel malus si imposta il boost nella scheda
del Pokémon. Anche gli stati iniziali si configurano nella stessa scheda.
Le vecchie selezioni di effetti casuali vengono ignorate; gli effetti garantiti
restano gestiti dal motore e le probabilità rimangono nelle descrizioni informative.

## Layout

Il calcolatore dispone risultati e configurazione dei Pokémon in due colonne sui
desktop ampi. I risultati seguono il flusso della pagina senza scorrimento interno;
la configurazione conserva un limite di altezza e uno scorrimento indipendente.
Sugli schermi più piccoli i pannelli vengono disposti in sequenza.

Ogni scheda di configurazione mostra un'immagine da 80 px centrata sopra il
selettore Pokémon a tutta larghezza. I controlli Genere e Livello non sono esposti;
i relativi valori rimangono nelle build e nell'import/export. Il genere continua
a influire sulle meccaniche pertinenti, come Rivalry. Un livello importato diverso
da 50 mantiene la segnalazione di incompatibilità con il calcolo Champions.

Campo e condizioni si trova sotto entrambe le colonne, a tutta larghezza, prima
di Scala Velocità. I selettori Meteo, Formato e Terreno sono affiancati sui desktop;
i controlli passano a due colonne su tablet e a una su mobile. Lo stato del campo
rimane condiviso con entrambe le direzioni di calcolo e con la tabella Velocità.

Si mantengono i titoli che identificano contenuti e direzioni del confronto,
evitando le diciture introduttive ripetute. I selettori Pokémon non hanno un
ulteriore titolo Pokémon 1/2; le etichette accessibili continuano a distinguere
i due lati. Se le card superano l'altezza dello schermo, scorre la pagina senza
tagliare descrizioni, condizioni della mossa selezionata o risultati.

## Set e trasferimento

Le selezioni sono condivise tra Il mio team e Damage calculator e conservate per coppia
di identità `(lato, nome Pokémon)`. Questo consente di cambiare Pokémon e recuperare le sue mosse,
e di confrontare due esemplari della stessa specie con set diversi.
Il trasferimento non ricostruisce né tronca il set alla sola mossa attiva.
Le modifiche fatte nel calcolatore si ritrovano nel team e viceversa.
Set e configurazioni sono condivisi nello stato del team workspace e salvati in localStorage,
quindi restano disponibili anche ricaricando la pagina.

## Dati e calcoli

Per il roster M-C, le opzioni usano `championsTeamData.js`, generato dai learnset
del commit Showdown fissato dall'importatore. Si includono tutte le mosse apprendibili,
comprese quelle di stato e con formule non ancora implementate. I risultati numerici
restano limitati alle mosse implementate nel motore, con indicazione esplicita per le altre.
`championsDamageLearnsets.js` rimane la mappa delle sole mosse implementate.
I vecchi set e PokeAPI rimangono fallback per dati esterni al roster noto.
Quando non si trovano mosse supportate, la modalità manuale è esplicitamente segnalata.
Questa modifica non completa la copertura di mosse di stato, formule speciali o altre meccaniche mancanti.

I due Pokémon hanno configurazioni indipendenti: natura, abilità, oggetto, SP e boost
per statistica, scottatura e schermi sul proprio lato.
Il formato iniziale è Doubles, con possibilità di selezionare Singles.
Gli SP iniziali sono zero e vengono impostati esplicitamente per ciascuna statistica,
oppure letti direttamente dalle righe EVs/SPs dell'export Champions.
Ogni riga usa Atk/Def per le mosse fisiche e SpA/SpD per le speciali; percentuali riferite
agli HP del bersaglio effettivo. Reflect e Light Screen proteggono il lato su cui sono attivati,
anche quando si calcola nella direzione opposta. Il brutto colpo condiviso si applica alle otto mosse.
La tabella dei valori mostra statistiche con natura e SP; i boost vengono applicati dal motore al danno.
Gli IV non sono configurabili e non condizionano il calcolo Champions, anche se presenti
in vecchi dati salvati. Non viene mostrata la sezione IV e dati aggiuntivi.
Nel dettaglio dell'efficacia si usano etichette testuali per i valori standard e moltiplicatori
espliciti solo per i valori eccezionali.

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
