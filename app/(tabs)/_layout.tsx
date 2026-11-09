import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, View } from 'react-native';

import { useAuth } from '@/lib/auth';
import { useLayout } from '@/lib/layout';
import { FONT, colors } from '@/lib/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

// Ícone da aba: o ativo fica num quadrado verde-limão com o ícone escuro (como no protótipo).
const tab = (title: string, icon: IconName) => ({
  title,
  tabBarIcon: ({ focused }: { focused: boolean }) => (
    <View style={{ width: 42, height: 32, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: focused ? colors.lime : 'transparent' }}>
      <Ionicons name={icon} color={focused ? colors.onLime : colors.soft} size={21} />
    </View>
  ),
});

export default function TabLayout() {
  const { player } = useAuth();
  const { insets, compact } = useLayout();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.soft,
        tabBarLabelStyle: { fontFamily: FONT.sansMedium, fontSize: compact ? 9.5 : 10.5 },
        // altura da barra é fixa: o nome da aba não cresce com a fonte grande do sistema
        tabBarAllowFontScaling: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          // no navegador: altura fixa mais a faixa inferior do iPhone em tela cheia
          ...(Platform.OS === 'web'
            ? {
                height: 66 + insets.bottom,
                paddingTop: 6,
                paddingBottom: 8 + insets.bottom,
                // celular deitado: a barra não passa por baixo do recorte lateral
                paddingLeft: insets.left,
                paddingRight: insets.right,
              }
            : null),
        },
      }}>
      <Tabs.Screen name="index" options={tab('Agendar', 'calendar-outline')} />
      <Tabs.Screen name="ranking" options={tab('Ranking', 'trophy-outline')} />
      <Tabs.Screen name="eventos" options={tab('Eventos', 'star-outline')} />
      <Tabs.Screen name="social" options={tab('Social', 'chatbubble-outline')} />
      <Tabs.Screen name="perfil" options={tab('Perfil', 'person-outline')} />
      {/* aba só para contas ligadas a um professor */}
      <Tabs.Screen name="aulas" options={{ ...tab('Aulas', 'grid-outline'), href: player?.teacherId ? undefined : null }} />
    </Tabs>
  );
}
