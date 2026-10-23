# Navigazione tra team e calcolatore

## Viste

La navigazione principale apre tre viste interne, compatibili con GitHub Pages:

- `#/catalogo`: ricerca, filtri, confronto delle due schede e catalogo Pokémon.
- `#/team`: membri del team, analisi difensiva e preparazione di una coppia per il calcolo.
- `#/damage-calculator`: calcolatore a tutta larghezza, con selettori indipendenti.

Team e calcolatore sono sezioni dedicate, non pannelli richiudibili del catalogo.
I componenti restano montati durante la navigazione: team, filtri e configurazione
del calcolatore si conservano nella sessione della pagina. Non è ancora un salvataggio persistente.

## Passaggio dal team

Nel team si sceglie un attaccante tra i membri, un avversario dal roster e fino a quattro mosse
per ciascuno, tra quelle gestite dal calcolatore. Il pulsante "Usa come attaccante" su un membro
aggiorna anche questa selezione.

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

I pulsanti `+` e `−` nelle schede del catalogo e del confronto hanno sempre la stessa azione:
aggiungere o rimuovere dal team. Il limite di sei membri vale in entrambi i punti.
Testo accessibile e tooltip indicano l'azione, il nome del Pokémon e l'eventuale team pieno.
I pulsanti non selezionano più implicitamente attaccante o difensore in base al pannello aperto.
Nel calcolatore non viene mostrato il catalogo: i Pokémon si cambiano attraverso i selettori.

## Ambito di questa modifica

È il collegamento tra il team esistente e il calcolatore, con quattro slot mossa per Pokémon.
La gestione del secondo team, il confronto completo dei tipi e l'import Showdown
rimangono le prossime parti della task sui team.
Le mosse del collegamento usano il learnset M-C verificato, filtrato per la copertura del motore;
se manca un learnset
supportato, il selettore lo segnala e richiede di verificarne manualmente l'apprendibilità.

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
