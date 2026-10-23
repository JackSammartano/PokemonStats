# Regulation M-C

## Fonte e importazione

Il roster è generato dal repository [smogon/pokemon-showdown](https://github.com/smogon/pokemon-showdown),
commit `1636bf6d0848fb3c9330576963a647d4e179d278`.
Il formato `[Gen 9 Champions] VGC 2026 Reg M-C` usa il mod `champions`.
L'importatore verifica questa associazione prima di scrivere lo snapshot.

File sorgente del medesimo commit:

- `config/formats.ts`: associazione tra formato M-C e mod Champions.
- `data/mods/champions/formats-data.ts`: disponibilità delle specie e delle forme.
- `data/pokedex.ts`: identità, forme, tipi, statistiche e abilità.
- `data/text/abilities.ts`: descrizioni brevi di fallback delle abilità.

Comando riproducibile, con Node.js 24:

```bash
npm run data:regulation-mc
```

La cache dei sorgenti è separata per commit in `.cache/showdown/` e non entra in Git.
L'output generato è `src/data/regulationMc.js`. La licenza MIT upstream è conservata in
`docs/licenses/pokemon-showdown.txt`.

## Criteri del roster

- Si escludono specie non standard, tier `Illegal`, specie senza tier ammesso,
  specie custom e leggendari limitati o misteriosi esclusi dalle Flat Rules.
- Le forme senza tier proprio ereditano quello della forma di origine o della specie base,
  seguendo la distinzione usata da Showdown.
- Le forme nominate in `cosmeticFormes` non vengono duplicate.
- Restano separate le altre forme: generi, forme regionali, dimensioni, famiglie,
  trasformazioni in battaglia e Mega. Il catalogo serve alla consultazione:
  una forma in battaglia non implica che possa essere scelta come tale all'inizio di un match.

Risultato: **358 voci, di cui 82 forme Mega**. Non è un conteggio di specie uniche.
Sono incluse le sei nuove Mega annunciate per M-C: Absol Z, Salamence, Garchomp Z,
Lucario Z, Golisopod e Baxcalibur.
Riferimento ufficiale: [annuncio Regulation Set M-C](https://champions-news.pokemon-home.com/en/page/816.html).

Rispetto alla precedente lista manuale, fra le correzioni ci sono Watchog al posto di Patrat
e Floette Eternal al posto di Floette normale, oltre alle forme precedentemente mancanti.

## Caricamento nell'app

Il roster, i tipi, le statistiche base e le identità delle abilità sono quelli Showdown.
PokeAPI aggiunge immagini, mosse e descrizioni delle abilità, quando disponibili.
Le corrispondenze fra nomi Showdown e slug PokeAPI sono esplicite per le forme ambigue.

Non si cercano altre Mega o varietà generiche come ripiego. Se il servizio non risponde
o non espone una forma, la scheda usa i dati essenziali dello snapshot; immagini e mosse
non disponibili restano assenti. Un errore nella descrizione di un'abilità non scarta il Pokémon.
La tabella dei tipi locale viene usata se la tabella PokeAPI non è raggiungibile.

Le mosse ottenute da PokeAPI non costituiscono una verifica del learnset legale M-C.
L'integrazione completa di mosse e import Showdown appartiene alla successiva task sui team.
Il damage calculator conserva le limitazioni documentate nel suo worklog.

## Verifiche

`npm test` copre inclusione delle novità M-C, esclusioni, ereditarietà delle forme,
integrità dello snapshot, identità delle Mega Z e caricamento dell'intero roster senza rete.
Include anche i test esistenti del calcolatore. Eseguire inoltre `npm run lint` e `npm run build`.

Verifica reale del 23 ottobre 2026: 358/358 schede caricate, nessuna richiesta HTTP fallita,
354 schede con immagine e 349 con mosse restituite da PokeAPI.
Polteageist Antique, Sinistcha Masterpiece, Vivillon Fancy e Vivillon Pokeball non hanno
una risorsa Pokémon separata in PokeAPI e usano i dati Showdown senza immagine.
Verificati nel browser il catalogo completo e la ricerca di Mega Garchomp Z, senza errori JavaScript.
