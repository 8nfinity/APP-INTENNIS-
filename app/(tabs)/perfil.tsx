import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { PostCard } from '@/components/PostCard';
import { Avatar, Button, Card, Empty, Eyebrow, Loading, RoundButton, Screen, Segmented, StatBox, Sub, Tag, Text } from '@/components/ui';
import { useFetch } from '@/lib/api';
import { useAuth, useMe } from '@/lib/auth';
import { checkinInfo, courtLabel, pad2 } from '@/lib/booking';
import { parseISO, MONTHS_SHORT } from '@/lib/dates';
import { levelFor } from '@/lib/game';
import { colors, space } from '@/lib/theme';
import { Booking, Court, Player, Post } from '@/lib/types';

type Tab = 'posts' | 'reservas' | 'conquistas';

export default function Perfil() {
  const me = useMe();
  const { refreshPlayer } = useAuth();
  const [tab, setTab] = useState<Tab>('posts');
  const rankQ = useFetch<{ players: Player[] }>('/ranking');
  const postsQ = useFetch<{ posts: Post[] }>(`/posts?author=${me.id}`);
  const bookingsQ = useFetch<{ bookings: Booking[] }>('/bookings');
  const courtsQ = useFetch<{ courts: Court[] }>('/courts');

  const lvl = levelFor(me.points);
  const rank = (rankQ.data?.players ?? []).findIndex((p) => p.id === me.id) + 1;
  const games = me.wins + me.losses;
  const winRate = games ? Math.round((me.wins / games) * 100) : 0;
  const courts = courtsQ.data?.courts ?? [];
  const key = (b: Booking) => b.date + pad2(b.hour);
  const bookings = (bookingsQ.data?.bookings ?? []).filter((b) => b.status === 'pago' || b.status === 'concluido').sort((a, b) => key(b).localeCompare(key(a)));

  const badges = [
    { icon: '🎾', label: 'Primeiro jogo', on: games >= 1 },
    { icon: '🔥', label: 'Sequência de 3', on: me.streak >= 3 },
    { icon: '📚', label: 'Aluno dedicado', on: me.classes >= 5 },
    { icon: '🏅', label: '10 vitórias', on: me.wins >= 10 },
    { icon: '🏆', label: 'Top 8', on: rank > 0 && rank <= 8 },
    { icon: '⭐', label: '100 pontos', on: me.points >= 100 },
  ];

  const reload = () => {
    refreshPlayer();
    rankQ.reload();
    postsQ.reload();
    bookingsQ.reload();
  };

  return (
    <Screen tab refreshing={false} onRefresh={reload}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Eyebrow>Seu espaço no clube</Eyebrow>
        <RoundButton icon="settings-outline" label="Configurações" onLight onPress={() => router.push('/settings')} />
      </View>

      <LinearGradient colors={['#E5ECD2', '#EFF3E4']} style={s.panel}>
        <Avatar name={me.name} url={me.avatarUrl} size={84} ring="#fff" />
        <Text style={{ fontSize: 28, letterSpacing: -0.9, marginTop: 12 }}>{me.name}</Text>
        <Sub style={{ fontSize: 12 }}>@{me.username}</Sub>
        {!!me.bio && <Text style={{ fontSize: 13, color: '#4A5A4F', textAlign: 'center', marginTop: 4 }}>{me.bio}</Text>}
        <View style={s.pill}>
          <Text style={{ fontSize: 11.5, fontWeight: '500', color: colors.onLime }}>
            {rank ? `#${rank} no ranking` : 'Sem posição'} · {me.points} pts
          </Text>
        </View>
      </LinearGradient>

      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <StatBox value={String(games)} label="Jogos" />
        <StatBox value={String(me.wins)} label="Vitórias" />
        <StatBox value={`${winRate}%`} label="Aproveitamento" />
      </View>

      <Button label="Editar perfil" variant="ghost" onPress={() => router.push('/edit-profile')} />

      <Segmented<Tab>
        options={[
          { key: 'posts', label: 'Publicações' },
          { key: 'reservas', label: 'Reservas' },
          { key: 'conquistas', label: 'Conquistas' },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'posts' && (
        <View style={{ gap: space.md }}>
          {postsQ.loading && <Loading />}
          {postsQ.data && postsQ.data.posts.length === 0 && (
            <>
              <Empty icon="chatbubble-outline" title="Nenhuma publicação" hint="Mostre seus jogos e melhores momentos." />
              <Button label="Fazer a primeira publicação" variant="ghost" onPress={() => router.push('/new-post')} />
            </>
          )}
          {postsQ.data?.posts.map((p) => (
            <PostCard key={p.id} post={p} canDelete onChanged={postsQ.reload} />
          ))}
        </View>
      )}

      {tab === 'reservas' && (
        <View style={{ gap: space.md }}>
          {bookings.length === 0 && (
            <>
              <Empty icon="calendar-outline" title="Nenhuma reserva ainda" />
              <Button label="Reservar quadra" onPress={() => router.push('/')} />
            </>
          )}
          {bookings.map((b) => {
            const d = parseISO(b.date);
            const court = courts.find((c) => c.id === b.courtId);
            const ci = checkinInfo(b);
            return (
              <Pressable key={b.id} onPress={() => router.push({ pathname: '/booking/[id]', params: { id: b.id } })}>
                <Card style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, padding: 12 }}>
                  <View style={s.date}>
                    <Text style={{ fontSize: 9.5, color: colors.muted }}>{MONTHS_SHORT[d.getMonth()]}</Text>
                    <Text style={{ fontSize: 20, fontWeight: '500', lineHeight: 22 }}>{d.getDate()}</Text>
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ fontSize: 14, fontWeight: '500' }}>
                      {court ? courtLabel(court.name, courts.indexOf(court)) : 'Quadra'} · {pad2(b.hour)}:00
                    </Text>
                    <Sub style={{ fontSize: 11.5 }}>{b.kind === 'aula' ? `Aula${b.teacherName ? ` com ${b.teacherName}` : ''}` : 'Jogo livre'}</Sub>
                  </View>
                  <Tag label={ci.state === 'open' ? 'Check-in' : b.status === 'concluido' ? 'Concluída' : 'Confirmada'} tone={ci.state === 'open' ? 'lime' : 'sage'} />
                </Card>
              </Pressable>
            );
          })}
        </View>
      )}

      {tab === 'conquistas' && (
        <View style={{ gap: space.md }}>
          <Card style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 16, fontWeight: '500', color: lvl.current.color }}>{lvl.current.name}</Text>
              <Sub style={{ fontSize: 11.5 }}>{lvl.next ? `${lvl.toNext} pts para ${lvl.next.name}` : 'Nível máximo'}</Sub>
            </View>
            <View style={s.track}>
              <View style={[s.fill, { width: `${Math.max(3, lvl.progress * 100)}%` }]} />
            </View>
            <Sub style={{ fontSize: 11.5 }}>
              Sequência: {me.streak} vitória{me.streak === 1 ? '' : 's'} seguida{me.streak === 1 ? '' : 's'} · {me.classes} aula{me.classes === 1 ? '' : 's'}
            </Sub>
          </Card>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
            {badges.map((b) => (
              <View key={b.label} style={[s.badge, !b.on && { opacity: 0.35 }]}>
                <Text style={{ fontSize: 24 }}>{b.icon}</Text>
                <Text style={{ fontSize: 10.5, textAlign: 'center', fontWeight: '500' }}>{b.label}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  panel: { borderRadius: 30, paddingVertical: 24, paddingHorizontal: 20, alignItems: 'center', borderWidth: 1, borderColor: '#DCE5C4' },
  pill: { marginTop: 14, backgroundColor: colors.lime, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6 },
  date: { width: 46, height: 50, borderRadius: 12, backgroundColor: colors.field, alignItems: 'center', justifyContent: 'center' },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.sage, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: '#B6D25A', borderRadius: 3 },
  badge: { width: '31%', alignItems: 'center', gap: 4, padding: 12, borderRadius: 16, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
});
