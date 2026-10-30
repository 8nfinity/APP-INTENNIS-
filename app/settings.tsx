import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { Avatar, Header, ListGroup, ListRow, Muted, Screen, Text } from '@/components/ui';
import { useAuth, useMe } from '@/lib/auth';
import { notify } from '@/lib/dialog';
import { POINTS, TOURNAMENT_SPOTS } from '@/lib/game';
import { installApp, useInstall } from '@/lib/install';
import { colors, space } from '@/lib/theme';

// Configurações (referência "Settings").
export default function Settings() {
  const me = useMe();
  const { signOut, session } = useAuth();
  const install = useInstall();

  const rules = () =>
    notify(
      'Regras de pontuação',
      `Vitória +${POINTS.vitoria} · Derrota +${POINTS.derrota}\nAula (check-in) +${POINTS.aula}\nJogo reservado (check-in) +${POINTS.jogoAgendado}\n\nOs ${TOURNAMENT_SPOTS} primeiros do ranking são convidados para o torneio.`,
    );

  return (
    <Screen>
      <Header title="Configurações" />

      <ListGroup>
        <Pressable onPress={() => router.push('/edit-profile')} style={s.user}>
          <Avatar name={me.name} url={me.avatarUrl} size={48} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '600', fontSize: 16 }}>{me.name}</Text>
            <Muted>@{me.username}</Muted>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </Pressable>
      </ListGroup>

      <ListGroup>
        <ListRow icon="person-outline" label="Editar perfil e foto" onPress={() => router.push('/edit-profile')} />
        <ListRow icon="calendar-outline" label="Reservar quadra" onPress={() => router.dismissTo('/')} />
        <ListRow icon="trophy-outline" label="Regras de pontuação" onPress={rules} last={!me.isAdmin} />
        {me.isAdmin && <ListRow icon="shield-checkmark-outline" label="Painel administrativo" onPress={() => router.push('/admin')} last />}
      </ListGroup>

      {install.show && (
        <ListGroup>
          <ListRow icon="download-outline" label="Instalar o app no celular" onPress={installApp} last />
        </ListGroup>
      )}

      <ListGroup>
        <ListRow icon="logo-instagram" label="Instagram do clube" onPress={() => Linking.openURL('https://www.instagram.com/in.tennisclub/')} />
        <ListRow icon="mail-outline" label="Conta" value={session?.user.email ?? ''} />
        <ListRow icon="information-circle-outline" label="Versão do app" value="1.0" last />
      </ListGroup>

      <View style={{ flex: 1, minHeight: space.xl }} />
      <Pressable onPress={signOut} style={({ pressed }) => [s.logout, { opacity: pressed ? 0.85 : 1 }]}>
        <Ionicons name="log-out-outline" size={20} color={colors.danger} />
        <Text style={s.logoutText}>Sair da conta</Text>
      </Pressable>
    </Screen>
  );
}

const s = StyleSheet.create({
  user: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg },
  logout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 56, borderRadius: 999, backgroundColor: colors.cream },
  logoutText: { color: colors.danger, fontWeight: '700', fontSize: 16 },
});
