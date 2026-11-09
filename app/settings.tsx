import { router } from 'expo-router';
import { Linking, View } from 'react-native';

import { Card, Eyebrow, Headline, ListRow, Screen, Sub, Tag, Text } from '@/components/ui';
import { useAuth, useMe } from '@/lib/auth';
import { confirmAsk, notify } from '@/lib/dialog';
import { POINTS, TOURNAMENT_SPOTS } from '@/lib/game';
import { installApp, useInstall } from '@/lib/install';
import { space } from '@/lib/theme';

// Configurações: conta, instalação do app, regras de pontuação e sair.
export default function Settings() {
  const me = useMe();
  const { signOut, session } = useAuth();
  const install = useInstall();

  const rules = () =>
    notify(
      'Como funciona a pontuação?',
      `Vitória +${POINTS.vitoria} · Derrota +${POINTS.derrota}\nAula (check-in) +${POINTS.aula}\nJogo reservado (check-in) +${POINTS.jogoAgendado}\n\nO resultado de um desafio só pontua depois que o adversário confirma.\nOs ${TOURNAMENT_SPOTS} primeiros do ranking são convidados para o torneio.`,
    );

  const leave = async () => {
    if (await confirmAsk('Sair da conta?', 'Você poderá entrar de novo quando quiser.', 'Sair')) signOut();
  };

  return (
    <Screen>
      <View style={{ gap: 8 }}>
        <Eyebrow>Do seu jeito</Eyebrow>
        <Headline>Configurações.</Headline>
      </View>

      <Card style={{ gap: 6 }}>
        <Text style={{ fontSize: 15, fontWeight: '500' }}>{me.name}</Text>
        <Sub style={{ fontSize: 12 }}>@{me.username}</Sub>
        <View style={{ marginTop: space.sm }}>
          <Tag label="E-mail confirmado" />
        </View>
        <Sub style={{ fontSize: 11.5 }}>{session?.user.email}</Sub>
      </Card>

      <View>
        <ListRow label="Editar meu perfil" onPress={() => router.push('/edit-profile')} />
        {install.show && <ListRow label="Instalar na tela inicial" onPress={installApp} />}
        <ListRow label="Como funciona a pontuação?" onPress={rules} />
        <ListRow label="Instagram do clube" onPress={() => Linking.openURL('https://www.instagram.com/in.tennisclub/')} />
        <ListRow label="Sair da conta" onPress={leave} danger last />
      </View>
    </Screen>
  );
}
