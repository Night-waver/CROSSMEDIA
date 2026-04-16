# CROSSMEDIA — Supabase Setup Guide

## Step 1 — Create a free Supabase project

1. Go to https://supabase.com → sign up (free, no credit card)
2. Click **New Project**, give it a name, set a password, pick a region
3. Wait ~2 minutes for it to spin up

---

## Step 2 — Run the database schema

1. In Supabase dashboard → **SQL Editor** → **New query**
2. Open `schema.sql`, copy ALL of it, paste it in, click **Run**
3. You should see "Success" — the tables, security rules, and 24 starter items are created

> If you already ran the old schema, just run the new one — it drops and recreates all policies safely.

---

## Step 3 — Get your credentials

Go to **Project Settings** → **API** and copy:
- **Project URL** → looks like `https://abcdefghijkl.supabase.co`
- **anon / public key** → long string starting with `eyJ...`

---

## Step 4 — Put them in db.js

Open `db.js` and replace the two lines at the top:

```js
const SUPABASE_URL      = 'https://YOUR-PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

---

## Step 5 — Disable email confirmation (REQUIRED)

The site uses fake emails like `username@crossmedia.local` to avoid
needing a real inbox. Email confirmation must be off or registration fails.

1. Supabase dashboard → **Authentication** → **Providers** → **Email**
2. Toggle **"Confirm email"** → OFF
3. Save

---

## Step 6 — Upload to your host

Upload both files to Neocities (or any host):
- `index.html`
- `db.js`

---

## Step 7 — Make yourself admin

1. Register your account on the site normally
2. Go to Supabase → **Table Editor** → **profiles**
3. Find your row, click the `is_admin` cell → set to `true` → Save
4. Log out and back in — you'll see the Admin panel

---

## Troubleshooting

**"Registration failed"** → Step 5 (email confirmation must be OFF)

**"Invalid username or password"** → Same as above, or check the email was confirmed in Auth → Users

**Media grid empty** → Run `select count(*) from media;` in SQL Editor. If 0, re-run schema.sql

**Admin can't add media** → Make sure `is_admin = true` in profiles table AND you re-logged in after setting it

**Comments show "Just now"** → Old comments without timestamps — new ones will show correct dates
