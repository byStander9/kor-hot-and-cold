const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim().replace(/\/+$/, '');
const shareBaseUrl = process.env.EXPO_PUBLIC_SHARE_BASE_URL?.trim().replace(
  /\/+$/,
  '',
);
const policyBaseUrl = process.env.EXPO_PUBLIC_POLICY_BASE_URL?.trim().replace(
  /\/+$/,
  '',
);

const PRIVACY_POLICY_FALLBACK_URL =
  'https://github.com/byStander9/kor-hot-and-cold/blob/mobile-app/docs/mobile/play-store/PRIVACY_POLICY_DRAFT_KO.md';
const LICENSES_FALLBACK_URL =
  'https://github.com/byStander9/kor-hot-and-cold/blob/main/docs/DATA_SOURCES.md';

export function getApiBaseUrl() {
  if (!apiBaseUrl) {
    throw new Error('EXPO_PUBLIC_API_BASE_URL 환경 변수를 설정해 주세요.');
  }

  return apiBaseUrl;
}

export function getShareBaseUrl() {
  return shareBaseUrl || getApiBaseUrl();
}

export function getPrivacyPolicyUrl() {
  return policyBaseUrl
    ? `${policyBaseUrl}/privacy`
    : PRIVACY_POLICY_FALLBACK_URL;
}

export function getLicensesUrl() {
  return policyBaseUrl ? `${policyBaseUrl}/licenses` : LICENSES_FALLBACK_URL;
}
