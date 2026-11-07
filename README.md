# NEXORIA — site officiel

Le site de tous les projets NEXORIA, hébergé gratuitement sur **GitHub Pages** : https://mrkevin900.github.io/nexoria/

Fondateur : **MRkevin** · Cofondateur : **Junior**. Style inspiré de la maquette de Junior (noir et argent, polices Sora et Figtree).

## Modifier le contenu

Tout le contenu est dans **`data/projects.json`** :

| Champ | Rôle |
| --- | --- |
| `state` | `dev` (en développement), `done` (terminé) ou `pause` (en pause, affiché avec un cadenas) |
| `authors` | `kevin` et/ou `junior` |
| `accent` / `bg` | couleur et fond du projet (affiche + page) |
| `logo` ou `monogram` | image du projet, ou lettres affichées à la place |
| `banner` | grande image de fond de la page du projet |
| `gallery` | images ; `"example": true` = image d’exemple, à remplacer par une vraie capture |
| `videos`, `bosses`, `roadmap`, `features`, `facts` | sections de la page du projet |

Le lien Discord et l’adresse du Panel HG se règlent dans **`config.js`** (jamais de mot de passe ni de jeton dedans : le fichier est public).

## Logo NEXORIA

Le logo (les lettres « NX » qui tirent la langue) est dans **`assets/img/nexoria-logo.png`** : fond transparent et contour blanc pour rester lisible sur le fond noir. L’icône d’onglet est **`assets/img/favicon.png`**.

## Voir le site sur son PC

```
node outils/serveur-local.mjs
```

puis ouvrir http://localhost:8080 (ouvrir `index.html` en double-cliquant ne marche pas : le navigateur bloque la lecture du JSON).

## Structure

```
index.html            page unique (accueil + pages projet via #/projet/<id>)
config.js             lien Discord, adresse du Panel HG
data/projects.json    tous les projets
assets/css/style.css  style
assets/js/app.js      affichage des projets, galerie, FAQ, pages projet
assets/js/fx.js       effets : thème, curseur, particules, apparitions, cartes 3D
assets/projects/…     images et vidéos de chaque projet
```

Le bot Discord a été retiré pour l’instant ; il sera refait à la fin.
