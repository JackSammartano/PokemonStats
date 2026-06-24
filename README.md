# PokemonStats

Frontend React + Vite per consultare la lista Regulation MB e mostrare dati live da PokeAPI.

## Funzionalita

- Lista locale Regulation MB da 224 Pokemon.
- Ricerca testuale e filtro per tipo.
- Stats base, tipi, debolezze difensive e abilita con descrizione.
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

La lista Regulation MB e' mantenuta in `src/data/regulationMb.js`.

I dati vengono letti a runtime da:

- `https://pokeapi.co/api/v2/pokemon/{name}`
- `https://pokeapi.co/api/v2/pokemon-species/{name}`
- `https://pokeapi.co/api/v2/type/{type}`
- `https://pokeapi.co/api/v2/ability/{ability}`

Se una forma non e' presente in PokeAPI, l'app mostra gli slug tentati e non inventa stats, tipi o abilita.
