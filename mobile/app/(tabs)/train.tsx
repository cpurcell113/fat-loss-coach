import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { getSupabase } from '@/lib/supabase';
import type { ProgramSession, Workout } from '@/lib/types';
import { Button, Card, Screen, Subtitle, Title } from '@/components/ui';
import { theme } from '@/constants/theme';

export default function TrainScreen() {
  const { profile } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<ProgramSession[]>([]);
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    const supabase = getSupabase();

    const [{ data: sessionRows }, { data: workoutRows }] = await Promise.all([
      supabase
        .from('program_sessions')
        .select('*, program_exercises(*, exercise:exercises(*))')
        .order('sort_order'),
      supabase
        .from('workouts')
        .select('*')
        .eq('client_id', profile.id)
        .eq('status', 'in_progress')
        .order('started_at', { ascending: false })
        .limit(1),
    ]);

    setSessions((sessionRows as ProgramSession[]) ?? []);
    setActiveWorkout((workoutRows?.[0] as Workout) ?? null);
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    load();
  }, [load]);

  const todaySession = useMemo(() => {
    const day = new Date().getDay();
    return sessions.find((s) => s.day_of_week === day) ?? sessions[0] ?? null;
  }, [sessions]);

  const startWorkout = async () => {
    if (!profile || !todaySession) return;
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('workouts')
      .insert({
        client_id: profile.id,
        session_id: todaySession.id,
        program_id: todaySession.program_id,
        workout_date: new Date().toISOString().slice(0, 10),
        status: 'in_progress',
      })
      .select()
      .single();
    if (error) return;
    router.push(`/workout/${data.id}`);
  };

  if (loading) {
    return (
      <Screen style={styles.center}>
        <ActivityIndicator color={theme.gold} />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.brand}>TRAIN</Text>
        <Title>Program</Title>
        <Subtitle>Log sets with auto-suggested progression.</Subtitle>
      </View>

      {activeWorkout ? (
        <Card style={styles.resumeCard}>
          <Text style={styles.cardTitle}>Workout in progress</Text>
          <Button label="Resume" onPress={() => router.push(`/workout/${activeWorkout.id}`)} />
        </Card>
      ) : null}

      {todaySession ? (
        <Card style={styles.sessionCard}>
          <Text style={styles.sessionName}>{todaySession.name}</Text>
          <FlatList
            data={todaySession.program_exercises ?? []}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item, index }) => (
              <Pressable
                style={styles.exerciseRow}
                onPress={() => item.exercise && router.push(`/exercise/${item.exercise.slug}`)}
              >
                <Text style={styles.exerciseIndex}>{index + 1}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.exerciseName}>{item.exercise?.name ?? 'Exercise'}</Text>
                  <Text style={styles.exerciseMeta}>
                    {item.target_sets} × {item.target_reps}
                    {item.target_weight ? ` @ ${item.target_weight} lb` : ''}
                  </Text>
                </View>
              </Pressable>
            )}
          />
          {!activeWorkout ? <Button label="Start session" onPress={startWorkout} /> : null}
        </Card>
      ) : (
        <Card style={styles.sessionCard}>
          <Text style={styles.cardBody}>No program assigned yet. Your coach will build your block structure.</Text>
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 20, gap: 4 },
  brand: { color: theme.gold, letterSpacing: 3, fontSize: 11, fontWeight: '700' },
  resumeCard: { margin: 20, marginBottom: 0 },
  sessionCard: { margin: 20, gap: 12 },
  cardTitle: { color: theme.gold, fontWeight: '700', marginBottom: 8 },
  cardBody: { color: theme.textMuted, lineHeight: 20 },
  sessionName: { color: theme.text, fontSize: 22, fontWeight: '700' },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  exerciseIndex: { color: theme.gold, width: 20, fontWeight: '700' },
  exerciseName: { color: theme.text, fontWeight: '600' },
  exerciseMeta: { color: theme.textMuted, fontSize: 12, marginTop: 2 },
});
