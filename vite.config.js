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
            { name: 'champions-learnsets', test: /champions(DamageLearnsets|TeamData)\.js$/ },
            { name: 'mega-evolutions', test: /megaEvolutions\.js$/ },
          ],
        },
      },
    },
  },
})
