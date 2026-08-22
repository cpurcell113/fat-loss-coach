import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { getSupabase } from '@/lib/supabase';
import type { Exercise } from '@/lib/types';
import { Input, Screen, Subtitle, Title } from '@/components/ui';
import { theme } from '@/constants/theme';

export default function LibraryScreen() {
  const router = useRouter();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await getSupabase()
        .from('exercises')
        .select('*')
        .order('name')
        .limit(200);
      setExercises((data as Exercise[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return exercises;
    return exercises.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.muscle_groups.some((m) => m.toLowerCase().includes(q)) ||
        e.equipment.toLowerCase().includes(q),
    );
  }, [exercises, query]);

  const renderItem = useCallback(
    ({ item }: { item: Exercise }) => (
      <Pressable style={styles.row} onPress={() => router.push(`/exercise/${item.slug}`)}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.thumbFallback]} />
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.meta}>
            {item.muscle_groups.slice(0, 2).join(', ')} · {item.equipment}
          </Text>
        </View>
      </Pressable>
    ),
    [router],
  );

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.brand}>LIBRARY</Text>
        <Title>Exercises</Title>
        <Subtitle>873 movements seeded from free-exercise-db.</Subtitle>
        <Input value={query} onChangeText={setQuery} placeholder="Search by name, muscle, equipment" />
      </View>

      {loading ? (
        <ActivityIndicator color={theme.gold} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No exercises found</Text>}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { padding: 20, gap: 8 },
  brand: { color: theme.gold, letterSpacing: 3, fontSize: 11, fontWeight: '700' },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    alignItems: 'center',
  },
  thumb: { width: 56, height: 56, borderRadius: 10, backgroundColor: theme.surfaceAlt },
  thumbFallback: { borderWidth: 1, borderColor: theme.border },
  name: { color: theme.text, fontWeight: '600' },
  meta: { color: theme.textMuted, fontSize: 12, marginTop: 2, textTransform: 'capitalize' },
  empty: { color: theme.textMuted, textAlign: 'center', marginTop: 40 },
});
