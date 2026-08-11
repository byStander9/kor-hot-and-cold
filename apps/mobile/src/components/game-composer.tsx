import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRef } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '../theme';

type Props = {
  action: 'idle' | 'guess' | 'hint' | 'reveal';
  error: { message: string; retryable: boolean } | null;
  hintCount: number;
  input: string;
  keyboardOpen: boolean;
  onChangeInput: (value: string) => void;
  onHint: () => void;
  onRetry: () => void;
  onReveal: () => void;
  onSubmit: (value: string) => Promise<boolean>;
};

export function GameComposer({
  action,
  error,
  hintCount,
  input,
  keyboardOpen,
  onChangeInput,
  onHint,
  onRetry,
  onReveal,
  onSubmit,
}: Props) {
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const busy = action !== 'idle';

  async function submit() {
    const succeeded = await onSubmit(input);
    if (succeeded) onChangeInput('');
    inputRef.current?.focus();
  }

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: Math.max(spacing.sm, insets.bottom) },
      ]}>
      {error?.retryable ? (
        <View accessibilityLiveRegion="polite" style={styles.banner}>
          <Text style={styles.bannerText}>{error.message}</Text>
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={onRetry}
            style={styles.retryButton}>
            <Text style={styles.retryText}>다시 시도</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.inputRow}>
        <TextInput
          ref={inputRef}
          accessibilityLabel="추측할 단어"
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect={false}
          editable={!busy}
          maxLength={20}
          onChangeText={onChangeInput}
          onSubmitEditing={() => void submit()}
          placeholder="단어를 입력하세요"
          placeholderTextColor={colors.muted}
          returnKeyType="done"
          selectionColor={colors.cold}
          style={styles.input}
          value={input}
        />
        <Pressable
          accessibilityLabel={action === 'guess' ? '순위를 확인하는 중' : '추측하기'}
          accessibilityRole="button"
          disabled={busy || input.trim().length === 0}
          onPress={() => void submit()}
          style={({ pressed }) => [
            styles.submitButton,
            (busy || input.trim().length === 0) && styles.disabled,
            pressed && styles.pressed,
          ]}>
          {action === 'guess' ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <Text style={styles.submitText}>추측</Text>
          )}
        </Pressable>
      </View>

      {error && !error.retryable ? (
        <Text accessibilityLiveRegion="polite" style={styles.errorText}>
          {error.message}
        </Text>
      ) : !keyboardOpen ? (
        <Text style={styles.helpText}>
          기본형과 자주 쓰는 조사·활용형을 입력할 수 있어요.
        </Text>
      ) : null}

      <View style={styles.actionRow}>
        <Pressable
          accessibilityLabel={action === 'hint' ? '더 가까운 단어를 찾는 중' : undefined}
          accessibilityRole="button"
          disabled={busy || hintCount >= 3}
          onPress={onHint}
          style={({ pressed }) => [
            styles.actionButton,
            (busy || hintCount >= 3) && styles.disabled,
            pressed && styles.pressed,
          ]}>
          {action === 'hint' ? (
            <ActivityIndicator color={colors.coldDark} size="small" />
          ) : (
            <MaterialCommunityIcons
              color={colors.coldDark}
              name="lightbulb-outline"
              size={20}
            />
          )}
          <Text style={styles.hintText}>힌트 {hintCount}/3</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={onReveal}
          style={({ pressed }) => [
            styles.actionButton,
            busy && styles.disabled,
            pressed && styles.pressed,
          ]}>
          <MaterialCommunityIcons
            color={colors.muted}
            name="flag-outline"
            size={20}
          />
          <Text style={styles.revealText}>포기하고 정답 보기</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderTopColor: colors.line,
    borderTopWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  banner: {
    alignItems: 'center',
    backgroundColor: '#FFF4F1',
    borderColor: '#F1C7BD',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  bannerText: { color: colors.hotDark, flex: 1, fontSize: 14 },
  retryButton: { justifyContent: 'center', minHeight: 44, paddingHorizontal: spacing.sm },
  retryText: { color: colors.coldDark, fontSize: 14, fontWeight: '600' },
  inputRow: { flexDirection: 'row', gap: spacing.sm },
  input: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    color: colors.ink,
    flex: 1,
    fontSize: 16,
    height: 52,
    paddingHorizontal: spacing.lg,
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    minWidth: 76,
  },
  submitText: { color: colors.white, fontSize: 16, fontWeight: '600' },
  helpText: { color: colors.muted, fontSize: 12, lineHeight: 16, marginTop: spacing.sm },
  errorText: {
    color: colors.hotDark,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.sm,
  },
  actionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  actionButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    minHeight: 48,
  },
  hintText: { color: colors.coldDark, fontSize: 14, fontWeight: '600' },
  revealText: { color: colors.muted, fontSize: 14, fontWeight: '600' },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.72 },
});
