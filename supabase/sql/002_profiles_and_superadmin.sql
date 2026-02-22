create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role text not null default 'user' check (role in ('user', 'superadmin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_self"
on public.profiles for select
using (auth.uid() = id);

create policy "profiles_update_self"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    coalesce(new.email, ''),
    case
      when lower(coalesce(new.email, '')) = 'design@doimih.net' then 'superadmin'
      else 'user'
    end
  )
  on conflict (id) do update
  set email = excluded.email,
      role = case
        when lower(excluded.email) = 'design@doimih.net' then 'superadmin'
        else public.profiles.role
      end;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;

create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute procedure public.handle_new_user_profile();

insert into public.profiles (id, email, role)
select id, email, case when lower(email) = 'design@doimih.net' then 'superadmin' else 'user' end
from auth.users
on conflict (id) do update
set email = excluded.email,
    role = case
      when lower(excluded.email) = 'design@doimih.net' then 'superadmin'
      else public.profiles.role
    end;

update public.profiles
set role = 'superadmin'
where lower(email) = 'design@doimih.net';