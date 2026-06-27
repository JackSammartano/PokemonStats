# PokemonStats

Frontend React + Vite per consultare Regulation Set M-B e mostrare dati live da PokeAPI.

## Funzionalita

- Lista locale Regulation Set M-B da Bulbapedia, con Pokemon base, forme esplicite e Mega Evolutions.
- Ricerca testuale, filtro per tipo e filtro per categoria.
- Stats base, tipi, debolezze difensive e abilita con descrizione.
- Team builder con analisi difensiva.
- Tab Confronta per vedere due card Pokemon complete affiancate.
- Damage calculator Champions con selezione attacker/defender, mosse, item, abilita, nature, SP, boost e condizioni di campo.
- Optimizer `Find KO` / `Find Survival` con ranking `Minimum investment` o `Practical build`.
- Gestione esplicita dei Pokemon non risolti da PokeAPI.
- Fallback per forme Mega tramite `pokemon-species/{name}` e `varieties`, come suggerito dai maintainer PokeAPI.

## Comandi

```bash
npm install
npm run dev
npm run lint
npm run build
```

## Dati

La lista Regulation Set M-B e' mantenuta in `src/data/regulationMb.js`.

Fonte principale del ruleset:

- `https://bulbapedia.bulbagarden.net/wiki/Regulation_Set_M-B`

I dati vengono letti a runtime da:

- `https://pokeapi.co/api/v2/pokemon/{name}`
- `https://pokeapi.co/api/v2/pokemon-species/{name}`
- `https://pokeapi.co/api/v2/type/{type}`
- `https://pokeapi.co/api/v2/ability/{ability}`

Se una forma non e' presente in PokeAPI, l'app mostra gli slug tentati e non inventa stats, tipi o abilita.
