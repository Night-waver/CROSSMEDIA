
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  username     text unique not null,
  bio          text default '',
  avatar_color text default '#00ffff',
  avatar_url   text default null,
  is_admin     boolean default false,
  created_at   timestamptz default now()
);


alter table public.profiles add column if not exists avatar_url text default null;

create table if not exists public.media (
  id          bigserial primary key,
  type        text not null check (type in ('movie','game')),
  title       text not null,
  year        text,
  director    text,
  developer   text,
  duration    text,
  description text,
  image       text,
  created_at  timestamptz default now()
);


create table if not exists public.favorites (
  id         bigserial primary key,
  user_id    uuid references auth.users(id) on delete cascade,
  media_id   bigint references public.media(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, media_id)
);


create table if not exists public.ratings (
  id         bigserial primary key,
  user_id    uuid references auth.users(id) on delete cascade,
  media_id   bigint references public.media(id) on delete cascade,
  stars      int not null check (stars between 1 and 5),
  created_at timestamptz default now(),
  unique(user_id, media_id)
);


create table if not exists public.comments (
  id         bigserial primary key,
  media_id   bigint references public.media(id) on delete cascade,
  user_id    uuid references auth.users(id) on delete cascade,
  username   text not null,
  is_admin   boolean default false,
  text       text not null,
  parent_id  bigint references public.comments(id) on delete cascade,
  likes      int default 0,
  created_at timestamptz default now()
);


create table if not exists public.review_likes (
  id         bigserial primary key,
  comment_id bigint references public.comments(id) on delete cascade,
  user_id    uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique(comment_id, user_id)
);


alter table public.comments add column if not exists parent_id bigint references public.comments(id) on delete cascade;
alter table public.comments add column if not exists likes int default 0;



alter table public.profiles     enable row level security;
alter table public.media        enable row level security;
alter table public.favorites    enable row level security;
alter table public.ratings      enable row level security;
alter table public.comments     enable row level security;
alter table public.review_likes enable row level security;


do $$ declare r record; begin
  for r in (select policyname, tablename from pg_policies where schemaname = 'public') loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;


create policy "profiles_select" on public.profiles for select using (true);
create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);


create policy "media_select" on public.media for select using (true);
create policy "media_insert" on public.media for insert
  with check (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));
create policy "media_update" on public.media for update
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));
create policy "media_delete" on public.media for delete
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));


create policy "favorites_select" on public.favorites for select using (auth.uid() = user_id);
create policy "favorites_insert" on public.favorites for insert with check (auth.uid() = user_id);
create policy "favorites_delete" on public.favorites for delete using (auth.uid() = user_id);


create policy "ratings_select" on public.ratings for select using (auth.uid() = user_id);
create policy "ratings_insert" on public.ratings for insert with check (auth.uid() = user_id);
create policy "ratings_update" on public.ratings for update using (auth.uid() = user_id);


create policy "comments_select" on public.comments for select using (true);
create policy "comments_insert" on public.comments for insert with check (auth.uid() = user_id);
create policy "comments_update" on public.comments for update using (auth.uid() = user_id);
create policy "comments_delete" on public.comments for delete using (
  auth.uid() = user_id or
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);


create policy "review_likes_select" on public.review_likes for select using (true);
create policy "review_likes_insert" on public.review_likes for insert with check (auth.uid() = user_id);
create policy "review_likes_delete" on public.review_likes for delete using (auth.uid() = user_id);


insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars_insert" on storage.objects;
drop policy if exists "avatars_update" on storage.objects;
drop policy if exists "avatars_select" on storage.objects;


create policy "avatars_insert" on storage.objects
  for insert with check (
    bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
  );


create policy "avatars_update" on storage.objects
  for update using (
    bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
  );


create policy "avatars_select" on storage.objects
  for select using (bucket_id = 'avatars');


insert into public.media (type, title, year, director, developer, duration, description)
select * from (values
  ('movie','The Dark Knight',             '2008','Christopher Nolan',    null,                  '2h 32m','Batman faces the Joker, a criminal mastermind who plunges Gotham City into anarchy.'),
  ('game', 'Elden Ring',                  '2022', null,                  'FromSoftware',         '~80h',  'An open-world action RPG set in the Lands Between, forged with George R.R. Martin.'),
  ('movie','Parasite',                    '2019','Bong Joon-ho',          null,                  '2h 12m','A poor family schemes to become employed by a wealthy household, with dark consequences.'),
  ('game', 'God of War',                  '2018', null,                  'Santa Monica Studio',  '~20h',  'Kratos and his son Atreus journey through the Norse realms on a deeply personal quest.'),
  ('game', 'Outer Wilds',                 '2019', null,                  'Mobius Digital',       '~15h',  'Explore a solar system trapped in an endless 22-minute time loop before the sun explodes.'),
  ('movie','Interstellar',                '2014','Christopher Nolan',    null,                  '2h 49m','A team of explorers travel through a wormhole in search of a new home for humanity.'),
  ('game', 'Zelda: Tears of the Kingdom', '2023', null,                  'Nintendo',             '~60h',  'Link sets out to explore the skies and depths of Hyrule in this sprawling adventure.'),
  ('movie','Dune',                        '2021','Denis Villeneuve',     null,                  '2h 35m','A noble family becomes embroiled in a war for control of the desert planet Arrakis.'),
  ('game', 'Cyberpunk 2077',              '2020', null,                  'CD Projekt Red',       '~50h',  'An open-world RPG set in the dystopian Night City where body modification is commonplace.'),
  ('movie','Inception',                   '2010','Christopher Nolan',    null,                  '2h 28m','A thief who enters the dreams of others to steal their deepest secrets.'),
  ('game', 'Hades',                       '2020', null,                  'Supergiant Games',     '~22h',  'Defy the god of the dead as you hack and slash out of the Underworld in this roguelite.'),
  ('movie','The Matrix',                  '1999','Wachowski Sisters',    null,                  '2h 16m','A computer hacker learns about the true nature of reality and his role in the war against its controllers.'),
  ('game', 'Bloodborne',                  '2015', null,                  'FromSoftware',         '~35h',  'Hunt through the nightmare-infested streets of Yharnam, uncovering its dark secrets.'),
  ('movie','Pulp Fiction',                '1994','Quentin Tarantino',    null,                  '2h 34m','The lives of two mob hitmen, a boxer, a gangster and his wife intertwine in four tales.'),
  ('game', 'Sekiro: Shadows Die Twice',   '2019', null,                  'FromSoftware',         '~30h',  'A shinobi fights to restore his master''s honor in war-torn Sengoku Japan.'),
  ('movie','The Godfather',               '1972','Francis Ford Coppola', null,                  '2h 55m','The aging patriarch of an organized crime dynasty transfers control to his reluctant son.'),
  ('game', 'Disco Elysium',               '2019', null,                  'ZA/UM',                '~30h',  'A detective with no memory must solve a murder in a decaying city while rebuilding his identity.'),
  ('movie','Spirited Away',               '2001','Hayao Miyazaki',       null,                  '2h 5m', 'A ten-year-old girl wanders into a mysterious spirit world in this Studio Ghibli masterpiece.'),
  ('game', 'Hollow Knight',               '2017', null,                  'Team Cherry',          '~40h',  'A challenging Metroidvania set in a vast underground kingdom of insects and heroes.'),
  ('movie','Blade Runner 2049',           '2017','Denis Villeneuve',     null,                  '2h 44m','A young blade runner discovers a long-buried secret, leading him to track down Rick Deckard.'),
  ('game', 'Red Dead Redemption 2',       '2018', null,                  'Rockstar Games',       '~60h',  'An epic tale of life in America''s unforgiving heartland, set in 1899.'),
  ('movie','2001: A Space Odyssey',       '1968','Stanley Kubrick',      null,                  '2h 29m','Humanity finds a mysterious object buried beneath the lunar surface and sets off on a quest.'),
  ('game', 'The Witcher 3',               '2015', null,                  'CD Projekt Red',       '~100h', 'As monster hunter Geralt of Rivia, search for your adopted daughter in a vast open world.'),
  ('movie','Whiplash',                    '2014','Damien Chazelle',      null,                  '1h 46m','A young drummer''s dreams are put to the test by a ruthless music conservatory instructor.')
) as v(type,title,year,director,developer,duration,description)
where not exists (select 1 from public.media limit 1);

