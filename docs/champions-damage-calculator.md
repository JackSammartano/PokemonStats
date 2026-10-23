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

### Pannelli principali

La UI operativa usa pannelli apribili/chiudibili:

- `Il mio team`
- `Confronta`
- `Damage calculator`

Il pulsante `+` sulle card Pokemon cambia comportamento in base al pannello aperto:

- con `Il mio team` aperto aggiunge/rimuove il Pokemon dal team, rispettando il limite di 6;
- con `Confronta` aperto seleziona il primo Pokemon a sinistra e il secondo a destra;
- con `Damage calculator` aperto seleziona il primo Pokemon come attacker e il secondo come defender;
- con un terzo Pokemon in `Confronta` o `Damage calculator`, chiede conferma prima di azzerare la coppia corrente e iniziare dal nuovo Pokemon;
- se nessun pannello e' aperto, mantiene il comportamento storico del team builder.

`Confronta` mostra due card Pokemon complete affiancate, con immagine, tipi, stats, debolezze e abilita'.

### Damage calculator UI

Il pannello `Damage calculator` contiene `Champions core damage` ed e' apribile/chiudibile come gli altri pannelli.

Layout attuale:

- colonna sinistra: controlli attacker;
- colonna centrale: impostazioni comuni della battaglia;
- colonna destra: controlli defender.

Le select `Attacker` e `Defender` mostrano anche una piccola immagine del Pokemon selezionato.

Il calculator permette di selezionare:

- attacker
- defender
- move
- weather
- format Singles/Doubles
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
- optimizer ranking:
  - `Minimum investment`
  - `Practical build`

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
- `Chople Berry`
- `Colbur Berry`
- `Mystic Water`
- `Occa Berry`
- `Shuca Berry`
- `Silk Scarf`
- `Spell Tag`
- `Yache Berry`

Le resist berries sono raggruppate nella select sotto `Berry`.

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
- Resist berries implementate come final modifier da reference Champions:
  - `Occa Berry` riduce mosse Fire superefficaci;
  - `Shuca Berry` riduce mosse Ground superefficaci;
  - `Yache Berry` riduce mosse Ice superefficaci;
  - `Chople Berry` riduce mosse Fighting superefficaci;
  - `Colbur Berry` riduce mosse Dark superefficaci.
- Nel calculator single-hit non viene gestito consumo persistente dell'item.
- Sono modellati anche i casi reference `Unnerve` e `Ripen`, anche se queste abilita' non sono ancora selezionabili dalla UI se non implementate/abilitate.

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
- `Drought`
- `Drizzle`
- `Sand Stream`
- `Snow Warning`

Le abilita' weather automatiche sovrascrivono il meteo selezionato:

- `Drought` forza `Sun`;
- `Drizzle` forza `Rain`;
- `Sand Stream` forza `Sand`;
- `Snow Warning` forza `Snow`.

La UI mantiene visibile la select `Weather`, ma mostra sotto la select il meteo effettivo usato dal calcolo. La stessa risoluzione viene usata da `Find KO` e `Find Survival`.

## Optimizer

Feature implementate:

- `Find Survival`
- `Find KO`

Ricerca oggi:

- nature;
- SP;
- weather;
- screen;
- burn;

Nota: `Find KO` non propone piu' soluzioni con crit. `Find Survival` era gia' senza crit.
Nota: i boost temporanei Atk/SpA e Def/SpD non sono piu' dimensioni di ricerca dell'optimizer. Restano disponibili nel damage preview manuale, ma `Find KO` e `Find Survival` cercano spread/build a boost 0.

Item e abilita' sono usati come condizioni fisse selezionate dall'utente, non ancora come dimensioni di ricerca.

Ottimizzazioni gia' fatte:

- non mostra milioni di risultati;
- limita candidate utili;
- scarta opzioni dominate;
- raggruppa le nature equivalenti per la stat cercata:
  - esempio `Find Survival` speciale mostra `Any +SpD nature` invece di righe duplicate `Calm`, `Careful`, `Gentle`, `Sassy`;
  - esempio `Find KO` speciale mostra `Any +SpA nature` invece di righe duplicate `Modest`, `Mild`, `Quiet`, `Rash`;
- mostra risultati in tabella, con colonne allineate per KO e Survival;
- mostra `Showing X best options`;
- spinner Pokeball durante il calcolo.
- se il setup corrente gia' soddisfa l'obiettivo, non lancia la ricerca:
  - `Find KO`: mostra che il KO e' gia' garantito;
  - `Find Survival`: mostra che il defender gia' sopravvive.

Modalita' ranking:

- `Minimum investment`
  - privilegia il minimo investimento sufficiente;
  - utile per capire quanto poco basta.
- `Practical build`
  - privilegia configurazioni piu' naturali da build;
  - per KO preferisce SP offensivi alti;
  - per Survival preferisce investimenti difensivi alti prima di condizioni.

## Prossimi step operativi

### Completato: item speciali Champions

Item Champions presenti nei set e ora calcolati:

- `Occa Berry`
- `Shuca Berry`
- `Yache Berry`
- `Chople Berry`
- `Colbur Berry`

Questi riducono danni superefficaci di tipo specifico.

Verifiche fatte:

- verificati in `calc/src/data/items.ts`;
- verificati in `src/js/data/sets/champions.js`;
- verificato il punto formula in:

```text
C:\Progetti\damage-calc\damage-calc\calc\src\mechanics\champions.ts
```

Test aggiunti:

- berry corretta + mossa superefficace riduce;
- berry corretta + mossa non superefficace non riduce;
- berry sbagliata non riduce;
- `Unnerve` impedisce la berry;
- `Ripen` aumenta la riduzione;
- modalita' UI `Champions set items` include le berries implementate.

Decisione: non gestiamo consumo persistente della berry nel calculator single-hit.

### 1. Abilita' offensive/difensive importanti

Priorita' alta.

Candidate da verificare nei set Champions:

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

Nota: `Drought`, `Drizzle`, `Sand Stream` e `Snow Warning` sono gia' implementate come override del meteo.

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

### 2. Mosse con formule speciali

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

### 3. Optimizer esteso

Da fare solo dopo item/abilita' base.

Possibili estensioni:

- cercare item offensivi;
- cercare item difensivi;
- cercare berries;
- cercare abilita';
- cercare weather/field piu' ampio;
- spiegare perche' una combinazione funziona.

Attenzione: ogni dimensione aumenta combinazioni. Continuare a usare pruning e opzioni dominate.

### Completato: formato Singles/Doubles e mosse spread

Priorita' alta per accuratezza in simulazioni Doubles.

Stato implementato:

- la UI espone `Format` con default `Singles`;
- `calculateChampionsDamage` riceve `field.gameType`;
- in `Doubles`, le mosse con `target: allAdjacent` o `target: allAdjacentFoes`, per esempio `Heat Wave`, applicano lo spread modifier `3072 / 4096`;
- `Find KO` e `Find Survival` usano lo stesso `gameType` selezionato nel calculator.

Reference:

```text
C:\Progetti\damage-calc\damage-calc\calc\src\mechanics\champions.ts
```

Test mirati:

- `Heat Wave` in Singles resta single-target;
- `Heat Wave` in Doubles applica spread modifier;
- `Earthquake` in Doubles applica spread modifier;
- `Find KO` cambia risultato quando il formato passa da Singles a Doubles.

### 4. Validazione con casi reali

Creare una lista di casi manuali da confrontare con reference:

- `Mega Charizard Y` con `Flamethrower` / `Fire Blast` / `Heat Wave` / `Solar Beam`
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

Test totali all'ultimo giro: `49`.

Ultimo commit deployato su GitHub Pages:

```text
cb9fe66 Improve Champions damage calculator mechanics
```

Deploy verificato:

```text
Workflow: Deploy GitHub Pages
Run: 28294644977
Status: success
HTTP: 200
```

URL:

```text
https://jacksammartano.github.io/PokemonStats/
```

## Note importanti

- Non mostrare nella UI dati che non vengono calcolati davvero, salvo disabilitarli esplicitamente.
- PokeAPI e' utile per species, stats, tipi, immagini, abilita' reali, fallback learnset.
- Per mosse e set Champions, preferire la reference `sets/champions.js`.
- Per matematica e ordine modifier, preferire `mechanics/champions.ts`.
- Per dati base di mosse/item/species, preferire `calc/src/data/*.ts`.
- Mega forms: non usare learnset PokeAPI puro come fonte primaria, perche' puo' includere mosse della specie/base o di altra Mega. Usare sempre i set Champions della forma quando disponibili.
