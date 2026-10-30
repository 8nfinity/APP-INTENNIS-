import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { PostCard } from '@/components/PostCard';
import { Avatar, Button, Card, Empty, Loading, Muted, ProgressBar, RoundButton, Screen, Segmented, StatTile, Text } from '@/components/ui';
import { useFetch } from '@/lib/api';
import { useAuth, useMe } from '@/lib/auth';
import { checkinInfo, doCheckIn, pad2 } from '@/lib/booking';
import { fmtDate, levelFor, toISO } from '@/lib/game';
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
  const today = toISO(new Date());
  const key = (b: Booking) => b.date + pad2(b.hour);
  const upcoming = (bookingsQ.data?.bookings ?? []).filter((b) => b.status === 'pago' && b.date >= today).sort((a, b) => key(a).localeCompare(key(b)));
  const done = (bookingsQ.data?.bookings ?? []).filter((b) => b.status === 'concluido');
  const courtName = (id: string) => courtsQ.data?.courts.find((c) => c.id === id)?.name ?? '';

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

  const checkIn = async (id: string) => {
    if (await doCheckIn(id)) reload();
  };

  return (
    <Screen tab refreshing={false} onRefresh={reload}>
      <View style={s.head}>
        <Text style={s.title}>Meu perfil</Text>
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <RoundButton icon="flame-outline" label={String(me.streak)} onPress={() => setTab('conquistas')} />
          <RoundButton icon="settings-outline" onPress={() => router.push('/settings')} />
        </View>
      </View>

      <View style={s.center}>
        <Pressable onPress={() => router.push('/edit-profile')}>
          <Avatar name={me.name} url={me.avatarUrl} size={108} />
        </Pressable>
        <View style={s.nameRow}>
          <Text style={s.name}>{me.name}</Text>
          <Ionicons name={me.isAdmin ? 'shield-checkmark' : 'checkmark-circle'} size={20} color={me.isAdmin ? colors.cream : lvl.current.color} />
        </View>
        <Muted style={{ fontSize: 14 }}>
          {rank ? `#${rank} no ranking` : 'Sem posição'} · {me.points} pts · {lvl.current.name}
        </Muted>
        {!!me.bio && <Text style={s.bio}>{me.bio}</Text>}
      </View>

      <View style={s.stats}>
        <StatTile value={rank ? `#${rank}` : '-'} label="Ranking" accent />
        <StatTile value={String(games)} label="Jogos" />
        <StatTile value={String(me.wins)} label="Vitórias" />
        <StatTile value={`${winRate}%`} label="Aproveit." />
      </View>

      <Segmented<Tab>
        options={[
          { key: 'posts', label: 'Publicações', icon: 'images-outline' },
          { key: 'reservas', label: 'Reservas', icon: 'calendar-outline' },
          { key: 'conquistas', label: 'Conquistas', icon: 'trophy-outline' },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'posts' && (
        <View style={{ gap: space.md }}>
          {postsQ.loading && <Loading />}
          {postsQ.data && postsQ.data.posts.length === 0 && (
            <>
              <Empty icon="images-outline" title="Nenhuma publicação" hint="Mostre seus jogos e melhores momentos." />
              <Button label="Fazer a primeira publicação" variant="ghost" onPress={() => router.push('/new-post')} />
            </>
          )}
          {postsQ.data?.posts.map((p) => (
            <PostCard key={p.id} post={p} variant="profile" canDelete onChanged={postsQ.reload} />
          ))}
        </View>
      )}

      {tab === 'reservas' && (
        <View style={{ gap: space.md }}>
          {upcoming.length === 0 && (
            <>
              <Empty icon="calendar-outline" title="Nenhuma reserva marcada" />
              <Button label="Reservar quadra" onPress={() => router.push('/')} />
            </>
          )}
          {upcoming.map((b) => {
            const ci = checkinInfo(b);
            return (
              <Card key={b.id} style={{ gap: space.md }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                  <View style={s.dateBox}>
                    <Text style={s.dateBoxDay}>{b.date.slice(8)}</Text>
                    <Text style={s.dateBoxMon}>{fmtDate(b.date).slice(3, 5)}/{b.date.slice(2, 4)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '700', fontSize: 16 }}>
                      {b.date === today ? 'Hoje' : fmtDate(b.date)} · {pad2(b.hour)}:00
                    </Text>
                    <Muted>
                      {b.kind === 'aula' ? `Aula${b.teacherName ? ` com ${b.teacherName}` : ''}` : 'Jogo'} · {courtName(b.courtId)}
                    </Muted>
                  </View>
                </View>
                {ci.state === 'open' ? (
                  <Button label="Fazer check-in" arrow onPress={() => checkIn(b.id)} />
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="time-outline" size={15} color={colors.muted} />
                    <Muted>{ci.label}</Muted>
                  </View>
                )}
              </Card>
            );
          })}
          {done.length > 0 && <Muted>{done.length} check-in{done.length > 1 ? 's' : ''} feito{done.length > 1 ? 's' : ''} até agora.</Muted>}
        </View>
      )}

      {tab === 'conquistas' && (
        <View style={{ gap: space.md }}>
          <Card style={{ gap: space.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontWeight: '700', fontSize: 16, color: lvl.current.color }}>{lvl.current.name}</Text>
              <Muted>{lvl.next ? `${lvl.toNext} pts para ${lvl.next.name}` : 'Nível máximo'}</Muted>
            </View>
            <ProgressBar value={lvl.progress} color={colors.lime} />
            <Muted>
              Sequência atual: {me.streak} vitória{me.streak === 1 ? '' : 's'} seguida{me.streak === 1 ? '' : 's'} · {me.classes} aula{me.classes === 1 ? '' : 's'}
            </Muted>
          </Card>
          <View style={s.badges}>
            {badges.map((b) => (
              <Card key={b.label} style={[s.badge, !b.on && { opacity: 0.3 }]}>
                <Text style={{ fontSize: 28 }}>{b.icon}</Text>
                <Text style={s.badgeText}>{b.label}</Text>
              </Card>
            ))}
          </View>
        </View>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 26, fontWeight: '700' },
  center: { alignItems: 'center', gap: 6 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  name: { fontSize: 24, fontWeight: '700' },
  bio: { textAlign: 'center', color: colors.text, opacity: 0.85 },
  stats: { flexDirection: 'row', gap: space.sm },
  dateBox: { width: 52, height: 52, borderRadius: 14, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' },
  dateBoxDay: { color: colors.onAccent, fontSize: 20, fontWeight: '800', lineHeight: 22 },
  dateBoxMon: { color: colors.onAccent, fontSize: 10, fontWeight: '600' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  badge: { width: '31%', alignItems: 'center', padding: space.md, gap: 4 },
  badgeText: { color: colors.text, fontSize: 11, textAlign: 'center', fontWeight: '600' },
});
