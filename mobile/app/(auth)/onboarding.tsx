import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { getSupabase } from '@/lib/supabase';
import { Button, Card, Screen, Subtitle, Title } from '@/components/ui';
import { theme } from '@/constants/theme';

export default function OnboardingScreen() {
  const { profile, refreshProfile } = useAuth();
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const complete = async () => {
    if (!accepted || !profile) return;
    setSaving(true);
    setError('');
    try {
      const { error: updateError } = await getSupabase()
        .from('profiles')
        .update({
          onboarding_complete: true,
          liability_accepted_at: new Date().toISOString(),
        })
        .eq('id', profile.id);
      if (updateError) throw updateError;
      await refreshProfile();
      router.replace('/(tabs)');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save onboarding');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.brand}>ALL IN</Text>
        <Title>Before we start</Title>
        <Subtitle>
          All In contextualizes training decisions from your logged data. It does not diagnose medical conditions or replace your physician.
        </Subtitle>

        <Card>
          <Text style={styles.waiverTitle}>Scope of practice</Text>
          <Text style={styles.waiverBody}>
            By continuing, you acknowledge that programming adjustments are based on training data — sleep, nutrition screenshots, body composition, and workout logs — not medical advice. Consult your doctor before starting any exercise or nutrition program.
          </Text>
          <Button
            label={accepted ? '✓ Accepted' : 'I understand and accept'}
            onPress={() => setAccepted(true)}
            variant={accepted ? 'ghost' : 'primary'}
          />
        </Card>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button label={saving ? 'Saving…' : 'Continue'} onPress={complete} disabled={!accepted || saving} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 24, gap: 16 },
  brand: { color: theme.gold, letterSpacing: 4, fontSize: 12, fontWeight: '700' },
  waiverTitle: { color: theme.gold, fontWeight: '700', marginBottom: 8, letterSpacing: 1 },
  waiverBody: { color: theme.textMuted, lineHeight: 22, marginBottom: 16 },
  error: { color: theme.danger },
});
