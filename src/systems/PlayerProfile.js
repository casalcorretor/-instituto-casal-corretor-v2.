import { DEFAULT_CAR_ID } from '../data/CarsData.js';
import { DEFAULT_TRACK_ID, TRACK_ORDER } from '../data/TracksData.js';

// Estado do jogador para a sessao atual (moedas, melhores tempos, carro
// e pista selecionados). Fica so em memoria por enquanto — a Etapa 13
// adiciona save/load com localStorage em cima exatamente deste objeto,
// sem precisar mudar quem le/escreve nele.
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

export function addCoins(amount) {
  profile.coins += amount;
  return profile.coins;
}

export function recordRaceResult(trackId, timeSeconds) {
  const best = profile.bestTimes[trackId];
  const isNewBest = best === undefined || timeSeconds < best;
  if (isNewBest) profile.bestTimes[trackId] = timeSeconds;
  return isNewBest;
}

export function getBestTime(trackId) {
  return profile.bestTimes[trackId] ?? null;
}

export function isCarUnlocked(carId) {
  return profile.unlockedCarIds.includes(carId);
}

export function unlockCar(carId) {
  if (!profile.unlockedCarIds.includes(carId)) profile.unlockedCarIds.push(carId);
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
  return nextTrackId;
}
