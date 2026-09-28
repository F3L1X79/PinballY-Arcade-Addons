# PinballY Arcade Add-ons

*[English version](README.md)*

Une sélection soignée d'add-ons JavaScript pour [PinballY](http://mjrnet.org/pinscape/PinballY.php) qui donnent à une borne de flipper virtuel un air de machine d'arcade. Du JavaScript exécuté tel quel par PinballY : aucune étape de build, aucune dépendance.

## Fonctionnalités

- **Dialogue de démarrage** : rester sur la dernière table jouée, ou lancer la table du jour, la table de la semaine ou une table au hasard.
- **Table du jour** (jamais jouée, ou à défaut jouée il y a le plus longtemps) et **table de la semaine** (au hasard, du lundi au dimanche).
- **Table au hasard** : une animation « roue de la fortune », jamais la dernière table jouée.
- **Entrées du menu principal** après « Jouer » : Changer de joueur (un carrousel d'Avatars piloté par les flippers, aussi dans le menu Quitter et en deuxième choix du dialogue de démarrage ; l'Avatar et le nom du Profile actif restent en haut à droite de l'écran de la roue ; choisir un Profile accueille le joueur, et démarrer PinballY aussi quand le dialogue de démarrage est désactivé), Succès personnels, Configuration de la table, table au hasard, table du jour, table de la semaine.
- **Filtre « Tables Originales »** dans « Filtrer par fabricant » : toutes les tables sauf celles de la communauté.
- **Filtre « Hall of Fame »** dans le menu principal : vos dix tables les plus jouées, classées par temps de jeu.
- **Horloge** en haut à gauche de l'écran de la roue, au format de votre langue (cachée pendant une partie).
- **Succès**, chacun annoncé une fois par une petite carte en bas à droite de l'écran du plateau, qui disparaît toute seule (jamais pendant une partie ; plusieurs cartes s'empilent, avec un son facultatif), et consultables par famille dans « Succès personnels » :
  - collection : première table, puis de 10 à 100 % de la collection jouée ;
  - temps de jeu : de 1 à 100 heures ;
  - tables du jour et de la semaine : première partie, total de jours ou de semaines joués, séries ;
  - sessions : marathon de 30 ou 60 minutes, rage quit (une session de 30 secondes à moins d'une minute), grand retour après 31 jours ;
  - table au hasard : 10, 50 et 100 tables au hasard jouées ;
  - fabricants : 3, 5 ou 8 fabricants différents joués le même jour, complétion d'un fabricant ;
  - complétion d'une décennie ou d'une catégorie.
- **Interface** : PinballY traduit en français, allemand, espagnol, italien ou portugais ; une ligne d'état sur la table sélectionnée ; un rappel pour noter une table après 60 minutes de jeu.
- **Lancement** : pas de flash noir entre la roue et la table, un son de lancement optionnel, le backglass masqué pendant une partie.

## Installation

Nécessite **Windows** et **PinballY 1.1.0 Beta 10** ou plus récent (plus la fonctionnalité facultative *Lecteur Windows Media*, pour les sons de lancement et de succès uniquement).

1. **Sauvegardez** `PinballY\Scripts`, en particulier `main.js` : ce projet le remplace.
2. **Copiez le projet** dans `PinballY\Scripts`, en gardant votre dossier `System`.
3. **Copiez `.env.example` en `.env.local`** et réglez ce qu'il vous faut, un `CLÉ=valeur` par ligne (UTF-8). Les réglages absents gardent leur valeur par défaut ; `.env.local` est ignoré par git.
4. **Redémarrez PinballY** et consultez `PinballY.log` : il liste vos réglages, une ligne « initialized » par add-on, et des lignes `ERROR` qui désignent l'add-on en cause.

| Réglage | Défaut | Rôle |
|---|---|---|
| `LANGUAGE` | `en` | `en`, `fr`, `de`, `es`, `it` ou `pt`. |
| `LAUNCH_SOUND_FILE` | vide | Chemin complet du son de lancement, par exemple `C:\PinballY\Media\Sounds\launch.mp3`. |
| `ACHIEVEMENT_SOUND_FILE` | vide | Chemin complet d'un son joué avec chaque carte de succès. |
| `PROFILE_GREETING_SOUND_FILE` | vide | Chemin complet d'un son joué quand un joueur est accueilli. |
| `COMMUNITY_TABLES_MANUFACTURER` | `VPX Community` | Nom de fabricant de vos tables de la communauté. |
| `SKIP_RANDOM_GAME_ANIMATION` | `false` | `true` saute l'animation de la roue. |
| `ASK_TO_RATE_AFTER_MINUTES_PLAYED` | `60` | Temps de jeu avant le rappel de notation. |
| `ACHIEVEMENT_TOAST_SECONDS` | `4` | Secondes pendant lesquelles une carte de succès reste pleinement visible (plus de 0, au plus 60). |
| `ACHIEVEMENT_TOAST_SCALE` | `1.0` | Taille d'une carte de succès : `1` = taille d'origine, `2` = deux fois plus grande (de 0,5 à 3, avec un point : `1.6`). |
| `ADD_ON_<NOM>` | `true` | `false` désactive un add-on, par exemple `ADD_ON_FORCE_BACKGLASS=false`. |

## Votre progression

La progression de chaque Profil est enregistrée dans le dossier `profiles`, à côté de `main.js`, que les mises à jour du projet n'écrasent jamais.

## Contribuer

Organisation du code, conventions, tests, ajout d'une langue et remise à zéro de la progression : voir le [guide du contributeur](CONTRIBUTING.md) (en anglais).

## Licence

MIT. Voir [LICENSE](LICENSE).
