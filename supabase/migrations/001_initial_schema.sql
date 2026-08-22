-- All In coaching platform — Track A foundation
-- Run via Supabase CLI: supabase db push

create extension if not exists "pgcrypto";

-- ─── Profiles ────────────────────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  role text not null check (role in ('coach', 'client')),
  coach_id uuid references public.profiles (id),
  onboarding_complete boolean not null default false,
  liability_accepted_at timestamptz,
  intake jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_coach_id_idx on public.profiles (coach_id);
create index profiles_role_idx on public.profiles (role);

-- ─── Client invites (coach-gated roster) ─────────────────────────────────────
create table public.client_invites (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles (id) on delete cascade,
  email text not null,
  token text not null unique,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'expired', 'revoked')),
  expires_at timestamptz not null,
  client_id uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create index client_invites_token_idx on public.client_invites (token);
create index client_invites_coach_id_idx on public.client_invites (coach_id);

-- ─── Exercise library ────────────────────────────────────────────────────────
create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  muscle_groups text[] not null default '{}',
  equipment text not null default 'none',
  instructions text not null default '',
  image_url text,
  video_url text,
  category text not null default 'strength',
  level text not null default 'beginner',
  source text not null default 'exercise-db',
  coach_id uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create index exercises_name_idx on public.exercises using gin (to_tsvector('english', name));
create index exercises_muscle_groups_idx on public.exercises using gin (muscle_groups);

-- ─── Programs ──────────────────────────────────────────────────────────────────
create table public.programs (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  description text not null default '',
  archetype text not null default 'balance'
    check (archetype in ('strength', 'fat_loss', 'longevity', 'balance')),
  is_template boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.program_sessions (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs (id) on delete cascade,
  name text not null,
  day_of_week int check (day_of_week between 0 and 6),
  sort_order int not null default 0,
  notes text not null default ''
);

create table public.program_exercises (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.program_sessions (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id),
  sort_order int not null default 0,
  target_sets int not null default 3,
  target_reps text not null default '8-10',
  target_weight numeric(8, 2),
  floor_weight numeric(8, 2),
  ceiling_weight numeric(8, 2),
  notes text not null default ''
);

-- ─── Client program assignments ──────────────────────────────────────────────
create table public.client_programs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  program_id uuid not null references public.programs (id) on delete cascade,
  assigned_by uuid not null references public.profiles (id),
  active boolean not null default true,
  started_at timestamptz not null default now(),
  unique (client_id, program_id)
);

-- ─── Readiness check-ins ─────────────────────────────────────────────────────
create table public.readiness_checkins (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  checkin_date date not null default current_date,
  sleep_hours numeric(4, 1),
  sleep_quality int check (sleep_quality between 1 and 5),
  soreness int check (soreness between 1 and 10),
  energy int check (energy between 1 and 10),
  hrv numeric(8, 2),
  readiness_score int check (readiness_score between 0 and 100),
  notes text not null default '',
  created_at timestamptz not null default now(),
  unique (client_id, checkin_date)
);

-- ─── Workout logging ─────────────────────────────────────────────────────────
create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  program_id uuid references public.programs (id),
  session_id uuid references public.program_sessions (id),
  workout_date date not null default current_date,
  status text not null default 'in_progress'
    check (status in ('in_progress', 'completed', 'abandoned')),
  readiness_score int,
  session_rpe int check (session_rpe between 1 and 10),
  notes text not null default '',
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id),
  program_exercise_id uuid references public.program_exercises (id),
  set_number int not null,
  is_warmup boolean not null default false,
  weight numeric(8, 2),
  reps int,
  rpe numeric(3, 1) check (rpe between 1 and 10),
  suggested_weight numeric(8, 2),
  suggested_reps int,
  logged_at timestamptz not null default now()
);

create index workouts_client_date_idx on public.workouts (client_id, workout_date desc);
create index workout_sets_workout_idx on public.workout_sets (workout_id, set_number);

-- ─── Updated-at trigger ──────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger programs_updated_at before update on public.programs
  for each row execute function public.set_updated_at();

-- ─── Auth: auto-create profile ───────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  user_role text;
  invite_token text;
  invite_row public.client_invites%rowtype;
begin
  user_role := coalesce(new.raw_user_meta_data->>'role', 'client');
  invite_token := new.raw_user_meta_data->>'invite_token';

  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    user_role
  );

  if invite_token is not null then
    select * into invite_row
    from public.client_invites
    where token = invite_token
      and status = 'pending'
      and expires_at > now()
    for update;

    if found then
      update public.profiles
      set coach_id = invite_row.coach_id
      where id = new.id;

      update public.client_invites
      set status = 'accepted', client_id = new.id
      where id = invite_row.id;
    end if;
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Invite helpers ──────────────────────────────────────────────────────────
create or replace function public.create_client_invite(p_email text)
returns public.client_invites language plpgsql security definer set search_path = public as $$
declare
  coach_profile public.profiles%rowtype;
  new_invite public.client_invites;
begin
  select * into coach_profile from public.profiles where id = auth.uid();
  if coach_profile.role <> 'coach' then
    raise exception 'Only coaches can create invites';
  end if;

  insert into public.client_invites (coach_id, email, token, expires_at)
  values (
    auth.uid(),
    lower(trim(p_email)),
    encode(gen_random_bytes(24), 'hex'),
    now() + interval '14 days'
  )
  returning * into new_invite;

  return new_invite;
end;
$$;

create or replace function public.get_invite_by_token(p_token text)
returns table (
  id uuid,
  email text,
  coach_name text,
  status text,
  expires_at timestamptz
) language sql security definer set search_path = public as $$
  select
    ci.id,
    ci.email,
    coalesce(p.full_name, 'Your coach') as coach_name,
    ci.status,
    ci.expires_at
  from public.client_invites ci
  join public.profiles p on p.id = ci.coach_id
  where ci.token = p_token;
$$;

-- ─── Row Level Security ──────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.client_invites enable row level security;
alter table public.exercises enable row level security;
alter table public.programs enable row level security;
alter table public.program_sessions enable row level security;
alter table public.program_exercises enable row level security;
alter table public.client_programs enable row level security;
alter table public.readiness_checkins enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_sets enable row level security;

-- Profiles
create policy "Users read own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Coaches read their clients" on public.profiles
  for select using (
    exists (
      select 1 from public.profiles coach
      where coach.id = auth.uid() and coach.role = 'coach' and profiles.coach_id = coach.id
    )
  );
create policy "Users update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Invites
create policy "Coaches manage invites" on public.client_invites
  for all using (coach_id = auth.uid());
create policy "Anyone can read invite by token" on public.client_invites
  for select using (true);

-- Exercises (global read)
create policy "Authenticated users read exercises" on public.exercises
  for select to authenticated using (true);
create policy "Coaches insert custom exercises" on public.exercises
  for insert to authenticated with check (
    coach_id = auth.uid() and exists (
      select 1 from public.profiles where id = auth.uid() and role = 'coach'
    )
  );

-- Programs
create policy "Coaches manage own programs" on public.programs
  for all using (coach_id = auth.uid());
create policy "Clients read assigned programs" on public.programs
  for select using (
    exists (
      select 1 from public.client_programs cp
      where cp.program_id = programs.id and cp.client_id = auth.uid() and cp.active
    )
  );

create policy "Coaches manage program sessions" on public.program_sessions
  for all using (
    exists (select 1 from public.programs p where p.id = program_sessions.program_id and p.coach_id = auth.uid())
  );
create policy "Clients read assigned program sessions" on public.program_sessions
  for select using (
    exists (
      select 1 from public.client_programs cp
      join public.programs p on p.id = cp.program_id
      where p.id = program_sessions.program_id and cp.client_id = auth.uid() and cp.active
    )
  );

create policy "Coaches manage program exercises" on public.program_exercises
  for all using (
    exists (
      select 1 from public.program_sessions ps
      join public.programs p on p.id = ps.program_id
      where ps.id = program_exercises.session_id and p.coach_id = auth.uid()
    )
  );
create policy "Clients read assigned program exercises" on public.program_exercises
  for select using (
    exists (
      select 1 from public.program_sessions ps
      join public.client_programs cp on cp.program_id = ps.program_id
      where ps.id = program_exercises.session_id and cp.client_id = auth.uid() and cp.active
    )
  );

create policy "Coaches manage client programs" on public.client_programs
  for all using (assigned_by = auth.uid());
create policy "Clients read own program assignments" on public.client_programs
  for select using (client_id = auth.uid());

create policy "Clients manage own checkins" on public.readiness_checkins
  for all using (client_id = auth.uid());
create policy "Coaches read client checkins" on public.readiness_checkins
  for select using (
    exists (select 1 from public.profiles c where c.id = readiness_checkins.client_id and c.coach_id = auth.uid())
  );

create policy "Clients manage own workouts" on public.workouts
  for all using (client_id = auth.uid());
create policy "Coaches read client workouts" on public.workouts
  for select using (
    exists (select 1 from public.profiles c where c.id = workouts.client_id and c.coach_id = auth.uid())
  );

create policy "Clients manage own workout sets" on public.workout_sets
  for all using (
    exists (select 1 from public.workouts w where w.id = workout_sets.workout_id and w.client_id = auth.uid())
  );
create policy "Coaches read client workout sets" on public.workout_sets
  for select using (
    exists (
      select 1 from public.workouts w
      join public.profiles c on c.id = w.client_id
      where w.id = workout_sets.workout_id and c.coach_id = auth.uid()
    )
  );
