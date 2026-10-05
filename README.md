# FCL.055 Trainer

Application web de révision de la phraséologie aéronautique anglaise pour le FCL.055.
Timer Quiz, clairances IFR et VFR, description de photo, cours par phase de vol, faux amis, examen blanc, suivi de progression.
Aucune dépendance, aucune installation : ce sont des fichiers statiques.

## Structure
- `index.html` : page et styles
- `js/app.js` : moteur de jeux et écrans
- `js/util.js` : voix, correction des réponses
- `js/data-*.js` : contenus (vocabulaire, clairances, photos, faux amis, cours)
- `sw.js` et `manifest.webmanifest` : mode hors ligne et installation sur l'écran d'accueil

## Mettre en ligne
**Option A : GitHub Pages.** Dépôt > Settings > Pages > Source : *GitHub Actions*. Chaque `git push` sur `main` redéploie.
**Option B : Netlify.** Add new site > Import an existing project > GitHub > ce dépôt. Aucun réglage de build. Chaque push redéploie.

## Faire une mise à jour
1. Modifiez les fichiers (par exemple ajoutez des mots dans `js/data-vocab.js`).
2. **Changez le numéro dans `sw.js`** (`const CACHE='fcl055-v2'`, puis v3, etc.). Sans cela, les téléphones gardent l'ancienne version en cache.
3. `git add . && git commit -m "Mise à jour" && git push`

## Ajouter du contenu
- Mots : `js/data-vocab.js`, format `français=anglais;` dans la bonne catégorie.
- Faux amis, franglais, Reformule, Mayday : `js/data-text.js`.
- Modèles de clairances : `js/data-clear.js`, fonctions `add(...)`.
- Photos : `js/data-photos.js`.

## Avertissement
Les messages radio sont des exemples pédagogiques. Fréquences et points de report sont fictifs. Ne pas utiliser pour voler.
