# Principi vincolanti di sviluppo

## Missione

PokémonStats deve essere un «porto sicuro» per i giocatori: un riferimento
affidabile, mantenibile e aggiornabile in modo semplice e verificabile a ogni
cambio di regulation. Il progetto deve sostenere aggiornamenti frequenti senza
richiedere ogni volta una ricostruzione delle funzionalità esistenti.

Questo principio riguarda l'intero sviluppo: dati, calcoli, interfaccia, gestione
delle squadre, salvataggi, asset, pipeline, test e documentazione. Vale per tutti
i contributori e per gli agenti che lavorano sul repository.

Una funzionalità è completa quando è verificabile oggi ed è chiaro come verrà
mantenuta al prossimo aggiornamento. Questo documento stabilisce requisiti di
sviluppo; non certifica che ogni comportamento attuale sia già coperto da controlli.

## Fonti e aggiornamenti

- Usare fonti verificate e revisioni precise, conservando la provenienza dei dati.
  Una nuova regulation deve indicare esplicitamente formato, mod e revisione.
- Importare i dati ordinari attraverso la pipeline esistente. Non modificare a mano
  gli snapshot generati e non ricopiare nel codice dati già disponibili nella fonte.
- Mantenere distinti dati della regulation, implementazione delle meccaniche e
  presentazione. Un normale aggiornamento di dati non deve richiedere modifiche
  alle card o a ogni schermata che li visualizza.
- Verificare le differenze fra regulation prima di attivare e pubblicare un
  aggiornamento. L'esistenza di un dato nella fonte non dimostra che il motore
  sappia già calcolarne gli effetti.
- Conservare attribuzioni e licenze necessarie anche negli artefatti distribuiti.

La procedura operativa e i comandi sono in [regulations.md](regulations.md): devono
restare il riferimento unico per importazione, confronto, verifica e aggiornamento.

## Accuratezza e limiti dichiarati

- Verificare comportamenti e assunzioni nel codice e nelle fonti pertinenti.
  Dichiarare esplicitamente ciò che non è verificato.
- Segnalare dati mancanti, effetti sconosciuti e calcoli parziali. Non presentare
  risultati o garanzie che il motore non è in grado di sostenere.
- Non sostituire silenziosamente una forma, una meccanica o un dato mancante con
  un caso simile. Conservare le informazioni importate e rendere visibili i limiti.
- Quando nuove meccaniche richiedono codice, implementarle con verifiche dedicate;
  non considerarle risolte dalla sola importazione dei metadati o delle descrizioni.
- Impedire la pubblicazione di aggiornamenti che non soddisfano i controlli di
  completezza richiesti dal progetto. Non disabilitare controlli, ridurre copertura
  o approvare automaticamente comportamenti nuovi per far passare la pipeline.

## Architettura e manutenzione

- Prima di scegliere una soluzione, verificare come il progetto gestisce casi
  analoghi. Riutilizzare convenzioni, funzioni e punti di accesso già presenti.
- Mantenere una fonte di verità per ciascun dato ed evitare logiche duplicate fra
  catalogo, squadre, calcolatore e analisi.
- Preferire modifiche mirate e leggibili. Introdurre nuove dipendenze o astrazioni
  solo quando servono al requisito e il loro costo di manutenzione è motivato.
- Per le eccezioni manuali documentare la fonte, il motivo, l'ambito di validità e
  la verifica necessaria quando cambia la regulation. Un'eccezione verificata per
  una versione non è automaticamente valida per quelle successive.
- Considerare compatibilità dei salvataggi, identità di specie e forme e isolamento
  fra regulation. Migrazioni e ripristini devono essere espliciti e verificabili.
- Mantenere gli aggiornamenti riproducibili e la possibilità di ripristinare la
  configurazione precedente in caso di fallimento. Preservare i riferimenti storici
  necessari alle regressioni e al confronto.

## Criteri per completare una modifica

Prima di considerare completo un intervento, verificare e descrivere:

1. La fonte dei dati o del comportamento e le eventuali incertezze.
2. Come la soluzione si aggiornerà con una nuova regulation e se richiederà
   interventi manuali; tali interventi devono essere individuabili e motivati.
3. L'impatto sulle altre funzionalità, sui salvataggi e sulle regulation supportate.
4. Le verifiche pertinenti: controlli dati, test significativi, lint, build,
   transizioni fra regulation e prove dell'interfaccia quando coinvolta.
5. La documentazione necessaria per ripetere l'aggiornamento e riconoscere gli errori.

I test di meccaniche o snapshot storici devono dichiarare la regulation di
riferimento. I controlli generali devono validare i dati della regulation attiva,
senza confonderli con aspettative proprie di una versione precedente. Una modifica
legittima della fonte richiede una revisione delle aspettative, non la cancellazione
delle regressioni storiche.

Per interventi soltanto documentali sono sufficienti controlli di coerenza,
collegamenti e diff. Se una verifica pertinente non può essere eseguita, dichiarare
il limite; non presentarla come superata.
