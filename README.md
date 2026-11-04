# NEXORIA — site officiel

Le site de tous les projets NEXORIA, hébergé gratuitement sur **GitHub Pages**, et relié au Discord par le **bot NEXORIA** hébergé sur un service gratuit.

## Comment le site et le bot sont reliés

```
 Discord                      Bot NEXORIA (hébergeur gratuit)             GitHub
 ───────                      ──────────────────────────────             ──────
 /annonce, /boss,   ───────►  écrit data/live.json dans le dépôt  ───►  GitHub Pages republie
 /avancement…                 (un commit par modification)              le site (~1 minute)

 Membres, en ligne,  ◄──────  API publique /api/live  ◄──────────────   Le site interroge le bot
 statut du serveur Gmod       (temps réel)                              à chaque visite
```

- **Si le bot dort ou tombe**, le site marche quand même : il lit la dernière version de `data/live.json` sur GitHub.
- **Aucun secret dans le site** : le jeton GitHub reste chez l’hébergeur du bot.

## Organisation des fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | La page (accueil + une page par projet : `#/black-clover`, `#/dino-app`…) |
| `config.js` | Adresse du bot et lien d’invitation Discord |
| `data/projects.json` | **Le contenu** : projets, vidéos, images, boss, avancement, équipe |
| `data/live.json` | Écrit par le bot (actus, boss et avancement modifiés depuis Discord) |
| `assets/projects/<projet>/` | Images et vidéos de chaque projet |
| `bot/` | Le bot Discord (Node.js) |
| `outils/serveur-local.mjs` | Aperçu du site sur ton PC |

## 1. Voir le site sur ton PC

Ouvrir `index.html` en double-cliquant ne marche pas (le navigateur bloque la lecture des fichiers JSON). Lance plutôt :

```bash
node outils/serveur-local.mjs
```

puis ouvre http://localhost:8080.

## 2. Mettre le site en ligne (GitHub Pages)

1. Crée un dépôt **public** sur GitHub, par exemple `nexoria`.
   (Pour l’adresse `https://ton-pseudo.github.io/`, nomme-le `ton-pseudo.github.io`.)
2. Envoie le contenu de ce dossier dans le dépôt (GitHub Desktop, ou en ligne de commande) :
   ```bash
   git init
   ```
   ```bash
   git add .
   ```
   ```bash
   git commit -m "Site NEXORIA"
   ```
   ```bash
   git branch -M main
   ```
   ```bash
   git remote add origin https://github.com/TON-PSEUDO/nexoria.git
   ```
   ```bash
   git push -u origin main
   ```
   Le `.gitignore` empêche d’envoyer `bot/.env`, `node_modules` et le dossier `_ancien`.
3. Sur GitHub : **Settings → Pages → Source : Deploy from a branch → `main` / `(root)`**.
4. Le site est en ligne au bout d’une minute ou deux, à l’adresse indiquée sur cette page.

## 3. Le bot Discord

### a) Créer le bot
1. https://discord.com/developers/applications → **New Application**.
2. Onglet **Bot** → *Reset Token* → copie le jeton (`DISCORD_TOKEN`).
3. Onglet **General Information** → copie l’**Application ID** (`DISCORD_CLIENT_ID`).
4. Si tu veux que les messages du salon d’annonces soient copiés sur le site : onglet **Bot** → active **Message Content Intent**.
5. Onglet **OAuth2 → URL Generator** : coche `bot` et `applications.commands`, permissions *Voir les salons*, *Envoyer des messages*, *Intégrer des liens*, *Joindre des fichiers*. Ouvre le lien et ajoute le bot à ton serveur.
6. Dans Discord (mode développeur activé) : clic droit sur le serveur → *Copier l’identifiant* (`DISCORD_GUILD_ID`), et pareil sur le salon d’annonces (`ANNOUNCE_CHANNEL_ID`, facultatif).

### b) Créer le jeton GitHub (pour que le bot puisse mettre le site à jour)
GitHub → **Settings → Developer settings → Fine-grained tokens → Generate new token** :
- *Repository access* : **Only select repositories** → uniquement le dépôt du site ;
- *Permissions* : **Contents → Read and write**. Rien d’autre.

Ne mets jamais ce jeton dans un fichier publié ni dans l’adresse d’un dépôt Git.

### c) Héberger le bot gratuitement
N’importe quel hébergeur Node.js qui lance `npm start` convient. Exemple avec un service « Web Service » (Render, Koyeb…) :
- **Dossier racine** : `bot`
- **Commande d’installation** : `npm install`
- **Commande de démarrage** : `npm start`
- **Variables d’environnement** : celles de `bot/.env.example` (jetons Discord et GitHub, `GITHUB_OWNER`, `GITHUB_REPO`, `SITE_URL`…). L’hébergeur fournit souvent `PORT` tout seul.

Les offres gratuites mettent souvent le service en veille quand personne ne l’appelle. Pour le garder éveillé, un service de surveillance gratuit (UptimeRobot par exemple) peut appeler `https://ton-bot…/health` toutes les 5 minutes, si les conditions de l’hébergeur l’autorisent.

### d) Relier le site au bot
Dans `config.js`, mets l’adresse publique du bot :
```js
botApi: "https://nexoria-bot.exemple.com",
```
Publie la modification : le site affiche alors les membres Discord en direct et le statut du serveur Gmod.

### Tester le bot sur ton PC
Copie `bot/.env.example` en `bot/.env`, remplis-le, puis :
```bash
cd bot
```
```bash
npm install
```
```bash
npm start
```

## Commandes Discord

Les commandes de gestion sont réservées aux membres qui ont la permission **Gérer le serveur** (modifiable dans *Paramètres du serveur → Intégrations*).

| Commande | Effet sur le site |
|---|---|
| `/annonce [projet] [image]` | Ouvre un formulaire (titre + texte). Publie l’actu sur le site et dans le salon d’annonces. |
| `/actu-supprimer` | Retire une actualité. |
| `/avancement etape` | Crée ou modifie une étape (terminé / en cours + % / à venir). |
| `/avancement global` | Fixe le pourcentage global d’un projet (`-1` = calcul automatique). |
| `/avancement infos` | Change le statut, la version, la bannière ou l’adresse du serveur de jeu. |
| `/boss ajouter` / `modifier` / `supprimer` | Gère les boss : image, difficulté, statut, progression, mode « mystère » (silhouette). |
| `/statut` | Montre l’état des serveurs de jeu dans Discord. |
| `/site` | Donne le lien du site. |

Si `ANNOUNCE_CHANNEL_ID` est rempli, **tout message posté dans le salon d’annonces apparaît aussi sur le site** (la première ligne devient le titre). Modifier ou supprimer le message le modifie ou le retire du site.

## Ajouter ou modifier un projet

Tout est dans `data/projects.json`. Pour un nouveau projet, copie un bloc existant et change :
- `id` (utilisé dans l’adresse : `#/mon-projet`), `name`, `category` (`jeux`, `applis` ou `bots`) ;
- `accent` : **la couleur du projet** (le site entier prend cette couleur sur sa page) ;
- `logo` (ou `monogram` : 1 ou 2 lettres si tu n’as pas de logo), `banner` ;
- `features`, `videos`, `gallery`, `bosses`, `roadmap`.

Vidéos : un fichier `.mp4` dans `assets/projects/<projet>/`, ou un lien YouTube dans `src`. GitHub refuse les fichiers de plus de 100 Mo : compresse les vidéos avant de les ajouter (les vidéos actuelles font entre 2 et 7 Mo).
