import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { getSupabase } from '@/lib/supabase';
import type { InvitePreview } from '@/lib/types';
import { Button, Input, Screen, Subtitle, Title } from '@/components/ui';
import { theme } from '@/constants/theme';

export default function InviteAcceptScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { signUp } = useAuth();
  const router = useRouter();

  const [invite, setInvite] = useState<InvitePreview | null>(null);
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;
    (async () => {
      setLoadingInvite(true);
      try {
        const { data, error: rpcError } = await getSupabase().rpc('get_invite_by_token', { p_token: token });
        if (rpcError) throw rpcError;
        setInvite((data?.[0] as InvitePreview) ?? null);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Invalid invite');
      } finally {
        setLoadingInvite(false);
      }
    })();
  }, [token]);

  const handleAccept = async () => {
    if (!invite || !token) return;
    setSubmitting(true);
    setError('');
    try {
      await signUp({
        email: invite.email,
        password,
        fullName: fullName.trim(),
        role: 'client',
        inviteToken: token,
      });
      router.replace('/(auth)/onboarding');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create account');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingInvite) {
    return (
      <Screen style={styles.center}>
        <ActivityIndicator color={theme.gold} />
      </Screen>
    );
  }

  if (!invite || invite.status !== 'pending') {
    return (
      <Screen style={styles.center}>
        <Title>Invite unavailable</Title>
        <Subtitle>This invite is expired or already used. Ask your coach for a new link.</Subtitle>
      </Screen>
    );
  }

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.brand}>ALL IN</Text>
          <Title>You're invited</Title>
          <Subtitle>
            {invite.coach_name} invited {invite.email}. Create your account to join their roster.
          </Subtitle>

          <View style={styles.form}>
            <Input value={invite.email} onChangeText={() => {}} placeholder="Email" keyboardType="email-address" />
            <Input value={fullName} onChangeText={setFullName} placeholder="Full name" autoCapitalize="words" />
            <Input value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button label={submitting ? 'Creating…' : 'Accept invite'} onPress={handleAccept} disabled={submitting} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  content: { padding: 24, gap: 12 },
  brand: { color: theme.gold, letterSpacing: 4, fontSize: 12, fontWeight: '700', marginTop: 40 },
  form: { gap: 12, marginTop: 24 },
  error: { color: theme.danger, fontSize: 13 },
});
