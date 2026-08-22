import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Input, Screen, Subtitle, Title } from '@/components/ui';
import { theme } from '@/constants/theme';

export default function SignupScreen() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    setError('');
    setLoading(true);
    try {
      await signUp({ email: email.trim(), password, fullName: fullName.trim(), role: 'coach' });
      router.replace('/(auth)/onboarding');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.brand}>ALL IN</Text>
          <Title>Coach account</Title>
          <Subtitle>Create your coach account. Clients join only via invite — no open signup.</Subtitle>

          <View style={styles.form}>
            <Input value={fullName} onChangeText={setFullName} placeholder="Full name" autoCapitalize="words" />
            <Input value={email} onChangeText={setEmail} placeholder="Email" keyboardType="email-address" />
            <Input value={password} onChangeText={setPassword} placeholder="Password (8+ chars)" secureTextEntry />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button label={loading ? 'Creating…' : 'Create coach account'} onPress={handleSignup} disabled={loading} />
          </View>

          <Link href="/(auth)/login" style={styles.link}>
            <Text style={styles.linkText}>Already have an account?</Text>
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 24, gap: 12 },
  brand: { color: theme.gold, letterSpacing: 4, fontSize: 12, fontWeight: '700', marginTop: 40 },
  form: { gap: 12, marginTop: 24 },
  error: { color: theme.danger, fontSize: 13 },
  link: { marginTop: 16, alignSelf: 'center' },
  linkText: { color: theme.textMuted },
});
