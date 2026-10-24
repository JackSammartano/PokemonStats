# Regulation M-C

La pipeline corrente è descritta in [regulations.md](regulations.md).
Lo snapshot operativo completo è `src/data/regulations/mc.js`, selezionato tramite
`src/data/activeRegulation.js`; i vecchi file M-C separati restano riferimenti
storici per i test. `npm run data:regulation-mc` aggiorna lo snapshot completo.
Le sezioni seguenti documentano anche la struttura dell'importazione precedente.

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
- `data/mods/champions/learnsets.ts` e `data/learnsets.ts`: mosse apprendibili, con l'ereditarietà definita da Showdown.

Comando riproducibile, con Node.js 24:

```bash
npm run data:regulation-mc
```

La cache dei sorgenti è separata per commit in `.cache/showdown/` e non entra in Git.
Gli output generati sono `src/data/regulationMc.js`, `src/data/championsDamageLearnsets.js`
e `src/data/championsTeamData.js` (learnset completi, tipi/categorie delle mosse e oggetti per l'import Showdown).
Il secondo contiene l'intersezione fra learnset Champions e mosse implementate dal motore danni,
condividendo i pool identici tra forme per limitare le dimensioni.
La licenza MIT upstream è conservata in
`docs/licenses/pokemon-showdown.txt`.

## Criteri del roster

- Si escludono specie non standard, tier `Illegal`, specie senza tier ammesso,
  specie custom e leggendari limitati o misteriosi esclusi dalle Flat Rules.
- Le forme senza tier proprio ereditano quello della forma di origine o della specie base,
  seguendo la distinzione usata da Showdown.
- Le forme nominate in `cosmeticFormes` non vengono duplicate.
- Tra le forme della stessa specie si mantiene una sola voce quando tipi, statistiche base,
  abilità (incluse quelle nascoste) e mosse apprendibili coincidono. Si confrontano le mosse
  effettive, non i metodi con cui vengono apprese; un learnset mancante interrompe l'importazione.
- Si conservano le forme con differenze funzionali e gli stati di battaglia che cambiano
  il comportamento di mosse o abilità, come Morpeko Hangry e Mimikyu Busted.
  Il catalogo serve alla consultazione:
  una forma in battaglia non implica che possa essere scelta come tale all'inizio di un match.

Risultato: **351 voci, di cui 82 forme Mega**. Non è un conteggio di specie uniche.
Sono incluse le sei nuove Mega annunciate per M-C: Absol Z, Salamence, Garchomp Z,
Lucario Z, Golisopod e Baxcalibur.
Riferimento ufficiale: [annuncio Regulation Set M-C](https://champions-news.pokemon-home.com/en/page/816.html).

Rispetto alla precedente lista manuale, fra le correzioni ci sono Watchog al posto di Patrat
e Floette Eternal al posto di Floette normale, oltre alle forme precedentemente mancanti.

Forme equivalenti eliminate: Polteageist Antique, Sinistcha Masterpiece, Vivillon Fancy,
Vivillon Pokeball, Maushold Four, Squawkabilly Blue e Squawkabilly White.
Per Squawkabilly rimangono verde e giallo, con abilità nascoste diverse.
Toxtricity Low Key rimane perché il learnset differisce da quello della forma Amped.

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

La prima verifica reale del 23 ottobre 2026, prima della rimozione dei duplicati,
ha caricato 358/358 schede senza richieste HTTP fallite. Il catalogo e la ricerca di
Mega Garchomp Z sono stati verificati nel browser senza errori JavaScript.
Le quattro forme allora prive di immagine sono ora escluse in quanto equivalenti.
