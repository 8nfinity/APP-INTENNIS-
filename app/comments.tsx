import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Avatar, Button, Card, Empty, ErrorText, Field, Loading, Muted, Screen, Text } from '@/components/ui';
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
    <Screen padTop={false}>
      {loading && <Loading />}
      {data && data.comments.length === 0 && <Empty title="Sem comentários" hint="Comece a conversa." />}
      {data?.comments.map((c) => (
        <Card key={c.id} style={{ flexDirection: 'row', gap: space.md }}>
          <Avatar name={c.authorName} url={c.authorAvatarUrl} size={38} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontWeight: '800' }}>
              {c.authorName} <Muted>· {timeAgo(c.createdAt)}</Muted>
            </Text>
            <Text style={{ color: colors.text, marginTop: 2 }}>{c.text}</Text>
          </View>
        </Card>
      ))}
      <Field label="Seu comentário" value={text} onChangeText={setText} maxLength={500} placeholder="Escreva algo legal..." />
      <ErrorText>{error}</ErrorText>
      <Button label="Comentar" loading={busy} disabled={!text.trim()} onPress={send} />
    </Screen>
  );
}
