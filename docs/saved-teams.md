# Squadre salvate

La pagina **Il mio team** contiene due schede, con navigazione coerente al Competitivo:
**Pianificazione** ospita le due squadre attive, configurazione, confronto dei tipi
e accesso al calcolatore; **Squadre Salvate** contiene archivio e backup a larghezza
piena. I pannelli restano montati: cambiare scheda non modifica squadre o configurazioni
e la scheda scelta resta selezionata durante la navigazione nella sessione.
Il pulsante **Salva** sopra ogni squadra in Pianificazione crea una
copia con nome. La tendina accanto ad **Aggiungi Pokémon** carica un salvataggio
nella relativa squadra; ciascuna card dell’archivio offre anche i due pulsanti
**Carica nella mia squadra** e **Carica nella squadra avversaria**.

Ogni caricamento mostra la destinazione e la formazione attuale prima della
conferma. Annullare lascia invariato il workspace. Confermare sostituisce solo
quella squadra, comprese le configurazioni precedenti del suo lato; il lato opposto
resta invariato. La selezione del membro da confrontare passa al primo caricato.
Il caricamento dall’archivio apre Pianificazione; anche il trasferimento dal
Competitivo torna a questo pannello. Le modali Salva/Carica sono esterne ai pannelli
nascosti e restano disponibili dalle tendine di Pianificazione. Gli esiti delle
operazioni compaiono sotto la navigazione; gli errori sono distinti dai messaggi
di successo e annunciati come avvisi accessibili.

## Contenuto dei salvataggi

Ogni squadra conserva ID stabile, nome (massimo 80 caratteri), date di creazione e
aggiornamento, regulation (ID, label, formato, commit e famiglia Champions) e da
uno a sei membri ordinati. Le specie sono identificate da `showdownId`, non dal
nome mostrato. Ogni membro conserva quattro slot mosse, inclusi quelli vuoti,
livello, genere, natura, sei SP, strumenti e abilità con ID e nome pubblicato,
e le righe aggiuntive dell’import Showdown.

Il salvataggio rappresenta la formazione e i set: HP correnti, boost, stati e
condizioni temporanee del calcolatore non fanno parte della copia. Al caricamento
ripartono dai valori predefiniti. L’export testuale Showdown resta disponibile e
distinto dal backup dell’archivio.

**Rinomina** cambia il nome della copia. **Aggiorna** permette di scegliere quale
delle due squadre attive sostituirà il salvataggio esistente, mantenendone ID e
data di creazione. **Elimina** chiede conferma e rimuove solo la copia archiviata.
Le modifiche a una squadra attiva non aggiornano automaticamente le copie salvate.

## Persistenza e backup

`src/lib/teamLibrary.js` gestisce schema, validazione, creazione, caricamento e
persistenza. `TeamLibrary.jsx` gestisce archivio e dialog; `SquadSection.jsx` espone
i comandi rapidi. `App.jsx` mantiene uno stato condiviso fra entrambe le squadre.
Nessuna nuova dipendenza, account, database o richiesta di rete.

L’archivio è locale, con chiave `pokemonstats.saved-teams.v1`, separato dal workspace
corrente `pokemonstats.team-workspace.v1.<regulationId>`. Non sincronizza dispositivi.
**Scarica backup** produce `pokemonstats-squadre.json`, con `version: 1` e `teams`.
**Ripristina backup** valida l’intero file e ne mostra il contenuto prima della
conferma: sostituisce l’archivio, lasciando intatte le due squadre attive.

Limiti: 100 squadre e file fino a 2 MB. File non validi o versioni sconosciute non
causano importazioni parziali. Sono controllati date, ID univoci, membri duplicati,
tipi dei campi, nature, quattro slot mosse con valori non vuoti distinti e SP (0–32 ciascuno,
massimo 66). Campi aggiuntivi del JSON vengono esclusi dalle configurazioni.
Al caricamento vengono verificati anche specie e mosse nel dataset corrente.
Il salvataggio non certifica la legalità competitiva di un set importato: eventuali
abilità, strumenti o mosse importati restano consultabili come nel workspace.

Per la regulation/revisione corrente gli ID delle mosse sono verificati direttamente
nel dataset: forme con trattino come `air-slash`, `heat-wave` e `fake-out` sono valide.
Il primo validatore li rifiutava erroneamente con una regex limitata a lettere e
numeri. La correzione conserva lo schema v1 e non riscrive gli ID o gli archivi.
Gli slot vuoti restano consentiti; non sono richieste quattro mosse selezionate.
La cattura di una squadra valida i quattro valori originali del workspace, evitando
di nascondere duplicati o dati errati tramite la normalizzazione visiva degli slot.

Gli errori specificano Pokémon, slot e azione suggerita, per esempio «Charizard:
Air Slash è ripetuta negli slot 2 e 4. Scegli una mossa diversa o lascia uno slot
vuoto». Una mossa non disponibile indica ID, slot e necessità di correggere Configura
o il backup; livello, natura e SP hanno avvisi riferiti al Pokémon. Nessun errore
salva una copia parziale o modifica la squadra originale. Per gli archivi storici
incompatibili restano controlli di struttura e sintassi, senza richiedere le mosse
del dataset attivo; il caricamento rimane disabilitato.

Una scrittura fallita non viene mostrata come riuscita e non sostituisce l’archivio
in memoria. Letture corrotte o indisponibili non provocano sovrascritture automatiche;
si può tentare il ripristino esplicito di un backup. Prima di modificare l’archivio
viene controllato se un’altra scheda l’ha cambiato: in quel caso la lista si aggiorna
e l’azione va ripetuta, evitando di sovrascrivere una versione più recente.

## Prossima regulation

La compatibilità richiede ID regulation, formato, commit e famiglia delle meccaniche
uguali alla build attiva. Salvataggi storici compatibili con lo schema rimangono
nell’archivio e nei backup, con caricamento disabilitato e assenza dalle tendine.
Non vengono eliminati o convertiti implicitamente. Una migrazione richiederà un
intervento esplicito che confronti roster, mosse e sistema di allenamento.

Quando cambia lo schema, aumentare la versione e documentare una migrazione prima
di leggere o riscrivere gli archivi precedenti. Non riutilizzare il nome visualizzato
come identificativo e non cancellare la chiave del workspace per creare l’archivio.

## Verifiche

Test offline: copie indipendenti, slot vuoti, configurazioni, round-trip JSON,
caricamento nei due lati, pulizia limitata alla destinazione, aggiornamento e
conservazione dello storico, dati malformati e assenza di modifiche parziali.
Browser sulla build: salvataggio da entrambi i lati, tendine e pulsanti, conferma
e annullamento, rinomina/aggiornamento/eliminazione, download e ripristino JSON,
file invalido, storico incompatibile, memoria piena, conflitto con un’altra scheda
e persistenza dopo ricaricamento. Controllati pagina e dialog a 1440, 1024, 768,
390 e 320 px senza overflow o eccezioni JavaScript.

Separazione in schede e correzione ID: `npm run verify` superato con 310 test.
I test coprono tutti i 510 ID mossa e i salvataggi predefiniti delle 351 forme M-C,
mosse composte, slot vuoti, duplicati con posizione, valori sconosciuti e storico.
Browser: visibilità dei pannelli, stato mantenuto, modale da Pianificazione,
salvataggio Air Slash/Heat Wave, avviso di successo, caricamento nelle due direzioni,
ritorno a Pianificazione, errori chiari su backup e workspace senza mutazioni.
Ripetute le prove di gestione copie, backup, memoria piena, conflitti tra schede e
trasferimento Showdown; verificati desktop/mobile da 320 a 1440 px senza errori JS.
