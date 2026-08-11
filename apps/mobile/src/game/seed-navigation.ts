import { GAME_DATA_VERSION } from './domain';

export const SEED_CHANGE_CONFIRMATION =
  '현재 게임을 나가고 다른 시드를 열까요?';

type SeedParamsUpdater = {
  setParams: (params: { seed: string; v: string }) => void;
};

export function updateSeedParams(updater: SeedParamsUpdater, seed: number) {
  updater.setParams({
    seed: String(seed),
    v: String(GAME_DATA_VERSION),
  });
}

export function confirmSeedChangeOnWeb(
  confirm: (message: string) => boolean,
) {
  return confirm(SEED_CHANGE_CONFIRMATION);
}
