import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { PostCard } from '@/components/PostCard';
import { Empty, ErrorState, Eyebrow, Headline, Loading, Screen, Sub, Text } from '@/components/ui';
import { useFetch } from '@/lib/api';
import { useMe } from '@/lib/auth';
import { colors, space } from '@/lib/theme';
import { Post } from '@/lib/types';

export default function Social() {
  const me = useMe();
  const { data, error, loading, reload } = useFetch<{ posts: Post[] }>('/posts');
  const posts = data?.posts ?? [];

  return (
    <Screen tab refreshing={false} onRefresh={reload}>
      <View style={{ gap: 8 }}>
        <Eyebrow>Nossa comunidade</Eyebrow>
        <Headline>O jogo continua{'\n'}por aqui.</Headline>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md }}>
          <Sub style={{ flex: 1 }}>Histórias de quem está IN.</Sub>
          <Pressable onPress={() => router.push('/new-post')} style={{ backgroundColor: colors.lime, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 9 }}>
            <Text style={{ fontSize: 12.5, fontWeight: '700', color: colors.onLime }}>+ Publicar</Text>
          </Pressable>
        </View>
      </View>

      {loading && <Loading />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && posts.length === 0 && <Empty icon="chatbubble-outline" title="Ninguém postou ainda" hint="Seja o primeiro: conte como foi seu jogo ou mostre aquele ponto." />}

      {posts.map((p) => (
        <PostCard key={p.id} post={p} canDelete={p.authorId === me.id || me.isAdmin} onChanged={reload} />
      ))}
    </Screen>
  );
}
