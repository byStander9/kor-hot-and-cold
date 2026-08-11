const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim().replace(/\/+$/, '');

export function getApiBaseUrl() {
  if (!apiBaseUrl) {
    throw new Error('EXPO_PUBLIC_API_BASE_URL 환경 변수를 설정해 주세요.');
  }

  return apiBaseUrl;
}
