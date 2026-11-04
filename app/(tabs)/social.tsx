import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Logo } from '@/components/Logo';
import { PostCard } from '@/components/PostCard';
import { Avatar, Empty, ErrorState, Loading, Muted, RoundButton, Screen, Text } from '@/components/ui';
import { useFetch } from '@/lib/api';
import { useMe } from '@/lib/auth';
import { avatarColor } from '@/lib/game';
import { useLayout } from '@/lib/layout';
import { colors, space } from '@/lib/theme';
import { Post } from '@/lib/types';

export default function Social() {
  const me = useMe();
  const { insets } = useLayout();
  const { data, error, loading, reload } = useFetch<{ posts: Post[] }>('/posts');
  const [author, setAuthor] = useState<string | null>(null);
  const posts = data?.posts ?? [];

  // "Stories": quem postou recentemente, com a mídia mais recente de cada um
  const stories: Post[] = [];
  for (const p of posts) if (!stories.some((x) => x.authorId === p.authorId)) stories.push(p);
  const shown = author ? posts.filter((p) => p.authorId === author) : posts;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Screen tab refreshing={false} onRefresh={reload}>
        <View style={s.top}>
          <RoundButton icon="add" onPress={() => router.push('/new-post')} />
          <Logo size={16} />
          <Pressable onPress={() => router.push('/perfil')}>
            <Avatar name={me.name} url={me.avatarUrl} size={44} />
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: space.lg }}>
          <Pressable onPress={() => router.push('/new-post')} style={[s.story, s.storyNew]}>
            <Ionicons name="add" size={30} color={colors.cream} />
            <Text style={s.storyNewText}>Publicar</Text>
          </Pressable>
          {stories.map((p) => {
            const on = author === p.authorId;
            return (
              <Pressable key={p.authorId} onPress={() => setAuthor(on ? null : p.authorId)} style={[s.story, on && s.storyOn]}>
                {p.mediaUrl && p.tag !== 'video' ? (
                  <Image source={{ uri: p.mediaUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                ) : (
                  <View style={[StyleSheet.absoluteFill, { backgroundColor: avatarColor(p.authorName), opacity: 0.35 }]} />
                )}
                <View style={s.storyAvatar}>
                  <Avatar name={p.authorName} url={p.authorAvatarUrl} size={36} ring={colors.bg} />
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
        {author && (
          <Pressable onPress={() => setAuthor(null)}>
            <Muted>
              Mostrando só {stories.find((p) => p.authorId === author)?.authorName}. <Text style={{ color: colors.cream, fontWeight: '600' }}>Ver todos</Text>
            </Muted>
          </Pressable>
        )}

        {loading && <Loading />}
        {error && <ErrorState message={error} onRetry={reload} />}
        {data && posts.length === 0 && <Empty title="Ninguém postou ainda" hint="Seja o primeiro: conte como foi seu jogo ou mostre aquele ponto." />}

        <View style={{ gap: space.xl + 8 }}>
          {shown.map((p) => (
            <PostCard key={p.id} post={p} canDelete={p.authorId === me.id || me.isAdmin} onChanged={reload} />
          ))}
        </View>
      </Screen>

      {/* botão flutuante de publicar, como os botões redondos da referência */}
      <Pressable onPress={() => router.push('/new-post')} style={[s.fab, { right: 20 + insets.right }]}>
        <Ionicons name="camera" size={24} color={colors.onAccent} />
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  story: { width: 76, height: 104, borderRadius: 38, overflow: 'hidden', backgroundColor: colors.cardAlt, borderWidth: 2, borderColor: 'rgba(244,243,236,0.15)', justifyContent: 'flex-end', alignItems: 'center' },
  storyOn: { borderColor: colors.cream },
  storyNew: { justifyContent: 'center', borderStyle: 'dashed', borderColor: 'rgba(244,243,236,0.35)', gap: 4 },
  storyNewText: { fontSize: 11, fontWeight: '600' },
  storyAvatar: { marginBottom: 8 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
});
