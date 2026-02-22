create extension if not exists "uuid-ossp";

create table if not exists public.projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.notes (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '',
  content text not null default '',
  tags text[] not null default '{}',
  pos_x double precision not null default 0,
  pos_y double precision not null default 0,
  width double precision not null default 240,
  height double precision not null default 160,
  color text not null default '#fef08a',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.connections (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  note_id_from uuid not null references public.notes(id) on delete cascade,
  note_id_to uuid not null references public.notes(id) on delete cascade,
  type text not null check (type in ('line', 'arrow')),
  created_at timestamptz not null default now()
);

create table if not exists public.attachments (
  id uuid primary key default uuid_generate_v4(),
  note_id uuid not null references public.notes(id) on delete cascade,
  file_url text not null,
  type text not null check (type in ('image', 'link')),
  created_at timestamptz not null default now()
);

create index if not exists idx_projects_user_id on public.projects(user_id);
create index if not exists idx_notes_project_id on public.notes(project_id);
create index if not exists idx_notes_user_id on public.notes(user_id);
create index if not exists idx_notes_updated_at on public.notes(updated_at);
create index if not exists idx_connections_project_id on public.connections(project_id);
create index if not exists idx_attachments_note_id on public.attachments(note_id);

alter table public.projects enable row level security;
alter table public.notes enable row level security;
alter table public.connections enable row level security;
alter table public.attachments enable row level security;

create policy "projects_select_own"
on public.projects for select
using (auth.uid() = user_id);

create policy "projects_insert_own"
on public.projects for insert
with check (auth.uid() = user_id);

create policy "projects_update_own"
on public.projects for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "projects_delete_own"
on public.projects for delete
using (auth.uid() = user_id);

create policy "notes_select_own"
on public.notes for select
using (auth.uid() = user_id);

create policy "notes_insert_own"
on public.notes for insert
with check (auth.uid() = user_id);

create policy "notes_update_own"
on public.notes for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "notes_delete_own"
on public.notes for delete
using (auth.uid() = user_id);

create policy "connections_select_own"
on public.connections for select
using (
  exists (
    select 1 from public.projects p
    where p.id = connections.project_id
      and p.user_id = auth.uid()
  )
);

create policy "connections_insert_own"
on public.connections for insert
with check (
  exists (
    select 1 from public.projects p
    where p.id = connections.project_id
      and p.user_id = auth.uid()
  )
);

create policy "connections_update_own"
on public.connections for update
using (
  exists (
    select 1 from public.projects p
    where p.id = connections.project_id
      and p.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.projects p
    where p.id = connections.project_id
      and p.user_id = auth.uid()
  )
);

create policy "connections_delete_own"
on public.connections for delete
using (
  exists (
    select 1 from public.projects p
    where p.id = connections.project_id
      and p.user_id = auth.uid()
  )
);

create policy "attachments_select_own"
on public.attachments for select
using (
  exists (
    select 1
    from public.notes n
    where n.id = attachments.note_id
      and n.user_id = auth.uid()
  )
);

create policy "attachments_insert_own"
on public.attachments for insert
with check (
  exists (
    select 1
    from public.notes n
    where n.id = attachments.note_id
      and n.user_id = auth.uid()
  )
);

create policy "attachments_update_own"
on public.attachments for update
using (
  exists (
    select 1
    from public.notes n
    where n.id = attachments.note_id
      and n.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.notes n
    where n.id = attachments.note_id
      and n.user_id = auth.uid()
  )
);

create policy "attachments_delete_own"
on public.attachments for delete
using (
  exists (
    select 1
    from public.notes n
    where n.id = attachments.note_id
      and n.user_id = auth.uid()
  )
);