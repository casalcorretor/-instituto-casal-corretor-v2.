import { DEFAULT_CAR_ID } from '../data/CarsData.js';

// Estado do jogador para a sessao atual (moedas, melhores tempos, carro
// selecionado). Fica so em memoria por enquanto — a Etapa 13 adiciona
// save/load com localStorage em cima exatamente deste objeto, sem
// precisar mudar quem le/escreve nele.
const profile = {
  coins: 0,
  bestTimes: {},
  unlockedCarIds: [DEFAULT_CAR_ID],
  selectedCarId: DEFAULT_CAR_ID,
  unlockedTrackIds: ['test'],
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
