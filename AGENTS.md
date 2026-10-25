# Istruzioni per gli agenti

Queste istruzioni si applicano a tutto il repository.

Prima di proporre o apportare modifiche, leggere e rispettare i
[principi di sviluppo](docs/development-principles.md). Per gli interventi che
coinvolgono regulation, dati o meccaniche, leggere anche la
[procedura di aggiornamento](docs/regulations.md).

La missione vincolante è mantenere PokémonStats un riferimento affidabile per i
giocatori, aggiornabile in modo semplice e verificabile a ogni cambio di regulation.
Valutare ogni modifica anche rispetto al prossimo aggiornamento, ai salvataggi,
alla provenienza dei dati e alle regressioni possibili.

Seguire l'architettura e i pattern verificati nel codice. Non inventare dati o
comportamenti, non duplicare manualmente dati importabili e non aggirare controlli
per dichiarare supportata una regulation. Segnalare lacune e limiti esplicitamente.
Le eccezioni necessarie devono essere motivate, circoscritte e verificabili.

Per ogni intervento indicare come verrà mantenuto e quali verifiche sono pertinenti.
Le modifiche soltanto documentali richiedono controlli di coerenza, collegamenti e
diff; non richiedono test applicativi senza una ragione specifica.
