# Sezione Competitivo

La vista `#/competitivo` separa tre fonti selezionabili: statistiche mensili
Showdown Champions Doubles, ranked nativa tramite Champions Battle Data e tornei
ospitati su Limitless.
La versione Showdown usa settembre 2026, Regulation M-C, soglia Smogon 1760.
Le due viste statistiche non contengono team individuali, archetipi, win rate o trend e non
mescolano le osservazioni dei provider. Le [fonti e condizioni](competitive-data-sources.md)
descrivono le integrazioni e le alternative studiate.

## Tornei Limitless

`TournamentExplorer.jsx` viene caricato solo scegliendo **Tornei**. Il client
`src/lib/competitive/limitless.js` legge `/games`, cerca un ID esattamente uguale
alla label della regulation Champions attiva e carica una pagina di 20 tornei
VGC del formato. Non sostituisce un formato assente con uno precedente o simile.
La ricerca dell’elenco riguarda la pagina corrente; la pagina successiva viene
richiesta esplicitamente. Una pagina piena abilita Successiva, senza inventare
un conteggio totale; l’eventuale pagina vuota permette di tornare indietro.

Solo la scelta di un evento avvia `/details` e, dopo la verifica di identità,
formato e visibilità pubblica, `/standings`. Nessuna richiesta a pairing, profili
o fonti secondarie. L’evento mostra piattaforma Switch/simulatore, organizzatore,
data UTC, partecipanti dichiarati, fasi e link originale. Gli eventi sulla
piattaforma non sono presentati come ufficiali o come classifiche finali certificate.

La ricerca nel torneo considera giocatore e specie dei team sheet caricati.
I dettagli di ogni giocatore mostrano il piazzamento pubblicato (o assente),
record vittorie/sconfitte/pareggi, ritiro e i membri disponibili. Il numero di team
è un conteggio dei fogli presenti fra i giocatori elencati, non una usage rate.
Team parziali, record e nature assenti restano espliciti; nessuno spread viene
ricostruito. Una megapietra non trasforma la specie pubblicata in una Mega.
L’ID della fonte viene normalizzato e cercato esattamente nel roster attivo.
Il nome visualizzato può differire, ad esempio Eternal Flower Floette corrisponde
a `floette-eternal`, collegato a `floetteeternal` / Floette Eternal nel catalogo.
I nomi del catalogo e gli alias Limitless verificati controllano eventuali
conflitti: se ID e nome identificano due forme diverse, nessuna immagine viene
assegnata. Senza ID è ammesso un nome esatto o un alias verificato e univoco;
un ID sconosciuto non viene invece sostituito usando il nome. La normalizzazione
dei nomi conserva il genere, traducendo ♀/♂ in f/m prima del confronto.
Forme sconosciute mantengono testo originale e placeholder, compreso `floette`
senza la forma Eternal. La ricerca include anche il nome del catalogo collegato;
il nome originale resta nel dato normalizzato e nel titolo della voce.
Tooltip e tipi delle mosse vengono dal dataset locale della regulation attiva.

Il client centralizza timeout di 15 secondi, annullamento al cambio fonte/pagina/
selezione, validazione e cache in memoria di massimo 16 risposte per due minuti
(o meno se richiesto da Cache-Control). Nessuna persistenza o fallback scaduto.
Non esegue retry automatici. Legge RateLimit e Retry-After quando accessibili;
HTTP 429/503 impone la pausa indicata oppure cinque minuti. Un budget locale
conservativo di 40 richieste in cinque minuti per scheda browser opera anche
quando CORS nasconde gli header; non rappresenta una garanzia dei limiti del
fornitore. Credenziali omesse, cache HTTP disabilitata. I dati validi già in memoria
restano consultabili durante una pausa. Le ricerche locali non generano richieste.

Manutenzione: a ogni cambio regulation verificare il registro `/games`, un evento
reale e la compatibilità di dettagli e team sheet. Nessun ID torneo è fissato nel
codice. Cambi schema producono un errore esplicito senza salvare la risposta.
Gli alias di `createLimitlessPokemonResolver` vengono attivati solo quando la
destinazione è nel roster fornito: non aggiungono specie o forme alla regulation.
Nuovi alias richiedono osservazione della fonte, verifica del target e test;
nessun confronto approssimativo o deduzione da strumenti, abilità o mosse.
La piattaforma è facoltativa: `null` o campo omesso diventa «Piattaforma non
indicata», mantenendo Online/In presenza come pubblicato. Non viene dedotta
Switch dal formato. Una piattaforma di tipo errato o fasi non valide restano errori
distinti e bloccanti. Battle Cruise VGC e il Side hanno evidenziato questo caso.
L’API non è una verifica di legalità dei team; eventuali regole personalizzate
pubblicate rimandano all’evento originale. I diritti di archivio permanente e
ridistribuzione richiedono un chiarimento prima di estendere questa integrazione.
Il trasferimento di mosse/spread alle due squadre resta un incremento successivo.

## Architettura e aggiornamento

React, routing hash e GitHub Pages restano quelli esistenti. Nessun backend,
database, scheduler o nuova dipendenza. Catalogo, team e calcolatore conservano
il proprio comportamento e i salvataggi esistenti. La vista Competitivo viene
caricata su apertura. Showdown recupera uno snapshot JSON locale incluso nella
build e non chiama servizi esterni dal browser; il JSON non diventa un grande modulo JS.
Ricerca e selezione restano nella sessione passando alle altre viste e tornando;
non sono salvate nel team o in localStorage.

Su desktop (oltre 900 px) classifica e dettaglio hanno bordi superiore e inferiore
allineati. L'altezza è determinata dal dettaglio: la classifica riempie la stessa
altezza, con intestazione e nota sempre esterne all'elenco che scorre internamente.
La ricerca non restringe il pannello; espandere una distribuzione nel dettaglio
aggiorna anche lo spazio disponibile nella classifica. Il vincolo è soltanto CSS,
senza misure JavaScript e senza dipendere dal dataset o dalla regulation.
Su mobile i pannelli rimangono impilati e l'elenco ha altezza massima 48dvh.

Entrambe le schede iniziano dai filtri, senza header introduttivo o card di
metadati separate. Una riga compatta mantiene fonte e formato, numero di battaglie
Showdown o data di generazione del dataset ranked. Periodo/soglia o stagione
restano nel selettore. «Informazioni sui dati», chiuso inizialmente, raccoglie
metodologia, provenienza e orari di consultazione. Le note dei dettagli sono
ridotte; la ranked mantiene l'avviso sugli SP senza natura associata e la data
dei dettagli, quando disponibile, nel riepilogo del blocco richiudibile.
I credits delle fonti restano sempre visibili; condizioni e disclaimer sono
consultabili in «Condizioni e attribuzioni». Questi blocchi usano details/summary
HTML nativi, accessibili anche da tastiera, senza nuove dipendenze.

In «Mosse più usate» di entrambe le schede, il badge accanto al nome mostra il
tipo della mossa nel dataset della regulation attiva. La risoluzione condivisa
accetta gli ID Showdown e i nomi della fonte nativa, senza nuove richieste o tabelle
manuali. Per mosse non riconciliate il badge è omesso; non si presume un tipo.
Nella ranked storica il tipo resta quello del catalogo attivo, come indicato dalla
nota sulla scheda locale, e non certifica eventuali meccaniche della stagione.

Mosse, strumenti, abilità e nature nei riquadri di dettaglio hanno un nome
sottolineato che apre una descrizione con il mouse o con focus da tastiera. Su
touchscreen il tocco apre e un secondo tocco chiude; Escape, tocco esterno,
scorrimento, ridimensionamento e navigazione chiudono il tooltip. È possibile
spostare il puntatore sul testo senza farlo scomparire. Un solo tooltip rimane
aperto e il posizionamento resta entro lo schermo, fuori dai contenitori che
potrebbero tagliarlo. Non è richiesta una libreria esterna.

`CompetitiveTooltip.jsx` è condiviso dalle due fonti e usa `role=tooltip` e
`aria-describedby`; il testo è associato al pulsante con il nome della voce.
`competitive/descriptions.js` risolve ID e nomi senza richieste esterne. Mosse,
strumenti e abilità mostrano il testo originale inglese; le mosse includono anche
tipo, categoria, potenza e precisione base. Per le nature gli effetti positivi,
negativi o neutri sono derivati da `CHAMPIONS_NATURES` e spiegati in italiano,
senza abbinamenti automatici agli spread. I dati non riconosciuti mostrano una
descrizione esplicita di indisponibilità. La regulation di riferimento compare
in ogni tooltip, anche nella ranked nativa.

Le descrizioni degli strumenti sono importate dalla fonte fissata dalla
[pipeline regulation](regulations.md), senza dizionari manuali: una futura
regulation richiede la consueta rigenerazione, non aggiornamenti dei tooltip.

```bash
npm run competitive:import -- --regulation mc --month 2026-09 --cutoff 1760
npm run competitive:check
npm run verify
```

Il mese e la soglia sono espliciti. L'importatore prende formato, mod e riferimento
meccanico da `config/regulations.json` e dallo snapshot della regulation richiesta,
senza un secondo elenco manuale di Pokémon o una seconda configurazione dei formati.
È ammesso solo un formato VGC Champions configurato. Non sostituisce un mese
mancante con uno precedente, non importa il mese corrente ancora incompleto e
non aggiunge automaticamente varianti Bo3 o altri rating.

L'originale viene conservato in `.cache/competitive/<id>.json`, fuori da Git.
La cache conserva anche risposte JSON non valide per l'analisi dell'errore; questo
non le rende snapshot attivi. Per ripetere dalla stessa fonte senza rete:

```bash
npm run competitive:import -- --regulation mc --month 2026-09 --cutoff 1760 --offline
```

Per controllare una correzione della fonte bypassando la cache usare `--refresh`.
Questo flag e `--offline` si escludono. Ogni richiesta ha timeout di 30 secondi e
massimo tre tentativi per errori di rete, HTTP 429 o 5xx, con backoff limitato.
`Retry-After` è rispettato; se richiede oltre dieci secondi, il comando si ferma
e rimanda a una nuova esecuzione. Un 404 o una risposta non JSON non viene ritentato.
Non disabilitare la verifica TLS; quando necessario usare le CA di sistema Node.

La normalizzazione e la validazione precedono la sostituzione del manifest.
Lo snapshot ha un nome derivato dal suo contenuto e viene scritto atomicamente;
solo dopo si aggiorna atomicamente il manifest. Se il recupero o la validazione
falliscono, l'ultimo manifest valido e i suoi file restano disponibili.
Un'importazione identica è un no-op e non cambia la data d'importazione.
Una correzione conserva il vecchio file, recuperabile dalla cronologia Git.
Eseguire un importatore alla volta; controllare sempre il diff prima di pubblicare.

`competitive:check` funziona senza rete e verifica manifest, integrità dei file,
regulation, identità, ranking, provenienza, SP e distribuzioni. È incluso in
`verify` e in `build`, quindi viene eseguito anche dal workflow Pages esistente.
Un guasto del provider non impedisce di costruire l'ultimo snapshot valido.

## Modello e formule

Manifest e snapshot sono in `src/data/competitive/`. Lo schema corrente è `1`.
Il manifest elenca versioni selezionabili; l'interfaccia mostra solo quelle della
regulation attiva, del formato esatto e del riferimento meccanico corrispondente.
Se non ne esistono, mostra «Statistiche non ancora disponibili» senza sostituire
dati di un altro regolamento. Una nuova regulation richiede una nuova importazione;
non cancella lo storico e non modifica i salvataggi del team.

| Campo | Significato |
| --- | --- |
| id | Mese, ID formato Showdown e soglia: nessuna fusione fra campioni |
| provider, sourceUrl, sourceHash | Smogon, URL preciso e SHA-256 della risposta originale |
| importedAt | Data dell'importazione, distinta dal periodo delle battaglie |
| regulationId/Label, format/Label | Regolamento e formato derivati dalla configurazione versionata |
| mechanicsReference | Commit del dataset meccanico usato per verificare identità e SP; non afferma che Smogon abbia usato quel commit per raccogliere tutte le battaglie |
| statSystem, battleStyle | `champions-sp` e `doubles` |
| battles | Numero di battaglie del formato dichiarato da `info`, non un campione di giocatori sopra soglia |
| showdownId, sourceName | Identità normalizzata senza punteggiatura e nome originale; Mega e forme regionali restano distinte |
| usage, rawCount, weightedCount | Frazione d'uso originale, conteggio grezzo originale e somma dei pesi delle abilità |
| distributions | Abilità, strumenti, mosse, compagni, spread e nature; `null` indica campo mancante |
| entries | Chiave originale e peso originale, ordinati e limitati a venti voci positive |
| totalEntries, omittedWeight | Numero totale di voci positive e peso delle voci omesse |
| emptySlotWeight | Peso della chiave vuota delle mosse, tenuto separato; zero nelle altre distribuzioni |

La classifica ordina `usage` decrescente; parità ordinate stabilmente per ID.
Il rank è l'ordine della nostra classifica su tutte le specie della fonte, non
una posizione della ranked nativa. Pokémon assenti dalla fonte non vengono
aggiunti con usage zero.

`usage` chaos è una frazione: nell'interfaccia diventa `usage × 100`.
Le quote dei dettagli sono `peso originale / weightedCount × 100`, senza dividere
per la somma delle sole voci mostrate. Mosse e compagni possono sommare oltre il
100%. La chiave vuota delle mosse conta slot non assegnati, anche più di uno per
set; il suo peso può superare il denominatore e viene conservato separatamente.
Una chiave vuota negli strumenti indica invece nessuno strumento. Assenza del
campo, zero osservato e scelta vuota non sono equivalenti.

Le nature sono aggregate sommando TUTTI gli spread originali prima di limitarli.
Ogni spread mantiene la combinazione di natura e sei valori SP della fonte,
nell'ordine HP/Atk/Def/SpA/SpD/Spe. Non è abbinato automaticamente alla mossa,
all'abilità o allo strumento più comune: tali distribuzioni sono marginali e non
descrivono un set individuale osservato.

Nel mod Champions verificato, il campo Showdown `evs` rappresenta già SP. La
formula nel [commit di riferimento](https://github.com/smogon/pokemon-showdown/blob/1636bf6d0848fb3c9330576963a647d4e179d278/data/mods/champions/scripts.ts)
coincide con il calcolatore del progetto. Nessuna conversione degli EV da 252 è
effettuata. Spread con valori oltre 32 o totale oltre 66 bloccano l'importazione.
Questa interpretazione non si estende ai formati tradizionali, che non sono supportati.

Nomi e immagini della UI vengono dal dataset locale esistente. Per mosse, abilità,
strumenti e compagni non riconciliati si mantiene la chiave della fonte con
un'indicazione esplicita, senza sostituzioni approssimative. Le statistiche base
e le difese derivano da `PokemonDetails`, non dagli aggregati Smogon. La presenza
in un set storico non certifica la legalità corrente della combinazione.

## Limiti e manutenzione

- Un solo snapshot non produce trend o variazioni percentuali.
- Le distribuzioni del sito mostrano inizialmente cinque voci, espandibili fino
  alle venti conservate. Il numero totale originale è dichiarato quando maggiore.
- I pesi zero non sono presentati come scelte popolari. Percentuali positive sotto
  0,1% sono mostrate come «<0,1%»; un denominatore nullo è «Non disponibile».
- Le nature hanno frequenze aggregate verificate, ma non costituiscono una
  raccomandazione di build e non provano la presenza delle altre scelte marginali.
- Non inferiamo IV, set completi, tasso di vittoria o attivazione della Mega.
- Cambi allo schema, regole non riconosciute o specie senza corrispondenza fermano
  l'importazione. I pesi originali, la cache e l'hash rendono analizzabile l'errore.
- Un cambio del commit meccanico di una regulation richiede la revisione e
  reimportazione dei relativi snapshot; non si approva automaticamente la compatibilità.
- Nessun aggiornamento automatico o cron è attivo in questa fase. Un futuro job
  mensile potrà preparare una PR senza pubblicare dati non revisionati.

## Attività successiva: trasferimento verso i team

Richiesta confermata dall'utente: trasferire singole mosse selezionate oppure
uno spread scelto dalla schermata Competitivo a «Mia squadra» o «Squadra avversaria».
La funzionalità è annotata, non implementata in questo incremento, e sarà ripresa
dopo lo sviluppo del competitivo con un piano dedicato.

Il trasferimento dovrà permettere la scelta esplicita del lato e dello slot di
destinazione, verificare forma, regulation, disponibilità delle mosse e sistema SP,
e chiarire come gestire dati già presenti. Lo spread include la natura associata
e i sei SP pubblicati insieme; le mosse sono scelte separatamente dall'utente.
Non si dovrà costruire automaticamente un set completo combinando le voci più
frequenti delle distribuzioni marginali, né presentarlo come realmente osservato.
Saranno riutilizzati il workspace condiviso e i controlli di compatibilità esistenti,
preservando i set indipendenti delle due squadre e i relativi salvataggi.

## Ranked nativa

«Ranked Champions» viene caricata soltanto dopo la scelta esplicita della fonte.
`NativeRankings.jsx` gestisce stagione e selezione indipendenti da Showdown;
`src/lib/competitive/battleData.js` valida le risposte e gestisce una cache temporanea
in memoria. Showdown resta disponibile se il provider non risponde, ma non viene
mai mostrato come sostituzione implicita dei dati nativi.

Le stagioni sono ricavate dalla risposta rankings, iniziando dall'alias Current
(«Attuale»). È supportato solo Doubles. Una richiesta legge la classifica completa
per stagione; le altre leggono i dettagli del solo Pokémon selezionato. Tornare
alla vista riusa dati ancora validi o li richiede dopo la scadenza. La cache
separa stagione, formato e identità. Le [condizioni del provider](competitive-data-sources.md)
descrivono durata, limiti e attribuzione. Nessun importatore o archivio storico
è stato aggiunto per questo servizio.

L'adattatore richiede formato e stagione corrispondenti, classifica completa,
identità e posizioni univoche e provenienza. Nei dettagli verifica identità,
stagione, categorie note, percentuali coerenti, date valide e sei SP interi tra
0 e 32 con totale fino a 66. Nuove categorie non vengono ignorate. Una forma non
riconciliata mantiene nome e dettagli originali senza scheda locale approssimata;
il roster non filtra né rinumera la classifica.

Le schede locali riconciliate sono esplicitamente riferite al catalogo della
regulation attiva, senza certificare il regolamento della stagione nativa.
Nature e spread rimangono separati: nessuna natura viene assegnata automaticamente.
La frequenza della megapietra non diventa una statistica della Mega.

Richieste annullate o risposte di selezioni precedenti non possono sostituire il
dettaglio corrente. Timeout, errori di rete, schema cambiato e HTTP 404/429/503
sono visibili, con riprova esplicita e senza retry automatico, uso di dati scaduti
o fallback Showdown. Nessuna risposta nativa viene salvata in localStorage o nel
repository, né viene offerto un download massivo.

## Verifiche del primo incremento

Test offline per denominatori, nature aggregate, troncamento, slot vuoti, SP,
forme regionali/Mega Z, duplicati, campi mancanti, provenienza e formato/soglia.
I pesi delle fixture sono sintetici, marcati come tali e confinati ai test.
I test di importazione usano directory temporanee e fetch simulato: verificano
idempotenza, assenza di richieste offline, retry, errori e manifest precedente
intatto. I casi M-C sono dichiarati storici; ogni snapshot versionato è inoltre
verificato contro la propria regulation, indipendentemente da quella attiva.

Il campione reale iniziale è stato confrontato con PokéKit: le quote di Rillaboom
coincidono per due abilità, due strumenti, due mosse, due compagni e primo spread,
all'arrotondamento pubblicato. PokéKit non diventa una dipendenza runtime o di test.

Verifica iniziale completata: `npm run verify`, 261 test superati, lint senza
segnalazioni, validazione offline e build con controllo licenze. Nel browser sulla
build di produzione: classifica di 277 specie, quote reali di Rillaboom, ricerca
senza rinormalizzazione, Mega Garchomp Z e SP, espansione delle distribuzioni,
selezione dei compagni, navigazione diretta e cronologia, conservazione della
selezione, attribuzioni e recupero dopo un HTTP 503 simulato sul JSON locale.
Nessuna richiesta esterna dalla vista Showdown o errore JavaScript rilevato; nessun overflow a 1440,
1024, 768, 390 e 320 px. Lo snapshot non viene richiesto all'avvio del Catalogo.

Verifiche ranked nativa: test offline con payload sintetici per schemi, identità,
date, quote mancanti, SP, cache/evizione, scadenza, blocco Retry-After, assenza di
retry automatici, errori e annullamenti. Nel browser sulla build sono stati
verificati CORS e dati reali con sei richieste: classifica di 262 Pokémon, Garchomp,
stagione M7 e forma Maushold-Four non riconciliata. Nessuna richiesta al provider
prima della scelta della fonte; cache riutilizzata al ritorno e nessuna persistenza.
Con intercettazioni sintetiche sono stati verificati HTTP 503 e riprova, payload
malformato e selezioni rapide con risposta precedente ritardata, senza fallback
Showdown. Nessun errore JavaScript o overflow a 1440, 1024, 768, 390 e 320 px;
allineamento dei pannelli desktop conservato.

Compattazione verificata sulla build: header e card metadati assenti, filtri in
apertura, informazioni chiuse inizialmente e consultabili anche da tastiera,
credits visibili, quote mancanti e SP senza natura associata conservati. Controllati
allineamento dei pannelli desktop e assenza di overflow a 1440, 1024, 768, 390 e
320 px, anche con informazioni aperte. Lint e build superati. Per questa verifica
di presentazione la ranked ha usato payload sintetici intercettati nel browser,
senza ulteriori richieste al provider; i dati reali erano stati verificati nel
primo incremento ranked descritto sopra.

Tooltip: verificate rigenerazioni offline identiche per M-B e M-C e aggiunta delle
sole descrizioni degli strumenti (148 e 166), senza modificare meccaniche, roster,
mosse o dati preesistenti. Test su override e testi mancanti, confronto fra
regulation, risoluzione di nomi/ID, nature neutre e modificatrici e dati sconosciuti.
Browser sulla build: Eject Button, Grassy Surge, mosse con valori base e Adamant;
overlay non tagliato, passaggio del puntatore sul tooltip, un solo overlay aperto,
focus/ARIA/Escape, chiusura con scroll, tocco, secondo tocco e tocco esterno a 390
e 320 px. La ranked usa fixture sintetiche per verificare nomi e descrizioni
assenti senza traffico al provider.

Tornei Limitless: `npm run verify` superato con 286 test, inclusi 14 nuovi casi
offline su registro/formati, paginazione, validazione, team parziali, identità,
piazzamenti assenti, cache e scadenza, abort, budget e Retry-After. Nessun dataset
reale dei partecipanti è conservato come fixture. Il client è stato verificato
su registro, prima pagina e un evento reale con 45 giocatori e 45 team pubblicati.
Sulla build Edge ha confermato CORS e quattro richieste complessive, con dettagli
solo dopo selezione. Ulteriori prove con risposte sintetiche: ricerche senza
richieste, ritorno con cache, pagina vuota, selezioni rapide e risposta ritardata
annullata, evento privato senza richiesta di standings, HTTP 503 e pausa prima
della riprova, tooltip da tastiera, badge tipo, dati mancanti e forme sconosciute.
Controllati pannelli desktop della stessa altezza e assenza di overflow a 1440,
1024, 768, 390 e 320 px, senza eccezioni JavaScript. Condizioni commerciali di
archiviazione/redistribuzione non certificate: resta il perimetro di consultazione
con cache temporanea descritto sopra.

Correzione identità/piattaforma: `npm run verify` superato con 292 test, inclusi
sei nuovi casi su tutte le 13 varianti osservate, fallback del nome senza ID,
conflitti, roster differente, Floette ambiguo, piattaforma assente e fasi errate.
Browser sulla build: registro e dettagli/standings reali di Battle Cruise VGC
(59 giocatori) e Side (33), con solo l’elenco di scoperta fissato ai due eventi
per evitare ulteriori richieste di paginazione. Verificati nome e immagine locale
di Floette Eternal, ricerca con il nome del catalogo, Floette ordinario mantenuto
senza associazione, piattaforma non indicata e In presenza, senza errori JavaScript
o overflow a 1440, 390 e 320 px. Ripetute con payload sintetici anche le verifiche
di paginazione, cache, ricerche, selezioni rapide, tooltip e gestione errori
dell’incremento Tornei. Nessun team reale aggiunto al repository.
