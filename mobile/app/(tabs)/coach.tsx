import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Share, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { getSupabase } from '@/lib/supabase';
import type { ClientInvite, Profile } from '@/lib/types';
import { Button, Card, Input, Screen, Subtitle, Title } from '@/components/ui';
import { theme } from '@/constants/theme';

export default function CoachScreen() {
  const { profile } = useAuth();
  const [email, setEmail] = useState('');
  const [clients, setClients] = useState<Profile[]>([]);
  const [invites, setInvites] = useState<ClientInvite[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!profile) return;
    const supabase = getSupabase();
    const [{ data: roster }, { data: pending }] = await Promise.all([
      supabase.from('profiles').select('*').eq('coach_id', profile.id).order('created_at', { ascending: false }),
      supabase.from('client_invites').select('*').eq('coach_id', profile.id).order('created_at', { ascending: false }).limit(10),
    ]);
    setClients((roster as Profile[]) ?? []);
    setInvites((pending as ClientInvite[]) ?? []);
  }, [profile]);

  useEffect(() => {
    load();
  }, [load]);

  const createInvite = async () => {
    if (!email.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await getSupabase().rpc('create_client_invite', { p_email: email.trim() });
      if (error) throw error;
      const invite = data as ClientInvite;
      const link = `allin://invite/${invite.token}`;
      await Share.share({ message: `Join my All In roster: ${link}` });
      setEmail('');
      await load();
    } catch (e) {
      Alert.alert('Invite failed', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const copyInviteLink = async (token: string) => {
    const link = `allin://invite/${token}`;
    await Share.share({ message: link });
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.brand}>ROSTER</Text>
        <Title>Coach dashboard</Title>
        <Subtitle>Invite clients by email — no open signup.</Subtitle>
      </View>

      <Card style={styles.card}>
        <Input value={email} onChangeText={setEmail} placeholder="client@email.com" keyboardType="email-address" />
        <Button label={loading ? 'Sending…' : 'Send invite'} onPress={createInvite} disabled={loading} />
      </Card>

      <Text style={styles.section}>Pending invites</Text>
      <FlatList
        data={invites.filter((i) => i.status === 'pending')}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <PressableRow email={item.email} meta={item.status} onPress={() => copyInviteLink(item.token)} />
        )}
        ListEmptyComponent={<Text style={styles.empty}>No pending invites</Text>}
      />

      <Text style={styles.section}>Clients ({clients.length})</Text>
      <FlatList
        data={clients}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        renderItem={({ item }) => <PressableRow email={item.email} meta={item.full_name ?? 'Client'} />}
        ListEmptyComponent={<Text style={styles.empty}>No clients yet</Text>}
      />
    </Screen>
  );
}

function PressableRow({ email, meta, onPress }: { email: string; meta: string; onPress?: () => void }) {
  return (
    <Text onPress={onPress} style={styles.row}>
      <Text style={styles.rowEmail}>{email}</Text>
      {'  ·  '}
      <Text style={styles.rowMeta}>{meta}</Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  header: { padding: 20, gap: 4 },
  brand: { color: theme.gold, letterSpacing: 3, fontSize: 11, fontWeight: '700' },
  card: { marginHorizontal: 20, marginBottom: 16, gap: 12 },
  section: {
    color: theme.textMuted,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginHorizontal: 20,
    marginBottom: 8,
  },
  row: { color: theme.text, paddingHorizontal: 20, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.border },
  rowEmail: { fontWeight: '600' },
  rowMeta: { color: theme.textMuted },
  empty: { color: theme.textMuted, paddingHorizontal: 20, paddingBottom: 12 },
});
