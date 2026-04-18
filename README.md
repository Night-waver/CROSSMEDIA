# 🎬🎮 CROSSMEDIA

> Découvrez, notez et suivez vos films et jeux préférés. Construisez votre collection personnelle.

![Stack](https://img.shields.io/badge/Stack-HTML%20%2F%20JS%20%2F%20Supabase-00e5ff?style=flat-square)
![License](https://img.shields.io/badge/Licence-MIT-ff2d6b?style=flat-square)

---

##  Fonctionnalités

-  **Catalogue** — Parcourez et filtrez films et jeux vidéo
-  **Notation** — Notez chaque œuvre sur 5 étoiles
-  **Favoris** — Créez votre liste personnelle
-  **Avis** — Rédigez des critiques, répondez aux commentaires, likez les avis
-  **Profil** — Avatar personnalisable, bio, historique de notations et d'avis
-  **Admin** — Panneau d'administration pour gérer la médiathèque (ajout, édition, suppression)

---

##  Installation

### Prérequis

- Un compte [Supabase](https://supabase.com) (gratuit, sans carte bancaire)
- Un hébergeur statique (ex. [Neocities](https://neocities.org), GitHub Pages, etc.)

### Étapes

1. **Créez un projet Supabase** et notez votre **Project URL** et votre **clé anon/publique**

2. **Initialisez la base de données** — Dans l'éditeur SQL de Supabase, collez et exécutez le contenu de `schema.sql`

3. **Configurez les identifiants** — Ouvrez `db.js` et renseignez vos propres valeurs :
   ```js
   const SUPABASE_URL      = 'https://VOTRE-PROJET.supabase.co';
   const SUPABASE_ANON_KEY = 'eyJ...';
   ```

4. **Désactivez la confirmation d'e-mail** — Dans Supabase : *Authentication → Providers → Email → désactivez "Confirm email"*

5. **Déployez** — Uploadez `index.html` et `db.js` sur votre hébergeur

6. **Devenez admin** — Inscrivez-vous sur le site, puis dans Supabase passez `is_admin` à `true` dans la table `profiles`

>  Consultez [`SETUP.md`](./SETUP.md) pour un guide détaillé avec résolution des erreurs courantes.

---

##  Structure du projet

```
CROSSMEDIA/
├── index.html     # Application complète (interface + logique)
├── db.js          # Connexion Supabase, auth, requêtes BDD
├── schema.sql     # Schéma PostgreSQL + données de démarrage (24 entrées)
└── SETUP.md       # Guide d'installation pas à pas
```

---

##  Stack technique

| Composant | Technologie |
|---|---|
| Frontend | HTML / CSS / JavaScript vanilla |
| Base de données | [Supabase](https://supabase.com) (PostgreSQL) |
| Authentification | Supabase Auth |
| Stockage avatars | Supabase Storage |
| Posters films | [TMDB API](https://www.themoviedb.org/documentation/api) |
| Couvertures jeux | [RAWG API](https://rawg.io/apidocs) |

---

##  Sécurité

La base de données est protégée par des politiques **Row Level Security (RLS)** : chaque utilisateur n'accède qu'à ses propres données. Seuls les administrateurs peuvent modifier la médiathèque.

---

##  Licence

Ce projet est distribué sous licence MIT. Libre à vous de le modifier et le redistribuer.
