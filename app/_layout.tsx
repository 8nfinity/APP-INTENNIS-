import { useFonts } from 'expo-font';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { StoreProvider } from '@/lib/store';
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
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.bg,
    primary: colors.ball,
    text: colors.text,
    border: colors.border,
  },
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <StoreProvider>
      <ThemeProvider value={theme}>
        <StatusBar style="light" />
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="checkout" options={{ presentation: 'modal', title: 'Pagamento' }} />
          <Stack.Screen name="new-post" options={{ presentation: 'modal', title: 'Nova publicação' }} />
          <Stack.Screen name="edit-profile" options={{ presentation: 'modal', title: 'Editar perfil' }} />
          <Stack.Screen name="match-result" options={{ presentation: 'modal', title: 'Registrar resultado' }} />
        </Stack>
      </ThemeProvider>
    </StoreProvider>
  );
}
