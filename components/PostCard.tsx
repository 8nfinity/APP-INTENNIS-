import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Image, Pressable, Share, StyleSheet, View } from 'react-native';

import { Avatar, Muted, Text } from '@/components/ui';
import { api, errMsg } from '@/lib/api';
import { confirmAsk, notify } from '@/lib/dialog';
import { timeAgo } from '@/lib/game';
import { colors, radius, space } from '@/lib/theme';
import { Post } from '@/lib/types';

const TAG = { jogo: 'Jogo', treino: 'Treino', foto: 'Foto', video: 'Vídeo' } as const;

function VideoBox({ uri, style }: { uri: string; style: object }) {
  const player = useVideoPlayer(uri);
  return <VideoView player={player} style={style} nativeControls contentFit="cover" />;
}

function Media({ post, style }: { post: Post; style: object }) {
  if (!post.mediaUrl) return null;
  return post.tag === 'video' ? <VideoBox uri={post.mediaUrl} style={style} /> : <Image source={{ uri: post.mediaUrl }} style={style} resizeMode="cover" />;
}

export function PostCard({
  post,
  canDelete,
  onChanged,
  variant = 'feed',
}: {
  post: Post;
  canDelete: boolean;
  onChanged: () => void;
  variant?: 'feed' | 'profile';
}) {
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
  const comments = () => router.push({ pathname: '/comments', params: { postId: post.id } });
  const share = () => Share.share({ message: `${post.authorName} no In Tennis Club: ${post.text}` }).catch(() => {});
  const subtitle = `${TAG[post.tag]}${post.score ? ` · ${post.score}` : ''} · ${timeAgo(post.createdAt)}`;

  if (variant === 'profile') {
    // referência "My profile": cartão com cabeçalho, texto, foto arredondada e pílulas
    return (
      <View style={s.pCard}>
        <View style={s.headRow}>
          <Avatar name={post.authorName} url={post.authorAvatarUrl} size={34} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '600', fontSize: 14 }}>{post.authorName}</Text>
            <Muted style={{ fontSize: 12 }}>{subtitle}</Muted>
          </View>
        </View>
        {!!post.text && <Text style={{ fontSize: 15, lineHeight: 21 }}>{post.text}</Text>}
        <Media post={post} style={s.pMedia} />
        <View style={s.pActions}>
          <Pressable onPress={comments} style={s.pill}>
            <Ionicons name="chatbubble-outline" size={15} color={colors.text} />
            <Text style={s.pillText}>{post.comments}</Text>
          </Pressable>
          <Pressable onPress={kudos} style={s.pill}>
            <Ionicons name={post.kudosByMe ? 'tennisball' : 'tennisball-outline'} size={15} color={post.kudosByMe ? colors.lime : colors.text} />
            <Text style={s.pillText}>{post.kudos}</Text>
          </Pressable>
          <View style={{ flex: 1 }} />
          {canDelete && (
            <Pressable onPress={remove} hitSlop={10}>
              <Ionicons name="ellipsis-horizontal" size={20} color={colors.muted} />
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  // referência do feed: cabeçalho, foto grande arredondada, ações embaixo
  return (
    <View style={{ gap: space.md }}>
      <View style={s.headRow}>
        <Avatar name={post.authorName} url={post.authorAvatarUrl} size={46} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '600', fontSize: 16 }}>{post.authorName}</Text>
          <Muted style={{ fontSize: 14 }}>{subtitle}</Muted>
        </View>
        {canDelete && (
          <Pressable onPress={remove} hitSlop={10}>
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.muted} />
          </Pressable>
        )}
      </View>
      {!!post.text && <Text style={{ fontSize: 16, lineHeight: 22 }}>{post.text}</Text>}
      <Media post={post} style={s.fMedia} />
      <View style={s.fActions}>
        <Pressable onPress={kudos} style={s.fAction} hitSlop={8}>
          <Ionicons name={post.kudosByMe ? 'tennisball' : 'tennisball-outline'} size={25} color={post.kudosByMe ? colors.lime : colors.text} />
          <Text style={s.fCount}>{post.kudos}</Text>
        </Pressable>
        <Pressable onPress={comments} style={s.fAction} hitSlop={8}>
          <Ionicons name="chatbubble-ellipses-outline" size={23} color={colors.text} />
          <Text style={s.fCount}>{post.comments}</Text>
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable onPress={share} hitSlop={8}>
          <Ionicons name="arrow-redo-outline" size={24} color={colors.text} />
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  headRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  fMedia: { width: '100%', aspectRatio: 0.95, borderRadius: radius.xl, backgroundColor: colors.cardAlt },
  fActions: { flexDirection: 'row', alignItems: 'center', gap: space.xl, paddingHorizontal: 2 },
  fAction: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  fCount: { color: colors.muted, fontSize: 15, fontWeight: '500' },
  pCard: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: space.md, gap: space.md },
  pMedia: { width: '100%', height: 200, borderRadius: radius.md, backgroundColor: colors.cardAlt },
  pActions: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.cardAlt, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  pillText: { fontSize: 13, fontWeight: '600' },
});
