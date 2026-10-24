// Reviewed against Showdown @ 1636bf6d0848fb3c9330576963a647d4e179d278.
// Importing data never updates this approval list automatically.
// Scope describes effects outside the configured attack, not a full battle simulation.
export const CHAMPIONS_ABILITY_COVERAGE = {
  "adaptability": {
    "status": "implemented",
    "fingerprints": [
      "cdf300b10335928690dcd7866d776905905825931e613c1b8f4b871c0d2e9fd5"
    ]
  },
  "aerilate": {
    "status": "implemented",
    "fingerprints": [
      "658725ea3f544c2d52a15508a0a3db01b14f8aebab36c8ca8897391abc74e569"
    ]
  },
  "aftermath": {
    "status": "no-direct-effect",
    "fingerprints": [
      "b8a918f070b95b03133b7bb3e9a51925e130f84eff75cc2099f7aa083ef5c965"
    ],
    "scope": "after-move-or-turn"
  },
  "analytic": {
    "status": "implemented",
    "fingerprints": [
      "df15f1f432a5bde74fd66d60b1eb3d916e7d2ffda598a8f11a0e74443ce0ca22"
    ]
  },
  "anger-point": {
    "status": "implemented",
    "fingerprints": [
      "ea053511fd1ea9390ce4bdb8267ccfb9d624eec332c53c38e4b8cd2b66d1063c"
    ]
  },
  "anticipation": {
    "status": "no-direct-effect",
    "fingerprints": [
      "250732a33dcd5c97cb855c933c610daa778ec97cd81e62b0f0c8a1e1bbd0382c"
    ]
  },
  "armor-tail": {
    "status": "implemented",
    "fingerprints": [
      "5ce1202b0c666233bf58a8b2baa32d94e0f325ad4df91beb52038f90ca08768b"
    ]
  },
  "aroma-veil": {
    "status": "no-direct-effect",
    "fingerprints": [
      "67862b5b63fc36bbedf7bbebe0d3122f8e7bc37866e9ff924524c9b2a8343084"
    ],
    "scope": "future-action-or-other-actor"
  },
  "aura-guard": {
    "status": "implemented",
    "fingerprints": [
      "06322fea5975003e969bb8755556d971b93ed44a978bc0e6230ced1718747de2"
    ]
  },
  "battle-armor": {
    "status": "implemented",
    "fingerprints": [
      "13e53f4565329c6563fc341bc8d3152c036e4f4045fb5d12d7e2f24af37b3676"
    ]
  },
  "battle-bond": {
    "status": "no-direct-effect",
    "fingerprints": [
      "a981b6987dac7f149f08311e22a09a6cf63357e6bd1f5ca0170ce9a98356b737"
    ],
    "scope": "after-move-or-turn"
  },
  "berserk": {
    "status": "no-direct-effect",
    "fingerprints": [
      "6c59a6b9716d8d133fe4d187066b663766d9cade02a5fba43bcb188d196737e9"
    ],
    "scope": "after-move-or-turn"
  },
  "big-pecks": {
    "status": "implemented",
    "fingerprints": [
      "6d9f5813fe29273d3b9a1e651a36715fa4caffb15cd23833acb9738d37af8ea9"
    ]
  },
  "blaze": {
    "status": "implemented",
    "fingerprints": [
      "14480c48f4cc31c36569a53ef948e9b08f13e470296e537408d99207c8ea1555"
    ]
  },
  "bulletproof": {
    "status": "implemented",
    "fingerprints": [
      "d36889efc17f789f94393817d901e4dac60b2c9a23757590174ba22e94a7aff1"
    ]
  },
  "cheek-pouch": {
    "status": "implemented",
    "fingerprints": [
      "94da48abd54856bb614f3e4162c799f4b809096299d4ed7983b84ce803e9d886"
    ]
  },
  "chlorophyll": {
    "status": "implemented",
    "fingerprints": [
      "c5ffc5796bfcb4497351ff60db4c77c068ab135f9cac64db858d06ba3bb48910"
    ]
  },
  "clear-body": {
    "status": "implemented",
    "fingerprints": [
      "813b3093b50e5f05495300ccbd8851e72aa91b211290c71ba56c17d936917339"
    ]
  },
  "cloud-nine": {
    "status": "implemented",
    "fingerprints": [
      "8c68a4cf66386b2f2ce996a7df523f28357dbc3103249ac6f27fc6b3d158cd92"
    ]
  },
  "competitive": {
    "status": "implemented",
    "fingerprints": [
      "ceefa7f9c1053e96b58610a9e618032279454b70ef9fe21afee1dcc8fb320b6b"
    ]
  },
  "compound-eyes": {
    "status": "no-direct-effect",
    "fingerprints": [
      "43e6fe47964a0d31f3df806a2971c358a736cff6bed7598ccc071b79525557fd"
    ],
    "scope": "accuracy-or-chosen-order"
  },
  "contrary": {
    "status": "implemented",
    "fingerprints": [
      "9de5af66f91825e3a8d2ca71b33bc84e2e60a47831065e7836974a4f5a26d368"
    ]
  },
  "corrosion": {
    "status": "implemented",
    "fingerprints": [
      "b0c7411faa13dd876ec5dc0ee0d37461b0346afcd63632f8d2619f55f4f6dc48"
    ]
  },
  "cud-chew": {
    "status": "no-direct-effect",
    "fingerprints": [
      "28e318fbea9095a8fc667af4d6f00566935c05bc625e254d145d328f55ec52c9"
    ],
    "scope": "after-move-or-turn"
  },
  "curious-medicine": {
    "status": "no-direct-effect",
    "fingerprints": [
      "ff8981d0c57b6c414b69a3a1ec69799176a8fe6cea29accfe8c1cdf0085dc95a"
    ],
    "scope": "future-action-or-other-actor"
  },
  "cursed-body": {
    "status": "no-direct-effect",
    "fingerprints": [
      "a63f3b1e4dae9433f0d7479a1630243de59b070f74e548b4f33aa0796718a5b1"
    ],
    "scope": "future-action-or-other-actor"
  },
  "cute-charm": {
    "status": "no-direct-effect",
    "fingerprints": [
      "aabc77b4280d51178e59796c75d85357ec2203230ecc03128932fe214ace43ba"
    ],
    "scope": "future-action-or-other-actor"
  },
  "damp": {
    "status": "implemented",
    "fingerprints": [
      "ef3faad229e3218704220777e529a22223797e90b78585a449b05b1e1735da3f"
    ]
  },
  "defiant": {
    "status": "implemented",
    "fingerprints": [
      "d6da424198343c46910c6fcab3b50783455a1056e63dd73a7c6dfd9034598643"
    ]
  },
  "disguise": {
    "status": "implemented",
    "fingerprints": [
      "0a43867fb3cba14863cedd3613fbcebad7246b4d06a16e169aafac313046e3cb"
    ]
  },
  "dragonize": {
    "status": "implemented",
    "fingerprints": [
      "b22d5e48d526d4829dd14f88a1f9325ba687bbbc9c7d1f900d51a0c7b5d65518"
    ]
  },
  "drizzle": {
    "status": "implemented",
    "fingerprints": [
      "da29e9386ceb2d822f08164e7a67a57c1f65a8c12260da9022afd857ee222e4b"
    ]
  },
  "drought": {
    "status": "implemented",
    "fingerprints": [
      "0150e17ba010e9b89a3ebd013708d4887c22fe2bb05561c796a398d1bbcafca4"
    ]
  },
  "dry-skin": {
    "status": "implemented",
    "fingerprints": [
      "a0937f99ce4d16cfda54968a2c8517e0e9a1209588b55e4bf751c721b068866a"
    ]
  },
  "early-bird": {
    "status": "no-direct-effect",
    "fingerprints": [
      "b0c7411faa13dd876ec5dc0ee0d37461b0346afcd63632f8d2619f55f4f6dc48"
    ],
    "scope": "accuracy-or-chosen-order"
  },
  "earth-eater": {
    "status": "implemented",
    "fingerprints": [
      "0e76fa4ca285c1645c7b63e94aaa6b5c97f88deeff1db7c498b51736613282e0"
    ]
  },
  "eelevate": {
    "status": "implemented",
    "fingerprints": [
      "618ed32ded263d917efe5e3946665c662e263a0cb07234a3b6006e5937d5529b"
    ]
  },
  "effect-spore": {
    "status": "implemented",
    "fingerprints": [
      "82b2ae603e2d775322ff8a6882bc68f7bb04d396fb7f4a5ccfd0b3dbaf148ebc"
    ]
  },
  "electric-surge": {
    "status": "implemented",
    "fingerprints": [
      "f9b612c4be67f967f53192558ff4ec8971841213527449a41e82da51bca9b740"
    ]
  },
  "electromorphosis": {
    "status": "implemented",
    "fingerprints": [
      "26e9c2907fbe01bcda32fd99dc0cc6bb677bb538990017e9b079c38350832b2f"
    ]
  },
  "emergency-exit": {
    "status": "no-direct-effect",
    "fingerprints": [
      "9d440968d9f90c486f5b7031c972d8bbf1dd23dafdac9a5fe1ab218538c2cd66"
    ],
    "scope": "after-move-or-turn"
  },
  "fairy-aura": {
    "status": "implemented",
    "fingerprints": [
      "e64932228bc6a319ab342618a432ea5995205772c559373fc035c470221a5840"
    ]
  },
  "filter": {
    "status": "implemented",
    "fingerprints": [
      "dccc73702b4a315a365af8202decc44112184df0a8d79a70fe38e1992a9c8e0f"
    ]
  },
  "fire-mane": {
    "status": "implemented",
    "fingerprints": [
      "0e46bc841f1b0dbb6f39cdac8547789ba4830158da75a45a2f2e8d596d01b5bd"
    ]
  },
  "flame-body": {
    "status": "implemented",
    "fingerprints": [
      "37e458fde41a655f0a4048b521d3cb41b3c77c44eb982cb9fc4835d7834c365b"
    ]
  },
  "flash-fire": {
    "status": "implemented",
    "fingerprints": [
      "82e48370efea66689b83583868f1e899becdf65773ab39eca1ebee0b3132dc46"
    ]
  },
  "flower-veil": {
    "status": "implemented",
    "fingerprints": [
      "1ede161bad90222f7a996c982a7defcdd8db2cb96d18cc2fb35eb950ecb45009"
    ]
  },
  "fluffy": {
    "status": "implemented",
    "fingerprints": [
      "905b5a8ad25013152b95cf06c410690d66247ab5d5a196b137d31b34a392ae9e"
    ]
  },
  "forecast": {
    "status": "implemented",
    "fingerprints": [
      "2f7348b4195da6ca914f214de48d5b0ca36e07db3f429334260d204e5e58fbca"
    ]
  },
  "forewarn": {
    "status": "no-direct-effect",
    "fingerprints": [
      "0cbdc0cfbeb2b09dfc1caf6ab2f35c1c59ae9a831d423e52996f7579b1451871"
    ]
  },
  "friend-guard": {
    "status": "implemented",
    "fingerprints": [
      "fe6e8116d9e1882c07a37ac8cd0133d949833a7b350d50fc0b6f764d522bd8d6"
    ]
  },
  "frisk": {
    "status": "no-direct-effect",
    "fingerprints": [
      "6d2d644e986b572cd5bad400483cf5a38b2ca3a1eadf7834ea8c9b829d407fdc"
    ]
  },
  "fur-coat": {
    "status": "implemented",
    "fingerprints": [
      "8807d784229419ca78a76e55c37556bf7584939306702a4dfa2574443d6eaca6"
    ]
  },
  "gale-wings": {
    "status": "implemented",
    "fingerprints": [
      "cea8d8e65f321f6b61c6e3a8d10c5b8cb5bc970c00670ce06c5a3f164da5c947"
    ]
  },
  "gluttony": {
    "status": "no-direct-effect",
    "fingerprints": [
      "d4db7b8b7b5a2fb9b91881ee127b24fe3f5055dc6c3b188f581092ded0659d01"
    ],
    "scope": "future-action-or-other-actor"
  },
  "good-as-gold": {
    "status": "no-direct-effect",
    "fingerprints": [
      "977d3eb3f36d9802d42d1e7c84962d998ba9e2f15799706421aecde4e24b73a2"
    ],
    "scope": "future-action-or-other-actor"
  },
  "gooey": {
    "status": "implemented",
    "fingerprints": [
      "62389a4f8f2fd7ffa6c037a68d073f62743e33b06efeaf6ef8db39df64717dd3"
    ]
  },
  "grass-pelt": {
    "status": "implemented",
    "fingerprints": [
      "76b0fed2f9432b682f3749cf24de64781202b67a4b9f212c339d8b09e92a4987"
    ]
  },
  "grassy-surge": {
    "status": "implemented",
    "fingerprints": [
      "4f6956a655c8106b8874eadf58f25d3c4b6ba26df9596b7aaec04e35fd142592"
    ]
  },
  "guard-dog": {
    "status": "implemented",
    "fingerprints": [
      "a44f874afa2a1391f0c2e8f27fef0f792912df8485c7313c174923bb626a71d7"
    ]
  },
  "guts": {
    "status": "implemented",
    "fingerprints": [
      "0b3a4eb4ff5f1f6e462d3e45fffb781526837352303b03f5dd2db35dede882e0"
    ]
  },
  "harvest": {
    "status": "no-direct-effect",
    "fingerprints": [
      "0fd646f97aabd542a4508624f4b7b226e56c887f3e63061da3f8cf84ae105737"
    ],
    "scope": "after-move-or-turn"
  },
  "healer": {
    "status": "no-direct-effect",
    "fingerprints": [
      "4dcbb55b84645605474becb7df55eb52046cc58b611306ca6a5b6893c8b19b44"
    ]
  },
  "heatproof": {
    "status": "implemented",
    "fingerprints": [
      "bedcab4bc632f8e43a701cad38d944e543864c1af1ce855214879382206972c4"
    ]
  },
  "heavy-metal": {
    "status": "implemented",
    "fingerprints": [
      "05ff0402584e8a46912da9bf6a51972a5e12f3e3ba8b973d49f30151f5e131c2"
    ]
  },
  "hospitality": {
    "status": "no-direct-effect",
    "fingerprints": [
      "23b040e9d2088a957c458fa7ba54c9aa2e387ebdfae0baf0030dfb56198e3206"
    ]
  },
  "huge-power": {
    "status": "implemented",
    "fingerprints": [
      "cca93bff4065be55fef1f0d7f3a07035d08575864c999807829e9dbad1041a6a"
    ]
  },
  "hunger-switch": {
    "status": "no-direct-effect",
    "fingerprints": [
      "b5eb76d1501cc07ca23c4dc860b5915372b3ae62ce63c575e7996526e23b495a"
    ],
    "scope": "after-move-or-turn"
  },
  "hustle": {
    "status": "implemented",
    "fingerprints": [
      "57a166b7e5c61f22098865d3530ee262ad875faf106ff73881a54cb59844f532"
    ]
  },
  "hydration": {
    "status": "no-direct-effect",
    "fingerprints": [
      "347bcc17516332cfa30a596c4ac1fd27caccf2529053c1485ce53b70143269ff"
    ],
    "scope": "after-move-or-turn"
  },
  "hyper-cutter": {
    "status": "implemented",
    "fingerprints": [
      "4a86372f868fcf4fa7b486baf27e3e32aa052b2d39595fd0e90efde4260d1d1f"
    ]
  },
  "ice-body": {
    "status": "no-direct-effect",
    "fingerprints": [
      "639a33bc8b1e86bb5a77a2ca6f71637ea79337c543cc6e1631f3b64f9da61c10"
    ],
    "scope": "after-move-or-turn"
  },
  "illuminate": {
    "status": "no-direct-effect",
    "fingerprints": [
      "83a69926e8fdf5b181b42d077658ce4465a6c6c61b2dec55a5e87180a5fce28b"
    ]
  },
  "illusion": {
    "status": "no-direct-effect",
    "fingerprints": [
      "20d5e49b002fc38a11d369cea107ed0061afb18214b2897f88e568a55c8e36ef"
    ],
    "scope": "future-action-or-other-actor"
  },
  "immunity": {
    "status": "implemented",
    "fingerprints": [
      "8fee184fa02a12cb6fc34d1c0f742df8b55845aa5da24e7aa68576612e0fc490"
    ]
  },
  "imposter": {
    "status": "implemented",
    "fingerprints": [
      "6b62cd917a1565a853b120a3c7608a58d6b6128598574eb3d1677c854f7f95af"
    ]
  },
  "infiltrator": {
    "status": "implemented",
    "fingerprints": [
      "e1e0d8dc9006458bd8f49510a2c81ca50b536769c0572887d147f703e24886fd"
    ]
  },
  "innards-out": {
    "status": "no-direct-effect",
    "fingerprints": [
      "ec127775a07b1861201d1bf1d3457cfe0fb948944d2ffebb6bbec1fb0c2226bb"
    ],
    "scope": "after-move-or-turn"
  },
  "inner-focus": {
    "status": "implemented",
    "fingerprints": [
      "25a46a310cb3a9f5ea33be1c5a01b6a8413de7b89546b59f6c426f26293b3d90"
    ]
  },
  "insomnia": {
    "status": "implemented",
    "fingerprints": [
      "d0dfb8e39567cfeb7f4362e73f97ff95bdefc40351694f49116ff7aa81d05ded"
    ]
  },
  "intimidate": {
    "status": "implemented",
    "fingerprints": [
      "ff4e6e1787a34279aaa69f8a7ff07fc806d9bc0496a707d91a18658fd66bb09d"
    ]
  },
  "iron-fist": {
    "status": "implemented",
    "fingerprints": [
      "ad5bab895471ed78eb47afe03a46135305ee03965546924f6bbc20e47e5d0440"
    ]
  },
  "justified": {
    "status": "implemented",
    "fingerprints": [
      "4dd58faa1b2a58dbddf9f8b58ce4ac1789ac115dd5080709d2fdfc466b245fba"
    ]
  },
  "keen-eye": {
    "status": "no-direct-effect",
    "fingerprints": [
      "fedbdc07140e10980c490ad060e74c231d22f6b39e5a4411a96ef4cd2018fd70"
    ],
    "scope": "accuracy-or-chosen-order"
  },
  "klutz": {
    "status": "implemented",
    "fingerprints": [
      "2d2b4334629a07c0658344448320a473259f083bcae56e476905df070fbeb84a"
    ]
  },
  "leaf-guard": {
    "status": "implemented",
    "fingerprints": [
      "aca17c6d51feafd7491972972856bdfdde0ada4c8557b402ac181aff3d4d3261"
    ]
  },
  "levitate": {
    "status": "implemented",
    "fingerprints": [
      "69e900d5e9c916bfbaace4325b24f3b3e681065e2bf8cd75377723084cae1caf"
    ]
  },
  "libero": {
    "status": "implemented",
    "fingerprints": [
      "c04cbccc3980cecb5c8e1fd4cbe2c665dce307a1f4c659973335fff0fb5787cb"
    ]
  },
  "light-metal": {
    "status": "implemented",
    "fingerprints": [
      "5106cb87e0a0f2c61a89f2f6110d42707657428bdd82252ff5564c424a756c19"
    ]
  },
  "lightning-rod": {
    "status": "implemented",
    "fingerprints": [
      "220c3664636bdbde518da77df68d2bd1292d988056fc331d6a4529bff32e8ee8"
    ]
  },
  "limber": {
    "status": "implemented",
    "fingerprints": [
      "3875a5e313359c4d355655f947fcd21ebc0287f8d59cf75c5c39d4bc3b7ef455"
    ]
  },
  "liquid-ooze": {
    "status": "implemented",
    "fingerprints": [
      "2ede825b976a33ad1920805b6d8efcb05d09561685e929e6594a65e2dc91b82a"
    ]
  },
  "liquid-voice": {
    "status": "implemented",
    "fingerprints": [
      "07cdcc734e786bf97512cbb278696936eb70fffabdd09280edb5f52474f7803a"
    ]
  },
  "long-reach": {
    "status": "implemented",
    "fingerprints": [
      "3db007aab8aa8cc3a10aca16bc730244442d1d0f63d31c2a331cbeb1d1f8dcf7"
    ]
  },
  "magic-bounce": {
    "status": "no-direct-effect",
    "fingerprints": [
      "cf841ec3f6ae7da249bc5c5b1d031c5de28b71cd736ffb48fb0295bff3d7b2d2"
    ],
    "scope": "future-action-or-other-actor"
  },
  "magic-guard": {
    "status": "implemented",
    "fingerprints": [
      "89709da3eb6323fc7ef3ed70f50d3576f9a6915f1c148e67527e70d3cc5e5df7"
    ]
  },
  "magician": {
    "status": "no-direct-effect",
    "fingerprints": [
      "e8e92e0d05c18bf4d6faababa57d804af3d571d8d114c6ef424a1ed8857215ca"
    ]
  },
  "magma-armor": {
    "status": "implemented",
    "fingerprints": [
      "023db30ce3fb94b23505da1a93faa96fbc2913e3bfe4211e07ecd97d621b817f"
    ]
  },
  "marvel-scale": {
    "status": "implemented",
    "fingerprints": [
      "15a2e7724086f54913421eca8857ccf513e2349f0c2f2a06c6e84d7c1e7c72bd"
    ]
  },
  "mega-launcher": {
    "status": "implemented",
    "fingerprints": [
      "9990fcf33fca4e3fa489d7f02dc3ef5cfcafe2de2b368dfbde127e23fb26b856"
    ]
  },
  "mega-sol": {
    "status": "implemented",
    "fingerprints": [
      "239efef4082b032abeea34b9c3e72d28d2eeecde430e1fea836e73b2168f54a4"
    ]
  },
  "merciless": {
    "status": "implemented",
    "fingerprints": [
      "2fb6a5d47969f177c42435c1043f202853229a10da0623d92d8ac626e2664cf3"
    ]
  },
  "mimicry": {
    "status": "implemented",
    "fingerprints": [
      "ca84b7a20507be41a0d95a6ebe8e2038c0fe54ae1554a9b4481b1a423c1f6432"
    ]
  },
  "minus": {
    "status": "implemented",
    "fingerprints": [
      "58a96ea55a6c4395b56e176e5e5dd3539b8b838943138a384f5f35e444e25f43"
    ]
  },
  "mirror-armor": {
    "status": "implemented",
    "fingerprints": [
      "abd317bed52257cecee3e47b52dd00c93619a3a7c8c604c88371a91fb8d3d2a5"
    ]
  },
  "mold-breaker": {
    "status": "implemented",
    "fingerprints": [
      "5eb0562b924726eedaa7047d2a651538f83c92a8042746803aaec3a1652405a9"
    ]
  },
  "moody": {
    "status": "no-direct-effect",
    "fingerprints": [
      "afc423fa27ad744e5ed6d68a6ce593e9741c25b88237b7feb33292b08cd53456"
    ],
    "scope": "after-move-or-turn"
  },
  "motor-drive": {
    "status": "implemented",
    "fingerprints": [
      "e4975c872e8917669bb28c623515e1373dcc98aaa401594fba1c2bb6cd3411cd"
    ]
  },
  "moxie": {
    "status": "no-direct-effect",
    "fingerprints": [
      "720d042cfd729134832029e18f573534234779eebd87eb105474f198da9ac221"
    ],
    "scope": "after-move-or-turn"
  },
  "multiscale": {
    "status": "implemented",
    "fingerprints": [
      "4f9d6605a846b6181e82aa0b427a21bf49b97d6a3c515234540c7793a9f925e3"
    ]
  },
  "mummy": {
    "status": "implemented",
    "fingerprints": [
      "f15be33894711977be07d5af52675a28098fb3aec2f567adfd77aa2ef48ce739"
    ]
  },
  "natural-cure": {
    "status": "no-direct-effect",
    "fingerprints": [
      "10ed8b622035666c17f03f6c521d0f3b455aededcb27ad68b17e270af965a0de"
    ],
    "scope": "after-move-or-turn"
  },
  "no-guard": {
    "status": "no-direct-effect",
    "fingerprints": [
      "8fbe19a8cc13cef7fbe4f5ae464574c7ea51ddb01158fd6253ca1576b262e9e1"
    ],
    "scope": "accuracy-or-chosen-order"
  },
  "oblivious": {
    "status": "implemented",
    "fingerprints": [
      "d0a6cd791adb49f487fabe987621dcbcf9fb0a8614f921e10aacee1f76fbb015"
    ]
  },
  "opportunist": {
    "status": "implemented",
    "fingerprints": [
      "004a45fcdac8430a6f268da4f4b0b1f90a2d56ffee9327045c5d1fa20e2d48bf"
    ]
  },
  "overcoat": {
    "status": "implemented",
    "fingerprints": [
      "0b504a6ba4973b661aeaa16132b52dfe4aacb50c5e9699c68b023777a6e1746a"
    ]
  },
  "overgrow": {
    "status": "implemented",
    "fingerprints": [
      "2724113f07ccc8b0800c53785c6accc88d396fff47177e137bfaea2e5cdac8b1"
    ]
  },
  "own-tempo": {
    "status": "implemented",
    "fingerprints": [
      "6e9584be9e5781947c72ad8533736e0b355bae46a4694616fb849423f3d173b6"
    ]
  },
  "parental-bond": {
    "status": "implemented",
    "fingerprints": [
      "3b29e2ddc326aad3edf366116c8720cd423541c342034d23626a08861a1b553b"
    ]
  },
  "pickpocket": {
    "status": "no-direct-effect",
    "fingerprints": [
      "261a289c586deaa9e737c9942ae9daf31fa70f394ba888b97a728bd8fa28e584"
    ],
    "scope": "after-move-or-turn"
  },
  "pickup": {
    "status": "no-direct-effect",
    "fingerprints": [
      "591906ef6efa042e2c54a3807cef6a314c677a48782bb5ac22b11890fe0246f3"
    ]
  },
  "piercing-drill": {
    "status": "implemented",
    "fingerprints": [
      "583dad87b6e866295fd7d301c40d95424d6c44e90933053ebf7f22c7edb19496"
    ]
  },
  "pixilate": {
    "status": "implemented",
    "fingerprints": [
      "ee066a35cfd74b4611335f28b9ea43ef33b9056f5172f0fc3b960aa45355f33f"
    ]
  },
  "plus": {
    "status": "implemented",
    "fingerprints": [
      "58a96ea55a6c4395b56e176e5e5dd3539b8b838943138a384f5f35e444e25f43"
    ]
  },
  "poison-heal": {
    "status": "no-direct-effect",
    "fingerprints": [
      "02063b76211a2022d932658a6e392d21b3545e42c9e09faa6bcacedc7da0f583"
    ],
    "scope": "after-move-or-turn"
  },
  "poison-point": {
    "status": "implemented",
    "fingerprints": [
      "1b14fcd3c2dca3a94de7f2091cfc16d3e4e5e0a851b7290fef06dc18a5c66c7b"
    ]
  },
  "poison-touch": {
    "status": "implemented",
    "fingerprints": [
      "0631bd695d605c5415746ee2f5082bef1095521c3c1035ed44004a411858b2fc"
    ]
  },
  "prankster": {
    "status": "no-direct-effect",
    "fingerprints": [
      "8f9a24f659adb0c1b42fe9cce9b4e3478c1520ee42f71e1966cc85590d708abb"
    ],
    "scope": "future-action-or-other-actor"
  },
  "pressure": {
    "status": "no-direct-effect",
    "fingerprints": [
      "75dc67d786cff38bfef25bd9ce9d12467060bf3dc7d3bac25770e4a1defde629"
    ],
    "scope": "future-action-or-other-actor"
  },
  "protean": {
    "status": "implemented",
    "fingerprints": [
      "f2012fb1a507e1e1fdf3c3984b3e09e37503dc7a72bbd755331298080a5a9f50"
    ]
  },
  "psychic-surge": {
    "status": "implemented",
    "fingerprints": [
      "0395358ed29e43dbd22036ba3ad35541355c23d14e6fb666aee0b477bce0e404"
    ]
  },
  "punk-rock": {
    "status": "implemented",
    "fingerprints": [
      "35663bf6c20a35483467b8be149c50b937665d5fe4927466ce912bb164f4a2df"
    ]
  },
  "pure-power": {
    "status": "implemented",
    "fingerprints": [
      "cca93bff4065be55fef1f0d7f3a07035d08575864c999807829e9dbad1041a6a"
    ]
  },
  "purifying-salt": {
    "status": "implemented",
    "fingerprints": [
      "cdff12276fe4df627ae457acfd1408e7ead32c1ce430555e482a0107a164587f"
    ]
  },
  "queenly-majesty": {
    "status": "implemented",
    "fingerprints": [
      "fced035a35befb7389543fa676b08f75a88e21c9a26e20fa5a61d996f5f747bb"
    ]
  },
  "quick-draw": {
    "status": "no-direct-effect",
    "fingerprints": [
      "26e030295b3865dfea3c79dae89e62540d0b0a26734d40dc873f79cc0b04eb0f"
    ],
    "scope": "accuracy-or-chosen-order"
  },
  "quick-feet": {
    "status": "implemented",
    "fingerprints": [
      "a453ddbae0c6f3d5755300da3f623987934bc66cd1eb145425367b2dfac2b468"
    ]
  },
  "rain-dish": {
    "status": "no-direct-effect",
    "fingerprints": [
      "d49dd5bbc15c01471f7af8b88d7e8733b957d44da3853f7093c551df6dfbba92"
    ],
    "scope": "after-move-or-turn"
  },
  "rattled": {
    "status": "implemented",
    "fingerprints": [
      "666f28780aaecd6a21303e5a73d9dfe0a8daa100c8f330464559464c5230e4ec"
    ]
  },
  "receiver": {
    "status": "implemented",
    "fingerprints": [
      "6dfd866c8e44578c179454dc2f72c55098a2dd892de602db305cd506c5cacd7e"
    ]
  },
  "reckless": {
    "status": "implemented",
    "fingerprints": [
      "a52f84094b3ef4d6723441573178a662cd995a1edf6dbdbc9063f1ca3b74c78b"
    ]
  },
  "refrigerate": {
    "status": "implemented",
    "fingerprints": [
      "9204789769d5be80708515cd68827aa67b8f1e8d8263b52c635eb4c655f45563"
    ]
  },
  "regenerator": {
    "status": "no-direct-effect",
    "fingerprints": [
      "71d52896393974836649c1e7a04228ca9177dc4f913bd9c8c59670b3296a4d05"
    ],
    "scope": "after-move-or-turn"
  },
  "ripen": {
    "status": "implemented",
    "fingerprints": [
      "7790a1d5482b3162057c4de56b1a74d5cdceadb898c8b1c258ac420fe7a810d8"
    ]
  },
  "rivalry": {
    "status": "implemented",
    "fingerprints": [
      "a92cfe211806fd492af439a8a3bcdfa390bf79be3fbe0729f1c5b49c9a654c33"
    ]
  },
  "rock-head": {
    "status": "no-direct-effect",
    "fingerprints": [
      "6536c60f969a314a8b256f4e06e33e8fd0526d94608be3f63089ae03a006bae7"
    ],
    "scope": "after-move-or-turn"
  },
  "rough-skin": {
    "status": "implemented",
    "fingerprints": [
      "25006b7d6009baa70134c19c602deafe90ca2668d233a1b2277510d24fb9b77e"
    ]
  },
  "run-away": {
    "status": "no-direct-effect",
    "fingerprints": [
      "74501825e468ffc20ab36ca694f47f61cdab84714fba4f2170096f6d683d07ad"
    ]
  },
  "sand-force": {
    "status": "implemented",
    "fingerprints": [
      "28a21c24effc94afd6ee27b826f51d615436d70ba962dd49f7d5574b3eb01312"
    ]
  },
  "sand-rush": {
    "status": "implemented",
    "fingerprints": [
      "6dd6a02606112f67f971f6b883b436a9e48771a17fd2bbf2ed1a71ddb7631248"
    ]
  },
  "sand-spit": {
    "status": "implemented",
    "fingerprints": [
      "3ce7b297308ac8cf11f48feea9d1bf78e52bc4f3b6e09d790722722174fc952e"
    ]
  },
  "sand-stream": {
    "status": "implemented",
    "fingerprints": [
      "c37883ffcdc53831658306acb381cc0923adb7525b5fd09a72cac5b27f71c0a0"
    ]
  },
  "sand-veil": {
    "status": "no-direct-effect",
    "fingerprints": [
      "bb6c41651048d06540e2cc4825f1497b0d3e70680e67e4ff6c4cba0d1ff27467"
    ],
    "scope": "accuracy-or-chosen-order"
  },
  "sap-sipper": {
    "status": "implemented",
    "fingerprints": [
      "5e5438c463c99d9f7d8b092a57209b3deeba35c040ac17f47b79282f523e342b"
    ]
  },
  "scrappy": {
    "status": "implemented",
    "fingerprints": [
      "5b07d34798f36655f4c46cef0ff867a3bb61a0c01239b8ed52f1a245026561c5"
    ]
  },
  "screen-cleaner": {
    "status": "implemented",
    "fingerprints": [
      "62e4cda3893c58dc8113951fb6b695fb748a5073fd36801c8a3eabcafeba5b47"
    ]
  },
  "seed-sower": {
    "status": "implemented",
    "fingerprints": [
      "322321ffc045ec9f407c52ece9e40889d412e37ddcf4dac52ac3723a0e4f57bd"
    ]
  },
  "shadow-tag": {
    "status": "no-direct-effect",
    "fingerprints": [
      "1dc47adf437ad03120dc05a05db18657f8db371fca282360fa5868c98ecd9ce2"
    ],
    "scope": "future-action-or-other-actor"
  },
  "sharpness": {
    "status": "implemented",
    "fingerprints": [
      "2245332e8c2a60d10fdb33e2bdf32c2a996a7574ad330fc6ebb103ab6e4d7ffd"
    ]
  },
  "shed-skin": {
    "status": "no-direct-effect",
    "fingerprints": [
      "7d068ef7c20a5e4718b46c17916902be70586c0a7361068fb94dc6841de5dc19"
    ],
    "scope": "after-move-or-turn"
  },
  "sheer-force": {
    "status": "implemented",
    "fingerprints": [
      "70bef95e9f0f7744266dd9b9a669e4d43201db2cae020eae076c4cbe500e4806"
    ]
  },
  "shell-armor": {
    "status": "implemented",
    "fingerprints": [
      "13e53f4565329c6563fc341bc8d3152c036e4f4045fb5d12d7e2f24af37b3676"
    ]
  },
  "shield-dust": {
    "status": "implemented",
    "fingerprints": [
      "dfc458740a3f394b118ab0da7dc37d0ba528cf99e3cd32b9b7e8cd63d2073919"
    ]
  },
  "skill-link": {
    "status": "implemented",
    "fingerprints": [
      "81667477bc328b643fde90ab830efe8ccb779d9e6f9f2c2179817866765f7150"
    ]
  },
  "slush-rush": {
    "status": "implemented",
    "fingerprints": [
      "10ca00ca02b1787269120814150ea7585f0e42cb98895356560fa4c6660dcc46"
    ]
  },
  "sniper": {
    "status": "implemented",
    "fingerprints": [
      "3743afd60522b5d3194e1e4cd868e5ef94e375c59475dcca539fb001987c5e8a"
    ]
  },
  "snow-cloak": {
    "status": "no-direct-effect",
    "fingerprints": [
      "94f32a3bc03875668e4847c3f8ef35ee38fe915abf7fdb75851e4118c87da214"
    ],
    "scope": "accuracy-or-chosen-order"
  },
  "snow-warning": {
    "status": "implemented",
    "fingerprints": [
      "c6ad9c2f7f5b0e3797fff0a43e1b3f8b9de840f0077ec9f57b215c244b10157c"
    ]
  },
  "solar-power": {
    "status": "implemented",
    "fingerprints": [
      "dfb339752c8347e095a5acf0befb35d42900f733c822b2450bee3d9cd114bc8e"
    ]
  },
  "solid-rock": {
    "status": "implemented",
    "fingerprints": [
      "3996414951a9c810eec02562b3007cd05ce2137f91c185b228a84294991e6e4e"
    ]
  },
  "soundproof": {
    "status": "implemented",
    "fingerprints": [
      "1323985be880ba839c4908b4942dc8a50a905de363ff4ba95c0852a6ab59900a"
    ]
  },
  "speed-boost": {
    "status": "no-direct-effect",
    "fingerprints": [
      "c85e4ba9c1eefa37c09ef86c3796c98c23dc8a6813df4fa599f7d40dc0636ae6"
    ],
    "scope": "after-move-or-turn"
  },
  "spicy-spray": {
    "status": "implemented",
    "fingerprints": [
      "603aefa305dc14dd904505f600b04b3f92c90064729d6d06b1a1cceca8825e86"
    ]
  },
  "stakeout": {
    "status": "implemented",
    "fingerprints": [
      "c585161dc0c7f0a7b9a9489d1618c8007ed9192adc97959346061ba8e4cdd971"
    ]
  },
  "stall": {
    "status": "no-direct-effect",
    "fingerprints": [
      "9769c62f9bf3b7743e5b32c7647531c37a62363cfe5660daff78b6a827c6ad85"
    ],
    "scope": "accuracy-or-chosen-order"
  },
  "stalwart": {
    "status": "no-direct-effect",
    "fingerprints": [
      "71947e6453b607415997d9673c6a884dfa64570a6e2bdf879a455397bc3572e0"
    ],
    "scope": "future-action-or-other-actor"
  },
  "stamina": {
    "status": "implemented",
    "fingerprints": [
      "54b9f2590a0046a936cee95aa9c7c2936b003c77f39adc4aed7e3a9e6a9298b2"
    ]
  },
  "stance-change": {
    "status": "implemented",
    "fingerprints": [
      "9d9e85ee6339185920e485e0fe6fce05f6196d34d7d1833ff857a99ec712f5a4"
    ]
  },
  "static": {
    "status": "implemented",
    "fingerprints": [
      "cdc642b0e83237370c8744cc5da97d8876678f4a3076837b25d61962bb07d873"
    ]
  },
  "steadfast": {
    "status": "no-direct-effect",
    "fingerprints": [
      "5d4a4684cd80c51c76e297465e982203df6ebf2a3323ba438104fa9781b0487f"
    ],
    "scope": "future-action-or-other-actor"
  },
  "steely-spirit": {
    "status": "implemented",
    "fingerprints": [
      "58fc6ef47d0f2ad09bacbd863e2fb0704415c5537bae0d34e43cede0e6a41edf"
    ]
  },
  "stench": {
    "status": "no-direct-effect",
    "fingerprints": [
      "3894efbef05e64d1a9ea6bd09d7ca6d3871a2671f417a64902ef4bb33a1f9921"
    ],
    "scope": "future-action-or-other-actor"
  },
  "sticky-hold": {
    "status": "implemented",
    "fingerprints": [
      "fd08f94a8a62648a08f99164f647cacd2a81048477d3bb7363f1aaddd290c811"
    ]
  },
  "strong-jaw": {
    "status": "implemented",
    "fingerprints": [
      "93b0e092bd92ca8eaba215e7b90d2e38e0fc6d83be9f705d520fd8180765d212"
    ]
  },
  "sturdy": {
    "status": "implemented",
    "fingerprints": [
      "679a0aca85cc208e58adde6e606cd9453d99e1a0a56b59288086e389e7a0ff34"
    ]
  },
  "suction-cups": {
    "status": "no-direct-effect",
    "fingerprints": [
      "6aef2a3f6c133b3a7f392603a693883ce255c8c708deba31f1929d2fdd89f57c"
    ],
    "scope": "future-action-or-other-actor"
  },
  "super-luck": {
    "status": "no-direct-effect",
    "fingerprints": [
      "bca665c5caf3727f012f8ad277c2f7e6165280be411adc7674d84fa26577041f"
    ],
    "scope": "accuracy-or-chosen-order"
  },
  "supersweet-syrup": {
    "status": "implemented",
    "fingerprints": [
      "3fb0febb47833a5d6e9c196a9a3a732181527414fbdb564103d6f695194afc1c"
    ]
  },
  "supreme-overlord": {
    "status": "implemented",
    "fingerprints": [
      "a3fe5c0c6d33b711bae9d608582fd8f7477689270e1e9149761eece657f2466a"
    ]
  },
  "surge-surfer": {
    "status": "implemented",
    "fingerprints": [
      "e355402f7c3b3cdc2294fe60860094adf99e356f911d42312479b0969ceb9868"
    ]
  },
  "swarm": {
    "status": "implemented",
    "fingerprints": [
      "8f47eff226649dbaf863cf0c319ae9cb18031877d3bbfaa14a86782cbec3307a"
    ]
  },
  "sweet-veil": {
    "status": "implemented",
    "fingerprints": [
      "04f4c3d05e3db7888ba6014863036710e7d168700ffb1a8b83ae7a3131895fde"
    ]
  },
  "swift-swim": {
    "status": "implemented",
    "fingerprints": [
      "4c71f3d0f79d517121fadecb89550e993cdc92f2b01b3efdb1a3e2afcddf35f7"
    ]
  },
  "symbiosis": {
    "status": "no-direct-effect",
    "fingerprints": [
      "f9b493eb7cd8525bc913618781df7de1ba43a9a81fdc3b43826006c43d1878cf"
    ],
    "scope": "future-action-or-other-actor"
  },
  "synchronize": {
    "status": "implemented",
    "fingerprints": [
      "c3cac1e863611af845d7013b66d700da37ebd6556855462868d4da2e038553fd"
    ]
  },
  "tangled-feet": {
    "status": "no-direct-effect",
    "fingerprints": [
      "6a6e983d8323de18cc13af4658e65fb48b5ed7d5a175fe8dfc0072f2b0cbbdf5"
    ],
    "scope": "accuracy-or-chosen-order"
  },
  "technician": {
    "status": "implemented",
    "fingerprints": [
      "7344a8a25c819930cff46ffa8cb907b799cc76aa0ecb34a9f5bdfdb31ff85963"
    ]
  },
  "telepathy": {
    "status": "no-direct-effect",
    "fingerprints": [
      "0aaf5a7d5a47ee08212361c8334d53b5491b9e44c1bd57952c4935db45e2ee16"
    ],
    "scope": "future-action-or-other-actor"
  },
  "thermal-exchange": {
    "status": "implemented",
    "fingerprints": [
      "c77fb6b0e85763d13c77db0401b379a763ff89a9fd62898668f972cbb0e64789"
    ]
  },
  "thick-fat": {
    "status": "implemented",
    "fingerprints": [
      "db99cd48fe385a75570b3dbd06568070c78f8c80d2d1c7c485a64d24a662de71"
    ]
  },
  "torrent": {
    "status": "implemented",
    "fingerprints": [
      "dd4091b466b8b5eb400383efdfd971009ab23706115924298086f4d5ddc58a9b"
    ]
  },
  "tough-claws": {
    "status": "implemented",
    "fingerprints": [
      "8465a5d32bf0b60b559a99974525354cd51f257d56d0819e3f8e24e6f2025bb8"
    ]
  },
  "toxic-debris": {
    "status": "no-direct-effect",
    "fingerprints": [
      "93fc9b9085ef0b80637b7f9a44657985dc1f310737ebe18f8754240c44d67960"
    ],
    "scope": "after-move-or-turn"
  },
  "trace": {
    "status": "implemented",
    "fingerprints": [
      "5505655854db6dcaef76200a77a4edff806d016fa643c08510a8c8aab1546084"
    ]
  },
  "unaware": {
    "status": "implemented",
    "fingerprints": [
      "27f19b194ffe4e886580761556c319d67edc4d000eacc44a85f3237279d1d845"
    ]
  },
  "unburden": {
    "status": "implemented",
    "fingerprints": [
      "e84154aea6455e02d8a63d32b1cf282218c5e085ea9e406a04d46d0b0dd76dfe"
    ]
  },
  "unnerve": {
    "status": "implemented",
    "fingerprints": [
      "6d010368d77452c581fe0d9d952b5ff981a0251d4058fb6a44837c915e087ae9"
    ]
  },
  "unseen-fist": {
    "status": "implemented",
    "fingerprints": [
      "583dad87b6e866295fd7d301c40d95424d6c44e90933053ebf7f22c7edb19496"
    ]
  },
  "vital-spirit": {
    "status": "implemented",
    "fingerprints": [
      "dccae82ff848ec0edb81ef1c72caf5b19ead2344730bab560a054bde75eae2ac"
    ]
  },
  "volt-absorb": {
    "status": "implemented",
    "fingerprints": [
      "ca5d517e08d9ac458a81f686403536588ce07390475786f87a63bf771d20672c"
    ]
  },
  "wandering-spirit": {
    "status": "implemented",
    "fingerprints": [
      "562ef1c8db2821a7c80798d612d0b66c702f684e23a26b6b102983b339a5096e"
    ]
  },
  "water-absorb": {
    "status": "implemented",
    "fingerprints": [
      "9bb95a249197313c4e5d20825d4c7bb3c023034db6d26241a0c8a6edf5e557b6"
    ]
  },
  "water-bubble": {
    "status": "implemented",
    "fingerprints": [
      "8a20b0aeced899e517239b5c02bf6fe516f68dd53bd9e070f0526c26ebdcff7b"
    ]
  },
  "weak-armor": {
    "status": "implemented",
    "fingerprints": [
      "86c6e6db5b17c88d02d52e6a1467cfbabd371f5d3e25e0fd74e51f394672d0a9"
    ]
  },
  "white-smoke": {
    "status": "implemented",
    "fingerprints": [
      "e2a24d99320d7b77093b0ffb06fb6f36231bcf1ce229ff1c850e144e5d3f8ecd"
    ]
  },
  "zero-to-hero": {
    "status": "implemented",
    "fingerprints": [
      "eaac4ed19a4ec1b42b63306af94bfb8f3dc8a742b939c63341fa3f8533b5928d"
    ]
  }
}
