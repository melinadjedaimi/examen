# WebCraft Solutions

Site vitrine pédagogique d'une agence web fictive. Il présente des projets clients et des formations techniques, et propose un parcours d'inscription côté interface.

## Sommaire

- [WebCraft Solutions](#webcraft-solutions)
  - [Sommaire](#sommaire)
  - [Fonctionnalités](#fonctionnalités)
  - [Technologies](#technologies)
  - [Structure du projet](#structure-du-projet)
  - [Lancer le site](#lancer-le-site)
  - [Données et limites](#données-et-limites)
  - [Accessibilité et expérience utilisateur](#accessibilité-et-expérience-utilisateur)
  - [Utilisation de l'intelligence artificielle](#utilisation-de-lintelligence-artificielle)
  - [Pistes d'amélioration](#pistes-damélioration)

## Fonctionnalités

- Page d'accueil avec sections Projets et Formations.
- Chargement des projets et formations depuis une API distante.
- Recherche et filtres par catégorie, technologie et, pour les formations, niveau.
- Fenêtres modales présentant les détails des projets et formations.
- Accès au formulaire d'inscription depuis une formation, avec pré-sélection de celle-ci.
- Validation des champs, messages d'erreur, compteur de caractères et confirmation visuelle.
- États de chargement, messages d'erreur et boutons permettant de réessayer le chargement.
- Mise en page responsive reposant sur la grille Bootstrap.

## Technologies

- HTML5 pour la structure des pages.
- CSS3 pour les styles, les variables visuelles et les animations.
- JavaScript natif pour les interactions, les appels `fetch` et la validation du formulaire.
- Bootstrap 5.3.3 et Bootstrap Icons 1.11.3, chargés depuis jsDelivr.

## Structure du projet

```text
.
├── index.html          # Accueil, projets et formations
├── inscription.html    # Formulaire d'inscription
├── css/
│   └── style.css       # Styles du site
└── js/
    └── main.js         # Chargement des données et interactions
```

## Lancer le site

Le projet ne nécessite ni compilation ni installation de dépendances avec npm. Il faut toutefois une connexion Internet pour charger Bootstrap, ses icônes et les données de l'API.

1. Ouvrir le dossier du projet dans Visual Studio Code.
2. Lancer `index.html` avec une extension de serveur local, par exemple **Live Server**.
3. Ouvrir l'adresse locale indiquée par l'extension, puis utiliser le lien **Inscription** pour accéder au formulaire.

Un serveur local est recommandé : l'ouverture directe en `file://` peut empêcher les requêtes `fetch` vers l'API selon le navigateur.

## Données et limites

Les listes sont récupérées auprès de ces endpoints :

- Projets : `https://webcraft-api.vercel.app/data/projects.json`
- Formations : `https://webcraft-api.vercel.app/data/courses.json`

Le fonctionnement de ces contenus dépend de la disponibilité de l'API et d'une connexion Internet. Si le chargement échoue, le site affiche un message d'erreur et permet de réessayer.

**Le formulaire est une démonstration côté navigateur.** Après validation, il simule un délai puis affiche une confirmation, mais n'envoie ni ne sauvegarde réellement les informations. Aucune inscription n'est transmise à une équipe. Pour un usage réel, il faudrait connecter le formulaire à un serveur, définir le traitement et la conservation des données, et mettre en place une politique de confidentialité effective.

## Accessibilité et expérience utilisateur

Les pages utilisent des titres structurés, des libellés associés aux champs, des textes alternatifs pour les images et des attributs ARIA pour annoncer certains états. Le formulaire donne des retours de validation et la navigation est conçue pour s'adapter aux petits écrans. Ces éléments constituent une base et ne remplacent pas des tests d'accessibilité avec clavier et lecteur d'écran.

## Utilisation de l'intelligence artificielle

Pendant ce projet, je me suis servi de l'IA à comprhendre certaines etapes du projet.J'ai repris ces propositions, je les ai adaptées au site et je dois pouvoir expliquer le fonctionnement du code.

Voici quelques exemples précis des sujets travaillés :

- Dans `js/main.js`, le chargement des projets et des formations avec `fetch` : réfléchir aux états à afficher pendant le chargement et à la façon de montrer une erreur si l'API ne répond pas.
- Toujours dans `js/main.js`, les filtres : organiser la recherche par texte, catégorie et technologie, puis remettre les critères à zéro avec le bouton de réinitialisation.
- Dans `js/main.js`, le formulaire : réfléchir à la validation de l'adresse e-mail et du téléphone et à la longueur minimale de 50 caractères pour le message de motivation et à l'affichage des erreurs près des champs.
- Dans `js/main.js` et `inscription.html`, le lien entre une formation et l'inscription : comprendre comment le paramètre `?formation=` dans l'adresse de la page peut pré-sélectionner la formation choisie.


Ces échanges m'ont aussi amené à réfléchir aux limites du résultat. Par exemple, le formulaire affiche une confirmation, mais `main.js` simule l'envoi : sans serveur, les données ne sont pas réellement transmises. L'IA m'a donc aidé à envisager des solutions et à mieux comprendre le code, mais les choix finaux et la vérification du fonctionnement restent de ma responsabilité.

## Pistes d'amélioration

- Ajouter un backend pour recevoir et traiter réellement les inscriptions.
- Ajouter des tests automatisés pour les filtres et la validation des champs.
- Vérifier l'accessibilité au clavier et avec un lecteur d'écran.
- Remplacer les liens provisoires des mentions légales et de la politique de confidentialité par des pages adaptées au contexte réel.