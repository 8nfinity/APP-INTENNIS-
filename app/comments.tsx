import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Avatar, Button, Empty, ErrorText, Eyebrow, Field, Headline, Loading, Screen, Sub, Text } from '@/components/ui';
import { api, errMsg, useFetch } from '@/lib/api';
import { timeAgo } from '@/lib/game';
import { colors, space } from '@/lib/theme';
import { Comment } from '@/lib/types';

export default function Comments() {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const { data, loading, reload } = useFetch<{ comments: Comment[] }>(`/posts/${postId}/comments`);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    if (!text.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/posts/${postId}/comments`, { method: 'POST', body: { text: text.trim() } });
      setText('');
      reload();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <View style={{ gap: 8 }}>
        <Eyebrow>Conversa</Eyebrow>
        <Headline>O que a galera disse.</Headline>
      </View>
      {loading && <Loading />}
      {data && data.comments.length === 0 && <Empty icon="chatbubble-outline" title="Sem comentários" hint="Comece a conversa." />}
      {data?.comments.map((c) => (
        <View key={c.id} style={{ flexDirection: 'row', gap: space.md, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Avatar name={c.authorName} url={c.authorAvatarUrl} size={34} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '500' }}>
              {c.authorName} <Sub style={{ fontSize: 11 }}>· {timeAgo(c.createdAt)}</Sub>
            </Text>
            <Text style={{ fontSize: 13, color: '#3B4A41', marginTop: 2 }}>{c.text}</Text>
          </View>
        </View>
      ))}
      <Field label="Seu comentário" value={text} onChangeText={setText} maxLength={500} placeholder="Escreva algo legal..." />
      <ErrorText>{error}</ErrorText>
      <Button label="Comentar" loading={busy} disabled={!text.trim()} onPress={send} />
    </Screen>
  );
}
