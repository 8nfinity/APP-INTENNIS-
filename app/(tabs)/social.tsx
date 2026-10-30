import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar, Button, Card, Muted } from '@/components/ui';
import { useStore } from '@/lib/store';
import { colors, radius, space } from '@/lib/theme';

const TAG_LABEL = { jogo: '🎾 Jogo', treino: '💪 Treino', foto: '📷 Foto', video: '🎬 Vídeo' } as const;

export default function SocialScreen() {
  const { posts, players, toggleKudos } = useStore();

  return (
    <View style={s.screen}>
      <FlatList
        data={posts}
        keyExtractor={(p) => p.id}
        contentContainerStyle={s.content}
        ListHeaderComponent={<Button label="+ Publicar jogo, foto ou vídeo" onPress={() => router.push('/new-post')} />}
        renderItem={({ item }) => {
          const author = players.find((p) => p.id === item.authorId)!;
          return (
            <Card style={{ gap: space.sm }}>
              <View style={s.head}>
                <Avatar player={author} />
                <View style={{ flex: 1 }}>
                  <Text style={s.name}>{author.name}</Text>
                  <Muted>
                    @{author.username} · {item.when}
                  </Muted>
                </View>
                <Text style={s.tag}>{TAG_LABEL[item.tag]}</Text>
              </View>
              <Text style={s.text}>{item.text}</Text>
              {item.score && <Text style={s.score}>{item.score}</Text>}
              {item.imageUri ? (
                <Image source={{ uri: item.imageUri }} style={s.media} resizeMode="cover" />
              ) : item.tag === 'video' ? (
                <View style={[s.media, s.videoPh]}>
                  <Ionicons name="play-circle" size={56} color={colors.ball} />
                </View>
              ) : null}
              <View style={s.actions}>
                <Pressable onPress={() => toggleKudos(item.id)} style={s.action}>
                  <Ionicons
                    name={item.kudosByMe ? 'tennisball' : 'tennisball-outline'}
                    size={22}
                    color={item.kudosByMe ? colors.ball : colors.muted}
                  />
                  <Text style={[s.count, item.kudosByMe && { color: colors.ball }]}>{item.kudos}</Text>
                </Pressable>
                <View style={s.action}>
                  <Ionicons name="chatbubble-outline" size={20} color={colors.muted} />
                  <Text style={s.count}>{item.comments}</Text>
                </View>
              </View>
            </Card>
          );
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg, gap: space.lg, paddingBottom: 40 },
  head: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  name: { color: colors.text, fontWeight: '800', fontSize: 15 },
  tag: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  text: { color: colors.text, fontSize: 15, lineHeight: 21 },
  score: { color: colors.ball, fontWeight: '900', fontSize: 18 },
  media: { width: '100%', height: 220, borderRadius: radius.md },
  videoPh: { backgroundColor: colors.cardAlt, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', gap: space.xl, marginTop: space.xs },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  count: { color: colors.muted, fontWeight: '800' },
});
