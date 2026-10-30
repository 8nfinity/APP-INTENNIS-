import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { ColorValue, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/lib/auth';
import { FONT, colors } from '@/lib/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const tab = (title: string, icon: IconName, iconOff: IconName) => ({
  title,
  tabBarIcon: ({ color, focused }: { color: ColorValue; size: number; focused: boolean }) => (
    <Ionicons name={focused ? icon : iconOff} color={color as string} size={23} />
  ),
});

export default function TabLayout() {
  const { player } = useAuth();
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.cream,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontFamily: FONT.medium, fontSize: 11 },
        // Barra fixa no rodapé com ícone + nome, como nas referências.
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          // no navegador: altura fixa para o nome da aba não cortar, mais a faixa
          // inferior do iPhone quando o webapp abre em tela cheia
          ...(Platform.OS === 'web' ? { height: 66 + insets.bottom, paddingTop: 6, paddingBottom: 10 + insets.bottom } : null),
        },
      }}>
      <Tabs.Screen name="index" options={tab('Agendar', 'calendar', 'calendar-outline')} />
      <Tabs.Screen name="ranking" options={tab('Ranking', 'trophy', 'trophy-outline')} />
      <Tabs.Screen name="eventos" options={tab('Eventos', 'megaphone', 'megaphone-outline')} />
      <Tabs.Screen name="social" options={tab('Social', 'people', 'people-outline')} />
      {/* aba só para contas ligadas a um professor */}
      <Tabs.Screen name="aulas" options={{ ...tab('Aulas', 'school', 'school-outline'), href: player?.teacherId ? undefined : null }} />
      <Tabs.Screen name="perfil" options={tab('Perfil', 'person-circle', 'person-circle-outline')} />
    </Tabs>
  );
}
