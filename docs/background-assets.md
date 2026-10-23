# Sfondo del sito

Originale: `vecteezy_a-vibrant-green-field-with-white-flowers-stretches-towards-a_69539900.jpg`,
4368 × 2448 pixel, 6.343.361 byte. Autore indicato nei metadati: ashalina / Vecteezy.
L'originale resta fuori dal repository; in `public/images` sono presenti solo le versioni web.

L'attribuzione richiesta compare nel footer di tutte le pagine:

```html
<a href="https://www.vecteezy.com/free-photos/pokemon-background">Pokemon Background Stock photos by Vecteezy</a>
```

## Versioni pubblicate

| Versione | Dimensioni | AVIF | WebP |
| --- | --- | ---: | ---: |
| Desktop | 1600 × 897 | 131.405 byte | 213.064 byte |
| Desktop ad alta risoluzione | 2400 × 1345 | 236.060 byte | 367.958 byte |
| Smartphone, ritaglio centrale | 900 × 1600 | 74.870 byte | 108.610 byte |

`SiteBackground` usa un `picture` decorativo e sceglie il taglio verticale fino a 640 px.
Il browser sceglie una sola risorsa in base al formato supportato, alla larghezza e alla densità
dello schermo. AVIF è il formato preferito, WebP il fallback. Le risorse usano il percorso
base di Vite per funzionare anche su GitHub Pages sotto `/PokemonStats/`.

Per rigenerare le immagini dall'originale:

```powershell
npm run assets:background -- "C:\percorso\immagine-originale.jpg"
```

Lo script usa Sharp con qualità AVIF 52 e WebP 80, rimuove i metadati incorporati e
mantiene l'originale intatto. Il tema è in `src/landscape-theme.css`; i colori dei tipi
Pokémon restano quelli definiti in `src/App.css`.
