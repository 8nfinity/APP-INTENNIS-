import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar, Empty, ErrorState, Loading, Muted, Screen, Text } from '@/components/ui';
import { useFetch } from '@/lib/api';
import { useMe } from '@/lib/auth';
import { toISO } from '@/lib/game';
import { colors, radius, space } from '@/lib/theme';
import { GameEvent } from '@/lib/types';

type IconName = keyof typeof Ionicons.glyphMap;
const CAT: Record<GameEvent['category'], { label: string; colors: [string, string]; icon: IconName }> = {
  torneio: { label: 'Torneio', colors: ['#3A2A10', '#B8862E'], icon: 'trophy' },
  jogo: { label: 'Jogo', colors: ['#16281C', '#4E7A5A'], icon: 'tennisball' },
  aula: { label: 'Aula', colors: ['#12243A', '#3C78A0'], icon: 'school' },
  novidade: { label: 'Novidade', colors: ['#331A27', '#A8506F'], icon: 'megaphone' },
};
const WEEK_FULL = ['DOMINGO', 'SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÁBADO'];
const WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const MON = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

function daysUntil(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  const t = new Date();
  return Math.round((new Date(y, m - 1, d).getTime() - new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime()) / 86400000);
}

function EventCard({ e, watching, onToggle }: { e: GameEvent; watching: boolean; onToggle: () => void }) {
  const cat = CAT[e.category];
  const [, m, d] = e.date.split('-').map(Number);
  const n = daysUntil(e.date);
  return (
    <LinearGradient colors={cat.colors} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={s.card}>
      <Ionicons name={cat.icon} size={190} color="rgba(244,243,236,0.10)" style={s.art} />
      <View style={s.cardTop}>
        <View style={s.catPill}>
          <Ionicons name={cat.icon} size={13} color={colors.cream} />
          <Text style={s.catText}>{cat.label}</Text>
        </View>
        <View style={s.dateTile}>
          <Text style={s.dateDay}>{d}</Text>
          <Text style={s.dateMon}>{MON[m - 1]}</Text>
        </View>
      </View>
      <View style={s.cardBottom}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={s.place}>{e.place || 'In Tennis Club'}</Text>
          <Text style={s.cardTitle}>{e.title}</Text>
          <Text style={s.cardSub} numberOfLines={2}>
            {n <= 0 ? 'Hoje' : n === 1 ? 'Amanhã' : `Em ${n} dias`}
            {e.description ? ` · ${e.description}` : ''}
          </Text>
        </View>
        <Pressable onPress={onToggle} style={[s.bell, watching && { backgroundColor: colors.cream }]} hitSlop={6}>
          <Ionicons name={watching ? 'notifications' : 'notifications-outline'} size={20} color={watching ? colors.onAccent : colors.cream} />
        </Pressable>
      </View>
    </LinearGradient>
  );
}

export default function Eventos() {
  const me = useMe();
  const { data, error, loading, reload } = useFetch<{ events: GameEvent[] }>('/events');
  const [view, setView] = useState<'lista' | 'calendario'>('lista');
  const [watching, setWatching] = useState<Set<string>>(new Set());
  const [picked, setPicked] = useState<string | null>(null);
  const events = data?.events ?? [];
  const now = new Date();

  const toggle = (id: string) =>
    setWatching((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const months = [0, 1, 2].map((k) => new Date(now.getFullYear(), now.getMonth() + k, 1));
  const byDay = (iso: string) => events.filter((e) => e.date === iso);

  return (
    <Screen tab refreshing={false} onRefresh={reload}>
      <View style={s.head}>
        <View>
          <Muted style={{ fontSize: 12, letterSpacing: 0.5 }}>
            {WEEK_FULL[now.getDay()]}, {now.getDate()} {MON[now.getMonth()]}
          </Muted>
          <Text style={s.title}>Eventos</Text>
        </View>
        <Pressable onPress={() => router.push('/perfil')}>
          <Avatar name={me.name} url={me.avatarUrl} size={44} />
        </Pressable>
      </View>

      {/* Abas da referência: lista, calendário e (admin) novo evento */}
      <View style={s.tabs}>
        {(
          [
            { key: 'lista', icon: 'albums-outline' },
            { key: 'calendario', icon: 'calendar-outline' },
          ] as const
        ).map((t) => (
          <Pressable key={t.key} onPress={() => setView(t.key)} style={[s.tab, view === t.key && s.tabOn]}>
            <Ionicons name={t.icon} size={21} color={view === t.key ? colors.cream : colors.muted} />
          </Pressable>
        ))}
        {me.isAdmin && (
          <Pressable onPress={() => router.push('/admin/events')} style={s.tab}>
            <Ionicons name="add-circle-outline" size={22} color={colors.muted} />
          </Pressable>
        )}
      </View>

      {loading && <Loading />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && events.length === 0 && <Empty icon="calendar-outline" title="Sem eventos por enquanto" hint="Novidades do clube aparecem aqui." />}

      {view === 'lista' && events.map((e) => <EventCard key={e.id} e={e} watching={watching.has(e.id)} onToggle={() => toggle(e.id)} />)}

      {view === 'calendario' && (
        <View style={{ gap: space.xl }}>
          {months.map((first) => {
            const y = first.getFullYear();
            const m = first.getMonth();
            const dim = new Date(y, m + 1, 0).getDate();
            const pad = first.getDay();
            return (
              <View key={`${y}-${m}`} style={{ gap: space.md }}>
                <Text style={s.monthTitle}>
                  {MONTHS[m]} {y}
                </Text>
                <View style={{ flexDirection: 'row' }}>
                  {WEEK.map((w) => (
                    <Text key={w} style={s.week}>
                      {w}
                    </Text>
                  ))}
                </View>
                <View style={s.grid}>
                  {Array.from({ length: pad }, (_, i) => (
                    <View key={`p${i}`} style={s.cell} />
                  ))}
                  {Array.from({ length: dim }, (_, i) => {
                    const iso = toISO(new Date(y, m, i + 1));
                    const evs = byDay(iso);
                    const on = picked === iso;
                    return (
                      <Pressable key={iso} style={s.cell} disabled={!evs.length} onPress={() => setPicked(on ? null : iso)}>
                        {evs.length ? (
                          <LinearGradient colors={CAT[evs[0].category].colors} style={[s.evDay, on && { borderColor: colors.cream }]}>
                            <Text style={{ fontWeight: '700', fontSize: 14 }}>{i + 1}</Text>
                          </LinearGradient>
                        ) : (
                          <Text style={s.dayNum}>{i + 1}</Text>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
                {picked && picked.startsWith(`${y}-${String(m + 1).padStart(2, '0')}`) &&
                  byDay(picked).map((e) => <EventCard key={e.id} e={e} watching={watching.has(e.id)} onToggle={() => toggle(e.id)} />)}
              </View>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 32, fontWeight: '800', letterSpacing: -0.8 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabOn: { borderBottomWidth: 2, borderBottomColor: colors.cream, marginBottom: -1 },
  card: { height: 280, borderRadius: radius.xl, padding: space.lg, justifyContent: 'space-between', overflow: 'hidden' },
  art: { position: 'absolute', right: -30, bottom: -20 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  catPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(10,13,11,0.35)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  catText: { fontSize: 12, fontWeight: '600' },
  dateTile: { width: 58, height: 62, borderRadius: 14, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' },
  dateDay: { color: colors.onAccent, fontSize: 24, fontWeight: '800', lineHeight: 26 },
  dateMon: { color: colors.onAccent, fontSize: 11, fontWeight: '600' },
  cardBottom: { flexDirection: 'row', alignItems: 'flex-end', gap: space.md },
  place: { fontSize: 12, color: 'rgba(244,243,236,0.75)' },
  cardTitle: { fontSize: 26, fontWeight: '800', letterSpacing: -0.6, lineHeight: 30 },
  cardSub: { fontSize: 13, color: 'rgba(244,243,236,0.8)' },
  bell: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(10,13,11,0.35)', alignItems: 'center', justifyContent: 'center' },
  monthTitle: { textAlign: 'center', fontSize: 16, fontWeight: '600' },
  week: { flex: 1, textAlign: 'center', color: colors.muted, fontSize: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, height: 46, alignItems: 'center', justifyContent: 'center' },
  dayNum: { fontSize: 14, color: colors.text },
  evDay: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
});
