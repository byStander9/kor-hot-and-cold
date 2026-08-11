import { describe, expect, it, vi } from 'vitest';

import {
  confirmSeedChangeOnWeb,
  SEED_CHANGE_CONFIRMATION,
  updateSeedParams,
} from './seed-navigation';

describe('시드 게임 이동', () => {
  it('현재 화면의 시드와 데이터 버전 파라미터를 함께 바꾼다', () => {
    const setParams = vi.fn();

    updateSeedParams({ setParams }, 4294967295);

    expect(setParams).toHaveBeenCalledWith({ seed: '4294967295', v: '1' });
  });

  it('웹 확인창의 취소와 확인 결과를 그대로 반환한다', () => {
    const cancel = vi.fn(() => false);
    const confirm = vi.fn(() => true);

    expect(confirmSeedChangeOnWeb(cancel)).toBe(false);
    expect(confirmSeedChangeOnWeb(confirm)).toBe(true);
    expect(cancel).toHaveBeenCalledWith(SEED_CHANGE_CONFIRMATION);
    expect(confirm).toHaveBeenCalledWith(SEED_CHANGE_CONFIRMATION);
  });
});
