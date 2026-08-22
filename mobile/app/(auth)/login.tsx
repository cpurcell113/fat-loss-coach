import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Input, Screen, Subtitle, Title } from '@/components/ui';
import { theme } from '@/constants/theme';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      router.replace('/(tabs)');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.brand}>ALL IN</Text>
          <Title>Welcome back</Title>
          <Subtitle>Coach-gated programming and biometric intelligence.</Subtitle>

          <View style={styles.form}>
            <Input value={email} onChangeText={setEmail} placeholder="Email" keyboardType="email-address" />
            <Input value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button label={loading ? 'Signing in…' : 'Sign in'} onPress={handleLogin} disabled={loading} />
          </View>

          <Link href="/(auth)/signup" style={styles.link}>
            <Text style={styles.linkText}>Coach signup →</Text>
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 24, gap: 12, flexGrow: 1, justifyContent: 'center' },
  brand: { color: theme.gold, letterSpacing: 4, fontSize: 12, fontWeight: '700', marginBottom: 8 },
  form: { gap: 12, marginTop: 24 },
  error: { color: theme.danger, fontSize: 13 },
  link: { marginTop: 16, alignSelf: 'center' },
  linkText: { color: theme.gold, fontWeight: '600' },
});
