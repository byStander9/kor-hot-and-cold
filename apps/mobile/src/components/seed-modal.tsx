import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MAX_SEED, parseSeed } from '../game/domain';
import { colors, spacing } from '../theme';

type Props = {
  currentSeed: number;
  visible: boolean;
  onClose: () => void;
  onOpenSeed: (seed: number) => void;
  onRandomSeed: () => void;
};

export function SeedModal({
  currentSeed,
  visible,
  onClose,
  onOpenSeed,
  onRandomSeed,
}: Props) {
  const [value, setValue] = useState(String(currentSeed));
  const [error, setError] = useState('');
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!visible) return;
    setValue(String(currentSeed));
    setError('');
    const focusTimer = setTimeout(() => inputRef.current?.focus(), 250);
    return () => clearTimeout(focusTimer);
  }, [currentSeed, visible]);

  function submit() {
    const seed = parseSeed(value);
    if (seed === null) {
      setError(`0부터 ${MAX_SEED.toLocaleString('ko-KR')} 사이의 정수를 입력해 주세요.`);
      return;
    }
    onOpenSeed(seed);
  }

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
      visible={visible}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.container}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>게임 시드</Text>
              <Text style={styles.description}>
                같은 시드는 누구에게나 같은 문제를 만들어요.
              </Text>
            </View>
            <Pressable
              accessibilityLabel="시드 선택 닫기"
              accessibilityRole="button"
              hitSlop={8}
              onPress={onClose}
              style={styles.iconButton}>
              <MaterialCommunityIcons color={colors.ink} name="close" size={24} />
            </Pressable>
          </View>

          <Text style={styles.label}>0–{MAX_SEED.toLocaleString('ko-KR')}</Text>
          <TextInput
            ref={inputRef}
            accessibilityLabel="게임 시드"
            keyboardType="number-pad"
            maxLength={10}
            onChangeText={(text) => {
              setValue(text);
              setError('');
            }}
            onSubmitEditing={submit}
            returnKeyType="done"
            selectionColor={colors.cold}
            style={[styles.input, error ? styles.inputError : null]}
            value={value}
          />
          {error ? (
            <Text accessibilityLiveRegion="polite" style={styles.error}>
              {error}
            </Text>
          ) : null}

          <Pressable
            accessibilityRole="button"
            onPress={submit}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
            <Text style={styles.primaryText}>이 시드 열기</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={onRandomSeed}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
            <MaterialCommunityIcons
              color={colors.coldDark}
              name="shuffle-variant"
              size={22}
            />
            <Text style={styles.secondaryText}>랜덤 새 게임</Text>
          </Pressable>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.paper, flex: 1 },
  container: { flex: 1, padding: spacing.xl },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xxxl,
  },
  title: { color: colors.ink, fontSize: 28, fontWeight: '800' },
  description: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.sm,
    maxWidth: 270,
  },
  iconButton: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  label: { color: colors.inkSoft, fontSize: 14, marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 20,
    fontWeight: '600',
    height: 52,
    paddingHorizontal: spacing.lg,
  },
  inputError: { borderColor: colors.hotDark },
  error: {
    color: colors.hotDark,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.sm,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderRadius: 14,
    justifyContent: 'center',
    marginTop: spacing.xxl,
    minHeight: 52,
  },
  primaryText: { color: colors.white, fontSize: 16, fontWeight: '600' },
  secondaryButton: {
    alignItems: 'center',
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    marginTop: spacing.md,
    minHeight: 52,
  },
  secondaryText: { color: colors.coldDark, fontSize: 16, fontWeight: '600' },
  pressed: { opacity: 0.72 },
});
