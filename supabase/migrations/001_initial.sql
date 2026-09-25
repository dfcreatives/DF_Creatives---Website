-- Apply with the Supabase SQL editor or `supabase db push`.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin', 'editor')),
  disabled boolean not null default false
);
create table public.content (
  id text primary key,
  kind text not null check (kind in ('page','settings','service','project','testimonial','logo','team','job')),
  slug text not null,
  draft jsonb not null,
  published jsonb,
  version integer not null default 1 check (version > 0),
  updated_at timestamptz not null default now(),
  unique(kind, slug)
);
create table public.revisions (
  id uuid primary key default gen_random_uuid(),
  content_id text not null references public.content(id) on delete cascade,
  data jsonb not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);
create index revisions_content on public.revisions(content_id, created_at desc);
create table public.media (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  path text not null unique,
  name text not null,
  alt text not null default '',
  focal_x numeric not null default 50 check (focal_x between 0 and 100),
  focal_y numeric not null default 50 check (focal_y between 0 and 100),
  created_at timestamptz not null default now()
);
create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('enquiry','application')),
  name text not null,
  email text not null,
  service text,
  budget text,
  message text not null,
  job_id text references public.content(id) on delete set null,
  resume_path text,
  portfolio text,
  status text not null default 'new' check (status in ('new','in_progress','completed','archived')),
  notes text not null default '',
  notification_status text not null default 'pending' check (notification_status in ('pending','not_configured','failed','sent')),
  created_at timestamptz not null default now()
);
create index submissions_status on public.submissions(status, created_at desc);
-- The Node API is the only content/write surface. This prevents direct REST access
-- from leaking draft columns, allowing self-assigned roles, or bypassing workflow.
alter table public.profiles enable row level security;
alter table public.content enable row level security;
alter table public.revisions enable row level security;
alter table public.media enable row level security;
alter table public.submissions enable row level security;
revoke all on public.profiles, public.content, public.revisions, public.media, public.submissions from anon, authenticated;
grant all on public.profiles, public.content, public.revisions, public.media, public.submissions to service_role;
-- Publish and revision capture are atomic, and independently require an active admin.
create or replace function public.publish_content(content_id text, expected_version integer, new_published jsonb, actor_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare current_row public.content; result public.content;
begin
 if not exists(select 1 from public.profiles where id=actor_id and role='admin' and not disabled) then
   raise exception 'Admin access required';
 end if;
 select * into current_row from public.content where id=content_id for update;
 if not found then raise exception 'Content not found'; end if;
 if current_row.version <> expected_version then raise exception 'Content changed. Reload before publishing.'; end if;
 if (new_published->>'sample')::boolean is true then raise exception 'Sample content cannot be published'; end if;
 if current_row.published is not null then
   insert into public.revisions(content_id,data,created_by) values(current_row.id,current_row.published,actor_id);
 end if;
 update public.content set published=new_published,version=version+1,updated_at=now() where id=current_row.id returning * into result;
 return to_jsonb(result);
end;
$$;
revoke all on function public.publish_content(text,integer,jsonb,uuid) from public, anon, authenticated;
grant execute on function public.publish_content(text,integer,jsonb,uuid) to service_role;
-- Public marketing assets; résumés have no public URL. All writes and signed
-- résumé links go through authenticated API endpoints using the service role.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('media','media',true,8388608,array['image/webp']),
 ('resumes','resumes',false,5242880,array['application/pdf'])
on conflict(id) do nothing;
