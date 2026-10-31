# Sezione Competitivo

La vista `#/competitivo` consulta statistiche mensili Showdown Champions Doubles.
È distinta dalla ranked nativa e dai tornei. La prima versione usa settembre 2026,
Regulation M-C, soglia Smogon 1760. Non contiene team individuali, archetipi, win
rate o trend. Le [fonti e condizioni](competitive-data-sources.md) descrivono il
provider integrato e le alternative studiate.

## Architettura e aggiornamento

React, routing hash e GitHub Pages restano quelli esistenti. Nessun backend,
database, scheduler o nuova dipendenza. Catalogo, team e calcolatore conservano
il proprio comportamento e i salvataggi esistenti. La vista Competitivo viene
caricata su apertura e recupera uno snapshot JSON locale incluso nella build;
non chiama servizi esterni dal browser. Il JSON non diventa un grande modulo JS.
Ricerca e selezione restano nella sessione passando alle altre viste e tornando;
non sono salvate nel team o in localStorage.

Su desktop (oltre 900 px) classifica e dettaglio hanno bordi superiore e inferiore
allineati. L'altezza è determinata dal dettaglio: la classifica riempie la stessa
altezza, con intestazione e nota sempre esterne all'elenco che scorre internamente.
La ricerca non restringe il pannello; espandere una distribuzione nel dettaglio
aggiorna anche lo spazio disponibile nella classifica. Il vincolo è soltanto CSS,
senza misure JavaScript e senza dipendere dal dataset o dalla regulation.
Su mobile i pannelli rimangono impilati e l'elenco ha altezza massima 48dvh.

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
Nessuna richiesta esterna o errore JavaScript rilevato; nessun overflow a 1440,
1024, 768, 390 e 320 px. Lo snapshot non viene richiesto all'avvio del Catalogo.
