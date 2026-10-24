// Reviewed against Showdown @ 1636bf6d0848fb3c9330576963a647d4e179d278. Damage formulas and conditions are implemented in the Champions engine.
export const CHAMPIONS_ADDITIONAL_MOVES = {
  "accelerock": {
    "name": "Accelerock",
    "type": "rock",
    "category": "physical",
    "basePower": 40,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "priority": 1,
    "hasSecondary": false
  },
  "acid-spray": {
    "name": "Acid Spray",
    "type": "poison",
    "category": "special",
    "basePower": 40,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1,
      "bullet": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 100,
        "boosts": {
          "spd": -2
        }
      }
    ]
  },
  "acrobatics": {
    "name": "Acrobatics",
    "type": "flying",
    "category": "physical",
    "basePower": 55,
    "target": "any",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "distance": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "aerial-ace": {
    "name": "Aerial Ace",
    "type": "flying",
    "category": "physical",
    "basePower": 60,
    "target": "any",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "distance": 1,
      "metronome": 1,
      "slicing": 1
    },
    "hasSecondary": false
  },
  "air-cutter": {
    "name": "Air Cutter",
    "type": "flying",
    "category": "special",
    "basePower": 60,
    "target": "allAdjacentFoes",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1,
      "slicing": 1,
      "wind": 1
    },
    "hasSecondary": false
  },
  "air-slash": {
    "name": "Air Slash",
    "type": "flying",
    "category": "special",
    "basePower": 75,
    "target": "any",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "distance": 1,
      "metronome": 1,
      "slicing": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 30,
        "volatileStatus": "flinch"
      }
    ]
  },
  "alluring-voice": {
    "name": "Alluring Voice",
    "type": "fairy",
    "category": "special",
    "basePower": 80,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "sound": 1,
      "bypasssub": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 100
      }
    ]
  },
  "ancient-power": {
    "name": "Ancient Power",
    "type": "rock",
    "category": "special",
    "basePower": 60,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 10,
        "self": {
          "boosts": {
            "atk": 1,
            "def": 1,
            "spa": 1,
            "spd": 1,
            "spe": 1
          }
        }
      }
    ]
  },
  "apple-acid": {
    "name": "Apple Acid",
    "type": "grass",
    "category": "special",
    "basePower": 90,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 100,
        "boosts": {
          "spd": -1
        }
      }
    ]
  },
  "aqua-cutter": {
    "name": "Aqua Cutter",
    "type": "water",
    "category": "physical",
    "basePower": 70,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1,
      "slicing": 1
    },
    "hasSecondary": false
  },
  "aqua-jet": {
    "name": "Aqua Jet",
    "type": "water",
    "category": "physical",
    "basePower": 40,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "priority": 1,
    "hasSecondary": false
  },
  "aqua-step": {
    "name": "Aqua Step",
    "type": "water",
    "category": "physical",
    "basePower": 80,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "dance": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 100,
        "self": {
          "boosts": {
            "spe": 1
          }
        }
      }
    ]
  },
  "aqua-tail": {
    "name": "Aqua Tail",
    "type": "water",
    "category": "physical",
    "basePower": 90,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "armor-cannon": {
    "name": "Armor Cannon",
    "type": "fire",
    "category": "special",
    "basePower": 120,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1
    },
    "hasSecondary": false,
    "selfBoosts": {
      "def": -1,
      "spd": -1
    }
  },
  "assurance": {
    "name": "Assurance",
    "type": "dark",
    "category": "physical",
    "basePower": 60,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "aura-sphere": {
    "name": "Aura Sphere",
    "type": "fighting",
    "category": "special",
    "basePower": 80,
    "target": "any",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "distance": 1,
      "metronome": 1,
      "bullet": 1,
      "pulse": 1
    },
    "hasSecondary": false
  },
  "aura-wheel": {
    "name": "Aura Wheel",
    "type": "electric",
    "category": "physical",
    "basePower": 110,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 100,
        "self": {
          "boosts": {
            "spe": 1
          }
        }
      }
    ]
  },
  "avalanche": {
    "name": "Avalanche",
    "type": "ice",
    "category": "physical",
    "basePower": 60,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "priority": -4,
    "hasSecondary": false
  },
  "axe-kick": {
    "name": "Axe Kick",
    "type": "fighting",
    "category": "physical",
    "basePower": 120,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasCrashDamage": true,
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 30,
        "volatileStatus": "confusion"
      }
    ]
  },
  "barb-barrage": {
    "name": "Barb Barrage",
    "type": "poison",
    "category": "physical",
    "basePower": 60,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 50,
        "status": "psn"
      }
    ]
  },
  "beak-blast": {
    "name": "Beak Blast",
    "type": "flying",
    "category": "physical",
    "basePower": 120,
    "target": "normal",
    "flags": {
      "protect": 1,
      "failmefirst": 1,
      "nosleeptalk": 1,
      "noassist": 1,
      "failcopycat": 1,
      "failinstruct": 1,
      "bullet": 1
    },
    "priority": -3,
    "hasSecondary": false
  },
  "beat-up": {
    "name": "Beat Up",
    "type": "dark",
    "category": "physical",
    "basePower": 0,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "allyanim": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "belch": {
    "name": "Belch",
    "type": "poison",
    "category": "special",
    "basePower": 120,
    "target": "normal",
    "flags": {
      "protect": 1,
      "failmefirst": 1,
      "nosleeptalk": 1,
      "noassist": 1,
      "failcopycat": 1,
      "failmimic": 1,
      "failinstruct": 1
    },
    "hasSecondary": false
  },
  "bind": {
    "name": "Bind",
    "type": "normal",
    "category": "physical",
    "basePower": 15,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "bite": {
    "name": "Bite",
    "type": "dark",
    "category": "physical",
    "basePower": 60,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1,
      "bite": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 30,
        "volatileStatus": "flinch"
      }
    ]
  },
  "bitter-blade": {
    "name": "Bitter Blade",
    "type": "fire",
    "category": "physical",
    "basePower": 90,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "heal": 1,
      "metronome": 1,
      "slicing": 1
    },
    "hasSecondary": false,
    "drain": [
      1,
      2
    ]
  },
  "bitter-malice": {
    "name": "Bitter Malice",
    "type": "ghost",
    "category": "special",
    "basePower": 75,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 100,
        "boosts": {
          "atk": -1
        }
      }
    ]
  },
  "blast-burn": {
    "name": "Blast Burn",
    "type": "fire",
    "category": "special",
    "basePower": 150,
    "target": "normal",
    "flags": {
      "recharge": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "blaze-kick": {
    "name": "Blaze Kick",
    "type": "fire",
    "category": "physical",
    "basePower": 85,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 10,
        "status": "brn"
      }
    ]
  },
  "blizzard": {
    "name": "Blizzard",
    "type": "ice",
    "category": "special",
    "basePower": 110,
    "target": "allAdjacentFoes",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1,
      "wind": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 10,
        "status": "frz"
      }
    ]
  },
  "body-press": {
    "name": "Body Press",
    "type": "fighting",
    "category": "physical",
    "basePower": 80,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1
    },
    "overrideOffensiveStat": "def",
    "hasSecondary": false
  },
  "body-slam": {
    "name": "Body Slam",
    "type": "normal",
    "category": "physical",
    "basePower": 85,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "nonsky": 1,
      "metronome": 1,
      "minimize": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 30,
        "status": "par"
      }
    ]
  },
  "bone-rush": {
    "name": "Bone Rush",
    "type": "ground",
    "category": "physical",
    "basePower": 30,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "multihit": [
      2,
      5
    ],
    "hasSecondary": false
  },
  "boomburst": {
    "name": "Boomburst",
    "type": "normal",
    "category": "special",
    "basePower": 140,
    "target": "allAdjacent",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "sound": 1,
      "bypasssub": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "bounce": {
    "name": "Bounce",
    "type": "flying",
    "category": "physical",
    "basePower": 85,
    "target": "any",
    "flags": {
      "contact": 1,
      "charge": 1,
      "protect": 1,
      "mirror": 1,
      "gravity": 1,
      "distance": 1,
      "metronome": 1,
      "nosleeptalk": 1,
      "noassist": 1,
      "failinstruct": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 30,
        "status": "par"
      }
    ]
  },
  "brave-bird": {
    "name": "Brave Bird",
    "type": "flying",
    "category": "physical",
    "basePower": 120,
    "target": "any",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "distance": 1,
      "metronome": 1
    },
    "hasSecondary": false,
    "recoil": [
      33,
      100
    ]
  },
  "breaking-swipe": {
    "name": "Breaking Swipe",
    "type": "dragon",
    "category": "physical",
    "basePower": 60,
    "target": "allAdjacentFoes",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 100,
        "boosts": {
          "atk": -1
        }
      }
    ]
  },
  "brick-break": {
    "name": "Brick Break",
    "type": "fighting",
    "category": "physical",
    "basePower": 75,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "brutal-swing": {
    "name": "Brutal Swing",
    "type": "dark",
    "category": "physical",
    "basePower": 60,
    "target": "allAdjacent",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "bug-bite": {
    "name": "Bug Bite",
    "type": "bug",
    "category": "physical",
    "basePower": 60,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "bug-buzz": {
    "name": "Bug Buzz",
    "type": "bug",
    "category": "special",
    "basePower": 90,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "sound": 1,
      "bypasssub": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 10,
        "boosts": {
          "spd": -1
        }
      }
    ]
  },
  "bulldoze": {
    "name": "Bulldoze",
    "type": "ground",
    "category": "physical",
    "basePower": 60,
    "target": "allAdjacent",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "nonsky": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 100,
        "boosts": {
          "spe": -1
        }
      }
    ]
  },
  "bullet-punch": {
    "name": "Bullet Punch",
    "type": "steel",
    "category": "physical",
    "basePower": 40,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "punch": 1,
      "metronome": 1
    },
    "priority": 1,
    "hasSecondary": false
  },
  "bullet-seed": {
    "name": "Bullet Seed",
    "type": "grass",
    "category": "physical",
    "basePower": 25,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1,
      "bullet": 1
    },
    "multihit": [
      2,
      5
    ],
    "hasSecondary": false
  },
  "burn-up": {
    "name": "Burn Up",
    "type": "fire",
    "category": "special",
    "basePower": 130,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "defrost": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "burning-jealousy": {
    "name": "Burning Jealousy",
    "type": "fire",
    "category": "special",
    "basePower": 70,
    "target": "allAdjacentFoes",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 100
      }
    ]
  },
  "ceaseless-edge": {
    "name": "Ceaseless Edge",
    "type": "dark",
    "category": "physical",
    "basePower": 65,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1,
      "slicing": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {}
    ]
  },
  "charge-beam": {
    "name": "Charge Beam",
    "type": "electric",
    "category": "special",
    "basePower": 50,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 70,
        "self": {
          "boosts": {
            "spa": 1
          }
        }
      }
    ]
  },
  "chilling-water": {
    "name": "Chilling Water",
    "type": "water",
    "category": "special",
    "basePower": 50,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 100,
        "boosts": {
          "atk": -1
        }
      }
    ]
  },
  "circle-throw": {
    "name": "Circle Throw",
    "type": "fighting",
    "category": "physical",
    "basePower": 60,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1,
      "noassist": 1,
      "failcopycat": 1
    },
    "priority": -6,
    "hasSecondary": false
  },
  "clanging-scales": {
    "name": "Clanging Scales",
    "type": "dragon",
    "category": "special",
    "basePower": 110,
    "target": "allAdjacentFoes",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "sound": 1,
      "bypasssub": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "clear-smog": {
    "name": "Clear Smog",
    "type": "poison",
    "category": "special",
    "basePower": 50,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "close-combat": {
    "name": "Close Combat",
    "type": "fighting",
    "category": "physical",
    "basePower": 120,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false,
    "selfBoosts": {
      "def": -1,
      "spd": -1
    }
  },
  "comeuppance": {
    "name": "Comeuppance",
    "type": "dark",
    "category": "physical",
    "basePower": 0,
    "target": "scripted",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "failmefirst": 1
    },
    "hasSecondary": false
  },
  "counter": {
    "name": "Counter",
    "type": "fighting",
    "category": "physical",
    "basePower": 0,
    "target": "scripted",
    "flags": {
      "contact": 1,
      "protect": 1,
      "failmefirst": 1,
      "noassist": 1,
      "failcopycat": 1
    },
    "priority": -5,
    "hasSecondary": false
  },
  "covet": {
    "name": "Covet",
    "type": "normal",
    "category": "physical",
    "basePower": 60,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "failmefirst": 1,
      "noassist": 1,
      "failcopycat": 1
    },
    "hasSecondary": false
  },
  "crabhammer": {
    "name": "Crabhammer",
    "type": "water",
    "category": "physical",
    "basePower": 100,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "cross-chop": {
    "name": "Cross Chop",
    "type": "fighting",
    "category": "physical",
    "basePower": 100,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "cross-poison": {
    "name": "Cross Poison",
    "type": "poison",
    "category": "physical",
    "basePower": 70,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1,
      "slicing": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 10,
        "status": "psn"
      }
    ]
  },
  "crunch": {
    "name": "Crunch",
    "type": "dark",
    "category": "physical",
    "basePower": 80,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1,
      "bite": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 20,
        "boosts": {
          "def": -1
        }
      }
    ]
  },
  "crush-claw": {
    "name": "Crush Claw",
    "type": "normal",
    "category": "physical",
    "basePower": 75,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1,
      "slicing": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 50,
        "boosts": {
          "def": -1
        }
      }
    ]
  },
  "dark-pulse": {
    "name": "Dark Pulse",
    "type": "dark",
    "category": "special",
    "basePower": 80,
    "target": "any",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "distance": 1,
      "metronome": 1,
      "pulse": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 20,
        "volatileStatus": "flinch"
      }
    ]
  },
  "darkest-lariat": {
    "name": "Darkest Lariat",
    "type": "dark",
    "category": "physical",
    "basePower": 85,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "ignoreDefensive": true,
    "hasSecondary": false
  },
  "dazzling-gleam": {
    "name": "Dazzling Gleam",
    "type": "fairy",
    "category": "special",
    "basePower": 80,
    "target": "allAdjacentFoes",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "dig": {
    "name": "Dig",
    "type": "ground",
    "category": "physical",
    "basePower": 80,
    "target": "normal",
    "flags": {
      "contact": 1,
      "charge": 1,
      "protect": 1,
      "mirror": 1,
      "nonsky": 1,
      "metronome": 1,
      "nosleeptalk": 1,
      "noassist": 1,
      "failinstruct": 1
    },
    "hasSecondary": false
  },
  "dire-claw": {
    "name": "Dire Claw",
    "type": "poison",
    "category": "physical",
    "basePower": 80,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1,
      "slicing": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 30
      }
    ]
  },
  "discharge": {
    "name": "Discharge",
    "type": "electric",
    "category": "special",
    "basePower": 80,
    "target": "allAdjacent",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 30,
        "status": "par"
      }
    ]
  },
  "dive": {
    "name": "Dive",
    "type": "water",
    "category": "physical",
    "basePower": 80,
    "target": "normal",
    "flags": {
      "contact": 1,
      "charge": 1,
      "protect": 1,
      "mirror": 1,
      "nonsky": 1,
      "allyanim": 1,
      "metronome": 1,
      "nosleeptalk": 1,
      "noassist": 1,
      "failinstruct": 1
    },
    "hasSecondary": false
  },
  "double-edge": {
    "name": "Double-Edge",
    "type": "normal",
    "category": "physical",
    "basePower": 120,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false,
    "recoil": [
      33,
      100
    ]
  },
  "double-hit": {
    "name": "Double Hit",
    "type": "normal",
    "category": "physical",
    "basePower": 35,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "multihit": 2,
    "hasSecondary": false
  },
  "double-shock": {
    "name": "Double Shock",
    "type": "electric",
    "category": "physical",
    "basePower": 120,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "punch": 1
    },
    "hasSecondary": false
  },
  "draco-meteor": {
    "name": "Draco Meteor",
    "type": "dragon",
    "category": "special",
    "basePower": 130,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false,
    "selfBoosts": {
      "spa": -2
    }
  },
  "dragon-claw": {
    "name": "Dragon Claw",
    "type": "dragon",
    "category": "physical",
    "basePower": 80,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1,
      "slicing": 1
    },
    "hasSecondary": false
  },
  "dragon-darts": {
    "name": "Dragon Darts",
    "type": "dragon",
    "category": "physical",
    "basePower": 50,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1,
      "noparentalbond": 1
    },
    "multihit": 2,
    "hasSecondary": false
  },
  "dragon-pulse": {
    "name": "Dragon Pulse",
    "type": "dragon",
    "category": "special",
    "basePower": 85,
    "target": "any",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "distance": 1,
      "metronome": 1,
      "pulse": 1
    },
    "hasSecondary": false
  },
  "dragon-rush": {
    "name": "Dragon Rush",
    "type": "dragon",
    "category": "physical",
    "basePower": 100,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1,
      "minimize": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 20,
        "volatileStatus": "flinch"
      }
    ]
  },
  "dragon-tail": {
    "name": "Dragon Tail",
    "type": "dragon",
    "category": "physical",
    "basePower": 60,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1,
      "noassist": 1,
      "failcopycat": 1
    },
    "priority": -6,
    "hasSecondary": false
  },
  "drain-punch": {
    "name": "Drain Punch",
    "type": "fighting",
    "category": "physical",
    "basePower": 75,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "punch": 1,
      "heal": 1,
      "metronome": 1
    },
    "hasSecondary": false,
    "drain": [
      1,
      2
    ]
  },
  "draining-kiss": {
    "name": "Draining Kiss",
    "type": "fairy",
    "category": "special",
    "basePower": 50,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "heal": 1,
      "metronome": 1
    },
    "hasSecondary": false,
    "drain": [
      3,
      4
    ]
  },
  "drill-peck": {
    "name": "Drill Peck",
    "type": "flying",
    "category": "physical",
    "basePower": 80,
    "target": "any",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "distance": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "drill-run": {
    "name": "Drill Run",
    "type": "ground",
    "category": "physical",
    "basePower": 80,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "drum-beating": {
    "name": "Drum Beating",
    "type": "grass",
    "category": "physical",
    "basePower": 80,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 100,
        "boosts": {
          "spe": -1
        }
      }
    ]
  },
  "dual-wingbeat": {
    "name": "Dual Wingbeat",
    "type": "flying",
    "category": "physical",
    "basePower": 40,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "multihit": 2,
    "hasSecondary": false
  },
  "dynamic-punch": {
    "name": "Dynamic Punch",
    "type": "fighting",
    "category": "physical",
    "basePower": 100,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "punch": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 100,
        "volatileStatus": "confusion"
      }
    ]
  },
  "earth-power": {
    "name": "Earth Power",
    "type": "ground",
    "category": "special",
    "basePower": 90,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "nonsky": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 10,
        "boosts": {
          "spd": -1
        }
      }
    ]
  },
  "earthquake": {
    "name": "Earthquake",
    "type": "ground",
    "category": "physical",
    "basePower": 100,
    "target": "allAdjacent",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "nonsky": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "eerie-spell": {
    "name": "Eerie Spell",
    "type": "psychic",
    "category": "special",
    "basePower": 80,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "sound": 1,
      "bypasssub": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 100
      }
    ]
  },
  "electro-ball": {
    "name": "Electro Ball",
    "type": "electric",
    "category": "special",
    "basePower": 0,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1,
      "bullet": 1
    },
    "hasSecondary": false
  },
  "electro-shot": {
    "name": "Electro Shot",
    "type": "electric",
    "category": "special",
    "basePower": 130,
    "target": "normal",
    "flags": {
      "charge": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "electroweb": {
    "name": "Electroweb",
    "type": "electric",
    "category": "special",
    "basePower": 55,
    "target": "allAdjacentFoes",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 100,
        "boosts": {
          "spe": -1
        }
      }
    ]
  },
  "endeavor": {
    "name": "Endeavor",
    "type": "normal",
    "category": "physical",
    "basePower": 0,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1,
      "noparentalbond": 1
    },
    "hasSecondary": false
  },
  "energy-ball": {
    "name": "Energy Ball",
    "type": "grass",
    "category": "special",
    "basePower": 90,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1,
      "bullet": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 10,
        "boosts": {
          "spd": -1
        }
      }
    ]
  },
  "eruption": {
    "name": "Eruption",
    "type": "fire",
    "category": "special",
    "basePower": 150,
    "target": "allAdjacentFoes",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "expanding-force": {
    "name": "Expanding Force",
    "type": "psychic",
    "category": "special",
    "basePower": 80,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "explosion": {
    "name": "Explosion",
    "type": "normal",
    "category": "physical",
    "basePower": 250,
    "target": "allAdjacent",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1,
      "noparentalbond": 1
    },
    "selfdestruct": "always",
    "hasSecondary": false
  },
  "extrasensory": {
    "name": "Extrasensory",
    "type": "psychic",
    "category": "special",
    "basePower": 80,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 10,
        "volatileStatus": "flinch"
      }
    ]
  },
  "extreme-speed": {
    "name": "Extreme Speed",
    "type": "normal",
    "category": "physical",
    "basePower": 80,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "priority": 2,
    "hasSecondary": false
  },
  "facade": {
    "name": "Facade",
    "type": "normal",
    "category": "physical",
    "basePower": 70,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "fake-out": {
    "name": "Fake Out",
    "type": "normal",
    "category": "physical",
    "basePower": 40,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "priority": 3,
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 100,
        "volatileStatus": "flinch"
      }
    ]
  },
  "feint": {
    "name": "Feint",
    "type": "normal",
    "category": "physical",
    "basePower": 30,
    "target": "normal",
    "flags": {
      "mirror": 1,
      "noassist": 1,
      "failcopycat": 1
    },
    "priority": 2,
    "breaksProtect": true,
    "hasSecondary": false
  },
  "fell-stinger": {
    "name": "Fell Stinger",
    "type": "bug",
    "category": "physical",
    "basePower": 50,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "fickle-beam": {
    "name": "Fickle Beam",
    "type": "dragon",
    "category": "special",
    "basePower": 80,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "fiery-dance": {
    "name": "Fiery Dance",
    "type": "fire",
    "category": "special",
    "basePower": 80,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "dance": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 50,
        "self": {
          "boosts": {
            "spa": 1
          }
        }
      }
    ]
  },
  "final-gambit": {
    "name": "Final Gambit",
    "type": "fighting",
    "category": "special",
    "basePower": 0,
    "target": "normal",
    "flags": {
      "protect": 1,
      "metronome": 1,
      "noparentalbond": 1
    },
    "selfdestruct": "ifHit",
    "hasSecondary": false
  },
  "fire-blast": {
    "name": "Fire Blast",
    "type": "fire",
    "category": "special",
    "basePower": 110,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 10,
        "status": "brn"
      }
    ]
  },
  "fire-fang": {
    "name": "Fire Fang",
    "type": "fire",
    "category": "physical",
    "basePower": 65,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1,
      "bite": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 10,
        "status": "brn"
      },
      {
        "chance": 10,
        "volatileStatus": "flinch"
      }
    ]
  },
  "fire-lash": {
    "name": "Fire Lash",
    "type": "fire",
    "category": "physical",
    "basePower": 90,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 100,
        "boosts": {
          "def": -1
        }
      }
    ]
  },
  "fire-punch": {
    "name": "Fire Punch",
    "type": "fire",
    "category": "physical",
    "basePower": 75,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "punch": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 10,
        "status": "brn"
      }
    ]
  },
  "fire-spin": {
    "name": "Fire Spin",
    "type": "fire",
    "category": "special",
    "basePower": 35,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "first-impression": {
    "name": "First Impression",
    "type": "bug",
    "category": "physical",
    "basePower": 100,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "priority": 2,
    "hasSecondary": false
  },
  "fissure": {
    "name": "Fissure",
    "type": "ground",
    "category": "physical",
    "basePower": 0,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "nonsky": 1,
      "metronome": 1
    },
    "ohko": true,
    "hasSecondary": false
  },
  "flail": {
    "name": "Flail",
    "type": "normal",
    "category": "physical",
    "basePower": 0,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "flame-charge": {
    "name": "Flame Charge",
    "type": "fire",
    "category": "physical",
    "basePower": 50,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 100,
        "self": {
          "boosts": {
            "spe": 1
          }
        }
      }
    ]
  },
  "flamethrower": {
    "name": "Flamethrower",
    "type": "fire",
    "category": "special",
    "basePower": 90,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 10,
        "status": "brn"
      }
    ]
  },
  "flare-blitz": {
    "name": "Flare Blitz",
    "type": "fire",
    "category": "physical",
    "basePower": 120,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "defrost": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "recoil": [
      33,
      100
    ],
    "secondaries": [
      {
        "chance": 10,
        "status": "brn"
      }
    ]
  },
  "flash-cannon": {
    "name": "Flash Cannon",
    "type": "steel",
    "category": "special",
    "basePower": 80,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 10,
        "boosts": {
          "spd": -1
        }
      }
    ]
  },
  "fling": {
    "name": "Fling",
    "type": "dark",
    "category": "physical",
    "basePower": 0,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "allyanim": 1,
      "metronome": 1,
      "noparentalbond": 1
    },
    "hasSecondary": false
  },
  "flip-turn": {
    "name": "Flip Turn",
    "type": "water",
    "category": "physical",
    "basePower": 60,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "flower-trick": {
    "name": "Flower Trick",
    "type": "grass",
    "category": "physical",
    "basePower": 70,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "isCrit": true,
    "hasSecondary": false
  },
  "fly": {
    "name": "Fly",
    "type": "flying",
    "category": "physical",
    "basePower": 90,
    "target": "any",
    "flags": {
      "contact": 1,
      "charge": 1,
      "protect": 1,
      "mirror": 1,
      "gravity": 1,
      "distance": 1,
      "metronome": 1,
      "nosleeptalk": 1,
      "noassist": 1,
      "failinstruct": 1
    },
    "hasSecondary": false
  },
  "flying-press": {
    "name": "Flying Press",
    "type": "fighting",
    "category": "physical",
    "basePower": 100,
    "target": "any",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "gravity": 1,
      "distance": 1,
      "nonsky": 1,
      "metronome": 1,
      "minimize": 1
    },
    "hasSecondary": false
  },
  "focus-blast": {
    "name": "Focus Blast",
    "type": "fighting",
    "category": "special",
    "basePower": 120,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1,
      "bullet": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 10,
        "boosts": {
          "spd": -1
        }
      }
    ]
  },
  "focus-punch": {
    "name": "Focus Punch",
    "type": "fighting",
    "category": "physical",
    "basePower": 150,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "punch": 1,
      "failmefirst": 1,
      "nosleeptalk": 1,
      "noassist": 1,
      "failcopycat": 1,
      "failinstruct": 1
    },
    "priority": -3,
    "hasSecondary": false
  },
  "foul-play": {
    "name": "Foul Play",
    "type": "dark",
    "category": "physical",
    "basePower": 95,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "overrideOffensivePokemon": "target",
    "hasSecondary": false
  },
  "freeze-dry": {
    "name": "Freeze-Dry",
    "type": "ice",
    "category": "special",
    "basePower": 70,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "frenzy-plant": {
    "name": "Frenzy Plant",
    "type": "grass",
    "category": "special",
    "basePower": 150,
    "target": "normal",
    "flags": {
      "recharge": 1,
      "protect": 1,
      "mirror": 1,
      "nonsky": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "frost-breath": {
    "name": "Frost Breath",
    "type": "ice",
    "category": "special",
    "basePower": 60,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "isCrit": true,
    "hasSecondary": false
  },
  "future-sight": {
    "name": "Future Sight",
    "type": "psychic",
    "category": "special",
    "basePower": 120,
    "target": "normal",
    "flags": {
      "allyanim": 1,
      "metronome": 1,
      "futuremove": 1
    },
    "hasSecondary": false
  },
  "giga-drain": {
    "name": "Giga Drain",
    "type": "grass",
    "category": "special",
    "basePower": 75,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "heal": 1,
      "metronome": 1
    },
    "hasSecondary": false,
    "drain": [
      1,
      2
    ]
  },
  "giga-impact": {
    "name": "Giga Impact",
    "type": "normal",
    "category": "physical",
    "basePower": 150,
    "target": "normal",
    "flags": {
      "contact": 1,
      "recharge": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "gigaton-hammer": {
    "name": "Gigaton Hammer",
    "type": "steel",
    "category": "physical",
    "basePower": 160,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1,
      "cantusetwice": 1
    },
    "hasSecondary": false
  },
  "glaive-rush": {
    "name": "Glaive Rush",
    "type": "dragon",
    "category": "physical",
    "basePower": 120,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "grass-knot": {
    "name": "Grass Knot",
    "type": "grass",
    "category": "special",
    "basePower": 0,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "nonsky": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "grassy-glide": {
    "name": "Grassy Glide",
    "type": "grass",
    "category": "physical",
    "basePower": 55,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "grav-apple": {
    "name": "Grav Apple",
    "type": "grass",
    "category": "physical",
    "basePower": 90,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 100,
        "boosts": {
          "def": -1
        }
      }
    ]
  },
  "guillotine": {
    "name": "Guillotine",
    "type": "normal",
    "category": "physical",
    "basePower": 0,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "ohko": true,
    "hasSecondary": false
  },
  "gunk-shot": {
    "name": "Gunk Shot",
    "type": "poison",
    "category": "physical",
    "basePower": 120,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 30,
        "status": "psn"
      }
    ]
  },
  "gyro-ball": {
    "name": "Gyro Ball",
    "type": "steel",
    "category": "physical",
    "basePower": 0,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1,
      "bullet": 1
    },
    "hasSecondary": false
  },
  "hammer-arm": {
    "name": "Hammer Arm",
    "type": "fighting",
    "category": "physical",
    "basePower": 100,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "punch": 1,
      "metronome": 1
    },
    "hasSecondary": false,
    "selfBoosts": {
      "spe": -1
    }
  },
  "hard-press": {
    "name": "Hard Press",
    "type": "steel",
    "category": "physical",
    "basePower": 0,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "head-smash": {
    "name": "Head Smash",
    "type": "rock",
    "category": "physical",
    "basePower": 150,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false,
    "recoil": [
      1,
      2
    ]
  },
  "headlong-rush": {
    "name": "Headlong Rush",
    "type": "ground",
    "category": "physical",
    "basePower": 120,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "punch": 1,
      "metronome": 1
    },
    "hasSecondary": false,
    "selfBoosts": {
      "def": -1,
      "spd": -1
    }
  },
  "heat-crash": {
    "name": "Heat Crash",
    "type": "fire",
    "category": "physical",
    "basePower": 0,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "nonsky": 1,
      "metronome": 1,
      "minimize": 1
    },
    "hasSecondary": false
  },
  "heat-wave": {
    "name": "Heat Wave",
    "type": "fire",
    "category": "special",
    "basePower": 95,
    "target": "allAdjacentFoes",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1,
      "wind": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 10,
        "status": "brn"
      }
    ]
  },
  "heavy-slam": {
    "name": "Heavy Slam",
    "type": "steel",
    "category": "physical",
    "basePower": 0,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "nonsky": 1,
      "metronome": 1,
      "minimize": 1
    },
    "hasSecondary": false
  },
  "hex": {
    "name": "Hex",
    "type": "ghost",
    "category": "special",
    "basePower": 65,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "high-horsepower": {
    "name": "High Horsepower",
    "type": "ground",
    "category": "physical",
    "basePower": 95,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "high-jump-kick": {
    "name": "High Jump Kick",
    "type": "fighting",
    "category": "physical",
    "basePower": 130,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "gravity": 1,
      "metronome": 1
    },
    "hasCrashDamage": true,
    "hasSecondary": false
  },
  "horn-drill": {
    "name": "Horn Drill",
    "type": "normal",
    "category": "physical",
    "basePower": 0,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "ohko": true,
    "hasSecondary": false
  },
  "horn-leech": {
    "name": "Horn Leech",
    "type": "grass",
    "category": "physical",
    "basePower": 75,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "heal": 1,
      "metronome": 1
    },
    "hasSecondary": false,
    "drain": [
      1,
      2
    ]
  },
  "hurricane": {
    "name": "Hurricane",
    "type": "flying",
    "category": "special",
    "basePower": 110,
    "target": "any",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "distance": 1,
      "metronome": 1,
      "wind": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 30,
        "volatileStatus": "confusion"
      }
    ]
  },
  "hydro-cannon": {
    "name": "Hydro Cannon",
    "type": "water",
    "category": "special",
    "basePower": 150,
    "target": "normal",
    "flags": {
      "recharge": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "hydro-pump": {
    "name": "Hydro Pump",
    "type": "water",
    "category": "special",
    "basePower": 110,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "hyper-beam": {
    "name": "Hyper Beam",
    "type": "normal",
    "category": "special",
    "basePower": 150,
    "target": "normal",
    "flags": {
      "recharge": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "hyper-voice": {
    "name": "Hyper Voice",
    "type": "normal",
    "category": "special",
    "basePower": 90,
    "target": "allAdjacentFoes",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "sound": 1,
      "bypasssub": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "ice-beam": {
    "name": "Ice Beam",
    "type": "ice",
    "category": "special",
    "basePower": 90,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 10,
        "status": "frz"
      }
    ]
  },
  "ice-fang": {
    "name": "Ice Fang",
    "type": "ice",
    "category": "physical",
    "basePower": 65,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1,
      "bite": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 10,
        "status": "frz"
      },
      {
        "chance": 10,
        "volatileStatus": "flinch"
      }
    ]
  },
  "ice-hammer": {
    "name": "Ice Hammer",
    "type": "ice",
    "category": "physical",
    "basePower": 100,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "punch": 1,
      "metronome": 1
    },
    "hasSecondary": false,
    "selfBoosts": {
      "spe": -1
    }
  },
  "ice-punch": {
    "name": "Ice Punch",
    "type": "ice",
    "category": "physical",
    "basePower": 75,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "punch": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 10,
        "status": "frz"
      }
    ]
  },
  "ice-shard": {
    "name": "Ice Shard",
    "type": "ice",
    "category": "physical",
    "basePower": 40,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "priority": 1,
    "hasSecondary": false
  },
  "ice-spinner": {
    "name": "Ice Spinner",
    "type": "ice",
    "category": "physical",
    "basePower": 80,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "icicle-crash": {
    "name": "Icicle Crash",
    "type": "ice",
    "category": "physical",
    "basePower": 85,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 30,
        "volatileStatus": "flinch"
      }
    ]
  },
  "icicle-spear": {
    "name": "Icicle Spear",
    "type": "ice",
    "category": "physical",
    "basePower": 25,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "multihit": [
      2,
      5
    ],
    "hasSecondary": false
  },
  "icy-wind": {
    "name": "Icy Wind",
    "type": "ice",
    "category": "special",
    "basePower": 55,
    "target": "allAdjacentFoes",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1,
      "wind": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 100,
        "boosts": {
          "spe": -1
        }
      }
    ]
  },
  "infernal-parade": {
    "name": "Infernal Parade",
    "type": "ghost",
    "category": "special",
    "basePower": 65,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 30,
        "status": "brn"
      }
    ]
  },
  "inferno": {
    "name": "Inferno",
    "type": "fire",
    "category": "special",
    "basePower": 100,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 100,
        "status": "brn"
      }
    ]
  },
  "infestation": {
    "name": "Infestation",
    "type": "bug",
    "category": "special",
    "basePower": 20,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "iron-head": {
    "name": "Iron Head",
    "type": "steel",
    "category": "physical",
    "basePower": 80,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 20,
        "volatileStatus": "flinch"
      }
    ]
  },
  "iron-tail": {
    "name": "Iron Tail",
    "type": "steel",
    "category": "physical",
    "basePower": 100,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 30,
        "boosts": {
          "def": -1
        }
      }
    ]
  },
  "jaw-lock": {
    "name": "Jaw Lock",
    "type": "dark",
    "category": "physical",
    "basePower": 80,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1,
      "bite": 1
    },
    "hasSecondary": false
  },
  "jet-punch": {
    "name": "Jet Punch",
    "type": "water",
    "category": "physical",
    "basePower": 60,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "punch": 1
    },
    "priority": 1,
    "hasSecondary": false
  },
  "knock-off": {
    "name": "Knock Off",
    "type": "dark",
    "category": "physical",
    "basePower": 65,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "kowtow-cleave": {
    "name": "Kowtow Cleave",
    "type": "dark",
    "category": "physical",
    "basePower": 85,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1,
      "slicing": 1
    },
    "hasSecondary": false
  },
  "lash-out": {
    "name": "Lash Out",
    "type": "dark",
    "category": "physical",
    "basePower": 75,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "last-resort": {
    "name": "Last Resort",
    "type": "normal",
    "category": "physical",
    "basePower": 140,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "last-respects": {
    "name": "Last Respects",
    "type": "ghost",
    "category": "physical",
    "basePower": 50,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "lava-plume": {
    "name": "Lava Plume",
    "type": "fire",
    "category": "special",
    "basePower": 80,
    "target": "allAdjacent",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 30,
        "status": "brn"
      }
    ]
  },
  "leaf-blade": {
    "name": "Leaf Blade",
    "type": "grass",
    "category": "physical",
    "basePower": 90,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1,
      "slicing": 1
    },
    "hasSecondary": false
  },
  "leaf-storm": {
    "name": "Leaf Storm",
    "type": "grass",
    "category": "special",
    "basePower": 130,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false,
    "selfBoosts": {
      "spa": -2
    }
  },
  "leech-life": {
    "name": "Leech Life",
    "type": "bug",
    "category": "physical",
    "basePower": 80,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "heal": 1,
      "metronome": 1
    },
    "hasSecondary": false,
    "drain": [
      1,
      2
    ]
  },
  "light-of-ruin": {
    "name": "Light of Ruin",
    "type": "fairy",
    "category": "special",
    "basePower": 140,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1
    },
    "hasSecondary": false,
    "recoil": [
      1,
      2
    ]
  },
  "liquidation": {
    "name": "Liquidation",
    "type": "water",
    "category": "physical",
    "basePower": 85,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 20,
        "boosts": {
          "def": -1
        }
      }
    ]
  },
  "low-kick": {
    "name": "Low Kick",
    "type": "fighting",
    "category": "physical",
    "basePower": 0,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "low-sweep": {
    "name": "Low Sweep",
    "type": "fighting",
    "category": "physical",
    "basePower": 65,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 100,
        "boosts": {
          "spe": -1
        }
      }
    ]
  },
  "lumina-crash": {
    "name": "Lumina Crash",
    "type": "psychic",
    "category": "special",
    "basePower": 80,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 100,
        "boosts": {
          "spd": -2
        }
      }
    ]
  },
  "lunge": {
    "name": "Lunge",
    "type": "bug",
    "category": "physical",
    "basePower": 80,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 100,
        "boosts": {
          "atk": -1
        }
      }
    ]
  },
  "mach-punch": {
    "name": "Mach Punch",
    "type": "fighting",
    "category": "physical",
    "basePower": 40,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "punch": 1,
      "metronome": 1
    },
    "priority": 1,
    "hasSecondary": false
  },
  "make-it-rain": {
    "name": "Make It Rain",
    "type": "steel",
    "category": "special",
    "basePower": 120,
    "target": "allAdjacentFoes",
    "flags": {
      "protect": 1,
      "mirror": 1
    },
    "hasSecondary": false,
    "selfBoosts": {
      "spa": -2
    }
  },
  "matcha-gotcha": {
    "name": "Matcha Gotcha",
    "type": "grass",
    "category": "special",
    "basePower": 80,
    "target": "allAdjacentFoes",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "defrost": 1,
      "heal": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "drain": [
      1,
      2
    ],
    "secondaries": [
      {
        "chance": 20,
        "status": "brn"
      }
    ]
  },
  "mega-kick": {
    "name": "Mega Kick",
    "type": "normal",
    "category": "physical",
    "basePower": 120,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "megahorn": {
    "name": "Megahorn",
    "type": "bug",
    "category": "physical",
    "basePower": 120,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "metal-burst": {
    "name": "Metal Burst",
    "type": "steel",
    "category": "physical",
    "basePower": 0,
    "target": "scripted",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1,
      "failmefirst": 1
    },
    "hasSecondary": false
  },
  "meteor-assault": {
    "name": "Meteor Assault",
    "type": "fighting",
    "category": "physical",
    "basePower": 170,
    "target": "normal",
    "flags": {
      "recharge": 1,
      "protect": 1,
      "mirror": 1,
      "failinstruct": 1
    },
    "hasSecondary": false
  },
  "meteor-beam": {
    "name": "Meteor Beam",
    "type": "rock",
    "category": "special",
    "basePower": 120,
    "target": "normal",
    "flags": {
      "charge": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "meteor-mash": {
    "name": "Meteor Mash",
    "type": "steel",
    "category": "physical",
    "basePower": 90,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "punch": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 20,
        "self": {
          "boosts": {
            "atk": 1
          }
        }
      }
    ]
  },
  "mirror-coat": {
    "name": "Mirror Coat",
    "type": "psychic",
    "category": "special",
    "basePower": 0,
    "target": "scripted",
    "flags": {
      "protect": 1,
      "failmefirst": 1,
      "noassist": 1
    },
    "priority": -5,
    "hasSecondary": false
  },
  "misty-explosion": {
    "name": "Misty Explosion",
    "type": "fairy",
    "category": "special",
    "basePower": 100,
    "target": "allAdjacent",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "selfdestruct": "always",
    "hasSecondary": false
  },
  "moonblast": {
    "name": "Moonblast",
    "type": "fairy",
    "category": "special",
    "basePower": 95,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 10,
        "boosts": {
          "spa": -1
        }
      }
    ]
  },
  "mortal-spin": {
    "name": "Mortal Spin",
    "type": "poison",
    "category": "physical",
    "basePower": 30,
    "target": "allAdjacentFoes",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 100,
        "status": "psn"
      }
    ]
  },
  "mountain-gale": {
    "name": "Mountain Gale",
    "type": "ice",
    "category": "physical",
    "basePower": 120,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 30,
        "volatileStatus": "flinch"
      }
    ]
  },
  "mud-shot": {
    "name": "Mud Shot",
    "type": "ground",
    "category": "special",
    "basePower": 55,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 100,
        "boosts": {
          "spe": -1
        }
      }
    ]
  },
  "mud-slap": {
    "name": "Mud-Slap",
    "type": "ground",
    "category": "special",
    "basePower": 20,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 100,
        "boosts": {
          "accuracy": -1
        }
      }
    ]
  },
  "muddy-water": {
    "name": "Muddy Water",
    "type": "water",
    "category": "special",
    "basePower": 90,
    "target": "allAdjacentFoes",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "nonsky": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 30,
        "boosts": {
          "accuracy": -1
        }
      }
    ]
  },
  "mystical-fire": {
    "name": "Mystical Fire",
    "type": "fire",
    "category": "special",
    "basePower": 75,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 100,
        "boosts": {
          "spa": -1
        }
      }
    ]
  },
  "night-daze": {
    "name": "Night Daze",
    "type": "dark",
    "category": "special",
    "basePower": 90,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 40,
        "boosts": {
          "accuracy": -1
        }
      }
    ]
  },
  "night-shade": {
    "name": "Night Shade",
    "type": "ghost",
    "category": "special",
    "basePower": 0,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "night-slash": {
    "name": "Night Slash",
    "type": "dark",
    "category": "physical",
    "basePower": 70,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1,
      "slicing": 1
    },
    "hasSecondary": false
  },
  "nuzzle": {
    "name": "Nuzzle",
    "type": "electric",
    "category": "physical",
    "basePower": 20,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 100,
        "status": "par"
      }
    ]
  },
  "outrage": {
    "name": "Outrage",
    "type": "dragon",
    "category": "physical",
    "basePower": 120,
    "target": "randomNormal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1,
      "failinstruct": 1
    },
    "hasSecondary": false
  },
  "overdrive": {
    "name": "Overdrive",
    "type": "electric",
    "category": "special",
    "basePower": 80,
    "target": "allAdjacentFoes",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "sound": 1,
      "bypasssub": 1
    },
    "hasSecondary": false
  },
  "overheat": {
    "name": "Overheat",
    "type": "fire",
    "category": "special",
    "basePower": 130,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false,
    "selfBoosts": {
      "spa": -2
    }
  },
  "parabolic-charge": {
    "name": "Parabolic Charge",
    "type": "electric",
    "category": "special",
    "basePower": 65,
    "target": "allAdjacent",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "heal": 1,
      "metronome": 1
    },
    "hasSecondary": false,
    "drain": [
      1,
      2
    ]
  },
  "payback": {
    "name": "Payback",
    "type": "dark",
    "category": "physical",
    "basePower": 50,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "petal-blizzard": {
    "name": "Petal Blizzard",
    "type": "grass",
    "category": "physical",
    "basePower": 90,
    "target": "allAdjacent",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1,
      "wind": 1
    },
    "hasSecondary": false
  },
  "petal-dance": {
    "name": "Petal Dance",
    "type": "grass",
    "category": "special",
    "basePower": 120,
    "target": "randomNormal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "dance": 1,
      "metronome": 1,
      "failinstruct": 1
    },
    "hasSecondary": false
  },
  "phantom-force": {
    "name": "Phantom Force",
    "type": "ghost",
    "category": "physical",
    "basePower": 90,
    "target": "normal",
    "flags": {
      "contact": 1,
      "charge": 1,
      "mirror": 1,
      "metronome": 1,
      "nosleeptalk": 1,
      "noassist": 1,
      "failinstruct": 1
    },
    "breaksProtect": true,
    "hasSecondary": false
  },
  "pin-missile": {
    "name": "Pin Missile",
    "type": "bug",
    "category": "physical",
    "basePower": 25,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "multihit": [
      2,
      5
    ],
    "hasSecondary": false
  },
  "play-rough": {
    "name": "Play Rough",
    "type": "fairy",
    "category": "physical",
    "basePower": 90,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 10,
        "boosts": {
          "atk": -1
        }
      }
    ]
  },
  "pluck": {
    "name": "Pluck",
    "type": "flying",
    "category": "physical",
    "basePower": 60,
    "target": "any",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "distance": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "poison-fang": {
    "name": "Poison Fang",
    "type": "poison",
    "category": "physical",
    "basePower": 50,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1,
      "bite": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 50,
        "status": "tox"
      }
    ]
  },
  "poison-jab": {
    "name": "Poison Jab",
    "type": "poison",
    "category": "physical",
    "basePower": 80,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 30,
        "status": "psn"
      }
    ]
  },
  "pollen-puff": {
    "name": "Pollen Puff",
    "type": "bug",
    "category": "special",
    "basePower": 90,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "allyanim": 1,
      "metronome": 1,
      "bullet": 1
    },
    "hasSecondary": false
  },
  "poltergeist": {
    "name": "Poltergeist",
    "type": "ghost",
    "category": "physical",
    "basePower": 110,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "population-bomb": {
    "name": "Population Bomb",
    "type": "normal",
    "category": "physical",
    "basePower": 20,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "slicing": 1
    },
    "multihit": 10,
    "multiaccuracy": true,
    "hasSecondary": false
  },
  "pounce": {
    "name": "Pounce",
    "type": "bug",
    "category": "physical",
    "basePower": 50,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 100,
        "boosts": {
          "spe": -1
        }
      }
    ]
  },
  "power-gem": {
    "name": "Power Gem",
    "type": "rock",
    "category": "special",
    "basePower": 80,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "power-trip": {
    "name": "Power Trip",
    "type": "dark",
    "category": "physical",
    "basePower": 20,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "power-whip": {
    "name": "Power Whip",
    "type": "grass",
    "category": "physical",
    "basePower": 120,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "psychic": {
    "name": "Psychic",
    "type": "psychic",
    "category": "special",
    "basePower": 90,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 10,
        "boosts": {
          "spd": -1
        }
      }
    ]
  },
  "psychic-fangs": {
    "name": "Psychic Fangs",
    "type": "psychic",
    "category": "physical",
    "basePower": 85,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1,
      "bite": 1
    },
    "hasSecondary": false
  },
  "psychic-noise": {
    "name": "Psychic Noise",
    "type": "psychic",
    "category": "special",
    "basePower": 75,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "sound": 1,
      "bypasssub": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 100,
        "volatileStatus": "healblock"
      }
    ]
  },
  "psycho-cut": {
    "name": "Psycho Cut",
    "type": "psychic",
    "category": "physical",
    "basePower": 70,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1,
      "slicing": 1
    },
    "hasSecondary": false
  },
  "psyshield-bash": {
    "name": "Psyshield Bash",
    "type": "psychic",
    "category": "physical",
    "basePower": 90,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 100,
        "self": {
          "boosts": {
            "def": 1
          }
        }
      }
    ]
  },
  "psyshock": {
    "name": "Psyshock",
    "type": "psychic",
    "category": "special",
    "basePower": 80,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "overrideDefensiveStat": "def",
    "hasSecondary": false
  },
  "pyro-ball": {
    "name": "Pyro Ball",
    "type": "fire",
    "category": "physical",
    "basePower": 120,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "defrost": 1,
      "bullet": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 10,
        "status": "brn"
      }
    ]
  },
  "quick-attack": {
    "name": "Quick Attack",
    "type": "normal",
    "category": "physical",
    "basePower": 40,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "priority": 1,
    "hasSecondary": false
  },
  "rage-fist": {
    "name": "Rage Fist",
    "type": "ghost",
    "category": "physical",
    "basePower": 50,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "punch": 1
    },
    "hasSecondary": false
  },
  "raging-bull": {
    "name": "Raging Bull",
    "type": "normal",
    "category": "physical",
    "basePower": 90,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1
    },
    "hasSecondary": false
  },
  "raging-fury": {
    "name": "Raging Fury",
    "type": "fire",
    "category": "physical",
    "basePower": 120,
    "target": "randomNormal",
    "flags": {
      "protect": 1,
      "mirror": 1
    },
    "hasSecondary": false
  },
  "rapid-spin": {
    "name": "Rapid Spin",
    "type": "normal",
    "category": "physical",
    "basePower": 50,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 100,
        "self": {
          "boosts": {
            "spe": 1
          }
        }
      }
    ]
  },
  "razor-shell": {
    "name": "Razor Shell",
    "type": "water",
    "category": "physical",
    "basePower": 75,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1,
      "slicing": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 50,
        "boosts": {
          "def": -1
        }
      }
    ]
  },
  "reversal": {
    "name": "Reversal",
    "type": "fighting",
    "category": "physical",
    "basePower": 0,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "rising-voltage": {
    "name": "Rising Voltage",
    "type": "electric",
    "category": "special",
    "basePower": 70,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "rock-blast": {
    "name": "Rock Blast",
    "type": "rock",
    "category": "physical",
    "basePower": 25,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1,
      "bullet": 1
    },
    "multihit": [
      2,
      5
    ],
    "hasSecondary": false
  },
  "rock-slide": {
    "name": "Rock Slide",
    "type": "rock",
    "category": "physical",
    "basePower": 75,
    "target": "allAdjacentFoes",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 30,
        "volatileStatus": "flinch"
      }
    ]
  },
  "rock-tomb": {
    "name": "Rock Tomb",
    "type": "rock",
    "category": "physical",
    "basePower": 60,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 100,
        "boosts": {
          "spe": -1
        }
      }
    ]
  },
  "rock-wrecker": {
    "name": "Rock Wrecker",
    "type": "rock",
    "category": "physical",
    "basePower": 150,
    "target": "normal",
    "flags": {
      "recharge": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1,
      "bullet": 1
    },
    "hasSecondary": false
  },
  "round": {
    "name": "Round",
    "type": "normal",
    "category": "special",
    "basePower": 60,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "sound": 1,
      "bypasssub": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "sacred-sword": {
    "name": "Sacred Sword",
    "type": "fighting",
    "category": "physical",
    "basePower": 90,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1,
      "slicing": 1
    },
    "ignoreDefensive": true,
    "hasSecondary": false
  },
  "salt-cure": {
    "name": "Salt Cure",
    "type": "rock",
    "category": "physical",
    "basePower": 40,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 100,
        "volatileStatus": "saltcure"
      }
    ]
  },
  "sand-tomb": {
    "name": "Sand Tomb",
    "type": "ground",
    "category": "physical",
    "basePower": 35,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "scald": {
    "name": "Scald",
    "type": "water",
    "category": "special",
    "basePower": 80,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "defrost": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 30,
        "status": "brn"
      }
    ]
  },
  "scale-shot": {
    "name": "Scale Shot",
    "type": "dragon",
    "category": "physical",
    "basePower": 25,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "multihit": [
      2,
      5
    ],
    "hasSecondary": false
  },
  "scorching-sands": {
    "name": "Scorching Sands",
    "type": "ground",
    "category": "special",
    "basePower": 70,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "defrost": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 30,
        "status": "brn"
      }
    ]
  },
  "seed-bomb": {
    "name": "Seed Bomb",
    "type": "grass",
    "category": "physical",
    "basePower": 80,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1,
      "bullet": 1
    },
    "hasSecondary": false
  },
  "seismic-toss": {
    "name": "Seismic Toss",
    "type": "fighting",
    "category": "physical",
    "basePower": 0,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "nonsky": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "self-destruct": {
    "name": "Self-Destruct",
    "type": "normal",
    "category": "physical",
    "basePower": 200,
    "target": "allAdjacent",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1,
      "noparentalbond": 1
    },
    "selfdestruct": "always",
    "hasSecondary": false
  },
  "shadow-ball": {
    "name": "Shadow Ball",
    "type": "ghost",
    "category": "special",
    "basePower": 80,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1,
      "bullet": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 20,
        "boosts": {
          "spd": -1
        }
      }
    ]
  },
  "shadow-claw": {
    "name": "Shadow Claw",
    "type": "ghost",
    "category": "physical",
    "basePower": 70,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1,
      "slicing": 1
    },
    "hasSecondary": false
  },
  "shadow-punch": {
    "name": "Shadow Punch",
    "type": "ghost",
    "category": "physical",
    "basePower": 60,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "punch": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "shadow-sneak": {
    "name": "Shadow Sneak",
    "type": "ghost",
    "category": "physical",
    "basePower": 40,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "priority": 1,
    "hasSecondary": false
  },
  "sheer-cold": {
    "name": "Sheer Cold",
    "type": "ice",
    "category": "special",
    "basePower": 0,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "ohko": "Ice",
    "hasSecondary": false
  },
  "shell-side-arm": {
    "name": "Shell Side Arm",
    "type": "poison",
    "category": "special",
    "basePower": 90,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 20,
        "status": "psn"
      }
    ]
  },
  "skitter-smack": {
    "name": "Skitter Smack",
    "type": "bug",
    "category": "physical",
    "basePower": 70,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 100,
        "boosts": {
          "spa": -1
        }
      }
    ]
  },
  "sky-attack": {
    "name": "Sky Attack",
    "type": "flying",
    "category": "physical",
    "basePower": 140,
    "target": "any",
    "flags": {
      "charge": 1,
      "protect": 1,
      "mirror": 1,
      "distance": 1,
      "metronome": 1,
      "nosleeptalk": 1,
      "failinstruct": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 30,
        "volatileStatus": "flinch"
      }
    ]
  },
  "slash": {
    "name": "Slash",
    "type": "normal",
    "category": "physical",
    "basePower": 80,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1,
      "slicing": 1
    },
    "hasSecondary": false
  },
  "sludge-bomb": {
    "name": "Sludge Bomb",
    "type": "poison",
    "category": "special",
    "basePower": 90,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1,
      "bullet": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 30,
        "status": "psn"
      }
    ]
  },
  "sludge-wave": {
    "name": "Sludge Wave",
    "type": "poison",
    "category": "special",
    "basePower": 95,
    "target": "allAdjacent",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 10,
        "status": "psn"
      }
    ]
  },
  "smack-down": {
    "name": "Smack Down",
    "type": "rock",
    "category": "physical",
    "basePower": 50,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "nonsky": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "smart-strike": {
    "name": "Smart Strike",
    "type": "steel",
    "category": "physical",
    "basePower": 70,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "snap-trap": {
    "name": "Snap Trap",
    "type": "steel",
    "category": "physical",
    "basePower": 35,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1
    },
    "hasSecondary": false
  },
  "snarl": {
    "name": "Snarl",
    "type": "dark",
    "category": "special",
    "basePower": 55,
    "target": "allAdjacentFoes",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "sound": 1,
      "bypasssub": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 100,
        "boosts": {
          "spa": -1
        }
      }
    ]
  },
  "snipe-shot": {
    "name": "Snipe Shot",
    "type": "water",
    "category": "special",
    "basePower": 85,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "snore": {
    "name": "Snore",
    "type": "normal",
    "category": "special",
    "basePower": 50,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "sound": 1,
      "bypasssub": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 30,
        "volatileStatus": "flinch"
      }
    ]
  },
  "solar-beam": {
    "name": "Solar Beam",
    "type": "grass",
    "category": "special",
    "basePower": 120,
    "target": "normal",
    "flags": {
      "charge": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1,
      "nosleeptalk": 1,
      "failinstruct": 1
    },
    "hasSecondary": false
  },
  "solar-blade": {
    "name": "Solar Blade",
    "type": "grass",
    "category": "physical",
    "basePower": 125,
    "target": "normal",
    "flags": {
      "contact": 1,
      "charge": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1,
      "nosleeptalk": 1,
      "failinstruct": 1,
      "slicing": 1
    },
    "hasSecondary": false
  },
  "sparkling-aria": {
    "name": "Sparkling Aria",
    "type": "water",
    "category": "special",
    "basePower": 90,
    "target": "allAdjacent",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "sound": 1,
      "bypasssub": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 100,
        "volatileStatus": "sparklingaria"
      }
    ]
  },
  "spirit-break": {
    "name": "Spirit Break",
    "type": "fairy",
    "category": "physical",
    "basePower": 75,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 100,
        "boosts": {
          "spa": -1
        }
      }
    ]
  },
  "spirit-shackle": {
    "name": "Spirit Shackle",
    "type": "ghost",
    "category": "physical",
    "basePower": 90,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 100
      }
    ]
  },
  "spit-up": {
    "name": "Spit Up",
    "type": "normal",
    "category": "special",
    "basePower": 0,
    "target": "normal",
    "flags": {
      "protect": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "steel-beam": {
    "name": "Steel Beam",
    "type": "steel",
    "category": "special",
    "basePower": 140,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1
    },
    "hasSecondary": false
  },
  "steel-roller": {
    "name": "Steel Roller",
    "type": "steel",
    "category": "physical",
    "basePower": 130,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "steel-wing": {
    "name": "Steel Wing",
    "type": "steel",
    "category": "physical",
    "basePower": 70,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 10,
        "self": {
          "boosts": {
            "def": 1
          }
        }
      }
    ]
  },
  "stomping-tantrum": {
    "name": "Stomping Tantrum",
    "type": "ground",
    "category": "physical",
    "basePower": 75,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "stone-axe": {
    "name": "Stone Axe",
    "type": "rock",
    "category": "physical",
    "basePower": 65,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1,
      "slicing": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {}
    ]
  },
  "stone-edge": {
    "name": "Stone Edge",
    "type": "rock",
    "category": "physical",
    "basePower": 100,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "stored-power": {
    "name": "Stored Power",
    "type": "psychic",
    "category": "special",
    "basePower": 20,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "storm-throw": {
    "name": "Storm Throw",
    "type": "fighting",
    "category": "physical",
    "basePower": 60,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "isCrit": true,
    "hasSecondary": false
  },
  "struggle-bug": {
    "name": "Struggle Bug",
    "type": "bug",
    "category": "special",
    "basePower": 50,
    "target": "allAdjacentFoes",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 100,
        "boosts": {
          "spa": -1
        }
      }
    ]
  },
  "sucker-punch": {
    "name": "Sucker Punch",
    "type": "dark",
    "category": "physical",
    "basePower": 70,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "priority": 1,
    "hasSecondary": false
  },
  "super-fang": {
    "name": "Super Fang",
    "type": "normal",
    "category": "physical",
    "basePower": 0,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "supercell-slam": {
    "name": "Supercell Slam",
    "type": "electric",
    "category": "physical",
    "basePower": 100,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1,
      "minimize": 1
    },
    "hasCrashDamage": true,
    "hasSecondary": false
  },
  "superpower": {
    "name": "Superpower",
    "type": "fighting",
    "category": "physical",
    "basePower": 120,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false,
    "selfBoosts": {
      "atk": -1,
      "def": -1
    }
  },
  "surf": {
    "name": "Surf",
    "type": "water",
    "category": "special",
    "basePower": 90,
    "target": "allAdjacent",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "nonsky": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "syrup-bomb": {
    "name": "Syrup Bomb",
    "type": "grass",
    "category": "special",
    "basePower": 60,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1,
      "bullet": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 100,
        "volatileStatus": "syrupbomb"
      }
    ]
  },
  "tail-slap": {
    "name": "Tail Slap",
    "type": "normal",
    "category": "physical",
    "basePower": 25,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "multihit": [
      2,
      5
    ],
    "hasSecondary": false
  },
  "temper-flare": {
    "name": "Temper Flare",
    "type": "fire",
    "category": "physical",
    "basePower": 75,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "terrain-pulse": {
    "name": "Terrain Pulse",
    "type": "normal",
    "category": "special",
    "basePower": 50,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1,
      "pulse": 1
    },
    "hasSecondary": false
  },
  "thief": {
    "name": "Thief",
    "type": "dark",
    "category": "physical",
    "basePower": 60,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "failmefirst": 1,
      "noassist": 1,
      "failcopycat": 1
    },
    "hasSecondary": false
  },
  "thrash": {
    "name": "Thrash",
    "type": "normal",
    "category": "physical",
    "basePower": 120,
    "target": "randomNormal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1,
      "failinstruct": 1
    },
    "hasSecondary": false
  },
  "throat-chop": {
    "name": "Throat Chop",
    "type": "dark",
    "category": "physical",
    "basePower": 80,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 100
      }
    ]
  },
  "thunder": {
    "name": "Thunder",
    "type": "electric",
    "category": "special",
    "basePower": 110,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 30,
        "status": "par"
      }
    ]
  },
  "thunder-fang": {
    "name": "Thunder Fang",
    "type": "electric",
    "category": "physical",
    "basePower": 65,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1,
      "bite": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 10,
        "status": "par"
      },
      {
        "chance": 10,
        "volatileStatus": "flinch"
      }
    ]
  },
  "thunder-punch": {
    "name": "Thunder Punch",
    "type": "electric",
    "category": "physical",
    "basePower": 75,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "punch": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 10,
        "status": "par"
      }
    ]
  },
  "thunderbolt": {
    "name": "Thunderbolt",
    "type": "electric",
    "category": "special",
    "basePower": 90,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 10,
        "status": "par"
      }
    ]
  },
  "torch-song": {
    "name": "Torch Song",
    "type": "fire",
    "category": "special",
    "basePower": 80,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "sound": 1,
      "bypasssub": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 100,
        "self": {
          "boosts": {
            "spa": 1
          }
        }
      }
    ]
  },
  "trailblaze": {
    "name": "Trailblaze",
    "type": "grass",
    "category": "physical",
    "basePower": 50,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 100,
        "self": {
          "boosts": {
            "spe": 1
          }
        }
      }
    ]
  },
  "tri-attack": {
    "name": "Tri Attack",
    "type": "normal",
    "category": "special",
    "basePower": 80,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 20
      }
    ]
  },
  "triple-arrows": {
    "name": "Triple Arrows",
    "type": "fighting",
    "category": "physical",
    "basePower": 90,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 50,
        "boosts": {
          "def": -1
        }
      },
      {
        "chance": 30,
        "volatileStatus": "flinch"
      }
    ]
  },
  "triple-axel": {
    "name": "Triple Axel",
    "type": "ice",
    "category": "physical",
    "basePower": 20,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "multihit": 3,
    "multiaccuracy": true,
    "hasSecondary": false
  },
  "trop-kick": {
    "name": "Trop Kick",
    "type": "grass",
    "category": "physical",
    "basePower": 85,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 100,
        "boosts": {
          "atk": -1
        }
      }
    ]
  },
  "twin-beam": {
    "name": "Twin Beam",
    "type": "psychic",
    "category": "special",
    "basePower": 40,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1
    },
    "multihit": 2,
    "hasSecondary": false
  },
  "u-turn": {
    "name": "U-turn",
    "type": "bug",
    "category": "physical",
    "basePower": 70,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "upper-hand": {
    "name": "Upper Hand",
    "type": "fighting",
    "category": "physical",
    "basePower": 65,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "priority": 3,
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 100,
        "volatileStatus": "flinch"
      }
    ]
  },
  "uproar": {
    "name": "Uproar",
    "type": "normal",
    "category": "special",
    "basePower": 90,
    "target": "randomNormal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "sound": 1,
      "bypasssub": 1,
      "metronome": 1,
      "nosleeptalk": 1,
      "failinstruct": 1
    },
    "hasSecondary": false
  },
  "vacuum-wave": {
    "name": "Vacuum Wave",
    "type": "fighting",
    "category": "special",
    "basePower": 40,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "priority": 1,
    "hasSecondary": false
  },
  "venoshock": {
    "name": "Venoshock",
    "type": "poison",
    "category": "special",
    "basePower": 65,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "volt-switch": {
    "name": "Volt Switch",
    "type": "electric",
    "category": "special",
    "basePower": 70,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "volt-tackle": {
    "name": "Volt Tackle",
    "type": "electric",
    "category": "physical",
    "basePower": 120,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "recoil": [
      33,
      100
    ],
    "secondaries": [
      {
        "chance": 10,
        "status": "par"
      }
    ]
  },
  "water-pulse": {
    "name": "Water Pulse",
    "type": "water",
    "category": "special",
    "basePower": 60,
    "target": "any",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "distance": 1,
      "metronome": 1,
      "pulse": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 20,
        "volatileStatus": "confusion"
      }
    ]
  },
  "water-shuriken": {
    "name": "Water Shuriken",
    "type": "water",
    "category": "special",
    "basePower": 15,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "multihit": [
      2,
      5
    ],
    "priority": 1,
    "hasSecondary": false
  },
  "water-spout": {
    "name": "Water Spout",
    "type": "water",
    "category": "special",
    "basePower": 150,
    "target": "allAdjacentFoes",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "waterfall": {
    "name": "Waterfall",
    "type": "water",
    "category": "physical",
    "basePower": 80,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 20,
        "volatileStatus": "flinch"
      }
    ]
  },
  "wave-crash": {
    "name": "Wave Crash",
    "type": "water",
    "category": "physical",
    "basePower": 120,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false,
    "recoil": [
      33,
      100
    ]
  },
  "weather-ball": {
    "name": "Weather Ball",
    "type": "normal",
    "category": "special",
    "basePower": 50,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1,
      "bullet": 1
    },
    "hasSecondary": false
  },
  "whirlpool": {
    "name": "Whirlpool",
    "type": "water",
    "category": "special",
    "basePower": 35,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "wild-charge": {
    "name": "Wild Charge",
    "type": "electric",
    "category": "physical",
    "basePower": 90,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false,
    "recoil": [
      1,
      4
    ]
  },
  "wood-hammer": {
    "name": "Wood Hammer",
    "type": "grass",
    "category": "physical",
    "basePower": 120,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false,
    "recoil": [
      33,
      100
    ]
  },
  "wrap": {
    "name": "Wrap",
    "type": "normal",
    "category": "physical",
    "basePower": 15,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": false
  },
  "x-scissor": {
    "name": "X-Scissor",
    "type": "bug",
    "category": "physical",
    "basePower": 80,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1,
      "slicing": 1
    },
    "hasSecondary": false
  },
  "zap-cannon": {
    "name": "Zap Cannon",
    "type": "electric",
    "category": "special",
    "basePower": 120,
    "target": "normal",
    "flags": {
      "protect": 1,
      "mirror": 1,
      "metronome": 1,
      "bullet": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 100,
        "status": "par"
      }
    ]
  },
  "zen-headbutt": {
    "name": "Zen Headbutt",
    "type": "psychic",
    "category": "physical",
    "basePower": 80,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 20,
        "volatileStatus": "flinch"
      }
    ]
  },
  "zing-zap": {
    "name": "Zing Zap",
    "type": "electric",
    "category": "physical",
    "basePower": 80,
    "target": "normal",
    "flags": {
      "contact": 1,
      "protect": 1,
      "mirror": 1,
      "metronome": 1
    },
    "hasSecondary": true,
    "secondaries": [
      {
        "chance": 30,
        "volatileStatus": "flinch"
      }
    ]
  }
}
