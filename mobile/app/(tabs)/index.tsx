import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { getSupabase } from '@/lib/supabase';
import { calculateReadinessScore } from '@/lib/readiness';
import type { ProgramSession, ReadinessCheckin } from '@/lib/types';
import { Button, Card, ScoreRing, Screen, Subtitle, Title } from '@/components/ui';
import { theme } from '@/constants/theme';

export default function HomeScreen() {
  const { profile } = useAuth();
  const router = useRouter();
  const [session, setSession] = useState<ProgramSession | null>(null);
  const [checkin, setCheckin] = useState<ReadinessCheckin | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!profile) return;
    const supabase = getSupabase();
    const today = new Date().toISOString().slice(0, 10);
    const day = new Date().getDay();

    const [{ data: checkinData }, { data: sessions }] = await Promise.all([
      supabase.from('readiness_checkins').select('*').eq('client_id', profile.id).eq('checkin_date', today).maybeSingle(),
      supabase
        .from('program_sessions')
        .select('*, program_exercises(*, exercise:exercises(*))')
        .eq('day_of_week', day)
        .order('sort_order'),
    ]);

    setCheckin(checkinData as ReadinessCheckin | null);
    setSession((sessions?.[0] as ProgramSession) ?? null);
  }, [profile]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const quickCheckin = async () => {
    if (!profile) return;
    const input = {
      sleepHours: 7,
      sleepQuality: 4,
      soreness: 3,
      energy: 7,
    };
    const score = calculateReadinessScore(input);
    const { data, error } = await getSupabase()
      .from('readiness_checkins')
      .upsert(
        {
          client_id: profile.id,
          checkin_date: new Date().toISOString().slice(0, 10),
          sleep_hours: input.sleepHours,
          sleep_quality: input.sleepQuality,
          soreness: input.soreness,
          energy: input.energy,
          readiness_score: score,
        },
        { onConflict: 'client_id,checkin_date' },
      )
      .select()
      .single();
    if (!error) setCheckin(data as ReadinessCheckin);
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.gold} />}
      >
        <Text style={styles.brand}>ALL IN</Text>
        <Title>{profile?.full_name?.split(' ')[0] ?? 'Athlete'}</Title>
        <Subtitle>Adaptive programming + biometric intelligence</Subtitle>

        <View style={styles.scoreRow}>
          <ScoreRing label="Readiness" score={checkin?.readiness_score ?? null} />
          <ScoreRing label="Recovery" score={null} />
          <ScoreRing label="Nutrition" score={null} />
        </View>

        {!checkin ? (
          <Card>
            <Text style={styles.cardTitle}>Daily check-in</Text>
            <Text style={styles.cardBody}>Set today's readiness baseline before training.</Text>
            <Button label="Quick check-in" onPress={quickCheckin} />
          </Card>
        ) : null}

        <Card>
          <Text style={styles.cardTitle}>Today's session</Text>
          {session ? (
            <>
              <Text style={styles.sessionName}>{session.name}</Text>
              <Text style={styles.cardBody}>
                {session.program_exercises?.length ?? 0} exercises programmed
              </Text>
              <Button label="Start workout" onPress={() => router.push('/(tabs)/train')} />
            </>
          ) : (
            <Text style={styles.cardBody}>No session scheduled for today. Your coach can assign a program.</Text>
          )}
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  brand: { color: theme.gold, letterSpacing: 4, fontSize: 11, fontWeight: '700' },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 8 },
  cardTitle: { color: theme.gold, fontWeight: '700', letterSpacing: 1, marginBottom: 6 },
  cardBody: { color: theme.textMuted, lineHeight: 20, marginBottom: 12 },
  sessionName: { color: theme.text, fontSize: 20, fontWeight: '700', marginBottom: 4 },
});
