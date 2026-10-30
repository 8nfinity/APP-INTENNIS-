import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Alert, Image, Pressable, Share, StyleSheet, View } from 'react-native';

import { Avatar, Button, Card, Empty, ErrorState, H1, Loading, Muted, Screen, Text } from '@/components/ui';
import { api, errMsg, useFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { timeAgo } from '@/lib/game';
import { colors, radius, space } from '@/lib/theme';
import { Post } from '@/lib/types';

const TAG_LABEL = { jogo: 'Jogo', treino: 'Treino', foto: 'Foto', video: 'Vídeo' } as const;

function VideoBox({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri);
  return <VideoView player={player} style={s.media} nativeControls contentFit="cover" />;
}

export default function Social() {
  const { player: me } = useAuth();
  const { data, error, loading, reload } = useFetch<{ posts: Post[] }>('/posts');

  const kudos = async (id: string) => {
    try {
      await api(`/posts/${id}/kudos`, { method: 'POST' });
      reload();
    } catch (e) {
      Alert.alert('Kudos', errMsg(e));
    }
  };

  const remove = (id: string) =>
    Alert.alert('Apagar publicação?', 'Essa ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar',
        style: 'destructive',
        onPress: async () => {
          try {
            await api(`/posts/${id}`, { method: 'DELETE' });
            reload();
          } catch (e) {
            Alert.alert('Erro', errMsg(e));
          }
        },
      },
    ]);

  const share = (p: Post) => Share.share({ message: `${p.authorName} no In Tennis Club: ${p.text}` }).catch(() => {});

  return (
    <Screen tab refreshing={false} onRefresh={reload}>
      <H1 style={{ fontSize: 40, lineHeight: 42 }}>Social</H1>
      <Button label="Publicar jogo, foto ou vídeo" arrow onPress={() => router.push('/new-post')} />
      {loading && <Loading />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && data.posts.length === 0 && (
        <Empty title="Ninguém postou ainda" hint="Seja o primeiro: conte como foi seu jogo ou mostre aquele ponto." />
      )}
      {data?.posts.map((p) => (
        <Card key={p.id} style={{ padding: 0, gap: space.md }}>
          <View style={s.head}>
            <Avatar name={p.authorName} url={p.authorAvatarUrl} size={46} />
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{p.authorName}</Text>
              <Muted>
                {timeAgo(p.createdAt)} · @{p.authorUsername}
              </Muted>
            </View>
            {(p.authorId === me?.id || me?.isAdmin) && (
              <Pressable onPress={() => remove(p.id)} hitSlop={10}>
                <Ionicons name="ellipsis-horizontal" size={22} color={colors.muted} />
              </Pressable>
            )}
          </View>

          {!!p.text && <Text style={s.text}>{p.text}</Text>}

          <View style={s.stats}>
            <View style={s.stat}>
              <Muted>Tipo</Muted>
              <Text style={s.statValue}>{TAG_LABEL[p.tag]}</Text>
            </View>
            <View style={s.divider} />
            <View style={s.stat}>
              <Muted>Placar</Muted>
              <Text style={[s.statValue, !!p.score && { color: colors.accent }]}>{p.score ?? '-'}</Text>
            </View>
            <View style={s.divider} />
            <View style={s.stat}>
              <Muted>Kudos</Muted>
              <Text style={s.statValue}>{p.kudos}</Text>
            </View>
          </View>

          {p.mediaUrl &&
            (p.tag === 'video' ? <VideoBox uri={p.mediaUrl} /> : <Image source={{ uri: p.mediaUrl }} style={s.media} resizeMode="cover" />)}

          <View style={s.actions}>
            <Pressable onPress={() => kudos(p.id)} style={s.action} hitSlop={8}>
              <Ionicons name={p.kudosByMe ? 'tennisball' : 'tennisball-outline'} size={28} color={p.kudosByMe ? colors.accent : colors.text} />
            </Pressable>
            <Pressable onPress={() => router.push({ pathname: '/comments', params: { postId: p.id } })} style={s.action} hitSlop={8}>
              <Ionicons name="chatbubble-outline" size={26} color={colors.text} />
              <Text style={s.count}>{p.comments}</Text>
            </Pressable>
            <Pressable onPress={() => share(p)} style={s.action} hitSlop={8}>
              <Ionicons name="share-outline" size={28} color={colors.text} />
            </Pressable>
          </View>
        </Card>
      ))}
    </Screen>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, paddingBottom: 0 },
  name: { color: colors.text, fontWeight: '800', fontSize: 16 },
  text: { color: colors.text, fontSize: 18, fontWeight: '700', lineHeight: 24, letterSpacing: -0.3, paddingHorizontal: space.lg },
  stats: { flexDirection: 'row', paddingHorizontal: space.lg, alignItems: 'center' },
  stat: { flex: 1, gap: 2 },
  divider: { width: 1, height: 34, backgroundColor: colors.border, marginRight: space.md },
  statValue: { color: colors.text, fontWeight: '900', fontSize: 20, letterSpacing: -0.5 },
  media: { width: '100%', height: 320, backgroundColor: colors.cardAlt, borderRadius: radius.sm },
  actions: { flexDirection: 'row', justifyContent: 'space-around', padding: space.lg, paddingTop: space.xs, borderTopWidth: 1, borderTopColor: colors.border },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  count: { color: colors.muted, fontWeight: '800' },
});
