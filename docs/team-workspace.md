# Navigazione tra team e calcolatore

## Viste

La navigazione principale apre tre viste interne, compatibili con GitHub Pages:

- `#/catalogo`: ricerca, filtri, confronto delle due schede e catalogo Pokémon.
- `#/team`: membri del team, analisi difensiva e preparazione di una coppia per il calcolo.
- `#/damage-calculator`: calcolatore a tutta larghezza, con selettori indipendenti.

Team e calcolatore sono sezioni dedicate, non pannelli richiudibili del catalogo.
I componenti restano montati durante la navigazione. Le due squadre, le configurazioni
dei Pokémon e le mosse sono salvate anche in localStorage; filtri e condizioni di campo
del calcolatore restano nella sessione della pagina.

## Passaggio dal team

Nel team si sceglie un membro per ciascuna squadra con "Confronta". "Configura"
apre direttamente il calcolatore sul membro scelto. Le quattro mosse si modificano
nel calcolatore oppure si importano da Showdown; non c'è un pannello duplicato di preparazione.

"Apri nel damage calculator" trasferisce i due Pokémon e tutte le otto selezioni.
Lo stesso trasferimento avviene usando la navigazione verso il calcolatore dalla vista team.
Le mosse e le configurazioni sono associate al Pokémon e al lato: cambiando Pokémon
si recupera il suo set, senza applicargli quello del precedente. I due lati possono avere
set diversi anche in un mirror match. Riaprendo una coppia, le impostazioni modificate
nel calcolatore restano disponibili. Gli slot vuoti e l'ordine scelto restano invariati.

"Torna al mio team" compare solo quando la voce di navigazione del calcolatore
proviene dal team. L'accesso dal catalogo o da un collegamento diretto non lo mostra.
Le modifiche ai quattro slot si condividono direttamente tra le viste.
Il ritorno riporta nel selettore del team l'avversario corrente; l'attaccante
viene riportato solo se appartiene già al team. Non vengono aggiunti membri automaticamente.
Anche avanti/indietro del browser conserva il contesto della voce di cronologia.

## Azioni sulle schede

Il pulsante `Aggiungi` nelle schede del catalogo e del confronto apre un menu specifico per quel Pokémon.
Non esiste più un controllo globale di destinazione. Il menu contiene:

- Mia squadra e Squadra avversaria: aggiunge alla squadra scelta o rimuove se già presente.
  Il limite di sei membri è indipendente: una squadra piena non disabilita le altre azioni.
- Confronta 1 o Confronta 2: usa il primo slot libero. Se il Pokémon è già selezionato,
  riapre il suo confronto senza duplicarlo. Con entrambi gli slot pieni, mostra due
  destinazioni esplicite indicando il Pokémon che verrebbe sostituito.

La scelta del confronto apre il pannello e lo porta in vista. È visibile anche una singola
scheda con l'altro slot vuoto; i pulsanti Libera Confronta 1/2 permettono di riutilizzare gli slot.
Il menu supporta frecce, Home/End, Escape e chiusura cliccando fuori. `Aggiungi` non cambia
mai attaccante o difensore del calcolatore.
Nel calcolatore non viene mostrato il catalogo: i Pokémon si cambiano attraverso i selettori.

## Ambito di questa modifica

La pagina comprende due squadre, import dagli appunti, quattro slot per Pokémon e
resoconto laterale dei tipi. Le mosse usano il learnset M-C completo, comprese quelle
di stato e con formule non ancora implementate. Queste ultime restano visibili e salvate;
il calcolatore segnala quando non può produrre un risultato o applicare un effetto.

## Verifiche

- Test di risoluzione della coppia, rimozione di membri selezionati e team vuoto.
- Test dei collegamenti diretti e del ritorno contestuale.
- Verifica browser con un team di sei Pokémon: trasferimento Charizard → Venusaur con Flamethrower,
  conservazione della natura Modest, ritorno contestuale, accesso diretto, cronologia,
  blocco del settimo membro e assenza di azioni team nel calcolatore.
- Verifica delle tre viste a 390 px, senza overflow orizzontale o errori JavaScript.
- `npm test`, `npm run lint` e `npm run build`.

Aggiornamento quattro mosse: verificati nel browser anche trasferimento 4+4,
conservazione degli slot vuoti, modifica delle mosse al ritorno, danni fisici/speciali,
immunità nella direzione opposta e invalidazione dei risultati optimizer dopo un cambio di selezione.
La verifica è stata eseguita sia in sviluppo sia sulla build di produzione, a 1440, 390 e 320 px.
