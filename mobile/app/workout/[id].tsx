import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getSupabase } from '@/lib/supabase';
import { parseTargetReps, suggestNextSet, type SetLog } from '@/lib/progression';
import { readinessMultiplier } from '@/lib/readiness';
import type { ProgramExercise, Workout, WorkoutSet } from '@/lib/types';
import { Button, Card, Input, Screen, Title } from '@/components/ui';
import { theme } from '@/constants/theme';

export default function WorkoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [exercises, setExercises] = useState<ProgramExercise[]>([]);
  const [sets, setSets] = useState<WorkoutSet[]>([]);
  const [activeExerciseIdx, setActiveExerciseIdx] = useState(0);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [rpe, setRpe] = useState('8');
  const [isWarmup, setIsWarmup] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const supabase = getSupabase();
    const { data: workoutRow } = await supabase.from('workouts').select('*').eq('id', id).single();
    const workoutData = workoutRow as Workout;
    setWorkout(workoutData);

    if (workoutData.session_id) {
      const { data: programExercises } = await supabase
        .from('program_exercises')
        .select('*, exercise:exercises(*)')
        .eq('session_id', workoutData.session_id)
        .order('sort_order');
      setExercises((programExercises as ProgramExercise[]) ?? []);
    }

    const { data: setRows } = await supabase.from('workout_sets').select('*').eq('workout_id', id).order('set_number');
    setSets((setRows as WorkoutSet[]) ?? []);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const activeExercise = exercises[activeExerciseIdx];
  const exerciseSets = useMemo(
    () => sets.filter((s) => s.exercise_id === activeExercise?.exercise_id),
    [sets, activeExercise?.exercise_id],
  );

  const suggestion = useMemo(() => {
    if (!activeExercise) return null;
    const targetReps = parseTargetReps(activeExercise.target_reps);
    const previous = exerciseSets[exerciseSets.length - 1];
    const prevLog: SetLog | null =
      previous?.weight && previous.reps && previous.rpe
        ? { weight: previous.weight, reps: previous.reps, rpe: previous.rpe, isWarmup: previous.is_warmup }
        : null;
    const multiplier = readinessMultiplier(workout?.readiness_score ?? 70);
    return suggestNextSet(prevLog, targetReps, {
      floor: activeExercise.floor_weight,
      ceiling: activeExercise.ceiling_weight,
    }, multiplier);
  }, [activeExercise, exerciseSets, workout?.readiness_score]);

  useEffect(() => {
    if (suggestion) {
      setWeight(String(suggestion.weight));
      setReps(String(suggestion.reps));
    }
  }, [suggestion?.weight, suggestion?.reps, activeExerciseIdx]);

  const logSet = async () => {
    if (!workout || !activeExercise) return;
    const setNumber = exerciseSets.length + 1;
    const payload = {
      workout_id: workout.id,
      exercise_id: activeExercise.exercise_id,
      program_exercise_id: activeExercise.id,
      set_number: setNumber,
      is_warmup: isWarmup,
      weight: parseFloat(weight) || null,
      reps: parseInt(reps, 10) || null,
      rpe: parseFloat(rpe) || null,
      suggested_weight: suggestion?.weight ?? null,
      suggested_reps: suggestion?.reps ?? null,
    };
    const { data, error } = await getSupabase().from('workout_sets').insert(payload).select().single();
    if (error) return;
    setSets((prev) => [...prev, data as WorkoutSet]);
    setIsWarmup(false);
  };

  const completeWorkout = async () => {
    if (!workout) return;
    await getSupabase()
      .from('workouts')
      .update({ status: 'completed', completed_at: new Date().toISOString(), session_rpe: parseInt(rpe, 10) })
      .eq('id', workout.id);
  };

  if (loading || !workout) {
    return (
      <Screen style={styles.center}>
        <ActivityIndicator color={theme.gold} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Title>Active workout</Title>
        <Text style={styles.meta}>{activeExercise?.exercise?.name ?? 'Select exercise'}</Text>

        <View style={styles.exerciseTabs}>
          {exercises.map((ex, idx) => (
            <Text
              key={ex.id}
              onPress={() => setActiveExerciseIdx(idx)}
              style={[styles.tab, idx === activeExerciseIdx && styles.tabActive]}
            >
              {idx + 1}
            </Text>
          ))}
        </View>

        <Card style={styles.card}>
          <Text style={styles.suggestLabel}>Suggested next set</Text>
          <Text style={styles.suggestValue}>
            {suggestion ? `${suggestion.weight} lb × ${suggestion.reps}` : '—'}
          </Text>

          <View style={styles.row}>
            <View style={styles.field}>
              <Text style={styles.label}>Weight</Text>
              <Input value={weight} onChangeText={setWeight} keyboardType="numeric" placeholder="lb" />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Reps</Text>
              <Input value={reps} onChangeText={setReps} keyboardType="numeric" placeholder="reps" />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>RPE</Text>
              <Input value={rpe} onChangeText={setRpe} keyboardType="numeric" placeholder="RPE" />
            </View>
          </View>

          <Button
            label={isWarmup ? 'Logging warm-up…' : 'Toggle warm-up'}
            variant="ghost"
            onPress={() => setIsWarmup((v) => !v)}
          />
          <Button label="Log set" onPress={logSet} />
        </Card>

        <Text style={styles.loggedTitle}>Logged sets</Text>
        {exerciseSets.map((s) => (
          <Text key={s.id} style={styles.loggedRow}>
            Set {s.set_number}{s.is_warmup ? ' (warm-up)' : ''}: {s.weight} × {s.reps} @ RPE {s.rpe}
          </Text>
        ))}

        <Button label="Complete workout" onPress={completeWorkout} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, gap: 12, paddingBottom: 40 },
  meta: { color: theme.textMuted, marginBottom: 8 },
  exerciseTabs: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  tab: {
    width: 36,
    height: 36,
    borderRadius: 18,
    textAlign: 'center',
    lineHeight: 36,
    backgroundColor: theme.surfaceAlt,
    color: theme.textMuted,
    overflow: 'hidden',
  },
  tabActive: { backgroundColor: theme.gold, color: '#000', fontWeight: '700' },
  card: { gap: 12 },
  suggestLabel: { color: theme.textMuted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  suggestValue: { color: theme.gold, fontSize: 28, fontWeight: '700' },
  row: { flexDirection: 'row', gap: 8 },
  field: { flex: 1, gap: 4 },
  label: { color: theme.textMuted, fontSize: 11 },
  loggedTitle: { color: theme.textMuted, marginTop: 8, letterSpacing: 1, fontSize: 11, textTransform: 'uppercase' },
  loggedRow: { color: theme.text, paddingVertical: 4 },
});
