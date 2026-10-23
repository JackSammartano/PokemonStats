# Piano: apertura immediata senza dipendere da PokéAPI

Stato: proposta; questo documento non modifica il caricamento attuale.

## Problema verificato

`src/lib/pokeapi.js` carica prima i 18 tipi, poi il roster in gruppi sequenziali di
10 Pokémon. Per ogni risorsa Pokémon richiede anche le descrizioni delle abilità.
`App.jsx` pubblica il dataset solo alla fine: il contatore avanza, ma il catalogo
aspetta l'ultimo gruppo. Il timeout di ogni richiesta è 10 secondi.

La cache è una Map in memoria: non sopravvive al ricaricamento e memorizza le
risposte concluse, non le richieste in corso. Richieste simultanee della stessa
abilità possono quindi duplicarsi. Le risposte non riuscite attivano un fallback
locale valido, ma soltanto dopo aver atteso la rete.

Abbiamo già nel repository il roster M-C fissato a un commit Showdown, statistiche,
tipi, abilità con descrizioni, tabella dei tipi e learnset Champions. I dati
competitivi provengono già da questo snapshot: PokéAPI aggiunge soprattutto immagini
e descrizioni, senza dover essere un prerequisito per l'apertura.

## Intervento proposto

1. **Dataset locale immediato.** Estrarre un adapter puro che trasformi il roster
   Showdown nel formato usato dalle card, calcolando debolezze e resistenze con la
   tabella locale. Inizializzare lo stato React da questo dataset, senza attendere
   fetch. Preservare nomi, ID, chiavi di salvataggio, import Showdown e forme distinte.
2. **Immagini indipendenti.** Generare una mappa versionata forma → immagine con uno
   script eseguito durante l'aggiornamento dei dati, fuori dalla navigazione utente.
   Preferire asset locali ottimizzati; caricare solo le immagini vicine al viewport,
   con dimensioni fisse e fallback grafico per quelle mancanti. Non sostituire una
   Mega o una forma recente con una forma diversa. Valutare il peso totale degli
   asset prima di includere tutte le illustrazioni.
3. **PokéAPI come arricchimento opzionale.** Mantenere le descrizioni Showdown già
   disponibili. Se servono traduzioni aggiuntive, generare anche queste nello script
   di aggiornamento. Per eventuali arricchimenti a runtime: solo su richiesta/apertura
   del dettaglio, concorrenza limitata, deduplicazione delle promise, cache persistente
   versionata e interruzione delle richieste non più necessarie. Nessun blocco globale.
4. **Separazione dei moduli.** Spostare formattazione, tipi e adapter in moduli locali;
   confinare il client HTTP in un modulo opzionale. Eliminare il caricamento batch
   globale e la notifica che obbliga ad aspettare tutti i Pokémon.
5. **Misurazione e verifica.** Confrontare apertura con cache vuota, rete lenta e
   PokéAPI bloccata. Controllare roster completo, forme, selezioni, import, mosse e
   round trip team/calcolatore. Misurare richieste API, byte e tempo al catalogo
   utilizzabile, senza promettere tempi prima della misurazione.

## Criteri di completamento

- Tutti i 351 Pokémon utilizzabili senza richieste JSON a PokéAPI all'avvio.
- Il blocco di PokéAPI non impedisce catalogo, filtri, team o calcolatore.
- Immagini caricate progressivamente senza spostare il layout.
- Aggiornamenti riproducibili tramite script con fonte e versione esplicite.
- Nessuna perdita di squadre, build o mosse già salvate.

Ordine consigliato: adapter locale + rimozione dell'attesa globale; quindi mappa
immagini e ottimizzazione; infine eventuale arricchimento e cache. La prima fase
risolve il blocco principale senza introdurre un backend.
