import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { CourtArt } from '@/components/CourtArt';
import { InstallBanner } from '@/components/InstallBanner';
import { Avatar, Button, Card, Chip, ErrorState, Muted, Screen, Section, Stepper, Text, formatBRL } from '@/components/ui';
import { useFetch } from '@/lib/api';
import { pad2 } from '@/lib/booking';
import { toISO } from '@/lib/game';
import { colors, radius, space } from '@/lib/theme';
import { BookingKind, Court, Teacher } from '@/lib/types';

const WEEK = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const MONTHS_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

type Summary = { days: { date: string; taken: number }[]; slotsPerDay: number };

const parse = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const addDays = (iso: string, n: number) => {
  const d = parse(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
};
const longDate = (iso: string) => {
  const d = parse(iso);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
};

export default function Agendar() {
  const today = toISO(new Date());
  const [date, setDate] = useState(today);
  const [hour, setHour] = useState<number | null>(null);
  const [courtId, setCourtId] = useState<string | null>(null);
  const [kind, setKind] = useState<BookingKind>('jogo');
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [cursor, setCursor] = useState(() => ({ y: new Date().getFullYear(), m: new Date().getMonth() }));

  const courtsQ = useFetch<{ courts: Court[]; hours: number[]; maxDaysAhead: number }>('/courts');
  const teachersQ = useFetch<{ teachers: Teacher[] }>('/teachers');
  const teachers = teachersQ.data?.teachers ?? [];
  const teacher = kind === 'aula' ? (teachers.find((t) => t.id === teacherId) ?? teachers[0]) : undefined;
  const maxDate = addDays(today, courtsQ.data?.maxDaysAhead ?? 365);
  const monthStart = toISO(new Date(cursor.y, cursor.m, 1));
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const monthFrom = monthStart < today ? today : monthStart;
  const monthDays = Math.max(1, daysInMonth - parse(monthFrom).getDate() + 1);
  const monthQ = useFetch<Summary>(`/availability/summary?from=${monthFrom}&days=${monthDays}`);
  const dayQ = useFetch<{ taken: { courtId: string; hour: number }[]; teacherTaken: number[] }>(
    `/availability?date=${date}${teacher ? `&teacherId=${teacher.id}` : ''}`,
  );

  const courts = courtsQ.data?.courts ?? [];
  const hours = courtsQ.data?.hours ?? [];
  const court = courts.find((c) => c.id === courtId) ?? courts[0];
  const price = court ? court.pricePerHour + (teacher ? teacher.pricePerHour : 0) : 0;
  const now = new Date();
  const noTeacher = kind === 'aula' && !teacher;

  // indisponível: horário passado, quadra ocupada ou (aula) professor já ocupado
  const unavailable = (c: Court | undefined, h: number) =>
    !c ||
    noTeacher ||
    (date === today && h <= now.getHours()) ||
    !!dayQ.data?.taken.some((t) => t.courtId === c.id && t.hour === h) ||
    (!!teacher && !!dayQ.data?.teacherTaken.includes(h));

  const pickDate = (iso: string) => {
    setDate(iso);
    setHour(null);
  };
  const canPrev = cursor.y > now.getFullYear() || (cursor.y === now.getFullYear() && cursor.m > now.getMonth());
  const canNext = toISO(new Date(cursor.y, cursor.m + 1, 1)) <= maxDate;
  const move = (delta: number) => {
    const d = new Date(cursor.y, cursor.m + delta, 1);
    setCursor({ y: d.getFullYear(), m: d.getMonth() });
  };

  // grade do mês com os dias do mês anterior/seguinte apagados, como na referência
  const firstDow = new Date(cursor.y, cursor.m, 1).getDay();
  const prevDays = new Date(cursor.y, cursor.m, 0).getDate();
  const cells: { iso: string | null; label: number }[] = [
    ...Array.from({ length: firstDow }, (_, i) => ({ iso: null, label: prevDays - firstDow + i + 1 })),
    ...Array.from({ length: daysInMonth }, (_, i) => ({ iso: toISO(new Date(cursor.y, cursor.m, i + 1)), label: i + 1 })),
  ];
  while (cells.length % 7) cells.push({ iso: null, label: cells.length - firstDow - daysInMonth + 1 });

  const occ = (iso: string) => {
    const total = monthQ.data?.slotsPerDay ?? 0;
    const taken = monthQ.data?.days.find((d) => d.date === iso)?.taken ?? 0;
    if (!total) return null;
    const r = taken / total;
    return r >= 0.95 ? colors.danger : r >= 0.6 ? colors.hot : null;
  };

  const goPay = () => {
    if (!court || hour === null) return;
    router.push({ pathname: '/checkout', params: { courtId: court.id, date, hour: String(hour), kind, teacherId: teacher?.id ?? '' } });
  };

  const reload = () => {
    courtsQ.reload();
    monthQ.reload();
    dayQ.reload();
  };

  return (
    <Screen tab refreshing={false} onRefresh={reload}>
      <InstallBanner />
      <Text style={s.title}>Reservar quadra</Text>
      <Stepper steps={['Quadra', 'Data e horário', 'Confirmar']} current={hour === null ? 1 : 2} />

      {courtsQ.error && <ErrorState message={courtsQ.error} onRetry={reload} />}

      {/* Cartão do "serviço" (referência LUXE) */}
      {court && (
        <Card style={s.service}>
          <CourtArt surface={court.surface} size={96} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={s.serviceName}>
              {court.name} · {court.surface}
            </Text>
            <Muted style={{ lineHeight: 18 }}>
              {kind === 'aula'
                ? teacher
                  ? `Aula com ${teacher.name} (${formatBRL(teacher.pricePerHour)}) + quadra.`
                  : 'Nenhum professor disponível no momento.'
                : 'Quadra livre para jogar com quem você quiser.'}
            </Muted>
            <View style={s.serviceMeta}>
              <Ionicons name="time-outline" size={15} color={colors.muted} />
              <Muted>60 min</Muted>
              <Text style={s.servicePrice}>{formatBRL(price)}</Text>
            </View>
          </View>
        </Card>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
        {courts.map((c) => (
          <Chip
            key={c.id}
            label={`${c.name} · ${c.surface}`}
            active={c.id === court?.id}
            onPress={() => {
              setCourtId(c.id);
              setHour(null);
            }}
          />
        ))}
      </ScrollView>
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <Chip label="Jogo livre" icon="tennisball-outline" active={kind === 'jogo'} onPress={() => setKind('jogo')} />
        <Chip
          label="Aula com professor"
          icon="school-outline"
          active={kind === 'aula'}
          onPress={() => {
            setKind('aula');
            setHour(null);
          }}
        />
      </View>

      {/* escolha do professor: cada um com o próprio valor */}
      {kind === 'aula' && (
        <View style={{ gap: space.sm }}>
          <Section>Professor</Section>
          {teachers.length === 0 && <Muted>Nenhum professor cadastrado ainda. Fale com o clube.</Muted>}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
            {teachers.map((t) => {
              const on = t.id === teacher?.id;
              return (
                <Pressable
                  key={t.id}
                  onPress={() => {
                    setTeacherId(t.id);
                    setHour(null);
                  }}
                  style={[s.teacher, on && s.teacherOn]}>
                  <Avatar name={t.name} url={t.avatarUrl} size={48} />
                  <Text style={[s.teacherName, on && { color: colors.onAccent }]} numberOfLines={1}>
                    {t.name}
                  </Text>
                  <Text style={[s.teacherPrice, on && { color: colors.onAccent }]}>{formatBRL(t.pricePerHour)}/aula</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      <Section>Selecione a data</Section>
      <Card style={{ gap: space.md }}>
        <View style={s.monthHead}>
          <Pressable onPress={() => canPrev && move(-1)} hitSlop={12} style={{ opacity: canPrev ? 1 : 0.2 }}>
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </Pressable>
          <Text style={s.monthTitle}>
            {MONTHS[cursor.m]} {cursor.y}
          </Text>
          <Pressable onPress={() => canNext && move(1)} hitSlop={12} style={{ opacity: canNext ? 1 : 0.2 }}>
            <Ionicons name="chevron-forward" size={20} color={colors.text} />
          </Pressable>
        </View>
        <View style={{ flexDirection: 'row' }}>
          {WEEK.map((w) => (
            <Text key={w} style={s.weekDay}>
              {w}
            </Text>
          ))}
        </View>
        <View style={s.grid}>
          {cells.map((c, i) => {
            if (!c.iso) {
              return (
                <View key={`x${i}`} style={s.cell}>
                  <Text style={[s.dayNum, { color: 'rgba(244,243,236,0.22)' }]}>{c.label}</Text>
                </View>
              );
            }
            const iso = c.iso;
            const off = iso < today || iso > maxDate;
            const on = iso === date;
            const dot = off ? null : occ(iso);
            return (
              <Pressable key={iso} disabled={off} onPress={() => pickDate(iso)} style={s.cell}>
                <View style={[s.dayCircle, on && s.dayOn]}>
                  <Text style={[s.dayNum, off && { color: 'rgba(244,243,236,0.22)' }, on && { color: colors.onAccent, fontWeight: '700' }]}>{c.label}</Text>
                </View>
                <View style={[s.dot, { backgroundColor: dot && !on ? dot : 'transparent' }]} />
              </Pressable>
            );
          })}
        </View>
        <Muted style={{ textAlign: 'center', fontSize: 11 }}>
          Ponto laranja: dia enchendo · vermelho: lotado · reserve com até 1 ano de antecedência
        </Muted>
      </Card>

      <Section>Selecione o horário</Section>
      <View style={s.times}>
        {hours.map((h) => {
          const off = unavailable(court, h);
          const on = hour === h;
          return (
            <Pressable key={h} disabled={off} onPress={() => setHour(h)} style={[s.time, on && s.timeOn, off && s.timeOff]}>
              <Text style={[s.timeText, on && { color: colors.onAccent, fontWeight: '700' }, off && s.timeTextOff]}>
                {pad2(h)}:00
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Mapa completo do dia: todas as quadras x todos os horários */}
      <Pressable onPress={() => setShowMap(!showMap)} style={s.mapToggle}>
        <Ionicons name="grid-outline" size={17} color={colors.text} />
        <Text style={{ flex: 1, fontWeight: '600' }}>Mapa do dia: todas as quadras</Text>
        <Ionicons name={showMap ? 'chevron-up' : 'chevron-down'} size={18} color={colors.muted} />
      </Pressable>
      {showMap && (
        <Card style={{ gap: 6, padding: space.md }}>
          <View style={s.mapRow}>
            <View style={s.mapHour} />
            {courts.map((c) => (
              <Text key={c.id} style={s.mapHead} numberOfLines={1}>
                {c.name}
              </Text>
            ))}
          </View>
          {hours.map((h) => (
            <View key={h} style={s.mapRow}>
              <Text style={s.mapHour}>{pad2(h)}h</Text>
              {courts.map((c) => {
                const off = unavailable(c, h);
                const on = court?.id === c.id && hour === h;
                return (
                  <Pressable
                    key={c.id}
                    disabled={off}
                    onPress={() => {
                      setCourtId(c.id);
                      setHour(h);
                    }}
                    style={[s.mapCell, on ? s.timeOn : off ? s.mapOff : s.mapFree]}
                  />
                );
              })}
            </View>
          ))}
          <Muted style={{ fontSize: 11, textAlign: 'center' }}>Contorno claro: livre · escuro: ocupado</Muted>
        </Card>
      )}

      <Section>Sua reserva</Section>
      <Card style={s.summary}>
        <View style={s.summaryIcon}>
          <Ionicons name="calendar-outline" size={20} color={colors.text} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontWeight: '600', fontSize: 15 }}>
            {court ? `${court.name} · ${kind === 'aula' ? 'Aula' : 'Jogo livre'}` : '-'}
          </Text>
          <Muted>
            {longDate(date)} • {hour === null ? 'escolha o horário' : `${pad2(hour)}:00`} • 60 min
          </Muted>
        </View>
        <Text style={{ fontWeight: '700', fontSize: 15 }}>{formatBRL(price)}</Text>
      </Card>

      <View style={s.secure}>
        <Ionicons name="shield-checkmark-outline" size={18} color={colors.cream} />
        <Text style={{ flex: 1, fontSize: 13, color: colors.cream }}>Pagamento antecipado garante o seu horário</Text>
        <Text style={{ fontWeight: '700', color: colors.cream }}>Pix ou cartão</Text>
      </View>

      <Button label={hour === null ? 'Escolha um horário' : 'Pagar e reservar'} trailing={formatBRL(price)} disabled={hour === null} onPress={goPay} />
    </Screen>
  );
}

const s = StyleSheet.create({
  title: { textAlign: 'center', fontSize: 18, fontWeight: '700', marginTop: 4 },
  teacher: { width: 120, alignItems: 'center', gap: 6, padding: space.md, borderRadius: radius.lg, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  teacherOn: { backgroundColor: colors.cream, borderColor: colors.cream },
  teacherName: { fontSize: 14, fontWeight: '700', maxWidth: '100%' },
  teacherPrice: { fontSize: 12, color: colors.muted, fontWeight: '600' },
  service: { flexDirection: 'row', gap: space.lg, alignItems: 'center', padding: space.md },
  serviceName: { fontSize: 17, fontWeight: '700' },
  serviceMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  servicePrice: { marginLeft: space.md, color: colors.cream, fontWeight: '700', fontSize: 16 },
  monthHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthTitle: { fontSize: 16, fontWeight: '600' },
  weekDay: { flex: 1, textAlign: 'center', color: colors.muted, fontSize: 11, fontWeight: '500' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 3 },
  dayCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  dayOn: { backgroundColor: colors.cream },
  dayNum: { color: colors.text, fontSize: 15 },
  dot: { width: 4, height: 4, borderRadius: 2, marginTop: 1 },
  times: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  time: { width: '15.3%', minWidth: 52, paddingVertical: 11, borderRadius: radius.sm, alignItems: 'center', backgroundColor: colors.cardAlt, borderWidth: 1, borderColor: colors.border },
  timeOn: { backgroundColor: colors.cream, borderColor: colors.cream },
  timeOff: { backgroundColor: 'rgba(244,243,236,0.03)', borderColor: 'transparent' },
  timeText: { fontSize: 13, fontWeight: '500' },
  timeTextOff: { color: 'rgba(244,243,236,0.25)', textDecorationLine: 'line-through' },
  mapToggle: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: 12, paddingHorizontal: space.lg, borderRadius: radius.md, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  mapRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  mapHour: { width: 34, color: colors.muted, fontSize: 12 },
  mapHead: { flex: 1, textAlign: 'center', color: colors.muted, fontSize: 11, fontWeight: '600' },
  mapCell: { flex: 1, height: 26, borderRadius: 7 },
  mapFree: { borderWidth: 1, borderColor: 'rgba(244,243,236,0.45)' },
  mapOff: { backgroundColor: 'rgba(244,243,236,0.05)' },
  summary: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md },
  summaryIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.cardAlt, alignItems: 'center', justifyContent: 'center' },
  secure: { flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.md, borderRadius: radius.md, borderWidth: 1, borderColor: 'rgba(244,243,236,0.22)' },
});
