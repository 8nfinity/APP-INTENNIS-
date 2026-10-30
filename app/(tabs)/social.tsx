import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar, Button, Card, Empty, ErrorState, H1, Loading, Muted, Screen } from '@/components/ui';
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

  return (
    <Screen refreshing={false} onRefresh={reload}>
      <H1 style={{ fontSize: 34 }}>Social</H1>
      <Button label="Publicar jogo, foto ou vídeo" arrow onPress={() => router.push('/new-post')} />
      {loading && <Loading />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && data.posts.length === 0 && (
        <Empty title="Ninguém postou ainda" hint="Seja o primeiro: conte como foi seu jogo ou mostre aquele ponto." />
      )}
      {data?.posts.map((p) => (
        <Card key={p.id} style={{ gap: space.md, padding: 0, overflow: 'hidden' }}>
          <View style={s.head}>
            <Avatar name={p.authorName} />
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{p.authorName}</Text>
              <Muted>
                @{p.authorUsername} · {timeAgo(p.createdAt)}
              </Muted>
            </View>
            {(p.authorId === me?.id || me?.isAdmin) && (
              <Pressable onPress={() => remove(p.id)} hitSlop={10}>
                <Ionicons name="trash-outline" size={20} color={colors.muted} />
              </Pressable>
            )}
          </View>

          {!!p.text && <Text style={s.text}>{p.text}</Text>}

          <View style={s.stats}>
            <View>
              <Muted>Tipo</Muted>
              <Text style={s.statValue}>{TAG_LABEL[p.tag]}</Text>
            </View>
            {p.score && (
              <View>
                <Muted>Placar</Muted>
                <Text style={[s.statValue, { color: colors.accent }]}>{p.score}</Text>
              </View>
            )}
          </View>

          {p.mediaUrl &&
            (p.tag === 'video' ? <VideoBox uri={p.mediaUrl} /> : <Image source={{ uri: p.mediaUrl }} style={s.media} resizeMode="cover" />)}

          <View style={s.actions}>
            <Pressable onPress={() => kudos(p.id)} style={s.action} hitSlop={8}>
              <Ionicons
                name={p.kudosByMe ? 'tennisball' : 'tennisball-outline'}
                size={24}
                color={p.kudosByMe ? colors.accent : colors.muted}
              />
              <Text style={[s.count, p.kudosByMe && { color: colors.accent }]}>{p.kudos}</Text>
            </Pressable>
            <Pressable onPress={() => router.push({ pathname: '/comments', params: { postId: p.id } })} style={s.action} hitSlop={8}>
              <Ionicons name="chatbubble-outline" size={22} color={colors.muted} />
              <Text style={s.count}>{p.comments}</Text>
            </Pressable>
          </View>
        </Card>
      ))}
    </Screen>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, paddingBottom: 0 },
  name: { color: colors.text, fontWeight: '800', fontSize: 15 },
  text: { color: colors.text, fontSize: 15, lineHeight: 22, paddingHorizontal: space.lg },
  stats: { flexDirection: 'row', gap: 32, paddingHorizontal: space.lg },
  statValue: { color: colors.text, fontWeight: '900', fontSize: 20, letterSpacing: -0.5 },
  media: { width: '100%', height: 300, backgroundColor: colors.cardAlt, borderRadius: radius.sm },
  actions: { flexDirection: 'row', gap: space.xl, padding: space.lg, paddingTop: 0 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  count: { color: colors.muted, fontWeight: '800' },
});
