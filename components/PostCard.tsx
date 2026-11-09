import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Image, Pressable, Share, StyleSheet, View } from 'react-native';

import { Avatar, Sub, Text } from '@/components/ui';
import { api, errMsg } from '@/lib/api';
import { confirmAsk, notify } from '@/lib/dialog';
import { timeAgo } from '@/lib/game';
import { colors, radius, space } from '@/lib/theme';
import { Post } from '@/lib/types';

function VideoBox({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri);
  return <VideoView player={player} style={s.media} nativeControls contentFit="cover" />;
}

// Publicação do feed e do perfil: cabeçalho, texto, mídia e ações (kudos, comentar, compartilhar).
export function PostCard({ post, canDelete, onChanged }: { post: Post; canDelete: boolean; onChanged: () => void }) {
  const kudos = async () => {
    try {
      await api(`/posts/${post.id}/kudos`, { method: 'POST' });
      onChanged();
    } catch (e) {
      notify('Kudos', errMsg(e));
    }
  };
  const remove = async () => {
    if (!(await confirmAsk('Apagar publicação?', 'Essa ação não pode ser desfeita.', 'Apagar', true))) return;
    try {
      await api(`/posts/${post.id}`, { method: 'DELETE' });
      onChanged();
    } catch (e) {
      notify('Erro', errMsg(e));
    }
  };
  const share = () => Share.share({ message: `${post.authorName} no In Tennis Club: ${post.text}` }).catch(() => {});

  return (
    <View style={s.card}>
      <View style={s.head}>
        <Avatar name={post.authorName} url={post.authorAvatarUrl} size={36} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13.5, fontWeight: '500' }}>{post.authorName}</Text>
          <Sub style={{ fontSize: 11 }}>
            IN Tennis Club · {timeAgo(post.createdAt)}
          </Sub>
        </View>
        {canDelete && (
          <Pressable onPress={remove} hitSlop={10}>
            <Ionicons name="close" size={16} color={colors.soft} />
          </Pressable>
        )}
      </View>

      {!!post.text && <Text style={{ fontSize: 13, lineHeight: 19, color: '#3B4A41' }}>{post.text}</Text>}
      {post.score ? <Text style={{ fontSize: 20, letterSpacing: -0.4 }}>{post.score}</Text> : null}

      {post.mediaUrl && (post.tag === 'video' ? <VideoBox uri={post.mediaUrl} /> : <Image source={{ uri: post.mediaUrl }} style={s.media} resizeMode="cover" />)}

      <View style={s.actions}>
        <Pressable onPress={kudos} style={s.action} hitSlop={8}>
          <Ionicons name={post.kudosByMe ? 'heart' : 'heart-outline'} size={20} color={post.kudosByMe ? '#D9534A' : colors.muted} />
          <Text style={s.count}>{post.kudos}</Text>
        </Pressable>
        <Pressable onPress={() => router.push({ pathname: '/comments', params: { postId: post.id } })} style={s.action} hitSlop={8}>
          <Ionicons name="chatbubble-outline" size={18} color={colors.muted} />
          <Text style={s.count}>{post.comments}</Text>
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable onPress={share} hitSlop={8}>
          <Ionicons name="arrow-redo-outline" size={19} color={colors.muted} />
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: 24, borderWidth: 1, borderColor: colors.border, padding: 14, gap: space.md },
  head: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  media: { width: '100%', height: 230, borderRadius: radius.lg, backgroundColor: colors.sage },
  actions: { flexDirection: 'row', alignItems: 'center', gap: space.xl },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  count: { fontSize: 12.5, color: colors.muted },
});
