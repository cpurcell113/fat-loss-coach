import { ScrollView, StyleSheet, Text } from 'react-native';
import { Screen, Card, Title, Subtitle } from '@/components/ui';
import { theme } from '@/constants/theme';

export default function SetupScreen() {
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.brand}>ALL IN</Text>
        <Title>Supabase setup required</Title>
        <Subtitle>
          Track A runs on Expo + Supabase. Copy mobile/.env.example to mobile/.env and add your project URL and anon key.
        </Subtitle>

        <Card style={styles.card}>
          <Text style={styles.code}>
            {`EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co\nEXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key`}
          </Text>
        </Card>

        <Subtitle>
          Then apply migrations from supabase/migrations/001_initial_schema.sql and run supabase/seed.sql to load the exercise library.
        </Subtitle>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 24,
    gap: 16,
  },
  brand: {
    color: theme.gold,
    letterSpacing: 4,
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    marginTop: 8,
  },
  code: {
    color: theme.text,
    fontFamily: 'SpaceMono',
    fontSize: 12,
    lineHeight: 20,
  },
});
