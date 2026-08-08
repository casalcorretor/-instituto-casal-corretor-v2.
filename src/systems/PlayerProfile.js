import { DEFAULT_CAR_ID } from '../data/CarsData.js';
import { DEFAULT_TRACK_ID, TRACK_ORDER } from '../data/TracksData.js';
import { STORAGE_KEY } from '../config/GameConfig.js';

// Estado do jogador (moedas, melhores tempos, carro/pista
// selecionados, desbloqueios, configuracoes). Persistido em
// localStorage — loadProfile() e chamado uma vez ao abrir o jogo
// (main.js) e saveProfile() a cada mudanca, entao o progresso continua
// la depois de fechar e reabrir.
const profile = {
  coins: 0,
  bestTimes: {},
  unlockedCarIds: [DEFAULT_CAR_ID],
  selectedCarId: DEFAULT_CAR_ID,
  unlockedTrackIds: [DEFAULT_TRACK_ID],
  selectedTrackId: DEFAULT_TRACK_ID,
  settings: {
    musicVolume: 0.7,
    sfxVolume: 0.8,
    vibration: true,
    controlMode: 'buttons'
  }
};

export function getProfile() {
  return profile;
}

// Le o progresso salvo, se existir. Chamado uma unica vez, bem no
// inicio (antes de qualquer cena tocar no perfil). Um save corrompido
// ou ausente simplesmente mantem os valores padrao.
export function loadProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    const saved = JSON.parse(raw);
    Object.assign(profile, saved);
    profile.settings = { ...profile.settings, ...(saved.settings || {}) };
  } catch {
    // save ausente/corrompido/localStorage bloqueado — comeca do zero
  }
}

export function saveProfile() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // localStorage indisponivel (modo privado, quota cheia etc.)
  }
}

export function addCoins(amount) {
  profile.coins += amount;
  saveProfile();
  return profile.coins;
}

export function recordRaceResult(trackId, timeSeconds) {
  const best = profile.bestTimes[trackId];
  const isNewBest = best === undefined || timeSeconds < best;
  if (isNewBest) {
    profile.bestTimes[trackId] = timeSeconds;
    saveProfile();
  }
  return isNewBest;
}

export function getBestTime(trackId) {
  return profile.bestTimes[trackId] ?? null;
}

export function isCarUnlocked(carId) {
  return profile.unlockedCarIds.includes(carId);
}

export function unlockCar(carId) {
  if (!profile.unlockedCarIds.includes(carId)) {
    profile.unlockedCarIds.push(carId);
    saveProfile();
  }
}

export function isTrackUnlocked(trackId) {
  return profile.unlockedTrackIds.includes(trackId);
}

// Vencer uma pista (1o lugar) desbloqueia a proxima da sequencia
// TRACK_ORDER. Retorna o id da pista desbloqueada, ou null se nao
// desbloqueou nenhuma (ja era a ultima, ou ja estava desbloqueada).
export function unlockNextTrackIfWon(trackId, position) {
  if (position !== 1) return null;

  const index = TRACK_ORDER.indexOf(trackId);
  if (index === -1 || index + 1 >= TRACK_ORDER.length) return null;

  const nextTrackId = TRACK_ORDER[index + 1];
  if (profile.unlockedTrackIds.includes(nextTrackId)) return null;

  profile.unlockedTrackIds.push(nextTrackId);
  saveProfile();
  return nextTrackId;
}
