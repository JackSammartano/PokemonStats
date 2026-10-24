import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/PokemonStats/',
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'react-vendor', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
            { name: 'champions-learnsets', test: /champions(DamageLearnsets|TeamData)\.js$/ },
            { name: 'mega-evolutions', test: /megaEvolutions\.js$/ },
            { name: 'regulation-learnsets', test: /data[\\/]regulations[\\/][a-z0-9-]+-learnsets\.js$/ },
            { name: 'regulation-data', test: /data[\\/]regulations[\\/](?![^/\\]*-learnsets\.js$)[a-z0-9-]+\.js$/ },
          ],
        },
      },
    },
  },
})
