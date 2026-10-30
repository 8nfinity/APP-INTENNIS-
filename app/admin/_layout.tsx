import { Stack } from 'expo-router';

import { FONT, colors } from '@/lib/theme';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        headerTitleStyle: { fontFamily: FONT.extra },
        contentStyle: { backgroundColor: colors.bg },
      }}>
      <Stack.Screen name="index" options={{ title: 'Administração' }} />
      <Stack.Screen name="courts" options={{ title: 'Quadras' }} />
      <Stack.Screen name="blocks" options={{ title: 'Bloquear horários' }} />
      <Stack.Screen name="bookings" options={{ title: 'Reservas' }} />
      <Stack.Screen name="events" options={{ title: 'Eventos' }} />
      <Stack.Screen name="players" options={{ title: 'Jogadores e ranking' }} />
    </Stack>
  );
}
