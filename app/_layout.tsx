import { DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { Newsreader_400Regular, Newsreader_400Regular_Italic, Newsreader_500Medium } from '@expo-google-fonts/newsreader';
import { useFonts } from 'expo-font';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import 'react-native-reanimated';

import { AppFrame } from '@/components/AppFrame';
import { Button, ErrorState } from '@/components/ui';
import { AuthProvider, useAuth } from '@/lib/auth';
import '@/lib/install'; // escuta cedo o aviso de instalação do navegador (webapp)
import { colors } from '@/lib/theme';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  anchor: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.paper,
    card: colors.paper,
    primary: colors.forest2,
    text: colors.ink,
    border: colors.border,
  },
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
    Newsreader_400Regular,
    Newsreader_500Medium,
    Newsreader_400Regular_Italic,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  if (!loaded) return null;

  return (
    <AuthProvider>
      <ThemeProvider value={theme}>
        {/* a barra do topo é verde-escura: ícones do sistema em claro */}
        <StatusBar style="light" />
        <AppFrame>
          <RootNav />
        </AppFrame>
      </ThemeProvider>
    </AuthProvider>
  );
}

function RootNav() {
  const { session, player, loading, profileError, refreshPlayer, signOut } = useAuth();

  useEffect(() => {
    if (!loading) SplashScreen.hideAsync();
  }, [loading]);

  if (loading) return null;

  if (session && !player && profileError) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.paper, justifyContent: 'center', padding: 24, gap: 12 }}>
        <ErrorState message={profileError} onRetry={refreshPlayer} />
        <Button label="Sair da conta" variant="ghost" onPress={signOut} />
      </View>
    );
  }

  const authed = !!session && !!player;

  // Todas as telas desenham a própria barra do topo (logo, voltar e avisos).
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.paper } }}>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={!!session && !player}>
        <Stack.Screen name="create-profile" />
      </Stack.Protected>
      <Stack.Protected guard={authed}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="calendario" />
        <Stack.Screen name="checkout" />
        <Stack.Screen name="booking/[id]" />
        <Stack.Screen name="event/[id]" />
        <Stack.Screen name="challenges" />
        <Stack.Screen name="match-result" />
        <Stack.Screen name="new-post" />
        <Stack.Screen name="comments" />
        <Stack.Screen name="edit-profile" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="avisos" />
        <Stack.Screen name="avatar-crop" options={{ presentation: 'modal' }} />
      </Stack.Protected>
    </Stack>
  );
}
