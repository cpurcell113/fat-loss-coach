import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text } from 'react-native';
import { getSupabase } from '@/lib/supabase';
import type { Exercise } from '@/lib/types';
import { Card, Screen, Title } from '@/components/ui';
import { theme } from '@/constants/theme';

export default function ExerciseDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data } = await getSupabase().from('exercises').select('*').eq('slug', slug).maybeSingle();
      setExercise(data as Exercise | null);
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return (
      <Screen style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={theme.gold} />
      </Screen>
    );
  }

  if (!exercise) {
    return (
      <Screen style={{ padding: 20 }}>
        <Title>Exercise not found</Title>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Title>{exercise.name}</Title>
        <Text style={styles.meta}>
          {exercise.muscle_groups.join(' · ')} · {exercise.equipment} · {exercise.level}
        </Text>
        {exercise.image_url ? <Image source={{ uri: exercise.image_url }} style={styles.image} /> : null}
        <Card>
          <Text style={styles.section}>Instructions</Text>
          <Text style={styles.body}>{exercise.instructions || 'No instructions available.'}</Text>
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 12, paddingBottom: 40 },
  meta: { color: theme.textMuted, textTransform: 'capitalize' },
  image: { width: '100%', height: 220, borderRadius: 16, backgroundColor: theme.surfaceAlt },
  section: { color: theme.gold, fontWeight: '700', marginBottom: 8, letterSpacing: 1 },
  body: { color: theme.text, lineHeight: 22 },
});
