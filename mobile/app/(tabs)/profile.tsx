import { Alert, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Card, Screen, Subtitle, Title } from '@/components/ui';
import { theme } from '@/constants/theme';

export default function ProfileScreen() {
  const { profile, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/(auth)/login');
    } catch (e) {
      Alert.alert('Sign out failed', e instanceof Error ? e.message : 'Unknown error');
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.brand}>PROFILE</Text>
        <Title>{profile?.full_name ?? 'Account'}</Title>
        <Subtitle>{profile?.email}</Subtitle>
        <Text style={styles.role}>{profile?.role?.toUpperCase()}</Text>
      </View>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Account</Text>
        <Text style={styles.cardBody}>
          Onboarding {profile?.onboarding_complete ? 'complete' : 'incomplete'}
          {profile?.liability_accepted_at ? ' · Liability accepted' : ''}
        </Text>
        <Button label="Sign out" onPress={handleSignOut} variant="ghost" />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { padding: 20, gap: 4 },
  brand: { color: theme.gold, letterSpacing: 3, fontSize: 11, fontWeight: '700' },
  role: { color: theme.gold, fontWeight: '700', marginTop: 8, letterSpacing: 2 },
  card: { margin: 20, gap: 12 },
  cardTitle: { color: theme.gold, fontWeight: '700' },
  cardBody: { color: theme.textMuted, lineHeight: 20 },
});
