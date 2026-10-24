# Aggiornare la regulation

La build contiene una sola regulation. `config/regulations.json` identifica quella
attiva e le fonti fissate per ogni regulation supportata. `src/lib/regulation.js`
espone lo snapshot attivo a catalogo, team, import Showdown, Mega e calcolatore.
Gli snapshot storici non sono inclusi nel bundle se non vengono importati.

## Aggiornamento ordinario

Prerequisiti: Node.js 24, dipendenze installate con `npm ci`, working tree controllato
con `git status`. La generazione usa la rete solo per sorgenti non ancora in cache.

1. Aggiungere o aggiornare la voce in `config/regulations.json`: label, nome e ID
   del formato Showdown, commit completo, mod, parent mod, famiglia delle meccaniche
   ed esclusioni verificate. Non usare `master` o nomi di branch come commit.
2. Eseguire `npm run data:regulation -- --regulation md` per generare lo snapshot
   senza attivarlo. `md` è un esempio: non è configurata finché mancano fonti verificate.
3. Eseguire `npm run data:diff -- mc md`. Esaminare aggiunte, rimozioni e modifiche
   a Pokémon, learnset, mosse, oggetti, Mega e copertura del motore.
4. Quando dati e regole sono stati verificati, eseguire `npm run data:update -- md`.
   Il comando genera e attiva lo snapshot, aggiorna le immagini mancanti, valida
   dati, asset e copertura completa del motore, esegue test, lint e build. Se un passaggio fallisce ripristina
   configurazione, puntatore attivo e file dati precedenti; cache e nuovi asset
   scaricati possono restare disponibili. Non pubblica e non crea commit.
5. Controllare il sito in locale: etichette, catalogo, importazione team, mosse,
   Mega, danni nelle due direzioni, condizioni e optimizer, desktop e mobile.
   Esaminare `git diff` prima del commit. Il push su `main` resta il passaggio
   separato che pubblica il sito attraverso il workflow Pages esistente.

Le immagini esistenti vengono riutilizzate quando identità, sorgente e file
corrispondono; `npm run assets:pokemon -- --force` forza la rigenerazione.
La mappa conserva anche le immagini storiche per evitare download nei ritorni
a una regulation precedente. Non si sostituiscono forme mancanti con altre forme.

## Controlli e copertura

`npm run data:check` verifica che configurazione e snapshot attivo coincidano,
che statistiche, learnset e collegamenti Mega siano integri, che le immagini
esistano e che tipo, categoria e potenza delle mosse implementate coincidano
con lo snapshot. Mostra un riepilogo della copertura.

`npm run data:check -- --details` elenca le mosse offensive mancanti e abilità/oggetti
non classificati dal motore. Non tutti gli oggetti e le abilità hanno effetti
sul danno diretto: la classificazione deve distinguerli prima di poter dichiarare
la copertura completa. La presenza nel dataset non equivale a un effetto implementato.
Le abilità risolte dai sorgenti Showdown includono un'impronta dei callback,
priorità, flag e condizioni annidate. `championsAbilityCoverage.js` contiene le
sole impronte revisionate: l'importatore non aggiunge approvazioni automaticamente.
Il report distingue abilità sconosciute, cambiate, parziali e senza effetto diretto.
Anche gli oggetti hanno impronte revisionate separatamente dai dati importati,
nel file `championsItemCoverage.js`; cambi a callback, Fling o bonus statistici
impediscono il riuso automatico dell'effetto precedente.
Un'abilità sconosciuta o cambiata impedisce risultati numerici e garanzie optimizer
nel matchup interessato. Se il comportamento è identico, una nuova specie può
riutilizzare l'implementazione senza modifiche al motore.

Aura Guard di Mega Lucario Z è implementata dai sorgenti Showdown fissati,
con test di contatto, Long Reach e Mold Breaker. La reference locale non la contiene;
le sue lacune non vengono interpretate come assenza dell'effetto nel gioco.
Dettagli sul motore, sulle fonti e sui confronti in [damage-coverage.md](damage-coverage.md).

`npm run data:check -- --complete` restituisce errore se rimangono voci
non coperte/non classificate. Il controllo passa per M-C ed è obbligatorio in
`verify`, `data:update` e Pages: una nuova regulation non può essere pubblicata
con abilità o oggetti ancora da revisionare. La copertura dichiarata non sostituisce
la verifica delle interazioni nelle fonti e nei test.

`npm run verify` esegue validazione dati, test, lint e build. La pipeline Pages
valida i dati prima della pubblicazione. I test dell'interfaccia dati e dei team
usano la regulation attiva; i casi specifici dello snapshot M-C restano regressioni
storiche. Per una regulation futura verificare anche che i casi di integrazione
continuino a usare specie e mosse disponibili, mantenendo le verifiche storiche.
Il workflow `regulations.yml` esegue la transizione storica su pull request e
su avvio manuale, senza pubblicare il sito.

Un cambio di regole, banlist, mod o meccaniche non riconosciute interrompe
l'importazione. Una regulation futura può richiedere codice: la pipeline rende
visibili gli interventi necessari, non può implementare automaticamente nuovi effetti.

## Simulazione M-B → M-C

Entrambi gli snapshot sono completi e versionati in `src/data/regulations/`.
Sono ricostruiti dal commit Showdown `1636bf6d0848fb3c9330576963a647d4e179d278`:
M-B usa `championsregmb`, ereditando `champions`; M-C usa `champions`.
La lista manuale `regulationMb.js` è solo un riferimento storico.

```bash
npm run data:simulate -- mb mc
# Dopo il primo recupero dei sorgenti:
npm run data:simulate -- mb mc --offline
```

La simulazione rigenera e confronta gli snapshot con quelli versionati, attiva
ciascuna regulation temporaneamente, verifica caricamento del catalogo, learnset,
import Showdown, collegamenti Mega, separazione dei salvataggi, asset, suite completa e build.
Stampa il confronto e ripristina configurazione, selezione e build originali
anche se una verifica fallisce. Non è una certificazione della completezza del
motore danni e non pubblica il sito. Eseguire il comando senza un server di sviluppo
condiviso: durante la prova i file della regulation attiva cambiano temporaneamente.

Risultati verificati: M-B 318 forme, 496 mosse, 148 oggetti; M-C 351 forme,
510 mosse, 166 oggetti. Il confronto include le sei Mega introdotte da M-C.

## Salvataggi

La chiave locale è `pokemonstats.team-workspace.v1.<regulation-id>`.
Le squadre di regulation diverse restano separate. Un salvataggio che dichiara
una regulation differente non viene caricato.
M-C recupera la vecchia chiave `pokemonstats.team-workspace.v1` solo se la propria
chiave non esiste; la chiave originale rimane intatta. Il cambio regulation
non converte automaticamente squadre potenzialmente illegali: l'importazione
Showdown permette di trasferirle con le verifiche del formato di destinazione.
