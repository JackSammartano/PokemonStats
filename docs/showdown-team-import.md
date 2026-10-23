# Due squadre e importazione Showdown

La pagina Il mio team contiene La mia squadra e La squadra avversaria. Entrambe hanno
sei slot, import dagli appunti, aggiunta manuale dal roster o dal catalogo, selezione
del membro da confrontare, configurazione nel calcolatore, rimozione e svuotamento.
La navigazione non mostra più anteprime o contatori del team; è stata rimossa anche
l'anteprima ridondante della coppia selezionata.

## Importazione

Il pulsante Importa sopra ciascuna squadra chiama `navigator.clipboard.readText()`
su gesto dell'utente. Il testo viene analizzato prima di sostituire quella squadra;
un errore lascia invariati dati e configurazioni. Se il browser non consente la lettura
degli appunti, si apre una finestra dove incollare manualmente lo stesso export.

Il parser gestisce specie e forme Showdown, nickname, genere, oggetto, abilità,
livello, natura, EVs/SPs, IVs e quattro mosse ordinate. Mantiene anche le righe
aggiuntive e il testo originale per consultazione. Il nome della specie viene risolto
contro il roster M-C; un Pokémon sconosciuto, un duplicato o più di sei membri blocca
l'importazione senza modifiche parziali.

Le righe EVs dell'export Champions sono lette direttamente come SP: 0–32 per statistica,
massimo 66 in totale. Non si convertono gli EV da 252 dei giochi principali.
Le mosse di stato e quelle con formule non implementate restano selezionate e salvate;
il calcolatore mostra una spiegazione invece di inventare un danno.
Una mossa conosciuta ma esterna al learnset verificato viene conservata con un avviso.

Il dataset completo di mosse e oggetti deriva dal medesimo commit Showdown del roster,
tramite `npm run data:regulation-mc`. Le abilità e gli oggetti non applicati dal motore
restano impostati e sono segnalati come effetti non implementati. Livelli diversi da 50
e IV diversi da 31 vengono conservati, ma non producono risultati con la formula Champions.

## Stato condiviso e salvataggio

Lo stato applicativo condiviso contiene le due liste di membri, le configurazioni e
i set mossa. Ogni profilo è identificato dal lato e dal nome del Pokémon, quindi due
esemplari della stessa specie in squadre opposte rimangono indipendenti.
Una modifica manuale a natura, abilità, oggetto, livello, nickname, genere, SP, IV,
boost, stato o schermi nel calcolatore aggiorna lo stesso profilo usato dalla pagina team.

Le informazioni sono salvate nel browser con chiave `pokemonstats.team-workspace.v1`.
Il ripristino controlla versione, membri del roster e limiti dei valori numerici.
Se lo storage non è disponibile, la pagina lo segnala e conserva lo stato in memoria.
Lo svuotamento di una squadra rimuove i membri dalla formazione; i loro profili restano
memorizzati per poterli recuperare aggiungendoli nuovamente.

## Resoconto laterale

- Distribuzione dei tipi nelle due squadre.
- Debolezze condivise da almeno due membri, con numero di resistenze e immunità disponibili.
- Numero di bersagli avversari colpibili con una mossa selezionata superefficace, nelle due direzioni.
- Tabella dei 18 tipi con conteggi distinti di deboli, resistenti e immuni; ogni riga
  è apribile per vedere nomi e moltiplicatori effettivi.

Il riepilogo è esplicitamente basato sui tipi: non include abilità, oggetti, danni,
SP o condizioni di campo. Le mosse di stato non vengono contate come copertura offensiva.
Su desktop il resoconto è a destra, su mobile segue le due squadre.

## Verifiche

Il testo completo fornito dall'utente è in `src/lib/fixtures/showdown-team.txt` ed è
usato nei test del parser e della persistenza. Verificati sei membri, Mega Garchomp Z,
forme regionali, genere, SP, oggetti, abilità e mosse come Protect, Transform e Foul Play.
I test coprono anche profili indipendenti nei mirror match, aggiornamenti manuali e input invalidi.

Verifica browser eseguita in sviluppo e sulla build di produzione: import degli appunti
simulati in entrambe le squadre, modifica nel calcolatore e ritorno, ricaricamento,
import invalido senza perdita dati, incolla manuale con appunti non disponibili,
destinazione avversaria dei pulsanti del catalogo, riepilogo dei tipi e larghezze 390/320 px.
