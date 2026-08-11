import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GameComposer } from '../src/components/game-composer';
import { GuessRow } from '../src/components/guess-row';
import { LoadingScreen } from '../src/components/loading-screen';
import { SeedModal } from '../src/components/seed-modal';
import {
  createRandomSeed,
  GAME_DATA_VERSION,
  getTemperature,
  parseSeed,
  sortGuessesByRank,
} from '../src/game/domain';
import { useGame } from '../src/game/use-game';
import { colors, getGutter, spacing } from '../src/theme';

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function IndexScreen() {
  const params = useLocalSearchParams<{ seed?: string | string[]; v?: string | string[] }>();
  const rawSeed = getSingleParam(params.seed);
  const rawVersion = getSingleParam(params.v);
  const seed = parseSeed(rawSeed);
  const version = rawVersion === undefined ? GAME_DATA_VERSION : Number(rawVersion);

  useEffect(() => {
    if (rawSeed !== undefined) return;
    router.replace({
      pathname: '/',
      params: { seed: String(createRandomSeed()), v: String(GAME_DATA_VERSION) },
    });
  }, [rawSeed]);

  if (rawSeed === undefined) return <LoadingScreen />;
  if (seed === null || version !== GAME_DATA_VERSION) {
    return (
      <LoadingScreen
        error="지원하지 않는 시드 또는 게임 데이터 버전이에요."
        onRetry={() =>
          router.replace({
            pathname: '/',
            params: {
              seed: String(createRandomSeed()),
              v: String(GAME_DATA_VERSION),
            },
          })
        }
      />
    );
  }

  return <GameScreen gameVersion={version} key={`${version}:${seed}`} seed={seed} />;
}

function GameScreen({ seed, gameVersion }: { seed: number; gameVersion: number }) {
  const { width } = useWindowDimensions();
  const gutter = getGutter(width);
  const [input, setInput] = useState('');
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [seedModalVisible, setSeedModalVisible] = useState(false);
  const game = useGame(seed, gameVersion);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardOpen(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const sortedGuesses = useMemo(
    () => sortGuessesByRank(game.guesses),
    [game.guesses],
  );

  if (game.loadState === 'loading') {
    return <LoadingScreen slow={game.slowLoading} />;
  }
  if (game.loadState === 'error' || !game.game) {
    return <LoadingScreen error={game.loadError} onRetry={game.retryInitialLoad} />;
  }

  const hasProgress = game.guesses.length > 0 && !game.finished;

  function replaceSeed(nextSeed: number) {
    const navigate = () => {
      setSeedModalVisible(false);
      router.replace({
        pathname: '/',
        params: { seed: String(nextSeed), v: String(GAME_DATA_VERSION) },
      });
    };

    if (!hasProgress) {
      navigate();
      return;
    }

    Alert.alert('다른 게임을 열까요?', '현재 게임을 나가고 다른 시드를 열까요?', [
      { text: '계속하기', style: 'cancel' },
      { text: '다른 시드 열기', onPress: navigate },
    ]);
  }

  function confirmReveal() {
    Alert.alert('정답을 공개할까요?', '정답을 공개하면 이 게임은 끝나요.', [
      { text: '계속하기', style: 'cancel' },
      {
        text: '정답 보기',
        style: 'destructive',
        onPress: () => void game.runReveal(),
      },
    ]);
  }

  function retryInlineAction() {
    if (game.inlineError?.operation === 'guess') void game.runGuess(input);
    if (game.inlineError?.operation === 'hint') void game.runHint();
    if (game.inlineError?.operation === 'reveal') void game.runReveal();
  }

  const listHeader = (
    <View style={{ gap: spacing.lg }}>
      <View style={styles.header}>
        <Text numberOfLines={1} style={styles.brand}>
          <Text style={styles.brandHot}>뜨겁고</Text>{' '}
          <Text style={styles.brandCold}>차갑게</Text>
        </Text>
      </View>

      <Pressable
        accessibilityHint="다른 시드 또는 랜덤 게임을 선택합니다"
        accessibilityRole="button"
        onPress={() => setSeedModalVisible(true)}
        style={({ pressed }) => [styles.seedButton, pressed && styles.pressed]}>
        <Text style={styles.seedText}>시드 #{seed.toLocaleString('ko-KR')}</Text>
        <MaterialCommunityIcons color={colors.muted} name="chevron-down" size={20} />
      </Pressable>

      {game.finished ? (
        <View style={[styles.resultCard, game.solved ? styles.solvedCard : styles.gaveUpCard]}>
          <Text style={[styles.resultLabel, game.solved && styles.solvedText]}>
            {game.solved ? '정답!' : '이 시드의 정답'}
          </Text>
          <Text style={[styles.resultWord, game.solved && styles.solvedText]}>
            {game.answer}
          </Text>
          <Text style={[styles.resultBody, game.solved && styles.solvedBody]}>
            {game.solved
              ? `${game.attemptCount}번 만에 찾았어요`
              : '다음 게임에서 다시 도전해 보세요.'}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => replaceSeed(createRandomSeed())}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
            <MaterialCommunityIcons color={colors.white} name="shuffle-variant" size={22} />
            <Text style={styles.primaryButtonText}>랜덤 새 게임</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: '/rankings',
                params: {
                  answer: game.answer,
                  seed: String(seed),
                  total: String(game.game?.wordCount ?? 0),
                  v: String(gameVersion),
                },
              })
            }
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
            <Text style={styles.secondaryButtonText}>전체 순위 보기</Text>
          </Pressable>
        </View>
      ) : game.guesses.length === 0 ? (
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>비밀 단어를 찾아보세요</Text>
          <Text style={styles.heroBody}>의미가 가까울수록 순위 숫자가 작아져요.</Text>
          <View style={styles.temperatureTrack}>
            <View style={styles.trackCold} />
            <View style={styles.trackNeutral} />
            <View style={styles.trackWarm} />
            <View style={styles.trackHot} />
          </View>
          <View style={styles.trackLabels}>
            <Text style={styles.trackLabel}>차가움</Text>
            <Text style={styles.trackLabel}>뜨거움</Text>
          </View>
        </View>
      ) : (
        <View
          style={[
            styles.bestCard,
            { borderLeftColor: game.bestRank <= 10 ? colors.hot : game.bestRank <= 1000 ? colors.warm : colors.cold },
          ]}>
          <Text style={styles.bestLabel}>최고 기록</Text>
          <Text numberOfLines={1} adjustsFontSizeToFit style={styles.bestRank}>
            {game.bestRank.toLocaleString('ko-KR')}위
          </Text>
          <View style={styles.bestMetaRow}>
            <View style={styles.temperatureLabel}>
              <MaterialCommunityIcons
                color={colors.inkSoft}
                name="thermometer"
                size={20}
              />
              <Text style={styles.bestTemperature}>
                {getTemperature(game.bestRank).label}
              </Text>
            </View>
            <Text style={styles.bestMeta}>
              시도 {game.attemptCount}회 · 힌트 {game.hintCount}/3
            </Text>
          </View>
        </View>
      )}

      <View style={styles.listTitleRow}>
        <Text style={styles.listTitle}>추측한 단어</Text>
        <Text style={styles.listCount}>{game.guesses.length}개</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.screen}>
        <FlatList
          contentContainerStyle={{
            gap: spacing.sm,
            paddingBottom: spacing.xxl,
            paddingHorizontal: gutter,
          }}
          data={sortedGuesses}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          keyExtractor={(item) => item.guess}
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <MaterialCommunityIcons
                  color={colors.cold}
                  name="thermometer"
                  size={28}
                />
              </View>
              <Text style={styles.emptyText}>첫 단어를 입력하면 순위가 쌓여요.</Text>
            </View>
          }
          ListHeaderComponent={listHeader}
          renderItem={({ item }) => <GuessRow guess={item} />}
          showsVerticalScrollIndicator={false}
        />

        {!game.finished ? (
          <GameComposer
            action={game.action}
            error={game.inlineError}
            hintCount={game.hintCount}
            input={input}
            keyboardOpen={keyboardOpen}
            onChangeInput={setInput}
            onHint={() => void game.runHint()}
            onRetry={retryInlineAction}
            onReveal={confirmReveal}
            onSubmit={game.runGuess}
          />
        ) : null}
      </KeyboardAvoidingView>

      <SeedModal
        currentSeed={seed}
        onClose={() => setSeedModalVisible(false)}
        onOpenSeed={replaceSeed}
        onRandomSeed={() => replaceSeed(createRandomSeed())}
        visible={seedModalVisible}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.paper, flex: 1 },
  screen: { flex: 1 },
  header: { height: 52, justifyContent: 'center' },
  brand: { fontSize: 18, fontWeight: '800' },
  brandHot: { color: colors.hot },
  brandCold: { color: colors.cold },
  seedButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 44,
  },
  seedText: { color: colors.inkSoft, fontSize: 14, fontWeight: '600' },
  heroCard: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 20,
    borderWidth: 1,
    padding: spacing.xl,
  },
  heroTitle: { color: colors.ink, fontSize: 20, fontWeight: '800' },
  heroBody: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: spacing.sm },
  temperatureTrack: {
    borderRadius: 999,
    flexDirection: 'row',
    height: 8,
    marginTop: spacing.xl,
    overflow: 'hidden',
  },
  trackCold: { backgroundColor: colors.cold, flex: 1 },
  trackNeutral: { backgroundColor: colors.line, flex: 1 },
  trackWarm: { backgroundColor: colors.warm, flex: 1 },
  trackHot: { backgroundColor: colors.hot, flex: 1 },
  trackLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  trackLabel: { color: colors.muted, fontSize: 12 },
  bestCard: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 20,
    borderWidth: 1,
    borderLeftWidth: 4,
    padding: spacing.xl,
  },
  bestLabel: { color: colors.muted, fontSize: 14, fontWeight: '600' },
  bestRank: { color: colors.ink, fontSize: 40, fontWeight: '800', lineHeight: 44 },
  bestMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  temperatureLabel: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs },
  bestTemperature: { color: colors.inkSoft, fontSize: 14, fontWeight: '600' },
  bestMeta: { color: colors.muted, fontSize: 14 },
  resultCard: { borderRadius: 20, padding: spacing.xl },
  solvedCard: { backgroundColor: colors.hot },
  gaveUpCard: {
    backgroundColor: colors.surface,
    borderColor: colors.muted,
    borderStyle: 'dashed',
    borderWidth: 1,
  },
  resultLabel: { color: colors.muted, fontSize: 14, fontWeight: '600' },
  resultWord: { color: colors.ink, fontSize: 28, fontWeight: '800', lineHeight: 36 },
  resultBody: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  solvedText: { color: colors.white },
  solvedBody: { color: '#FFF3EE' },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderRadius: 14,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    marginTop: spacing.xl,
    minHeight: 52,
  },
  primaryButtonText: { color: colors.white, fontSize: 16, fontWeight: '600' },
  secondaryButton: {
    alignItems: 'center',
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: spacing.md,
    minHeight: 52,
  },
  secondaryButtonText: { color: colors.ink, fontSize: 16, fontWeight: '600' },
  listTitleRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  listTitle: { color: colors.ink, fontSize: 20, fontWeight: '800' },
  listCount: { color: colors.muted, fontSize: 14 },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: spacing.md,
    justifyContent: 'center',
    minHeight: 144,
  },
  emptyIcon: {
    alignItems: 'center',
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  emptyText: { color: colors.muted, fontSize: 14 },
  pressed: { opacity: 0.72 },
});
