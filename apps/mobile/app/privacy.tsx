import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '../src/theme';

const DATA_SOURCES_URL =
  'https://github.com/byStander9/kor-hot-and-cold/blob/main/docs/DATA_SOURCES.md';

export default function PrivacyScreen() {
  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="게임으로 돌아가기"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => router.back()}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
          <MaterialCommunityIcons color={colors.ink} name="arrow-left" size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>개인정보·데이터 출처</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.introCard}>
          <Text style={styles.introTitle}>게임에 필요한 정보만 다뤄요</Text>
          <Text style={styles.body}>
            로그인, 광고, 분석 SDK, 푸시 알림을 사용하지 않습니다.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>서버로 보내는 정보</Text>
          <Text style={styles.body}>
            정답 판정과 순위 계산을 위해 숫자 시드, 입력한 추측어, 힌트·정답 공개
            요청을 게임 서버로 전송합니다. 앱 코드는 계정별 플레이 기록이나 분석
            이벤트를 만들지 않습니다.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>기기에 저장하는 정보</Text>
          <Text style={styles.body}>
            시드별 추측, 힌트 횟수, 종료 상태를 기기의 로컬 저장소에 보관합니다. 앱
            데이터 삭제 또는 앱 제거로 지울 수 있습니다.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>서버 접근 로그</Text>
          <Text style={styles.body}>
            운영 호스팅 사업자는 보안과 장애 대응을 위해 IP 주소, 요청 주소, 요청
            시각, 기기·브라우저 식별 정보를 표준 접근 로그로 처리할 수 있습니다.
            운영 호스팅이 확정되면 공개 개인정보처리방침에 사업자, 보유기간, 삭제
            요청 방법을 정확히 명시하고 이 안내를 갱신합니다.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>게임 데이터 출처</Text>
          <Text style={styles.body}>
            표준국어대사전 공개 데이터, multilingual-e5-small 의미 임베딩 모델,
            Kiwi 한국어 형태소 분석기를 활용합니다. 각 자료의 고정 리비전과
            라이선스는 공개 출처 문서에서 확인할 수 있습니다.
          </Text>
          <Pressable
            accessibilityHint="브라우저에서 GitHub 출처 문서를 엽니다"
            accessibilityRole="link"
            onPress={() => void Linking.openURL(DATA_SOURCES_URL)}
            style={({ pressed }) => [styles.linkButton, pressed && styles.pressed]}>
            <Text style={styles.linkText}>데이터·모델 출처 보기</Text>
            <MaterialCommunityIcons
              color={colors.coldDark}
              name="open-in-new"
              size={20}
            />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.paper, flex: 1 },
  header: {
    alignItems: 'center',
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingHorizontal: spacing.sm,
  },
  iconButton: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  headerTitle: { color: colors.ink, fontSize: 18, fontWeight: '800' },
  headerSpacer: { width: 48 },
  content: { gap: spacing.lg, padding: spacing.xl, paddingBottom: spacing.xxxl },
  introCard: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 20,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.xl,
  },
  introTitle: { color: colors.ink, fontSize: 20, fontWeight: '800' },
  section: { gap: spacing.sm, paddingVertical: spacing.sm },
  sectionTitle: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  body: { color: colors.inkSoft, fontSize: 14, lineHeight: 22 },
  linkButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.lg,
  },
  linkText: { color: colors.coldDark, fontSize: 14, fontWeight: '600' },
  pressed: { opacity: 0.72 },
});
