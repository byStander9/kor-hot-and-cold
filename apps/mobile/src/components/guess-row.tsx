import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { GameGuess } from '../game/domain';
import { colors, spacing } from '../theme';

function getAccent(level: number) {
  if (level >= 4) return colors.hot;
  if (level >= 2) return colors.warm;
  return colors.cold;
}

export const GuessRow = memo(function GuessRow({ guess }: { guess: GameGuess }) {
  const label = `${guess.guess}, ${guess.rank}위, ${guess.temperature.label}${
    guess.source === 'hint' ? ', 힌트' : ''
  }`;

  return (
    <View
      accessible
      accessibilityLabel={label}
      style={[styles.row, { borderLeftColor: getAccent(guess.temperature.level) }]}>
      <View style={styles.wordColumn}>
        <Text style={styles.word}>{guess.guess}</Text>
        {guess.source === 'hint' ? (
          <Text style={styles.hintBadge}>힌트</Text>
        ) : null}
      </View>
      <View style={styles.rankColumn}>
        <Text style={styles.rank}>{guess.rank.toLocaleString('ko-KR')}위</Text>
        <Text style={styles.temperature}>{guess.temperature.label}</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 68,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  wordColumn: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 1,
    gap: spacing.sm,
  },
  word: { color: colors.ink, flexShrink: 1, fontSize: 16, fontWeight: '600' },
  hintBadge: {
    borderColor: colors.cold,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.coldDark,
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  rankColumn: { alignItems: 'flex-end', minWidth: 96 },
  rank: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  temperature: { color: colors.muted, fontSize: 12, lineHeight: 16 },
});
