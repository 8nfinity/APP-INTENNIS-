import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Avatar, Button, Chip, Eyebrow, Headline, Screen, SectionHead, Segmented, Sub, Text, formatBRL } from '@/components/ui';
import { InstallBanner } from '@/components/InstallBanner';
import { useFetch } from '@/lib/api';
import { pad2 } from '@/lib/booking';
import { WEEK_SHORT, addDays, longDay, occupancyDots, parseISO } from '@/lib/dates';
import { setDraft, useDraft } from '@/lib/draft';
import { toISO } from '@/lib/game';
import { useLayout } from '@/lib/layout';
import { photoForSurface } from '@/lib/photos';
import { colors, radius, space } from '@/lib/theme';
import { Court, Teacher } from '@/lib/types';

type Summary = { days: { date: string; taken: number }[]; slotsPerDay: number };

// Agendar: tela escura com foto. Escolha jogo livre ou aula, quadra, dia e horário.
export default function Agendar() {
  const today = toISO(new Date());
  const draft = useDraft();
  const { contentW } = useLayout();

  const courtsQ = useFetch<{ courts: Court[]; hours: number[]; maxDaysAhead: number }>('/courts');
  const teachersQ = useFetch<{ teachers: Teacher[] }>('/teachers');
  const stripQ = useFetch<Summary>(`/availability/summary?from=${today}&days=14`);

  const courts = courtsQ.data?.courts ?? [];
  const hours = courtsQ.data?.hours ?? [];
  const teachers = teachersQ.data?.teachers ?? [];
  const court = courts.find((c) => c.id === draft.courtId) ?? courts[0];
  const teacher = draft.kind === 'aula' ? (teachers.find((t) => t.id === draft.teacherId) ?? teachers[0]) : undefined;
  const dayQ = useFetch<{ taken: { courtId: string; hour: number }[]; teacherTaken: number[] }>(
    `/availability?date=${draft.date}${teacher ? `&teacherId=${teacher.id}` : ''}`,
  );

  const price = court ? court.pricePerHour + (teacher?.pricePerHour ?? 0) : 0;
  const now = new Date();
  const noTeacher = draft.kind === 'aula' && !teacher;

  const unavailable = (h: number) =>
    !court ||
    noTeacher ||
    (draft.date === today && h <= now.getHours()) ||
    !!dayQ.data?.taken.some((t) => t.courtId === court.id && t.hour === h) ||
    (!!teacher && !!dayQ.data?.teacherTaken.includes(h));

  const strip = Array.from({ length: 6 }, (_, i) => addDays(today, i));
  const pillW = Math.floor((contentW - space.sm * 5) / 6);

  const reload = () => {
    courtsQ.reload();
    teachersQ.reload();
    stripQ.reload();
    dayQ.reload();
  };

  const review = () => {
    if (!court || draft.hour === null) return;
    setDraft({ courtId: court.id, teacherId: teacher?.id ?? null });
    router.push('/checkout');
  };

  return (
    <Screen tone="dark" photo={photoForSurface(court?.surface)} back={false} tab refreshing={false} onRefresh={reload}>
      <InstallBanner />
      <View style={{ gap: 8 }}>
        <Eyebrow>Bora pra quadra</Eyebrow>
        <Headline style={{ fontSize: 34, lineHeight: 37 }}>Seu próximo jogo{'\n'}começa aqui.</Headline>
        <Sub>Escolha seu horário e deixe o resto com a gente.</Sub>
      </View>

      <Segmented
        options={[
          { key: 'jogo', label: 'Jogo livre' },
          { key: 'aula', label: 'Aula com professor' },
        ]}
        value={draft.kind}
        onChange={(k) => setDraft({ kind: k, hour: null })}
      />

      {draft.kind === 'aula' && (
        <View style={{ gap: space.sm }}>
          <SectionHead title="Seu professor" />
          {teachers.length === 0 && <Sub>Nenhum professor cadastrado ainda. Fale com o clube.</Sub>}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
            {teachers.map((t) => {
              const on = t.id === teacher?.id;
              return (
                <Pressable key={t.id} onPress={() => setDraft({ teacherId: t.id, hour: null })} style={[s.teacher, on && { backgroundColor: colors.lime, borderColor: colors.lime }]}>
                  <Avatar name={t.name} url={t.avatarUrl} size={40} />
                  <Text style={{ fontSize: 13, fontWeight: '500', color: on ? colors.onLime : colors.onForest }} numberOfLines={1}>
                    {t.name}
                  </Text>
                  <Text style={{ fontSize: 11, color: on ? colors.onLime : colors.forestMuted }}>{formatBRL(t.pricePerHour)}/aula</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      <View style={{ gap: space.sm }}>
        <View style={s.rowBetween}>
          <Text style={s.h2}>Sua quadra</Text>
          <Sub style={{ fontSize: 11 }}>60 minutos por reserva</Sub>
        </View>
        <View style={s.wrap}>
          {courts.map((c, i) => (
            <Chip
              key={c.id}
              label={/^quadra\s*\d+$/i.test(c.name) ? `Quadra ${pad2(i + 1)}` : c.name}
              active={c.id === court?.id}
              onPress={() => setDraft({ courtId: c.id, hour: null })}
            />
          ))}
        </View>
        {court && (
          <View style={s.rowBetween}>
            <Sub style={{ flex: 1 }}>
              {court.surface} · {formatBRL(court.pricePerHour)} por hora{teacher ? ` + ${formatBRL(teacher.pricePerHour)} do professor` : ''}
            </Sub>
            <Sub style={{ fontSize: 10, opacity: 0.7 }}>Imagem ilustrativa</Sub>
          </View>
        )}
      </View>

      <View style={{ gap: space.md }}>
        <SectionHead title="Quando?" action="Ver calendário" onAction={() => router.push('/calendario')} />
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          {strip.map((iso) => {
            const d = parseISO(iso);
            const on = iso === draft.date;
            const dots = occupancyDots(stripQ.data?.days.find((x) => x.date === iso)?.taken ?? 0, stripQ.data?.slotsPerDay ?? 0);
            return (
              <Pressable key={iso} onPress={() => setDraft({ date: iso, hour: null })} style={[s.day, { width: pillW }, on && { backgroundColor: colors.lime, borderColor: colors.lime }]}>
                <Text style={{ fontSize: 11, color: on ? colors.onLime : colors.forestMuted }}>{WEEK_SHORT[d.getDay()]}</Text>
                <Text style={{ fontSize: 20, fontWeight: '500', color: on ? colors.onLime : colors.onForest }}>{d.getDate()}</Text>
                <View style={{ flexDirection: 'row', gap: 2, height: 4 }}>
                  {Array.from({ length: dots }, (_, k) => (
                    <View key={k} style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: on ? colors.onLime : colors.forestMuted }} />
                  ))}
                </View>
              </Pressable>
            );
          })}
        </View>
        <Sub style={{ fontSize: 11.5 }}>Ou escolha outra data (até 1 ano):</Sub>
        <Pressable onPress={() => router.push('/calendario')} style={s.dateField}>
          <Text style={{ fontSize: 15 }}>{draft.date.split('-').reverse().join('/')}</Text>
          <Ionicons name="calendar-outline" size={18} color={colors.onForest} />
        </Pressable>
      </View>

      <View style={{ gap: space.sm }}>
        <View style={s.rowBetween}>
          <Text style={s.h2}>Horários</Text>
          <Sub style={{ fontSize: 11 }}>{longDay(draft.date)}</Sub>
        </View>
        {noTeacher && <Sub>Escolha um professor para ver os horários da aula.</Sub>}
        <View style={s.wrap}>
          {hours.map((h) => {
            const off = unavailable(h);
            const on = draft.hour === h;
            return (
              <Pressable key={h} disabled={off} onPress={() => setDraft({ hour: h })} style={[s.time, on && { backgroundColor: colors.lime, borderColor: colors.lime }, off && { opacity: 0.3 }]}>
                <Text style={{ fontSize: 13, fontWeight: on ? '700' : '500', color: on ? colors.onLime : colors.onForest, textDecorationLine: off ? 'line-through' : 'none' }}>{pad2(h)}:00</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Button
        label={draft.hour === null ? 'Escolha um horário' : 'Revisar e pagar'}
        trailing={draft.hour === null ? undefined : formatBRL(price)}
        arrow={draft.hour === null}
        disabled={draft.hour === null || !court}
        onPress={review}
      />
    </Screen>
  );
}

const s = StyleSheet.create({
  h2: { fontSize: 18, fontWeight: '500', letterSpacing: -0.3 },
  rowBetween: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  teacher: { width: 124, alignItems: 'center', gap: 4, padding: space.md, borderRadius: radius.lg, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)' },
  day: { alignItems: 'center', gap: 3, paddingVertical: 12, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' },
  dateField: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', paddingHorizontal: 16, paddingVertical: 14 },
  time: { paddingVertical: 11, paddingHorizontal: 16, minWidth: 74, alignItems: 'center', borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' },
});
