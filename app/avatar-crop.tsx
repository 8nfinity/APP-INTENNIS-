import { Ionicons } from '@expo/vector-icons';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { router } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Image, PanResponder, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { Button, ErrorText, Header, Muted, Screen, Text } from '@/components/ui';
import { api, errMsg } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { uploadAsset } from '@/lib/media';
import { takePendingImage } from '@/lib/pending';
import { colors, space } from '@/lib/theme';

const MAX_ZOOM = 4;

// Ajuste da foto de perfil: arrastar para posicionar e zoom. O recorte é feito no
// próprio aparelho (funciona também no navegador) antes do envio.
export default function AvatarCrop() {
  const { session, refreshPlayer } = useAuth();
  const [img] = useState(() => takePendingImage());
  const { width } = useWindowDimensions();
  const S = Math.min(width - 32, 340); // lado da área de recorte
  const base = img ? S / Math.min(img.width, img.height) : 1; // escala que cobre a área

  const [zoom, setZoom] = useState(1);
  const [off, setOff] = useState({ x: 0, y: 0 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const live = useRef({ zoom: 1, off: { x: 0, y: 0 } });
  const start = useRef({ x: 0, y: 0, zoom: 1 });

  // mantém a foto cobrindo toda a área (sem bordas vazias)
  const apply = useCallback(
    (o: { x: number; y: number }, z: number) => {
      let c = o;
      if (img) {
        const k = base * z;
        const mx = Math.max(0, (img.width * k - S) / 2);
        const my = Math.max(0, (img.height * k - S) / 2);
        c = { x: Math.max(-mx, Math.min(mx, o.x)), y: Math.max(-my, Math.min(my, o.y)) };
      }
      live.current = { zoom: z, off: c };
      setZoom(z);
      setOff(c);
    },
    [img, base, S],
  );

  const drag = useMemo(
    () =>
      // refs só são lidos dentro dos gestos, não na renderização
      // eslint-disable-next-line react-hooks/refs
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          start.current = { ...live.current.off, zoom: live.current.zoom };
        },
        onPanResponderMove: (_e, g) => apply({ x: start.current.x + g.dx, y: start.current.y + g.dy }, live.current.zoom),
      }),
    [apply],
  );

  const TRACK = S - 100;
  const slider = useMemo(
    () =>
      // eslint-disable-next-line react-hooks/refs
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          start.current = { ...live.current.off, zoom: live.current.zoom };
        },
        onPanResponderMove: (_e, g) => {
          const z = Math.max(1, Math.min(MAX_ZOOM, start.current.zoom + (g.dx / TRACK) * (MAX_ZOOM - 1)));
          apply(live.current.off, z);
        },
      }),
    [apply, TRACK],
  );

  const step = (d: number) => apply(live.current.off, Math.max(1, Math.min(MAX_ZOOM, live.current.zoom + d)));

  const save = async () => {
    if (!img || !session) return;
    setBusy(true);
    setError(null);
    try {
      const k = base * zoom;
      const left = S / 2 - (img.width * k) / 2 + off.x;
      const top = S / 2 - (img.height * k) / 2 + off.y;
      const size = Math.min(Math.floor(S / k), img.width, img.height);
      const originX = Math.max(0, Math.min(img.width - size, Math.round(-left / k)));
      const originY = Math.max(0, Math.min(img.height - size, Math.round(-top / k)));

      const ctx = ImageManipulator.manipulate(img.uri);
      ctx.crop({ originX, originY, width: size, height: size }).resize({ width: 512, height: 512 });
      const rendered = await ctx.renderAsync();
      const out = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.85 });

      const url = await uploadAsset({ bucket: 'avatars', userId: session.user.id, uri: out.uri, mime: 'image/jpeg', ext: 'jpg', maxBytes: 5 * 1024 * 1024 });
      await api('/me', { method: 'PATCH', body: { avatarUrl: url } });
      await refreshPlayer();
      router.back();
    } catch (e) {
      setError(errMsg(e));
      setBusy(false);
    }
  };

  if (!img) {
    return (
      <Screen>
        <Header title="Ajustar foto" />
        <Muted>Nenhuma foto selecionada. Volte e escolha uma foto.</Muted>
      </Screen>
    );
  }

  const k = base * zoom;
  const dW = img.width * k;
  const dH = img.height * k;
  const r = S / 2 - 2;
  const hole = `M0 0H${S}V${S}H0Z M${S / 2 - r} ${S / 2} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0`;

  return (
    <Screen>
      <Header title="Ajustar foto" />
      <Muted style={{ textAlign: 'center' }}>Arraste para posicionar e use o zoom para enquadrar.</Muted>

      <View style={[s.stage, { width: S, height: S }]} {...drag.panHandlers}>
        <Image
          source={{ uri: img.uri }}
          style={{ position: 'absolute', width: dW, height: dH, left: S / 2 - dW / 2 + off.x, top: S / 2 - dH / 2 + off.y }}
        />
        <Svg width={S} height={S} style={StyleSheet.absoluteFill} pointerEvents="none">
          <Path d={hole} fill="rgba(10,13,11,0.75)" fillRule="evenodd" />
          <Circle cx={S / 2} cy={S / 2} r={r} stroke={colors.cream} strokeWidth={2} fill="none" />
        </Svg>
      </View>

      <View style={s.zoomRow}>
        <Pressable onPress={() => step(-0.25)} hitSlop={8}>
          <Ionicons name="remove-circle-outline" size={28} color={colors.text} />
        </Pressable>
        <View style={[s.track, { width: TRACK }]} {...slider.panHandlers}>
          <View style={[s.trackFill, { width: TRACK, backgroundColor: 'rgba(244,243,236,0.18)' }]} />
          <View style={[s.trackFill, { width: ((zoom - 1) / (MAX_ZOOM - 1)) * TRACK }]} />
          <View style={[s.thumb, { left: ((zoom - 1) / (MAX_ZOOM - 1)) * TRACK - 12 }]} />
        </View>
        <Pressable onPress={() => step(0.25)} hitSlop={8}>
          <Ionicons name="add-circle-outline" size={28} color={colors.text} />
        </Pressable>
      </View>
      <Text style={{ textAlign: 'center', color: colors.muted, fontSize: 12 }}>Zoom {zoom.toFixed(1)}x</Text>

      <ErrorText>{error}</ErrorText>
      <Button label="Salvar foto" loading={busy} onPress={save} style={{ borderRadius: 999 }} />
      <Button label="Cancelar" variant="dark" onPress={() => router.back()} style={{ borderRadius: 999 }} />
    </Screen>
  );
}

const s = StyleSheet.create({
  stage: { alignSelf: 'center', overflow: 'hidden', borderRadius: 20, backgroundColor: colors.card, marginVertical: space.sm },
  zoomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.md },
  track: { height: 28, justifyContent: 'center' },
  trackFill: { position: 'absolute', left: 0, height: 4, borderRadius: 2, backgroundColor: colors.cream },
  thumb: { position: 'absolute', width: 24, height: 24, borderRadius: 12, backgroundColor: colors.cream, borderWidth: 3, borderColor: colors.bg },
});
