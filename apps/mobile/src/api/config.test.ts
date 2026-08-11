import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  delete process.env.EXPO_PUBLIC_POLICY_BASE_URL;
  vi.resetModules();
});

describe('공개 정책 링크', () => {
  it('운영 정책 주소의 privacy와 licenses 경로를 사용한다', async () => {
    process.env.EXPO_PUBLIC_POLICY_BASE_URL = 'https://example.hf.space/';
    const { getLicensesUrl, getPrivacyPolicyUrl } = await import('./config');

    expect(getPrivacyPolicyUrl()).toBe('https://example.hf.space/privacy');
    expect(getLicensesUrl()).toBe('https://example.hf.space/licenses');
  });

  it('운영 주소가 없으면 공개 저장소 문서를 사용한다', async () => {
    const { getLicensesUrl, getPrivacyPolicyUrl } = await import('./config');

    expect(getPrivacyPolicyUrl()).toContain('PRIVACY_POLICY_DRAFT_KO.md');
    expect(getLicensesUrl()).toContain('docs/DATA_SOURCES.md');
  });
});
