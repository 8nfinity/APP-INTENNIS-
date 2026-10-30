import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { ColorValue, Platform } from 'react-native';

import { FONT, colors } from '@/lib/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const tab = (title: string, icon: IconName, iconOff: IconName) => ({
  title,
  tabBarIcon: ({ color, focused }: { color: ColorValue; size: number; focused: boolean }) => (
    <Ionicons name={focused ? icon : iconOff} color={color as string} size={23} />
  ),
});

export default function TabLayout() {
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
          // no navegador não há área segura: altura fixa para o nome da aba não cortar
          ...(Platform.OS === 'web' ? { height: 66, paddingTop: 6, paddingBottom: 10 } : null),
        },
      }}>
      <Tabs.Screen name="index" options={tab('Agendar', 'calendar', 'calendar-outline')} />
      <Tabs.Screen name="ranking" options={tab('Ranking', 'trophy', 'trophy-outline')} />
      <Tabs.Screen name="eventos" options={tab('Eventos', 'megaphone', 'megaphone-outline')} />
      <Tabs.Screen name="social" options={tab('Social', 'people', 'people-outline')} />
      <Tabs.Screen name="perfil" options={tab('Perfil', 'person-circle', 'person-circle-outline')} />
    </Tabs>
  );
}
