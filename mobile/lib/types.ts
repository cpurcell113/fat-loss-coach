export type UserRole = 'coach' | 'client';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  coach_id: string | null;
  onboarding_complete: boolean;
  liability_accepted_at: string | null;
  intake: Record<string, unknown>;
  created_at: string;
}

export interface ClientInvite {
  id: string;
  coach_id: string;
  email: string;
  token: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  expires_at: string;
  client_id: string | null;
  created_at: string;
}

export interface Exercise {
  id: string;
  slug: string;
  name: string;
  muscle_groups: string[];
  equipment: string;
  instructions: string;
  image_url: string | null;
  video_url: string | null;
  category: string;
  level: string;
  source: string;
}

export interface ProgramSession {
  id: string;
  program_id: string;
  name: string;
  day_of_week: number | null;
  sort_order: number;
  notes: string;
  program_exercises?: ProgramExercise[];
}

export interface ProgramExercise {
  id: string;
  session_id: string;
  exercise_id: string;
  sort_order: number;
  target_sets: number;
  target_reps: string;
  target_weight: number | null;
  floor_weight: number | null;
  ceiling_weight: number | null;
  notes: string;
  exercise?: Exercise;
}

export interface Program {
  id: string;
  coach_id: string;
  name: string;
  description: string;
  archetype: string;
  is_template: boolean;
  program_sessions?: ProgramSession[];
}

export interface WorkoutSet {
  id: string;
  workout_id: string;
  exercise_id: string;
  program_exercise_id: string | null;
  set_number: number;
  is_warmup: boolean;
  weight: number | null;
  reps: number | null;
  rpe: number | null;
  suggested_weight: number | null;
  suggested_reps: number | null;
  logged_at: string;
}

export interface Workout {
  id: string;
  client_id: string;
  program_id: string | null;
  session_id: string | null;
  workout_date: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  readiness_score: number | null;
  session_rpe: number | null;
  notes: string;
  started_at: string;
  completed_at: string | null;
  workout_sets?: WorkoutSet[];
}

export interface ReadinessCheckin {
  id: string;
  client_id: string;
  checkin_date: string;
  sleep_hours: number | null;
  sleep_quality: number | null;
  soreness: number | null;
  energy: number | null;
  hrv: number | null;
  readiness_score: number | null;
  notes: string;
}

export interface InvitePreview {
  id: string;
  email: string;
  coach_name: string;
  status: string;
  expires_at: string;
}
