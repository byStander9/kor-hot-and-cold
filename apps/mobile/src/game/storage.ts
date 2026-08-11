import AsyncStorage from '@react-native-async-storage/async-storage';

import { createStoredGame, parseStoredGame, type RestoredGame } from './state';

const STORAGE_PREFIX = 'kor-hot-and-cold:mobile:game:v1';

function getStorageKey(seed: number, gameVersion: number) {
  return `${STORAGE_PREFIX}:${gameVersion}:${seed}`;
}

export async function loadStoredGame(options: {
  seed: number;
  gameVersion: number;
  wordCount: number;
}) {
  try {
    const raw = await AsyncStorage.getItem(
      getStorageKey(options.seed, options.gameVersion),
    );
    return raw ? parseStoredGame(raw, options) : null;
  } catch {
    return null;
  }
}

export async function saveStoredGame(options: {
  seed: number;
  gameVersion: number;
  game: RestoredGame;
}) {
  try {
    const stored = createStoredGame(options);
    await AsyncStorage.setItem(
      getStorageKey(options.seed, options.gameVersion),
      JSON.stringify(stored),
    );
  } catch {
    // 저장이 차단돼도 현재 게임은 계속 진행한다.
  }
}
