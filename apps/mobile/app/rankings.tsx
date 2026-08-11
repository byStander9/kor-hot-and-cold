import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getRankingPage } from '../src/api/client';
import type { RankingEntry } from '../src/api/types';
import { GAME_DATA_VERSION, getTemperature, parseSeed } from '../src/game/domain';
import { colors, getGutter, spacing } from '../src/theme';

const PAGE_SIZE = 200;

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function RankingsScreen() {
  const params = useLocalSearchParams<{
    answer?: string | string[];
    seed?: string | string[];
    total?: string | string[];
    v?: string | string[];
  }>();
  const seed = parseSeed(getSingleParam(params.seed));
  const version = Number(getSingleParam(params.v));
  const answer = getSingleParam(params.answer) ?? '';
  const total = Number(getSingleParam(params.total));
  const { width } = useWindowDimensions();
  const gutter = getGutter(width);
  const [items, setItems] = useState<RankingEntry[]>([]);
  const [nextOffset, setNextOffset] = useState<number | null>(0);
  const [firstState, setFirstState] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );
  const [footerState, setFooterState] = useState<'idle' | 'loading' | 'error'>(
    'idle',
  );
  const [includeSensitive, setIncludeSensitive] = useState(false);
  const loadingOffset = useRef<number | null>(null);

  const valid =
    seed !== null &&
    version === GAME_DATA_VERSION &&
    Number.isInteger(total) &&
    total > 0 &&
    answer.length > 0;

  const loadPage = useCallback(
    async (offset: number) => {
      if (!valid || loadingOffset.current === offset) return;
      loadingOffset.current = offset;
      if (offset === 0) setFirstState('loading');
      else setFooterState('loading');

      try {
        const page = await getRankingPage({
          seed: seed as number,
          version,
          offset,
          limit: PAGE_SIZE,
          includeSensitive,
        });
        setItems((current) => {
          if (offset === 0) return page.items;
          const knownRanks = new Set(current.map((item) => item.rank));
          return [...current, ...page.items.filter((item) => !knownRanks.has(item.rank))];
        });
        setNextOffset(page.nextOffset);
        setFirstState('ready');
        setFooterState('idle');
      } catch {
        if (offset === 0) setFirstState('error');
        else setFooterState('error');
      } finally {
        loadingOffset.current = null;
      }
    },
    [includeSensitive, seed, valid, version],
  );

  useEffect(() => {
    if (valid) void loadPage(0);
  }, [loadPage, valid]);

  function applySensitivePreference(nextValue: boolean) {
    setItems([]);
    setNextOffset(0);
    setFirstState('loading');
    setFooterState('idle');
    loadingOffset.current = null;
    setIncludeSensitive(nextValue);
  }

  function toggleSensitiveWords() {
    if (includeSensitive) {
      applySensitivePreference(false);
      return;
    }

    const message =
      '전체 사전에는 성인·비속어·폭력·약물 관련 단어가 표시될 수 있습니다. 이 선택은 현재 화면에만 적용되고 저장하거나 공유하지 않습니다.';
    if (Platform.OS === 'web') {
      if (globalThis.confirm(message)) applySensitivePreference(true);
      return;
    }

    Alert.alert('민감 단어 포함 전체 순위', message, [
      { text: '취소', style: 'cancel' },
      { text: '포함해서 보기', onPress: () => applySensitivePreference(true) },
    ]);
  }

  if (!valid) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerCard}>
          <Text style={styles.errorTitle}>전체 순위를 열 수 없어요.</Text>
          <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.darkButton}>
            <Text style={styles.darkButtonText}>게임으로 돌아가기</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const header = (
    <View style={styles.headerContent}>
      <View style={styles.titleRow}>
        <Pressable
          accessibilityLabel="게임으로 돌아가기"
          accessibilityRole="button"
          onPress={() => router.back()}
          style={styles.backButton}>
          <MaterialCommunityIcons color={colors.ink} name="arrow-left" size={24} />
        </Pressable>
        <View>
          <Text style={styles.title}>전체 순위</Text>
          <Text style={styles.subtitle}>시드 #{seed.toLocaleString('ko-KR')}</Text>
        </View>
      </View>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>정답</Text>
        <Text style={styles.answer}>{answer}</Text>
        <Text style={styles.total}>총 {total.toLocaleString('ko-KR')}개 단어</Text>
      </View>
      <View style={styles.safetyCard}>
        <View style={styles.safetyCopy}>
          <Text style={styles.safetyTitle}>
            민감 단어 {includeSensitive ? '포함' : '제외'}
          </Text>
          <Text style={styles.safetyBody}>
            기본 순위는 명시된 민감 단어를 숨깁니다. 선택은 저장·공유되지 않아요.
          </Text>
        </View>
        <Pressable
          accessibilityHint="민감 단어가 표시될 수 있다는 경고를 먼저 확인합니다"
          accessibilityLabel={
            includeSensitive ? '민감 단어 다시 숨기기' : '민감 단어 포함해서 보기'
          }
          accessibilityRole="button"
          accessibilityState={{ selected: includeSensitive }}
          onPress={toggleSensitiveWords}
          style={({ pressed }) => [styles.safetyButton, pressed && styles.pressed]}>
          <Text style={styles.safetyButtonText}>
            {includeSensitive ? '다시 숨기기' : '포함해서 보기'}
          </Text>
        </Pressable>
      </View>
    </View>
  );

  if (firstState === 'error') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{ paddingHorizontal: gutter }}>{header}</View>
        <View style={styles.centerCard}>
          <Text style={styles.errorTitle}>순위를 불러오지 못했어요.</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => void loadPage(0)}
            style={styles.darkButton}>
            <Text style={styles.darkButtonText}>다시 시도</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.lightButton}>
            <Text style={styles.lightButtonText}>게임으로 돌아가기</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        contentContainerStyle={{ paddingBottom: spacing.xxxl, paddingHorizontal: gutter }}
        data={items}
        keyExtractor={(item) => String(item.rank)}
        ListEmptyComponent={
          firstState === 'loading' ? (
            <View style={styles.skeletonList}>
              {Array.from({ length: 8 }, (_, index) => (
                <View key={index} style={styles.skeletonRow} />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>순위 데이터가 없어요.</Text>
              <Pressable accessibilityRole="button" onPress={() => void loadPage(0)}>
                <Text style={styles.retryLink}>다시 시도</Text>
              </Pressable>
            </View>
          )
        }
        ListFooterComponent={
          items.length === 0 ? null : (
            <View style={styles.footer}>
              {footerState === 'loading' ? (
                <>
                  <ActivityIndicator color={colors.coldDark} size="small" />
                  <Text style={styles.footerText}>다음 200개를 불러오는 중…</Text>
                </>
              ) : footerState === 'error' ? (
                <>
                  <Text style={styles.footerText}>더 불러오지 못했어요</Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => nextOffset !== null && void loadPage(nextOffset)}>
                    <Text style={styles.retryLink}>다시 시도</Text>
                  </Pressable>
                </>
              ) : nextOffset === null ? (
                <Text style={styles.footerText}>전체 순위를 모두 불러왔어요</Text>
              ) : null}
            </View>
          )
        }
        ListHeaderComponent={header}
        onEndReached={() => {
          if (nextOffset !== null && footerState === 'idle') void loadPage(nextOffset);
        }}
        onEndReachedThreshold={0.6}
        renderItem={({ item }) => {
          const temperature = getTemperature(item.rank);
          const tint =
            item.rank <= 10 ? '#FDF1EE' : item.rank <= 100 ? '#FEF6EC' : colors.surface;
          return (
            <View
              accessible
              accessibilityLabel={`${item.rank}위, ${item.word}, ${temperature.label}`}
              style={[styles.rankRow, { backgroundColor: tint }]}>
              <Text style={styles.rankNumber}>{item.rank.toLocaleString('ko-KR')}위</Text>
              <Text style={styles.rankWord}>{item.word}</Text>
              <Text style={styles.rankTemperature}>{temperature.label}</Text>
            </View>
          );
        }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.paper, flex: 1 },
  headerContent: { gap: spacing.lg, paddingBottom: spacing.xl, paddingTop: spacing.sm },
  titleRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  backButton: { alignItems: 'center', height: 48, justifyContent: 'center', width: 48 },
  title: { color: colors.ink, fontSize: 20, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: 12, lineHeight: 16 },
  summaryCard: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 20,
    borderWidth: 1,
    padding: spacing.xl,
  },
  summaryLabel: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  answer: { color: colors.ink, fontSize: 28, fontWeight: '800', lineHeight: 36 },
  total: { color: colors.muted, fontSize: 14, marginTop: spacing.xs },
  safetyCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
  },
  safetyCopy: { flex: 1, gap: spacing.xs },
  safetyTitle: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  safetyBody: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  safetyButton: {
    borderColor: colors.line,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  safetyButtonText: { color: colors.ink, fontSize: 12, fontWeight: '700' },
  rankRow: {
    alignItems: 'center',
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 68,
    paddingHorizontal: spacing.md,
  },
  rankNumber: { color: colors.ink, fontSize: 14, fontWeight: '800', width: 88 },
  rankWord: { color: colors.ink, flex: 1, fontSize: 16, fontWeight: '600' },
  rankTemperature: { color: colors.muted, fontSize: 12, textAlign: 'right', width: 78 },
  skeletonList: { gap: 1 },
  skeletonRow: { backgroundColor: colors.line, borderRadius: 8, height: 68, opacity: 0.5 },
  footer: {
    alignItems: 'center',
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 88,
  },
  footerText: { color: colors.muted, fontSize: 14 },
  retryLink: { color: colors.coldDark, fontSize: 14, fontWeight: '600', padding: spacing.sm },
  centerCard: {
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 20,
    borderWidth: 1,
    gap: spacing.md,
    margin: spacing.xxl,
    marginTop: spacing.xxxl,
    padding: spacing.xl,
    width: '85%',
  },
  errorTitle: { color: colors.ink, fontSize: 20, fontWeight: '800' },
  darkButton: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderRadius: 14,
    justifyContent: 'center',
    minHeight: 52,
  },
  darkButtonText: { color: colors.white, fontSize: 16, fontWeight: '600' },
  lightButton: {
    alignItems: 'center',
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 52,
  },
  lightButtonText: { color: colors.ink, fontSize: 16, fontWeight: '600' },
  emptyState: { alignItems: 'center', gap: spacing.sm, padding: spacing.xxxl },
  emptyText: { color: colors.muted, fontSize: 14 },
  pressed: { opacity: 0.72 },
});
