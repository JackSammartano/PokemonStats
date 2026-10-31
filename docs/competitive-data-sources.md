# Fonti delle statistiche competitive

Verifica iniziale: 31 ottobre 2026. Lo studio distingue documentazione, risposte
campionate e autorizzazioni di riuso. Una risposta HTTP 200 non è una licenza.
La sezione corrente separa gli aggregati della ladder Smogon / Pokémon Showdown
dalla ranked nativa consultata tramite Champions Battle Data. Le altre fonti
restano oggetto dello studio, senza codice di integrazione attivo.

## Fonte integrata: Smogon / Pokémon Showdown

- Directory: <https://www.smogon.com/stats/>.
- Dataset iniziale verificato con GET:
  <https://www.smogon.com/stats/2026-09/chaos/gen9championsvgc2026regmc-1760.json>.
- Periodo: settembre 2026; formato `gen9championsvgc2026regmc`; soglia 1760;
  1.631.943 battaglie dichiarate nel formato; 277 Pokémon.
- Non sono dati della ranked nativa e non sono risultati di tornei.
- Il numero di battaglie descrive il formato nella fonte, non il numero di
  giocatori sopra la soglia. La soglia identifica una ponderazione statistica.
- Nessuna chiave richiesta nelle letture verificate. Nessuna garanzia di schema
  stabile o SLA individuata; le importazioni verificano i campi prima di attivare i dati.
- Aggiornamento della fonte: mensile; il nostro importatore seleziona un mese
  completo esplicito, senza assumere una data di pubblicazione garantita.

La [documentazione @pkmn/smogon](https://pkmn.github.io/smogon/) distingue il codice
MIT, gli aggregati statistici disponibili in pubblico dominio e i set/analisi
editoriali soggetti ai diritti di Smogon e dei contributori. Usiamo i soli aggregati,
senza importare set editoriali, analisi testuali o team individuali e senza
introdurre la libreria come dipendenza. L'indicazione sui diritti dei dati deriva
da questa documentazione e non dalla licenza MIT del repository Showdown.

Attribuzione nell'interfaccia, accanto al contesto e in «Fonti dati e attribuzioni»:
Smogon (<https://www.smogon.com/stats/>) / Pokémon Showdown
(<https://pokemonshowdown.com/>), con collegamento al file originale nel dettaglio.
L'importazione conserva l'originale nella cache locale esclusa da Git e uno
snapshot normalizzato versionato; lo storico mensile può essere conservato.
Nessun nuovo diritto su artwork, loghi o marchi è dedotto dai termini dei dati.

## Fonte integrata su consultazione: Champions Battle Data

La [guida API](https://championsbattledata.com/api_guide) e le
[regole di uso](https://championsbattledata.com/api-rules/) sono state ricontrollate
il 31 ottobre 2026. L'integrazione legge soltanto:

- `GET /api/rankings?format=Doubles&season=<season>`: classifica completa,
  identificativi, stagioni disponibili, posizioni, generatedAt e dataVersion.
- `GET /api/battle/Doubles/<showdownId>?season=<season>`: mosse, strumenti,
  abilità, nature, spread SP e compagni del solo Pokémon selezionato.

Il controllo nel browser ha verificato CORS reale con sei richieste per aprire la
vista, selezionare Pokémon, cambiare stagione e controllare una forma non riconciliata.
La lista attuale conteneva 262 Pokémon; Maushold-Four e Vivillon-Fancy non trovavano
corrispondenza esatta nel roster M-C. Si mantengono nome e posizione originali,
senza assegnare immagini o statistiche di forme simili. Non si leggono i pesanti
record `/api/pokemon`, gli indici globali o gli asset del provider nella UI.

Uso pubblico e commerciale consentito con attribuzione e cache ragionevole.
Niente mirror, archivi permanenti o redistribuzione come servizio dati autonomo
senza autorizzazione scritta. L'app non archivia risposte nel repository, in
localStorage, IndexedDB o cache HTTP persistente: usa `cache: no-store`, senza cookie
o credenziali, e una cache applicativa in memoria di massimo 24 record e 120 secondi.
Rispetta eventuali max-age più brevi, no-cache e no-store. Non esiste polling.

Ogni richiesta ha timeout di 15 secondi ed è annullabile, senza retry automatici.
HTTP 429 e 503 bloccano nuove richieste per il Retry-After leggibile; se manca,
non è valido o non è esposto tramite CORS, si applica un'attesa locale prudenziale
di 60 secondi. Non è un rate limit dichiarato dal servizio, che non ne pubblica
uno fisso. Non si usano endpoint alternativi per aggirare gli errori.

Le quote dei dettagli sono già percentuali, non pesi chaos; quelle assenti restano
null. La posizione delle specie non viene trasformata in usage. Gli SP di uno
spread sono pubblicati insieme ma senza natura associata; nature e spread restano
distribuzioni indipendenti. Non si ricostruiscono set completi né si assegna un
rank separato alle Mega dalla frequenza delle megapietre.

L'attribuzione «Battle data provided by Pokémon Champions Battle Data» è presente
nella vista con link al servizio, alle condizioni e al dettaglio API del Pokémon.
Data di generazione della classifica, eventuale data dei dettagli e momento di
consultazione sono distinti. L'assenza della data nei dettagli Current è dichiarata.
Non si equiparano automaticamente stagioni M7 e regulation M-C.

## Altre fonti studiate

| Provider | Verifiche del 31 ottobre 2026 | Riuso e decisione |
| --- | --- | --- |
| [PokéKit](https://poke.itlibra.com/it/opendata) | GET `usage-champions.json`: settembre 2026, Doubles M-C, soglia 1760, 150 Pokémon. Link reali anche per championssingles, ou, doublesou e vgc. | Open data riutilizzabili e ridistribuibili anche commercialmente con credits a PokéKit e Smogon/Showdown; confermato dall'eccezione open data nei [termini](https://poke.itlibra.com/en/terms). Alternativa più semplice, ma troncata. |
| [Limitless](https://docs.limitlesstcg.com/developer) | GET games, lista VGC e details/standings/pairings del torneo `6adfbd7122fd412b92a4d932`. Formato M-C, piattaforma SWITCH; team pubblici con strumenti/abilità/nature/mosse, alcuni placing null. | Endpoint pubblici senza chiave. Header osservato `50-in-5min`, da rileggere a ogni esecuzione. Prima di archiviazione e ridistribuzione approfondire le condizioni commerciali e dei dati dei partecipanti. |
| [MunchStats](https://github.com/PizzaTimeJoshua/munchstats) | Route statistiche M-C/Rillaboom, pokemon-teams, Limitless M-C teams e teams `champions-mc` rispondono sul dominio munchstats.com, con redirect a www.munchstats.com. | Nessuna licenza generale trovata nella root; metadato GitHub `license: null`. Destinazione a terzi, permessi di redistribuzione e limiti non chiariti: nessun riuso di codice o dati in questa fase. |
| [VGC History](https://vgchistory.com/data) | GET statistiche Garchomp, Miracle Seed, Protect, Grace Beck; standings/sheets/matches NAIC 2026, sitemap e data.js. | Riuso incoraggiato, caching richiesto per ridurre traffico, credits con link suggeriti. Nessuna licenza standard o clausola commerciale specifica individuata. Catalogo eventi e condizioni da approfondire prima dell'integrazione. |

Battle Data documenta `/api/rankings` con paginazione e precisa che il rank delle
specie non ha una usage percentage associata. Non inventare una percentuale da
posizione, frequenza delle megapietre o somma delle configurazioni. Stagione `M7`
e regulation `M-C` sono identificativi diversi. Alcune quote dei compagni sono
assenti. I suoi metadati denominati `baseStats` non sono usati per sostituire i
valori base del nostro dataset: Garchomp riportava HP 183 nel campione.
L'integrazione usa l'attribuzione richiesta, collegata a <https://championsbattledata.com/>.

PokéKit restituisce nel JSON `usage` (percentuale), mentre il CSV documenta
`usage_pct`. Include solo quattro spread principali: non bastano per ricavare
una distribuzione completa delle nature. Non mescolare i suoi valori già
percentuali con `usage` frazionario e pesi del JSON chaos originale.

Limitless espone tornei ospitati sulla piattaforma, non necessariamente eventi
ufficiali. Distinguere SWITCH e SIM. I pairing possono includere game-by-game
results nel campione verificato: non attribuire questa disponibilità a VGC History.
Un team incompleto non deve essere completato con le scelte più frequenti.

VGC History documenta piazzamenti `[first,last]`, `movedTo`, `retired`, ritiri e
classifiche Swiss o parziali: non convertire questi casi in piazzamenti esatti.
Il file data.js verificato contiene una funzione JavaScript: non eseguirlo come
codice dell'importatore e non considerarlo un semplice JSON con un prefisso.
Un futuro adattatore richiederà una lettura statica controllata o un catalogo
JSON concordato. Credits proposti: «Historical VGC data: VGC History», con link
a <https://vgchistory.com/> e all'evento originale.

## Verifiche successive

Prima di attivare un provider ricontrollare termini, schema, frequenza, rate limit,
cache, diritti di redistribuzione e denominatori. Non ereditare permessi da un
aggregatore per dati di una fonte diversa. Nessun contatto a gestori è stato inviato.
PokéKit e Smogon non saranno sommati come campioni indipendenti dello stesso meta.
