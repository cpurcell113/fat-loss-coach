-- Demo program for a coach's first client
-- Replace placeholders before running:
--   :coach_id  — UUID from auth.users / profiles where role = 'coach'
--   :client_id — UUID from profiles where role = 'client'

-- Example: assign a 3-day strength split with barbell main lifts

with new_program as (
  insert into public.programs (coach_id, name, description, archetype, is_template)
  values (
    :coach_id,
    'Foundation Strength Block',
    'Track A demo — bounded auto-progression on main lifts',
    'strength',
    false
  )
  returning id
),
session_a as (
  insert into public.program_sessions (program_id, name, day_of_week, sort_order)
  select id, 'Strength A', 1, 1 from new_program
  returning id, program_id
),
session_b as (
  insert into public.program_sessions (program_id, name, day_of_week, sort_order)
  select id, 'Strength B', 3, 2 from new_program
  returning id, program_id
),
session_c as (
  insert into public.program_sessions (program_id, name, day_of_week, sort_order)
  select id, 'Strength C', 5, 3 from new_program
  returning id, program_id
)
insert into public.client_programs (client_id, program_id, assigned_by, active)
select :client_id, np.id, :coach_id, true from new_program np;

-- Link exercises (requires seed.sql loaded first)
insert into public.program_exercises (session_id, exercise_id, sort_order, target_sets, target_reps, target_weight, floor_weight, ceiling_weight)
select sa.id, e.id, 1, 4, '5', 185, 135, 225
from session_a sa, public.exercises e where e.slug = 'barbell-squat';

insert into public.program_exercises (session_id, exercise_id, sort_order, target_sets, target_reps, target_weight, floor_weight, ceiling_weight)
select sa.id, e.id, 2, 3, '8-10', 135, 95, 185
from session_a sa, public.exercises e where e.slug = 'barbell-bench-press';

insert into public.program_exercises (session_id, exercise_id, sort_order, target_sets, target_reps, target_weight, floor_weight, ceiling_weight)
select sb.id, e.id, 1, 4, '5', 225, 185, 315
from session_b sb, public.exercises e where e.slug = 'barbell-deadlift';

insert into public.program_exercises (session_id, exercise_id, sort_order, target_sets, target_reps, target_weight, floor_weight, ceiling_weight)
select sb.id, e.id, 2, 3, '8-12', 50, 25, 70
from session_b sb, public.exercises e where e.slug = 'dumbbell-shoulder-press';

insert into public.program_exercises (session_id, exercise_id, sort_order, target_sets, target_reps, target_weight, floor_weight, ceiling_weight)
select sc.id, e.id, 1, 3, '8-10', 155, 115, 205
from session_c sc, public.exercises e where e.slug = 'barbell-row';
