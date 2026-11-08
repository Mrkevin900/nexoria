/* Contenu d’Academy Nexoria. Une leçon sans champ « b » est « en préparation » (aucun contenu inventé). */
window.CONTENT={
 "categories": [
  {
   "id": "mapping",
   "name": "Mapping",
   "color": "#b9c6d3",
   "icon": "▦",
   "tag": "Environnements & 3D",
   "desc": "Hammer, Blender, props, textures, optimisation et compilation : construire les cartes de ton serveur.",
   "topics": [
    "Blender",
    "Hammer Editor",
    "Création de maps Garry’s Mod",
    "Bâtiments",
    "Modélisation 3D",
    "Props et assets",
    "Textures et matériaux",
    "UV Mapping",
    "Éclairage",
    "Optimisation",
    "Compilation",
    "Gestion des entités",
    "Navigation des NPC",
    "Portails et zones de transition",
    "Environnements immersifs",
    "Import / export de modèles",
    "Source Engine et Source SDK",
    "SourceIO",
    "Organisation des fichiers",
    "Erreurs de compilation"
   ],
   "parcours": [
    {
     "id": "debutant",
     "name": "Parcours débutant",
     "level": 1,
     "chapters": [
      {
       "id": "m1",
       "name": "Avant de commencer",
       "lessons": [
        {
         "id": "m-i0",
         "title": "Les logiciels et les versions",
         "b": [
          [
           "obj",
           [
            "Connaître les outils et le moment où ils deviennent utiles."
           ]
          ],
          [
           "list",
           "Les outils",
           [
            "Hammer / Hammer++ — Construire la géométrie, placer entités, props, lumières et préparer la compilation. (Tout de suite)",
            "Garry’s Mod — Tester la map en jeu : déplacement, collisions, spawn, rendu et erreurs. (Tout de suite)",
            "Blender — Créer des modèles 3D personnalisés : mobilier, architecture, accessoires. (Après les bases Hammer)",
            "Crowbar — Compiler ou inspecter certains modèles Source. (Plus tard)",
            "PureRef ou tableau de références — Rassembler les images et idées qui guident le style. (Dès le premier vrai projet)"
           ]
          ],
          [
           "text",
           "Hammer classique est l’éditeur Valve fourni avec certains outils Source. Hammer++ est une version améliorée maintenue par un développeur indépendant ; son site officiel propose un téléchargement spécifique à Garry’s Mod : choisis la branche correspondant au jeu visé."
          ],
          [
           "warn",
           "Ne réinstalle rien pour le moment : ouvre ton Hammer, prends une capture de toute la fenêtre et note le nom du fichier qui le lance (hammer.exe ou hammerplusplus.exe)."
          ],
          [
           "link",
           "https://wiki.facepunch.com/gmod/Mapping_Fundamentals",
           "Facepunch — Mapping Fundamentals"
          ],
          [
           "link",
           "https://ficool2.github.io/HammerPlusPlus-Website/download.html",
           "Hammer++ — téléchargements (choisir Garry’s Mod)"
          ]
         ]
        },
        {
         "id": "m-i1",
         "title": "Le vocabulaire essentiel",
         "b": [
          [
           "obj",
           [
            "Comprendre les mots utilisés en mapping Source."
           ]
          ],
          [
           "list",
           "Glossaire",
           [
            "Map — Le niveau jouable que tu construis.",
            "VMF — Le fichier source modifiable de la map. C’est ton fichier de travail Hammer.",
            "BSP — Le fichier compilé que Garry’s Mod charge comme map jouable.",
            "Brush — Un volume construit directement dans Hammer : sol, mur, plafond, bloc.",
            "World geometry — La géométrie principale du monde, qui participe notamment au calcul de visibilité.",
            "func_detail — Une entité pour certains brushs de détail ; utile pour éviter qu’ils compliquent inutilement le calcul de visibilité. Ce n’est pas une solution à appliquer à tous les murs.",
            "Prop — Un modèle 3D placé dans la map : chaise, arbre, lampadaire, caisse, etc.",
            "Entity — Un objet logique ou interactif : spawn, lumière, porte, déclencheur, etc.",
            "Material / texture — L’apparence appliquée à une surface.",
            "Leak — Une ouverture involontaire entre l’intérieur de la map et le vide extérieur ; elle peut empêcher une compilation correcte.",
            "Displacement — Une surface déformable utilisée notamment pour créer du relief.",
            "Blockout — La première version simplifiée d’un niveau, faite de formes basiques pour tester les dimensions et les déplacements.",
            "PVS / VIS — Le système qui détermine quelles zones peuvent être visibles depuis la position du joueur."
           ]
          ]
         ]
        }
       ]
      },
      {
       "id": "m2",
       "name": "Prendre Hammer en main (#0 à #4)",
       "lessons": [
        {
         "id": "m-h0",
         "title": "#0 — Pré requis",
         "b": [
          [
           "obj",
           [
            "Comprendre les prérequis et le principe du mapping Source."
           ]
          ],
          [
           "ex",
           "Ouvre Hammer, repère les vues et note la version que tu utilises. Ne change aucun chemin de configuration."
          ],
          [
           "video",
           "https://www.youtube.com/watch?v=0D43rULaOAY",
           "Garry’s Mod mapping tutorial [FR] — #0 — Pré requis"
          ],
          [
           "tip",
           "Ne change aucun chemin de configuration et ne réinstalle rien avant d’avoir identifié ta version de Hammer."
          ],
          [
           "warn",
           "La série date de 2015–2016 : menus, chemins ou paramètres peuvent différer de ton installation. Ne modifie pas plusieurs réglages à la fois."
          ],
          [
           "recap",
           "Règle d’or : une vidéo devient une compétence lorsque tu peux refaire la manipulation sans elle et expliquer à quoi elle sert."
          ]
         ]
        },
        {
         "id": "m-h1",
         "title": "#1 — Block tool",
         "b": [
          [
           "obj",
           [
            "Créer des volumes de base avec l’outil Block."
           ]
          ],
          [
           "ex",
           "Construis un sol et quatre murs simples. Sauvegarde un premier fichier VMF."
          ],
          [
           "video",
           "https://www.youtube.com/watch?v=3h4syKvSaJA",
           "Garry’s Mod mapping tutorial [FR] — #1 — Block tool"
          ],
          [
           "link",
           "https://creatorsarea.fr/tutoriels/astuces-en-mapping-sur-source/raccourcis-clavier-sur-hammer",
           "Creators Area — Raccourcis clavier sur Hammer"
          ],
          [
           "warn",
           "La série date de 2015–2016 : menus, chemins ou paramètres peuvent différer de ton installation. Ne modifie pas plusieurs réglages à la fois."
          ],
          [
           "recap",
           "Règle d’or : une vidéo devient une compétence lorsque tu peux refaire la manipulation sans elle et expliquer à quoi elle sert."
          ]
         ]
        },
        {
         "id": "m-h2",
         "title": "#2 — Texturing",
         "b": [
          [
           "obj",
           [
            "Choisir et appliquer des textures sur les surfaces."
           ]
          ],
          [
           "ex",
           "Applique une texture de sol et une texture murale. Vérifie l’échelle et l’alignement."
          ],
          [
           "video",
           "https://www.youtube.com/watch?v=5Japn6JJCWU",
           "Garry’s Mod mapping tutorial [FR] — #2 — Texturing"
          ],
          [
           "warn",
           "La série date de 2015–2016 : menus, chemins ou paramètres peuvent différer de ton installation. Ne modifie pas plusieurs réglages à la fois."
          ],
          [
           "recap",
           "Règle d’or : une vidéo devient une compétence lorsque tu peux refaire la manipulation sans elle et expliquer à quoi elle sert."
          ]
         ]
        },
        {
         "id": "m-h3",
         "title": "#3 — Clipping & Vertex tool",
         "b": [
          [
           "obj",
           [
            "Couper et modifier des brushs pour sortir des formes purement cubiques."
           ]
          ],
          [
           "ex",
           "Crée un petit pan de mur incliné ou un encadrement simple. Garde une copie de la version précédente."
          ],
          [
           "video",
           "https://www.youtube.com/watch?v=eUoXe0BLGw0",
           "Garry’s Mod mapping tutorial [FR] — #3 — Clipping & Vertex tool"
          ],
          [
           "tip",
           "Garde une copie de la version précédente."
          ],
          [
           "warn",
           "La série date de 2015–2016 : menus, chemins ou paramètres peuvent différer de ton installation. Ne modifie pas plusieurs réglages à la fois."
          ],
          [
           "recap",
           "Règle d’or : une vidéo devient une compétence lorsque tu peux refaire la manipulation sans elle et expliquer à quoi elle sert."
          ]
         ]
        },
        {
         "id": "m-h4",
         "title": "#4 — Skybox & Compilation",
         "b": [
          [
           "obj",
           [
            "Comprendre la skybox et le principe de compilation."
           ]
          ],
          [
           "ex",
           "Compile une petite pièce de test, lance-la dans le jeu et vérifie que le joueur peut apparaître et se déplacer."
          ],
          [
           "video",
           "https://www.youtube.com/watch?v=5fP6WcaoXT8",
           "Garry’s Mod mapping tutorial [FR] — #4 — Skybox & Compilation"
          ],
          [
           "tip",
           "Après #4, arrête-toi pour créer une pièce, la texturer et la compiler avant de continuer avec #5 à #9."
          ],
          [
           "warn",
           "La série date de 2015–2016 : menus, chemins ou paramètres peuvent différer de ton installation. Ne modifie pas plusieurs réglages à la fois."
          ],
          [
           "recap",
           "Règle d’or : une vidéo devient une compétence lorsque tu peux refaire la manipulation sans elle et expliquer à quoi elle sert."
          ]
         ]
        }
       ]
      },
      {
       "id": "m3",
       "name": "Lumière, props, portes et relief (#5 à #9)",
       "lessons": [
        {
         "id": "m-h5",
         "title": "#5 — Éclairage basique",
         "b": [
          [
           "obj",
           [
            "Placer des sources lumineuses et comprendre leur rôle."
           ]
          ],
          [
           "ex",
           "Teste une pièce avec une lumière simple. Compare plusieurs intensités et températures de couleur."
          ],
          [
           "video",
           "https://www.youtube.com/watch?v=XqmojjNedFQ",
           "Garry’s Mod mapping tutorial [FR] — #5 — Éclairage basique"
          ],
          [
           "link",
           "https://creatorsarea.fr/tutoriels/astuces-en-mapping-sur-source/comment-embellir-ses-lumieres",
           "Creators Area — Comment embellir ses lumières"
          ],
          [
           "warn",
           "La série date de 2015–2016 : menus, chemins ou paramètres peuvent différer de ton installation. Ne modifie pas plusieurs réglages à la fois."
          ],
          [
           "recap",
           "Règle d’or : une vidéo devient une compétence lorsque tu peux refaire la manipulation sans elle et expliquer à quoi elle sert."
          ]
         ]
        },
        {
         "id": "m-h6",
         "title": "#6 — Les Props",
         "b": [
          [
           "obj",
           [
            "Ajouter des modèles 3D existants pour meubler et détailler une scène."
           ]
          ],
          [
           "ex",
           "Ajoute une table ou une caisse, puis vérifie sa collision et son échelle en jeu."
          ],
          [
           "video",
           "https://www.youtube.com/watch?v=Bd33tMjIHFo",
           "Garry’s Mod mapping tutorial [FR] — #6 — Les Props"
          ],
          [
           "warn",
           "La série date de 2015–2016 : menus, chemins ou paramètres peuvent différer de ton installation. Ne modifie pas plusieurs réglages à la fois."
          ],
          [
           "recap",
           "Règle d’or : une vidéo devient une compétence lorsque tu peux refaire la manipulation sans elle et expliquer à quoi elle sert."
          ]
         ]
        },
        {
         "id": "m-h7",
         "title": "#7 — Les Portes",
         "b": [
          [
           "obj",
           [
            "Créer une porte et comprendre ses paramètres de fonctionnement."
           ]
          ],
          [
           "ex",
           "Ajoute une porte à ton bâtiment de test et vérifie son ouverture en jeu."
          ],
          [
           "video",
           "https://www.youtube.com/watch?v=t8VR6KMtnUw",
           "Garry’s Mod mapping tutorial [FR] — #7 — Les Portes"
          ],
          [
           "warn",
           "La série date de 2015–2016 : menus, chemins ou paramètres peuvent différer de ton installation. Ne modifie pas plusieurs réglages à la fois."
          ],
          [
           "recap",
           "Règle d’or : une vidéo devient une compétence lorsque tu peux refaire la manipulation sans elle et expliquer à quoi elle sert."
          ]
         ]
        },
        {
         "id": "m-h8",
         "title": "#8 — Le Relief (Displacements)",
         "b": [
          [
           "obj",
           [
            "Créer des surfaces de terrain moins plates à l’aide des displacements."
           ]
          ],
          [
           "ex",
           "Crée un petit talus ou une zone de terrain irrégulière. N’utilise pas encore les displacements partout."
          ],
          [
           "video",
           "https://www.youtube.com/watch?v=WF5jIIPYyXY",
           "Garry’s Mod mapping tutorial [FR] — #8 — Le Relief (Displacements)"
          ],
          [
           "tip",
           "N’utilise pas encore les displacements partout."
          ],
          [
           "warn",
           "La série date de 2015–2016 : menus, chemins ou paramètres peuvent différer de ton installation. Ne modifie pas plusieurs réglages à la fois."
          ],
          [
           "recap",
           "Règle d’or : une vidéo devient une compétence lorsque tu peux refaire la manipulation sans elle et expliquer à quoi elle sert."
          ]
         ]
        },
        {
         "id": "m-h9",
         "title": "#9 — Le func_detail (Optimisation)",
         "b": [
          [
           "obj",
           [
            "Comprendre pourquoi certains détails peuvent être convertis en func_detail."
           ]
          ],
          [
           "ex",
           "Identifie quelques éléments décoratifs de ta scène et explique pourquoi ils ne doivent pas tous devenir des murs structurels."
          ],
          [
           "video",
           "https://www.youtube.com/watch?v=v3pcSQ35Wy4",
           "Garry’s Mod mapping tutorial [FR] — #9 — Le func_detail (Optimisation)"
          ],
          [
           "tip",
           "Ne transforme pas tout en func_detail : les murs qui doivent bloquer la visibilité restent structurels."
          ],
          [
           "link",
           "https://creatorsarea.fr/tutoriels/optimiser-une-map-sur-source-engine/optimiser-une-map-gmod-avec-funcdetail",
           "Creators Area — Optimiser une map avec func_detail"
          ],
          [
           "warn",
           "La série date de 2015–2016 : menus, chemins ou paramètres peuvent différer de ton installation. Ne modifie pas plusieurs réglages à la fois."
          ],
          [
           "recap",
           "Règle d’or : une vidéo devient une compétence lorsque tu peux refaire la manipulation sans elle et expliquer à quoi elle sert."
          ]
         ]
        }
       ]
      },
      {
       "id": "m4",
       "name": "Missions : première pièce et couloir",
       "lessons": [
        {
         "id": "m-p0",
         "title": "Mission 1 — La première pièce",
         "b": [
          [
           "obj",
           [
            "Compétences : vues 2D/3D, sélection, Block Tool, grille, sauvegarde VMF."
           ]
          ],
          [
           "text",
           "Résultat attendu : pièce simple avec sol, murs, plafond et une ouverture."
          ],
          [
           "ex",
           "Fichier conseillé : MAP_001_room.vmf. Validation : Capture de Hammer + Capture en jeu + Liste des problèmes corrigés."
          ],
          [
           "tip",
           "Termine et teste chaque exercice avant de passer au suivant. Si tu bloques, prends une capture et note le message d’erreur exact : ne modifie pas plusieurs réglages à la fois."
          ]
         ]
        },
        {
         "id": "m-p1",
         "title": "Mission 2 — Le petit couloir",
         "b": [
          [
           "obj",
           [
            "Compétences : duplication, alignement, proportions, textures, clipping de base."
           ]
          ],
          [
           "text",
           "Résultat attendu : couloir avec deux ouvertures et un sol texturé."
          ],
          [
           "ex",
           "Fichier conseillé : MAP_002_corridor.vmf. Validation : Capture de Hammer + Capture en jeu + Liste des problèmes corrigés."
          ],
          [
           "tip",
           "Termine et teste chaque exercice avant de passer au suivant. Si tu bloques, prends une capture et note le message d’erreur exact : ne modifie pas plusieurs réglages à la fois."
          ]
         ]
        }
       ]
      }
     ]
    },
    {
     "id": "intermediaire",
     "name": "Parcours intermédiaire",
     "level": 2,
     "chapters": [
      {
       "id": "m5",
       "name": "Blender : la deuxième compétence",
       "lessons": [
        {
         "id": "m-b0",
         "title": "Formation complète débutant — Apprendre Blender (2026)",
         "b": [
          [
           "obj",
           [
            "Parcours progressif : interface, navigation, déplacement, modélisation, matériaux, éclairage et rendu. À privilégier comme cours principal."
           ]
          ],
          [
           "video",
           "https://www.youtube.com/watch?v=Mx0Vi7UnTuY",
           "Formation complète débutant — Apprendre Blender (2026)"
          ]
         ]
        },
        {
         "id": "m-b1",
         "title": "MEGA TUTO : Les bases de Blender — Bertrand Tech",
         "b": [
          [
           "obj",
           [
            "Formation de trois heures : navigation, modélisation, matériaux, lumière, UV et export. Très utile comme bibliothèque de chapitres."
           ]
          ],
          [
           "video",
           "https://www.youtube.com/watch?v=_5Js5pbvFSw",
           "MEGA TUTO : Les bases de Blender — Bertrand Tech"
          ]
         ]
        },
        {
         "id": "m-b2",
         "title": "Dépliage UV expliqué simplement — Blender en Français",
         "b": [
          [
           "obj",
           [
            "À regarder quand tu commenceras à créer et texturer tes propres objets."
           ]
          ],
          [
           "video",
           "https://www.youtube.com/watch?v=72r8atHFax4",
           "Dépliage UV expliqué simplement — Blender en Français"
          ]
         ]
        }
       ]
      },
      {
       "id": "m6",
       "name": "Outils Source",
       "lessons": [
        {
         "id": "m-t0",
         "title": "Outils Source pour plus tard",
         "b": [
          [
           "obj",
           [
            "Découvrir le pipeline Blender → Source sans te lancer trop tôt."
           ]
          ],
          [
           "warn",
           "Ne te lance pas trop tôt dans l’export : il demande maillage propre, UV, matériaux, échelle, formats Source, fichier QC et compilation. Modélise d’abord une caisse ou un petit meuble."
          ],
          [
           "link",
           "https://github.com/ZeqMacaw/Crowbar",
           "Crowbar — dépôt officiel"
          ],
          [
           "link",
           "https://developer.valvesoftware.com/wiki/Blender_Source_Tools",
           "Blender Source Tools — Valve Developer Community"
          ],
          [
           "link",
           "https://source2blender.readthedocs.io/en/latest/",
           "Source2Blender — prise en main"
          ]
         ]
        }
       ]
      },
      {
       "id": "m7",
       "name": "Missions : intérieur RP et coin de rue",
       "lessons": [
        {
         "id": "m-p2",
         "title": "Mission 3 — L’intérieur RP",
         "b": [
          [
           "obj",
           [
            "Compétences : props, portes, lumière, collision et navigation."
           ]
          ],
          [
           "text",
           "Résultat attendu : intérieur de petite boutique ou salle d’accueil jouable."
          ],
          [
           "ex",
           "Fichier conseillé : MAP_003_interior.vmf. Validation : Capture de Hammer + Capture en jeu + Liste des problèmes corrigés."
          ],
          [
           "tip",
           "Termine et teste chaque exercice avant de passer au suivant. Si tu bloques, prends une capture et note le message d’erreur exact : ne modifie pas plusieurs réglages à la fois."
          ]
         ]
        },
        {
         "id": "m-p3",
         "title": "Mission 4 — Le coin de rue",
         "b": [
          [
           "obj",
           [
            "Compétences : blockout, trottoir, façade, éclairage, circulation et repères visuels."
           ]
          ],
          [
           "text",
           "Résultat attendu : une petite zone extérieure lisible, avec un chemin clair."
          ],
          [
           "ex",
           "Fichier conseillé : MAP_004_street.vmf. Validation : Capture de Hammer + Capture en jeu + Liste des problèmes corrigés."
          ],
          [
           "tip",
           "Termine et teste chaque exercice avant de passer au suivant. Si tu bloques, prends une capture et note le message d’erreur exact : ne modifie pas plusieurs réglages à la fois."
          ]
         ]
        }
       ]
      }
     ]
    },
    {
     "id": "avance",
     "name": "Parcours avancé",
     "level": 3,
     "chapters": [
      {
       "id": "m8",
       "name": "Production",
       "lessons": [
        {
         "id": "m-p4",
         "title": "Mission 5 — Une mini-zone de village",
         "b": [
          [
           "obj",
           [
            "Compétences : cohérence visuelle, bâtiments modulaires, décor, optimisation et tests."
           ]
          ],
          [
           "text",
           "Résultat attendu : petite place médiévale avec plusieurs bâtiments et une zone accessible."
          ],
          [
           "ex",
           "Fichier conseillé : MAP_005_village.vmf. Validation : Capture de Hammer + Capture en jeu + Liste des problèmes corrigés."
          ],
          [
           "tip",
           "Termine et teste chaque exercice avant de passer au suivant. Si tu bloques, prends une capture et note le message d’erreur exact : ne modifie pas plusieurs réglages à la fois."
          ]
         ]
        },
        {
         "id": "m-m0",
         "title": "Méthode professionnelle de création d’une map",
         "b": [
          [
           "obj",
           [
            "Comprendre le besoin, planifier et tester une version simple avant de décorer."
           ]
          ],
          [
           "list",
           "Les 9 étapes",
           [
            "1 — Brief : Qui va jouer sur la map ? Quel type de serveur ? Quel style ? Quelles zones sont indispensables ? Quelles limites techniques ?",
            "2 — Références : Rassembler des images autorisées : architecture, matériaux, ambiance, palette de couleurs, circulation et éclairage.",
            "3 — Plan : Dessiner une vue du dessus simple. Définir les entrées, les sorties, les zones de jeu, les chemins et les distances.",
            "4 — Blockout : Construire uniquement les gros volumes avec des textures simples. Ne pas décorer tant que la circulation ne fonctionne pas.",
            "5 — Test d’échelle : Marcher dans la map. Vérifier les hauteurs, largeurs, portes, escaliers, lignes de vue et espaces de jeu.",
            "6 — Art pass : Ajouter matériaux, props, détails, lumières et ambiance. Garder un style cohérent et éviter les détails gratuits.",
            "7 — Optimisation : Vérifier visibilité, géométrie, densité de props, textures, lumières et temps de compilation.",
            "8 — QA / tests : Compiler, lancer en jeu, tester chaque zone, corriger, refaire tester par quelqu’un d’autre et garder une liste de bugs.",
            "9 — Livraison : Fournir le BSP, le VMF si prévu, les dépendances autorisées, les captures, les notes de version et les crédits."
           ]
          ],
          [
           "list",
           "Règles à prendre dès le départ",
           [
            "Construis sur la grille autant que possible : les alignements propres facilitent la modification et la compilation.",
            "Évite les formes compliquées quand plusieurs brushs simples font le travail plus proprement.",
            "Ne bouche pas les problèmes visuels avec des props : vérifie les volumes, les textures, les collisions et les passages.",
            "Ne transforme pas tout en func_detail. Les murs qui doivent bloquer la visibilité restent structurels.",
            "Teste très tôt. Une map jolie mais pénible à parcourir est un mauvais niveau de jeu."
           ]
          ]
         ]
        },
        {
         "id": "m-o0",
         "title": "Optimisation, tests et livraison",
         "b": [
          [
           "obj",
           [
            "Tester une map en jeu et préparer une livraison propre."
           ]
          ],
          [
           "list",
           "Checklist de test en jeu",
           [
            "Le joueur apparaît au bon endroit et ne commence pas coincé (spawn).",
            "Toutes les portes et tous les chemins prévus sont accessibles.",
            "Les collisions correspondent à ce que le joueur voit.",
            "Aucun mur, plafond ou sol important n’est manquant (géométrie).",
            "Les textures personnalisées et les modèles s’affichent correctement.",
            "Les lumières ne créent pas de zones totalement illisibles ou trop sombres.",
            "Les zones importantes restent fluides depuis les points de vue principaux.",
            "La map ne produit pas d’erreurs évidentes à la compilation ou au chargement."
           ]
          ],
          [
           "link",
           "https://wiki.facepunch.com/gmod/Map_Testing",
           "Facepunch — Map Testing"
          ],
          [
           "link",
           "https://wiki.facepunch.com/gmod/Mapping_Resources",
           "Facepunch — Mapping Resources"
          ],
          [
           "link",
           "https://wiki.facepunch.com/gmod/Addon_Creation",
           "Facepunch — Addon Creation"
          ],
          [
           "link",
           "https://wiki.facepunch.com/gmod/Workshop_Addon_Creation",
           "Facepunch — Workshop Addon Creation"
          ],
          [
           "warn",
           "Ne confonds pas source et livraison : le VMF est ton fichier de travail, le BSP est la map compilée que le jeu charge. Précise ce qui est livré avant le début d’un projet."
          ]
         ]
        }
       ]
      },
      {
       "id": "m9",
       "name": "Livraison et portfolio",
       "lessons": [
        {
         "id": "m-f0",
         "title": "Organisation des fichiers et checklist finale",
         "b": [
          [
           "obj",
           [
            "Ranger ses fichiers et vérifier qu’une map est prête à être présentée."
           ]
          ],
          [
           "list",
           "Arborescence conseillée",
           [
            "MAP_001_Premiere_Piece/",
            "01_sources/ MAP_001_room_v001.vmf, MAP_001_room_v002.vmf",
            "02_builds/ MAP_001_room.bsp",
            "03_assets/ materials/, models/",
            "04_references/ images_inspiration/",
            "05_captures/ hammer/, jeu/",
            "06_tests/ notes_bugs.txt",
            "07_livraison/ map/, documentation/"
           ]
          ],
          [
           "tip",
           "Enregistre souvent des versions : v001, v002, v003. N’écrase pas ton seul fichier source lorsqu’une modification importante est risquée."
          ],
          [
           "list",
           "Checklist finale",
           [
            "Le projet a un nom clair et une description courte.",
            "Le fichier VMF source est sauvegardé et rangé.",
            "La map compile sans erreur bloquante.",
            "La map a été testée dans Garry’s Mod.",
            "Les spawns, collisions, portes et passages ont été vérifiés.",
            "Les assets externes sont autorisés et crédités si nécessaire.",
            "Les captures montrent plusieurs endroits et ne masquent pas les défauts.",
            "Le dossier livré contient uniquement les fichiers convenus.",
            "Les limitations connues sont indiquées honnêtement."
           ]
          ]
         ]
        },
        {
         "id": "m-p5",
         "title": "Mission 6 — Portfolio",
         "b": [
          [
           "obj",
           [
            "Compétences : captures propres, documentation, fiche de projet, packaging et crédits."
           ]
          ],
          [
           "text",
           "Résultat attendu : une présentation montrant l’objectif, les choix, les vues et la version testée."
          ],
          [
           "ex",
           "Fichier conseillé : Dossier Portfolio/Projet_01. Validation : Capture de Hammer + Capture en jeu + Liste des problèmes corrigés."
          ],
          [
           "tip",
           "Termine et teste chaque exercice avant de passer au suivant. Si tu bloques, prends une capture et note le message d’erreur exact : ne modifie pas plusieurs réglages à la fois."
          ],
          [
           "list",
           "Projets à montrer dans ton portfolio",
           [
            "Intérieur simple — Proportions, alignement, éclairage et textures.",
            "Rue RP — Blockout, circulation, façades et cohérence urbaine.",
            "Bâtiment public — Organisation des espaces, accessibilité, détails et lisibilité.",
            "Zone fantastique — Direction artistique, matériaux, lumière et décor.",
            "Optimisation avant / après — Capacité à identifier un problème et à expliquer les corrections."
           ]
          ],
          [
           "warn",
           "Au début, présente tes créations comme des projets d’apprentissage ou des prototypes. Ne promets pas une grande map complète ni une date irréaliste."
          ]
         ]
        }
       ]
      },
      {
       "id": "m10",
       "name": "Sujets à rédiger",
       "lessons": [
        {
         "id": "m-d1",
         "title": "Gestion des entités"
        },
        {
         "id": "m-d2",
         "title": "Navigation et déplacements des NPC"
        },
        {
         "id": "m-d3",
         "title": "Portails et zones de transition"
        },
        {
         "id": "m-d4",
         "title": "SourceIO et outils complémentaires"
        },
        {
         "id": "m-d5",
         "title": "Résolution des erreurs de compilation"
        },
        {
         "id": "m-d6",
         "title": "Environnements inspirés de différents univers RP"
        }
       ]
      }
     ]
    }
   ]
  },
  {
   "id": "code",
   "name": "Code",
   "color": "#a9cfb4",
   "icon": "‹/›",
   "tag": "Programmation GLua",
   "desc": "De Lua aux systèmes RP complets : addons, interfaces, bases de données, sécurité et projet professionnel.",
   "topics": [
    "Lua",
    "GLua",
    "Hooks",
    "Addons",
    "Systèmes RP",
    "Derma",
    "HUD",
    "Métiers",
    "Inventaire",
    "Compétences",
    "Magie",
    "Permissions",
    "Administration",
    "MySQL",
    "SQLite",
    "API et HTTP",
    "Sécurité",
    "Performances",
    "Débogage",
    "Git et GitHub"
   ],
   "parcours": [
    {
     "id": "debutant",
     "name": "Parcours débutant",
     "level": 1,
     "chapters": [
      {
       "id": "c025",
       "name": "Bases de la programmation",
       "lessons": [
        {
         "id": "c-7",
         "title": "Bases de la programmation"
        },
        {
         "id": "c-8",
         "title": "Variables et fonctions"
        },
        {
         "id": "c-9",
         "title": "Conditions et boucles"
        },
        {
         "id": "c-10",
         "title": "Tables et structures de données"
        }
       ]
      },
      {
       "id": "c011",
       "name": "Lua et GLua",
       "lessons": [
        {
         "id": "c-11",
         "title": "Lua"
        },
        {
         "id": "c-12",
         "title": "GLua"
        },
        {
         "id": "c-13",
         "title": "Hooks Garry’s Mod"
        }
       ]
      }
     ]
    },
    {
     "id": "intermediaire",
     "name": "Parcours intermédiaire",
     "level": 2,
     "chapters": [
      {
       "id": "c120",
       "name": "Addons et interfaces",
       "lessons": [
        {
         "id": "c-14",
         "title": "Création d’addons"
        },
        {
         "id": "c-15",
         "title": "Interfaces Derma"
        },
        {
         "id": "c-16",
         "title": "HUD personnalisés"
        },
        {
         "id": "c-17",
         "title": "Développement de systèmes RP"
        }
       ]
      },
      {
       "id": "c117",
       "name": "Données et réseau",
       "lessons": [
        {
         "id": "c-18",
         "title": "Bases de données MySQL"
        },
        {
         "id": "c-19",
         "title": "SQLite"
        },
        {
         "id": "c-20",
         "title": "API et requêtes HTTP"
        }
       ]
      }
     ]
    },
    {
     "id": "avance",
     "name": "Parcours avancé",
     "level": 3,
     "chapters": [
      {
       "id": "c217",
       "name": "Systèmes complets",
       "lessons": [
        {
         "id": "c-21",
         "title": "Systèmes de métiers"
        },
        {
         "id": "c-22",
         "title": "Systèmes d’inventaire"
        },
        {
         "id": "c-23",
         "title": "Systèmes de compétences"
        },
        {
         "id": "c-24",
         "title": "Systèmes de magie"
        },
        {
         "id": "c-25",
         "title": "Gestion des permissions"
        },
        {
         "id": "c-26",
         "title": "Administration"
        }
       ]
      },
      {
       "id": "c231",
       "name": "Qualité et projet professionnel",
       "lessons": [
        {
         "id": "c-27",
         "title": "Sécurité du code"
        },
        {
         "id": "c-28",
         "title": "Optimisation des performances"
        },
        {
         "id": "c-29",
         "title": "Débogage"
        },
        {
         "id": "c-30",
         "title": "Git et GitHub"
        },
        {
         "id": "c-31",
         "title": "Organisation d’un projet professionnel"
        }
       ]
      }
     ]
    }
   ]
  },
  {
   "id": "vfx",
   "name": "VFX",
   "color": "#e0a5b3",
   "icon": "✦",
   "tag": "Effets & ambiance",
   "desc": "Particules, animations, effets de magie et de combat, sound design : créer l’expérience visuelle et sonore.",
   "topics": [
    "Particules",
    "Animations 3D",
    "Magie",
    "Combat",
    "Lumière",
    "Fumée",
    "Énergie",
    "Explosion",
    "Aura",
    "Environnement",
    "Sound design",
    "Optimisation"
   ],
   "parcours": [
    {
     "id": "debutant",
     "name": "Parcours débutant",
     "level": 1,
     "chapters": [
      {
       "id": "v012",
       "name": "Fondamentaux",
       "lessons": [
        {
         "id": "v-32",
         "title": "Création d’effets visuels"
        },
        {
         "id": "v-33",
         "title": "Particules"
        },
        {
         "id": "v-34",
         "title": "Systèmes de particules Source"
        },
        {
         "id": "v-35",
         "title": "Animations 3D"
        }
       ]
      }
     ]
    },
    {
     "id": "intermediaire",
     "name": "Parcours intermédiaire",
     "level": 2,
     "chapters": [
      {
       "id": "v19",
       "name": "Animation",
       "lessons": [
        {
         "id": "v-36",
         "title": "Animations de personnages"
        },
        {
         "id": "v-37",
         "title": "Animations d’objets"
        }
       ]
      },
      {
       "id": "v16",
       "name": "Effets",
       "lessons": [
        {
         "id": "v-38",
         "title": "Effets de magie"
        },
        {
         "id": "v-39",
         "title": "Effets de combat"
        },
        {
         "id": "v-40",
         "title": "Effets de lumière"
        },
        {
         "id": "v-41",
         "title": "Effets de fumée"
        },
        {
         "id": "v-42",
         "title": "Effets d’énergie"
        },
        {
         "id": "v-43",
         "title": "Effets d’explosion"
        },
        {
         "id": "v-44",
         "title": "Effets d’aura"
        },
        {
         "id": "v-45",
         "title": "Effets environnementaux"
        }
       ]
      }
     ]
    },
    {
     "id": "avance",
     "name": "Parcours avancé",
     "level": 3,
     "chapters": [
      {
       "id": "v216",
       "name": "Son et immersion",
       "lessons": [
        {
         "id": "v-46",
         "title": "Sound Design"
        },
        {
         "id": "v-47",
         "title": "Intégration des sons"
        },
        {
         "id": "v-48",
         "title": "Transitions animées"
        },
        {
         "id": "v-49",
         "title": "Création d’effets immersifs"
        }
       ]
      },
      {
       "id": "v212",
       "name": "Optimisation",
       "lessons": [
        {
         "id": "v-50",
         "title": "Optimisation des effets visuels"
        }
       ]
      }
     ]
    }
   ]
  }
 ],
 "resources": [
  {
   "name": "Facepunch — Mapping Fundamentals",
   "desc": "Le meilleur point d’entrée écrit pour débuter : où trouver Hammer, lire les quatre vues et comprendre l’interface.",
   "cat": "Mapping · Facepunch",
   "url": "https://wiki.facepunch.com/gmod/Mapping_Fundamentals",
   "verified": "2026-11-08"
  },
  {
   "name": "Creators Area — Raccourcis clavier sur Hammer",
   "desc": "Raccourcis de sélection, bloc, caméra, textures, grille et vues. Certains peuvent varier selon la configuration.",
   "cat": "Mapping · Creators Area",
   "url": "https://creatorsarea.fr/tutoriels/astuces-en-mapping-sur-source/raccourcis-clavier-sur-hammer",
   "verified": "2026-11-08"
  },
  {
   "name": "Creators Area — Comment embellir ses lumières",
   "desc": "Exemples d’éclairage avec lumière simple, spotlight et particules décoratives.",
   "cat": "Mapping · Creators Area",
   "url": "https://creatorsarea.fr/tutoriels/astuces-en-mapping-sur-source/comment-embellir-ses-lumieres",
   "verified": "2026-11-08"
  },
  {
   "name": "Creators Area — Optimiser une map avec func_detail",
   "desc": "Explique les bons et mauvais usages de func_detail. À lire avant d’optimiser une grande map.",
   "cat": "Mapping · Creators Area",
   "url": "https://creatorsarea.fr/tutoriels/optimiser-une-map-sur-source-engine/optimiser-une-map-gmod-avec-funcdetail",
   "verified": "2026-11-08"
  },
  {
   "name": "Creators Area — Packer les contenus dans le BSP",
   "desc": "Introduction à l’intégration des matériaux et modèles (mentionne VIDE). Article ancien : vérifie les versions d’outils.",
   "cat": "Mapping · Creators Area",
   "url": "https://creatorsarea.fr/tutoriels/astuces-en-mapping-sur-source/packer-les-contents-dans-le-bsp",
   "verified": "2026-11-08"
  },
  {
   "name": "Facepunch — Mapping Resources",
   "desc": "Liste plus avancée sur le layout, la visibilité, le PVS, les areaportals et l’optimisation.",
   "cat": "Mapping · Facepunch",
   "url": "https://wiki.facepunch.com/gmod/Mapping_Resources",
   "verified": "2026-11-08"
  },
  {
   "name": "Facepunch — Map Testing",
   "desc": "Vérifier la visibilité et repérer des sources de lenteur pendant les tests en jeu.",
   "cat": "Mapping · Facepunch",
   "url": "https://wiki.facepunch.com/gmod/Map_Testing",
   "verified": "2026-11-08"
  },
  {
   "name": "Facepunch — Addon Creation",
   "desc": "Structure générale d’un addon, y compris le dossier maps.",
   "cat": "Mapping · Facepunch",
   "url": "https://wiki.facepunch.com/gmod/Addon_Creation",
   "verified": "2026-11-08"
  },
  {
   "name": "Facepunch — Workshop Addon Creation",
   "desc": "Structure d’un addon, test local, icône, GMA, publication Workshop et erreurs courantes.",
   "cat": "Mapping · Facepunch",
   "url": "https://wiki.facepunch.com/gmod/Workshop_Addon_Creation",
   "verified": "2026-11-08"
  },
  {
   "name": "Facepunch — Steam Workshop Rules",
   "desc": "Règles à lire avant toute publication publique.",
   "cat": "Mapping · Facepunch",
   "url": "https://wiki.facepunch.com/gmod/Steam_Workshop_Rules",
   "verified": "2026-11-08"
  },
  {
   "name": "Hammer++ — téléchargements (officiel)",
   "desc": "Choisir explicitement la version Garry’s Mod, pas une branche destinée à un autre jeu.",
   "cat": "Mapping · Outils",
   "url": "https://ficool2.github.io/HammerPlusPlus-Website/download.html",
   "verified": "2026-11-08"
  },
  {
   "name": "Blender — téléchargement (officiel)",
   "desc": "À installer plus tard, lorsque tu commenceras la modélisation 3D.",
   "cat": "Mapping · Outils",
   "url": "https://www.blender.org/download/",
   "verified": "2026-11-08"
  },
  {
   "name": "Crowbar — dépôt officiel",
   "desc": "Outil communautaire de modding GoldSource/Source, notamment pour compiler et inspecter des modèles.",
   "cat": "Mapping · Outils",
   "url": "https://github.com/ZeqMacaw/Crowbar",
   "verified": "2026-11-08"
  },
  {
   "name": "Blender Source Tools — Valve Developer Community",
   "desc": "Pipeline de transfert de modèles Source via les formats pris en charge par les outils.",
   "cat": "Mapping · Outils",
   "url": "https://developer.valvesoftware.com/wiki/Blender_Source_Tools",
   "verified": "2026-11-08"
  },
  {
   "name": "Source2Blender — prise en main",
   "desc": "Guide communautaire sur les outils d’import et d’export ; certaines parties concernent des jeux Source spécifiques.",
   "cat": "Mapping · Outils",
   "url": "https://source2blender.readthedocs.io/en/latest/",
   "verified": "2026-11-08"
  },
  {
   "name": "TopHATTwaffle — bibliothèque Hammer V2 (EN)",
   "desc": "Série structurée : première salle, brushs, leaks, props, optimisation, éclairage, portes, textures personnalisées et publication.",
   "cat": "Mapping · TopHATTwaffle (EN)",
   "url": "https://www.tophattwaffle.com/tutorials/",
   "verified": "2026-11-08"
  },
  {
   "name": "TopHATTwaffle — éclairage complet (EN)",
   "desc": "Éclairage Source, compilation, couleur et ambiance.",
   "cat": "Mapping · TopHATTwaffle (EN)",
   "url": "https://www.tophattwaffle.com/hammer-tutorial-v2-series-8-complete-lighting-tutorial/",
   "verified": "2026-11-08"
  },
  {
   "name": "TopHATTwaffle — optimisation (EN)",
   "desc": "func_detail, skybox, hint/skip et areaportals.",
   "cat": "Mapping · TopHATTwaffle (EN)",
   "url": "https://www.tophattwaffle.com/hammer-tutorial-v2-series-21-optimization/",
   "verified": "2026-11-08"
  }
 ]
};
