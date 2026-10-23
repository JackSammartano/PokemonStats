# Cambio di forma nelle squadre

Le card di entrambe le squadre mostrano `M` sotto `i` quando il Pokémon tiene
la propria megapietra. Il pulsante sostituisce il membro nello stesso slot;
la Mega mostra `m` per tornare alla forma di partenza. Le Mega importate
direttamente possono tornare alla base anche senza uno stato precedente.

La relazione è generata da `megaStone` nella fonte Showdown fissata del progetto,
con `npm run data:regulation-mc`, e salvata in `src/data/megaEvolutions.js`.
Copre tutte le 82 Mega M-C, incluse Z, X/Y, i due Meowstic e Floette Eternal.
Non viene dedotta dal nome della pietra o dal numero Pokédex.

`toggleMegaEvolution` aggiorna atomicamente il nome nello slot, la build e i
quattro slot delle mosse della sola squadra interessata. Conserva oggetto,
SP, natura, boost, livello, genere e condizioni; applica l'abilità della Mega.
Al ritorno mantiene gli ultimi valori modificati e ripristina l'abilità base
precedentemente salvata, se valida; altrimenti usa la prima abilità base.
Le mosse importate sono mantenute anche quando risultano fuori dal learnset,
con l'avviso già previsto dal calcolatore.

Se la forma di destinazione è già nella stessa squadra, il pulsante è disabilitato
per evitare di unire due membri. La squadra opposta può avere la stessa specie.
I cambi aggiornano selezioni team/calcolatore e identità della modale: statistiche,
tipi, immagini, resoconto, deduzioni e danno vengono ricalcolati dal dataset locale.
