# Copertura del calcolatore Champions

Il calcolatore M-C è utilizzabile per il singolo attacco configurato, incluse
formule speciali e sequenze multicolpo. Le 333 mosse offensive sono registrate;
le abilità e i 166 oggetti sono revisionati, senza voci sconosciute, cambiate o
parziali nel report attuale. Il controllo `--complete` passa ed è obbligatorio
per verifica, aggiornamento e pubblicazione. Questo controllo misura la copertura
dichiarata: non certifica ogni combinazione possibile di effetti.
`npm run data:check -- --details` espone il report aggiornato.

## Fonti e aggiornamenti

La reference matematica locale resta `damage-calc/calc/src/mechanics/champions.ts`.
I metadati aggiornati e gli effetti mancanti nella reference provengono dal commit
Showdown fissato in `config/regulations.json`, applicando l'ereditarietà dei mod.
Si verificano gli handler effettivi di `data/abilities.ts` e degli override Champions,
senza dedurre una formula dalla sola descrizione dell'abilità.

Ogni abilità nello snapshot ha un'impronta SHA-256 del comportamento. La lista
revisionata in `src/data/championsAbilityCoverage.js` è separata dai file generati.
I cambi di nome/rating non alterano l'impronta; cambi a callback, priorità, flag
o condizioni annidate richiedono una nuova verifica. Anche modifiche formali del
corpo di un callback possono richiedere revisione: l'impronta è conservativa.
Non rileva da sola cambi dentro helper esterni invocati da un callback: per un nuovo
commit rimangono necessari il confronto delle fonti e i test di regressione.

Gli oggetti hanno un registro separato, `src/data/championsItemCoverage.js`.
L'impronta comprende callback, condizioni, flag, potenza/effetti Fling, bonus
statistici e collegamenti Mega. Un oggetto nuovo o modificato richiede revisione;
importare uno snapshot non aggiorna il registro delle approvazioni.

Per una nuova regulation:

- nuova specie con comportamento già revisionato: riuso dell'implementazione;
- nuova abilità: classificazione e, se rilevante, implementazione più test;
- abilità nota con impronta diversa: verifica delle modifiche prima del riuso;
- nuovi vincoli o meccaniche: aggiornamento esplicito del motore e della pipeline.

Le abilità sconosciute, cambiate o parziali e gli oggetti non revisionati non producono risultati numerici né
garanzie KO/sopravvivenza nella UI. Le abilità revisionate come prive di effetto
diretto sul singolo attacco, per esempio Frisk, non sono considerate mancanti.
Questa classificazione riguarda il danno dell'attacco configurato, non una
simulazione automatica della partita. Il controllo completo di copertura continua
a fallire finché restano mosse ed effetti non coperti.

## Comportamenti verificati

Il motore usa proprietà di contatto, taglio, pugno, morso, suono e pulse delle mosse.
Sono inclusi Aura Guard, Fluffy, Fur Coat, Tough Claws, Sharpness, Technician,
Iron Fist, Strong Jaw, Mega Launcher, Long Reach, Mold Breaker e altri modificatori
offensivi/difensivi verificati. HP attuali e stato sono configurabili per lato;
Flash Fire richiede l'attivazione esplicita del relativo effetto offensivo.
Multiscale considera gli HP attuali; Guts sostituisce la penalità da scottatura.

Per le mosse multicolpo si seleziona il numero di colpi andati a segno. Gli effetti
secondari casuali delle mosse non vengono forzati nella sequenza, nemmeno se una
vecchia build conserva `secondaryAfterHit` o `secondaryStatus`. Per valutare un
attacco successivo si impostano boost e stati nella configurazione del Pokémon.
Gli effetti garantiti al 100% restano applicabili tra i colpi, rispettando abilità
e oggetti che li modificano o impediscono.

I controlli separati delle reazioni di abilità come Flame Body, Static, Poison
Point, Effect Spore e Poison Touch restano disponibili. Le garanzie sono
condizionate a quelle scelte: non sono probabilità di KO e non includono i
fallimenti di precisione. Le mosse OHKO restano escluse dall'optimizer.

La sequenza ricalcola stato, HP, oggetti, abilità e statistiche tra i colpi e si
interrompe quando uno dei due Pokémon va KO. Focus Sash, Sturdy, bacche resistenti,
cure, drain e danni da contatto possono modificare l'esito. Il drain precede gli
effetti di contatto; il contraccolpo ordinario avviene dopo l'intera mossa.
White Herb non annulla i cali tra i colpi della stessa mossa. Il range indica il
danno diretto dei colpi; cure e Disguise sono considerati nelle garanzie e negli HP
residui della sequenza, senza essere sommati come danno diretto della mossa.

Body Press usa Defense e il relativo boost; Foul Play usa Attack del bersaglio;
Psyshock usa Defense mantenendo Light Screen come schermo rilevante. Sacred Sword
e Darkest Lariat ignorano gli stadi difensivi. Flower Trick, Frost Breath e Storm
Throw applicano il critico garantito senza richiedere il toggle manuale.

Sabbia e Neve applicano i bonus difensivi appropriati. Solar Beam perde potenza
con meteo sfavorevole. Poltergeist fallisce senza oggetto sul bersaglio.
Con due abilità che impostano meteo diversi si richiede il meteo effettivo: non
si attribuisce precedenza al Pokémon che appare a sinistra nel calcolatore.

L'optimizer conserva HP attuali, stato, attivazione dell'abilità, SP nelle altre
statistiche e gli schermi pertinenti. Le ricerche eliminano i boost temporanei e
non cercano critici opzionali; il controllo iniziale usa la stessa base matematica.
Le soluzioni rispettano il budget SP totale. Le etichette delle statistiche seguono
gli override della mossa; Foul Play non suggerisce investimenti offensivi inutili.
Le percentuali delle righe sono riferite agli HP massimi; le soglie di KO e
sopravvivenza usano gli HP correnti.

La ricerca avviene in un Worker nativo, terminato al cambio di configurazione o
all'uscita dal calcolatore. Gli SP variano nelle statistiche coinvolte nel calcolo:
SpA/Atk e Velocità per Electro Ball/Gyro Ball; Atk e SpA, oppure HP/Def/SpD,
per Shell Side Arm. La categoria viene ricalcolata per ogni candidato. Foul Play,
Body Press, Power Trick, Wonder Room e la proprietà delle statistiche copiate da
Imposter sono considerate nell'individuazione degli investimenti rilevanti.
Gli SP nelle altre statistiche restano fissi e il totale non supera 66.
Imposter copia statistiche non HP, tipi, boost, mosse e abilità del bersaglio
selezionato; conserva gli HP propri. La forma attuale del bersaglio e Power Trick
sono risolti prima della copia. Trace e Receiver verificano anche la copertura
dell'abilità copiata. Le restrizioni di copia provengono dai flag Showdown.

Le nature vengono raggruppate soltanto se hanno gli stessi modificatori su tutte
le statistiche rilevanti. I risultati includono distribuzione SP, totale e categoria
effettiva della mossa. Payback con ordine automatico esclude le combinazioni con
parità non risolta e ne segnala il numero; un ordine esplicito elimina l'ambiguità.

Le ricerche non assumono che aumentare una statistica migliori sempre il danno
o la sopravvivenza. Le potature usano dominanza su soluzioni già verificate o
limiti derivati dall'ordinamento. Il danno di Shell Side Arm viene riusato al
variare dei soli HP soltanto in un insieme conservativo di casi con un colpo,
senza oggetti e con abilità note prive di dipendenze dagli HP. Multiscale, Focus
Sash e gli altri casi rimangono calcoli separati. I test confrontano i fronti
dei due ordinamenti con enumerazioni complete su griglie SP controllate.
Si mantengono fino a 200 candidati e se ne mostrano normalmente 50.

## Verifiche numeriche

La suite ordinaria usa fixture numeriche versionate in
`src/lib/damage/fixtures/reference-abilities.json`, oltre a casi mirati sugli effetti
assenti dalla reference. Non richiede la reference installata né accesso alla rete.

Per ricostruire localmente l'oracolo senza modificare la sua checkout o installare
dipendenze:

```bash
node scripts/prepare-damage-reference.mjs "C:/Progetti/damage-calc/damage-calc/calc/src"
node scripts/check-damage-parity.mjs
```

Le formule della reference vengono trasposte nella cache locale. Il confronto usa
i metadati delle mosse dal dataset aggiornato, poiché la reference locale ha anche
un catalogo di mosse precedente a M-C. L'ultimo confronto ha eseguito 125.595 casi
senza differenze, variando abilità, oggetti, meteo, HP, stati e tipi difensivi nei casi indicati
dal programma; non è una prova esaustiva di tutte le interazioni.
Aura Guard, Fluffy, Ice Scales, Tinted Lens e Punk Rock sono assenti dalle formule
della reference locale e hanno verifiche separate basate sugli handler Showdown.
Il comando elenca anche le mosse senza una formula confrontabile nella reference
e il caso Fling/Metronome: la fonte fissata indica potenza 30, il suo catalogo
locale restituisce 0. Questi casi hanno test separati sulle regole della fonte primaria.

Per aggiornare le fixture dopo una revisione dei risultati:

```bash
node scripts/check-damage-parity.mjs --fixtures
```

Il comando fallisce in presenza di differenze; registrare nuove fixture non deve
sostituire l'indagine sulla causa di una regressione. Eseguire infine `npm run verify`
e la simulazione storica `npm run data:simulate -- mb mc --offline`.
