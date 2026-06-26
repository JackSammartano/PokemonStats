# Champions Damage Calculator Worklog

Data: 2026-06-26
Branch: `feature/champions-damage-calculator`
App repo: `C:\Progetti\PokemonStats`
Reference repo: `C:\Progetti\damage-calc\damage-calc`

## Obiettivo

Integrare nella UI di PokemonStats un damage calculator basato sulle regole matematiche e sui dati verificati di Pokemon Champions, usando la repo `damage-calc` come riferimento principale.

Principio guida: non copiare alla cieca Pokemon Showdown, ma usare matematica, dati e logica indispensabili del calcolo danni Pokemon/Champions, adattandoli alla nostra UI.

## Regola di collaborazione

Prima di implementare modifiche importanti:

1. Verificare nella repo locale e nella reference.
2. Spiegare piano e motivazione.
3. Implementare solo dopo approvazione.
4. Non inventare dati mancanti.
5. Quando un dato e' incerto, lasciare fuori la feature o renderla esplicitamente non calcolata.

## Comandi di lavoro

Da `C:\Progetti\PokemonStats`:

```powershell
npm run dev
```

URL locale Vite:

```text
http://localhost:5173/PokemonStats/
```

Verifiche obbligatorie dopo ogni modifica:

```powershell
npm test
npm run lint
npm run build
```

Nota: `git status` mostra warning su `C:\Users\jacks/.config/git/ignore` permission denied. Finora e' innocuo.

## File principali creati o modificati

App:

- `src/App.jsx`
- `src/App.css`
- `src/lib/pokeapi.js`

Damage engine:

- `src/lib/damage/championsData.js`
- `src/lib/damage/championsMath.js`
- `src/lib/damage/championsDamage.js`
- `src/lib/damage/championsOptimizer.js`
- `src/lib/damage/championsAbilities.js`
- `src/lib/damage/championsItems.js`
- `src/lib/damage/championsOptions.js`

Data derivata dalla reference:

- `src/data/championsSetMoves.js`

Test:

- `src/lib/damage/championsDamage.test.js`
- `src/lib/damage/championsOptimizer.test.js`
- `src/lib/damage/championsData.test.js`
- `src/lib/damage/championsItems.test.js`
- `src/lib/damage/championsOptions.test.js`

## Reference da usare

Percorsi principali nella repo reference:

```text
C:\Progetti\damage-calc\damage-calc\calc\src\mechanics\champions.ts
C:\Progetti\damage-calc\damage-calc\calc\src\stats.ts
C:\Progetti\damage-calc\damage-calc\calc\src\data\moves.ts
C:\Progetti\damage-calc\damage-calc\calc\src\data\items.ts
C:\Progetti\damage-calc\damage-calc\calc\src\data\species.ts
C:\Progetti\damage-calc\damage-calc\src\js\data\sets\champions.js
```

Informazioni verificate:

- Champions nella reference usa `gen.num === 0`.
- Livello default usato nel nostro calcolo: `50`.
- Stat formula Champions:
  - HP: `base + SP + 75`
  - altre stat: `floor(nature * (base + SP + 20))`
  - SP ammessi: `0..32`
- Nature Champions da `calc/src/stats.ts`.
- Mosse Champions:
  - `calc/src/data/moves.ts`
  - blocco `CHAMPIONS_LIST`
  - blocco `CHAMPIONS_PATCH`
  - `CHAMPIONS` costruito da `SV` filtrato + patch.
- Set Champions:
  - `src/js/data/sets/champions.js`

## Stato attuale della feature

### Damage calculator UI

Il pannello `Champions core damage` permette di selezionare:

- attacker
- defender
- move
- weather
- attacker ability
- defender ability
- item pool
- attacker damage item
- defender damage item
- attacker nature
- defender nature
- Atk/SpA boost
- Def/SpD boost
- Atk/SpA SP
- Defender HP SP
- Defender Def/SpD SP
- Burn
- Crit
- Reflect
- Light Screen

Label rese piu' chiare:

- `Off boost` -> `Atk/SpA boost`
- `Def boost` -> `Def/SpD boost`
- `Off SP` -> `Atk/SpA SP`
- `HP SP` -> `Defender HP SP`
- `Def SP` -> `Defender Def/SpD SP`

Microtesto contestuale:

- mossa fisica: usa `Atk` / `Def`
- mossa speciale: usa `SpA` / `SpD`

### Select mosse

Le mosse sono filtrate cosi':

1. Fonte primaria: mosse presenti nei set Champions della forma specifica.
2. Fallback: PokeAPI learnset solo se la forma non e' nella mappa Champions.
3. Intersezione finale: solo mosse implementate in `CHAMPIONS_MOVES`.

Caso verificato:

- `Mega Charizard Y` non mostra `Earthquake`.
- Le mosse attuali per `Mega Charizard Y` sono:
  - `Air Slash`
  - `Blast Burn`
  - `Fire Blast`
  - `Flame Charge`
  - `Flamethrower`
  - `Focus Blast`
  - `Heat Wave`
  - `Overheat`
  - `Solar Beam`

### Mappa set moves

`src/data/championsSetMoves.js` e' generato da:

```text
C:\Progetti\damage-calc\damage-calc\src\js\data\sets\champions.js
```

Contiene `pokemon apiName -> unique move ids usate nei set Champions`.

Se cambia la reference o il roster, rigenerare questa mappa con uno script Node che:

1. legge `sets/champions.js`;
2. esegue il file in `vm`;
3. estrae `SETDEX_CHAMPIONS`;
4. normalizza le mosse con id tipo `fire-blast`;
5. scrive `CHAMPIONS_SET_MOVE_IDS`.

### Mosse implementate

`CHAMPIONS_MOVES` ora contiene `146` mosse:

- 7 iniziali;
- 139 aggiunte dal primo batch di mosse damage dirette Champions.

Sono incluse solo mosse:

- presenti nei set Champions;
- con base power fisso;
- non status;
- senza formula speciale di danno;
- senza override stat;
- senza multi-hit;
- senza crit forzato;
- senza base power condizionale.

Esempi inclusi:

- `Air Slash`
- `Blast Burn`
- `Fire Blast`
- `Flame Charge`
- `Flamethrower`
- `Focus Blast`
- `Heat Wave`
- `Overheat`
- `Solar Beam`
- `Close Combat`
- `Dragon Claw`
- `Flare Blitz`
- `Moonblast`
- `Shadow Ball`
- `Sludge Bomb`
- `Stone Edge`
- `Surf`
- `Hydro Pump`

Esempi volutamente esclusi:

- `Body Press`
- `Foul Play`
- `Grass Knot`
- `Psyshock`
- `Stored Power`
- `Water Spout`
- `Rock Blast`
- `Bullet Seed`
- `Freeze-Dry`
- `Flower Trick`

Motivo: richiedono regole specifiche.

### Item

Gli item sono divisi in due modalita' UI:

1. `Champions set items`
   - default;
   - mostra solo item presenti nei set Champions e gia' implementati nel calcolo danni.

2. `All damage items`
   - mostra tutti gli item gia' modellati nel nostro motore;
   - include item non presenti nei set Champions ma utili per simulazione.

`Champions set items` attuali:

- `None`
- `Black Glasses`
- `Charcoal`
- `Mystic Water`
- `Silk Scarf`
- `Spell Tag`

`All damage items` include anche:

- `Fairy Feather`
- `Magnet`
- `Soft Sand`
- `Hard Stone`
- `Metal Coat`
- `Miracle Seed`
- `Never-Melt Ice`
- `Poison Barb`
- `Sharp Beak`
- `Silver Powder`
- `Twisted Spoon`
- altri item gia' nel motore.

Nota verificata:

- `Fairy Feather` esiste in `calc/src/data/items.ts`.
- `Fairy Feather` non compare in `src/js/data/sets/champions.js`.
- Per questo non appare nella modalita' default, ma appare in `All damage items`.

### Abilita'

Le select abilita' mostrano:

- `None` sempre selezionabile;
- abilita' reali del Pokemon da PokeAPI;
- abilita' implementate abilitate;
- abilita' non implementate disabilitate con label `(not calculated yet)`.

Abilita' implementate finora:

- `Adaptability`
- `Huge Power`
- `Pure Power`
- `Thick Fat`
- `Multiscale`
- `Solid Rock`
- `Filter`
- `Levitate`
- `Flash Fire`
- `Water Absorb`
- `Volt Absorb`
- `Sap Sipper`

## Optimizer

Feature implementate:

- `Find Survival`
- `Find KO`

Ricerca oggi:

- nature;
- SP;
- boost;
- weather;
- screen;
- burn;
- crit.

Item e abilita' sono usati come condizioni fisse selezionate dall'utente, non ancora come dimensioni di ricerca.

Ottimizzazioni gia' fatte:

- non mostra milioni di risultati;
- limita candidate utili;
- scarta opzioni dominate;
- mostra `Showing X best options`;
- spinner Pokeball durante il calcolo.

## Prossimi step operativi

### 1. Item speciali Champions

Priorita' alta.

Item Champions presenti nei set ma non ancora calcolati:

- `Occa Berry`
- `Shuca Berry`
- `Yache Berry`
- `Chople Berry`
- `Colbur Berry`

Questi riducono danni superefficaci di tipo specifico.

Workflow corretto:

1. Verificare in `calc/src/data/items.ts` che gli item esistano nella gen Champions/reference.
2. Verificare in `src/js/data/sets/champions.js` quali Pokemon li usano.
3. Verificare nella damage mechanics reference come sono trattate le resist berries:

```text
C:\Progetti\damage-calc\damage-calc\calc\src\mechanics\champions.ts
```

4. Implementare in `championsItems.js` una funzione specifica, probabilmente in final modifier o damage modifier, verificando il punto corretto della formula.
5. Aggiungere test in `championsDamage.test.js` per:
   - berry corretta + mossa superefficace riduce;
   - berry corretta + mossa non superefficace non riduce;
   - berry sbagliata non riduce;
   - modalita' UI `Champions set items` include le berries solo dopo implementazione.

Domanda da risolvere prima di implementare:

- Le berries vanno consumate? Nel calculator single-hit probabilmente basta applicare effetto se condizioni vere. Non gestiamo consumo persistente.

### 2. Abilita' offensive/difensive importanti

Priorita' alta dopo berries.

Candidate da verificare nei set Champions:

- `Drought`
- `Tough Claws`
- `Sharpness`
- `Intimidate`
- `Supreme Overlord`
- `Technician`
- `Sand Force`
- `Mold Breaker`
- `Strong Jaw`
- `Skill Link`
- `Scrappy`
- `Pixilate` / `Aerilate` se presenti

Workflow:

1. Estrarre abilita' dai set Champions:

```powershell
node -e "/* leggere SETDEX_CHAMPIONS e listare ability uniche */"
```

2. Confrontare con `CHAMPIONS_ABILITIES`.
3. Per ogni abilita', cercare comportamento nella reference:

```powershell
rg -n "Tough Claws|Sharpness|Drought|Technician" C:\Progetti\damage-calc\damage-calc\calc\src
```

4. Inserire solo abilita' con effetto danno chiaramente verificato.
5. Aggiungere test per ogni effetto.

### 3. Mosse con formule speciali

Priorita' media, ma fondamentale per copertura.

Gruppi:

- Stat override:
  - `Body Press`
  - `Foul Play`
  - `Psyshock`
- Base power variabile:
  - `Grass Knot`
  - `Gyro Ball`
  - `Heavy Slam`
  - `Stored Power`
  - `Water Spout`
  - `Eruption`
- Multi-hit:
  - `Rock Blast`
  - `Bullet Seed`
  - `Icicle Spear`
  - `Pin Missile`
  - `Scale Shot`
  - `Triple Axel`
- Fixed/OHKO:
  - `Night Shade`
  - `Seismic Toss`
  - `Super Fang`
  - `Horn Drill`
  - `Sheer Cold`
- Type/effect special:
  - `Freeze-Dry`
  - `Flower Trick`

Workflow:

1. Prendere una mossa per gruppo, non tutte insieme.
2. Verificare dati in `moves.ts`.
3. Verificare formula in `mechanics/champions.ts` e file condivisi della reference.
4. Estendere `calculateChampionsDamage` solo per quel comportamento.
5. Aggiungere test mirati.

### 4. Optimizer esteso

Da fare solo dopo item/abilita' base.

Possibili estensioni:

- cercare item offensivi;
- cercare item difensivi;
- cercare berries;
- cercare abilita';
- cercare weather/field piu' ampio;
- spiegare perche' una combinazione funziona.

Attenzione: ogni dimensione aumenta combinazioni. Continuare a usare pruning e opzioni dominate.

### 5. Validazione con casi reali

Creare una lista di casi manuali da confrontare con reference:

- `Mega Charizard Y` con `Flamethrower` / `Fire Blast` / `Solar Beam`
- `Garchomp` con `Earthquake`
- `Kingambit` con `Kowtow Cleave` / `Sucker Punch`
- `Palafin` con `Jet Punch` / `Wave Crash`
- `Skeledirge` se presente, con `Torch Song`
- Pokemon con berries difensive appena implementate

Per ogni caso:

1. Impostare attacker/defender/move in UI.
2. Impostare nature/SP/boost/weather/item/ability.
3. Confrontare range con reference damage-calc.
4. Se differisce, verificare ordine modifier e rounding.

## Come incrociare dati con la reference

### Estrarre item dai set Champions

```powershell
node -e "import fs from 'node:fs'; import vm from 'node:vm'; const code=fs.readFileSync('C:/Progetti/damage-calc/damage-calc/src/js/data/sets/champions.js','utf8'); const ctx={}; vm.createContext(ctx); vm.runInContext(code+'; this.SETDEX_CHAMPIONS=SETDEX_CHAMPIONS;', ctx); const items=[...new Set(Object.values(ctx.SETDEX_CHAMPIONS).flatMap(sets=>Object.values(sets).map(s=>s.item).filter(Boolean)))].sort(); console.log(items.join('\n'));"
```

### Estrarre abilita' dai set Champions

```powershell
node -e "import fs from 'node:fs'; import vm from 'node:vm'; const code=fs.readFileSync('C:/Progetti/damage-calc/damage-calc/src/js/data/sets/champions.js','utf8'); const ctx={}; vm.createContext(ctx); vm.runInContext(code+'; this.SETDEX_CHAMPIONS=SETDEX_CHAMPIONS;', ctx); const abilities=[...new Set(Object.values(ctx.SETDEX_CHAMPIONS).flatMap(sets=>Object.values(sets).map(s=>s.ability).filter(Boolean)))].sort(); console.log(abilities.join('\n'));"
```

### Cercare comportamento in reference

```powershell
rg -n "Item Name|Ability Name|Move Name" C:\Progetti\damage-calc\damage-calc\calc\src
```

Esempi:

```powershell
rg -n "Occa Berry|Shuca Berry|Yache Berry|Chople Berry|Colbur Berry" C:\Progetti\damage-calc\damage-calc\calc\src
rg -n "Drought|Tough Claws|Sharpness|Technician" C:\Progetti\damage-calc\damage-calc\calc\src
rg -n "Body Press|Foul Play|Psyshock|Grass Knot|Stored Power" C:\Progetti\damage-calc\damage-calc\calc\src
```

### Rigenerare la mappa mosse dei set

Usare lo stesso approccio gia' usato:

1. leggere `sets/champions.js`;
2. eseguire in `vm`;
3. estrarre `SETDEX_CHAMPIONS`;
4. normalizzare specie e mosse;
5. scrivere `src/data/championsSetMoves.js`.

Prima di sovrascrivere il file, verificare diff.

## Test attuali

Ultimo stato verificato:

```text
npm test      PASS
npm run lint  PASS
npm run build PASS
```

Test totali all'ultimo giro: `29`.

## Note importanti

- Non mostrare nella UI dati che non vengono calcolati davvero, salvo disabilitarli esplicitamente.
- PokeAPI e' utile per species, stats, tipi, immagini, abilita' reali, fallback learnset.
- Per mosse e set Champions, preferire la reference `sets/champions.js`.
- Per matematica e ordine modifier, preferire `mechanics/champions.ts`.
- Per dati base di mosse/item/species, preferire `calc/src/data/*.ts`.
- Mega forms: non usare learnset PokeAPI puro come fonte primaria, perche' puo' includere mosse della specie/base o di altra Mega. Usare sempre i set Champions della forma quando disponibili.
