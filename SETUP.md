# CROSSMEDIA — Guide de configuration Supabase

## Étape 1 — Créer un projet Supabase gratuit

1. Allez sur https://supabase.com → inscrivez-vous 
2. Cliquez sur **New Project**, donnez-lui un nom, définissez un mot de passe, choisissez une région
3. Attendez environ 2 minutes pour que le projet soit prêt

---

## Étape 2 — Exécuter le schéma de la base de données

1. Dans le tableau de bord Supabase → **SQL Editor** → **New query**
2. Ouvrez `schema.sql`, copiez TOUT, collez-le, puis cliquez sur **Run**
3. Vous devriez voir "Success" — les tables, règles de sécurité et 24 éléments initiaux sont créés

> Si vous avez déjà exécuté un ancien schéma, lancez simplement le nouveau — il supprime et recrée tout en toute sécurité.

---

## Étape 3 — Récupérer vos identifiants

Allez dans **Project Settings** → **API** et copiez :

- **Project URL** → ressemble à `https://abcdefghijkl.supabase.co`
- **anon / public key** → longue chaîne commençant par `eyJ...`

---

## Étape 4 — Les ajouter dans db.js

Ouvrez `db.js` et remplacez les deux lignes en haut :

```js
const SUPABASE_URL      = 'https://VOTRE-PROJET.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

---

## Étape 5 — Désactiver la confirmation par email (OBLIGATOIRE)

Le site utilise de faux emails comme `username@crossmedia.local` pour éviter
d’avoir besoin d’une vraie boîte mail. La confirmation doit être désactivée sinon l’inscription échoue.

1. Tableau de bord Supabase → **Authentication** → **Providers** → **Email**
2. Désactivez **"Confirm email"**
3. Enregistrez

---

## Étape 6 — Upload vers votre hébergeur

Téléversez les fichiers sur Neocities (ou autre hébergeur) :

- `index.html`
- `db.js`

---

## Étape 7 — Vous mettre admin

1. Créez votre compte normalement sur le site
2. Allez dans Supabase → **Table Editor** → **profiles**
3. Trouvez votre ligne, cliquez sur la cellule `is_admin` → mettez `true` → Enregistrer
4. Déconnectez-vous puis reconnectez-vous — vous verrez le panneau Admin

---

## Dépannage

**"Registration failed"** → Vérifiez l’étape 5 (confirmation email désactivée)

**"Invalid username or password"** → Même problème ou vérifiez si l’email est confirmé dans Auth → Users

**Grille vide** → Exécutez `select count(*) from media;` dans SQL Editor. Si 0, relancez `schema.sql`

**Admin ne peut pas ajouter du contenu** → Vérifiez que `is_admin = true` dans la table profiles ET reconnectez-vous après modification

**Commentaires affichent "Just now"** → Anciens commentaires sans timestamp — les nouveaux afficheront la bonne date
