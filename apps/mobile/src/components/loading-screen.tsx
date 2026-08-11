import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '../theme';

type Props = {
  slow?: boolean;
  error?: string;
  onRetry?: () => void;
};

export function LoadingScreen({ slow = false, error, onRetry }: Props) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        {error ? (
          <View style={styles.errorCard} accessibilityLiveRegion="polite">
            <Text style={styles.errorTitle}>게임 서버에 연결하지 못했어요.</Text>
            <Text style={styles.errorBody}>{error}</Text>
            {onRetry ? (
              <Pressable
                accessibilityRole="button"
                onPress={onRetry}
                style={({ pressed }) => [
                  styles.retryButton,
                  pressed && styles.pressed,
                ]}>
                <Text style={styles.retryText}>다시 시도</Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <View accessibilityLiveRegion="polite" style={styles.loading}>
            <ActivityIndicator color={colors.coldDark} size="small" />
            <Text style={styles.loadingTitle}>시드 게임을 준비하고 있어요</Text>
            {slow ? (
              <Text style={styles.loadingBody}>
                순위를 계산하고 있어요. 첫 계산은 조금 더 걸릴 수 있어요.
              </Text>
            ) : null}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.paper, flex: 1 },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  loading: { alignItems: 'center', gap: spacing.md, maxWidth: 300 },
  loadingTitle: { color: colors.ink, fontSize: 16, fontWeight: '600' },
  loadingBody: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  errorCard: {
    alignItems: 'stretch',
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 20,
    borderWidth: 1,
    gap: spacing.md,
    maxWidth: 360,
    padding: spacing.xl,
    width: '100%',
  },
  errorTitle: { color: colors.ink, fontSize: 20, fontWeight: '800' },
  errorBody: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  retryButton: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderRadius: 14,
    justifyContent: 'center',
    minHeight: 52,
  },
  retryText: { color: colors.white, fontSize: 16, fontWeight: '600' },
  pressed: { opacity: 0.72 },
});
