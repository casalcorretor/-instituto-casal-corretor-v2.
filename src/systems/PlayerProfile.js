import { CARS, DEFAULT_CAR_ID } from '../data/CarsData.js';

// Bonus diario configuravel (spec pede 500 a 2000). A logica de "so
// pode resgatar uma vez por dia" depende de data salva em disco, que
// so existe a partir da Etapa 19 (salvamento) — por enquanto so o
// valor fica pronto aqui, sem UI ainda pra resgatar.
export const DAILY_BONUS_RANGE = { min: 500, max: 2000 };

// Curva de XP necessaria pra passar de nivel: cresce linearmente (nivel
// 1->2 pede 500, 2->3 pede 750, 3->4 pede 1000, ...). Simples de
// prever e facil de ajustar num lugar so.
const LEVEL_BASE_XP = 500;
const LEVEL_XP_GROWTH = 250;

function xpNeededForLevel(level) {
  return LEVEL_BASE_XP + (level - 1) * LEVEL_XP_GROWTH;
}

const state = {
  coins: 0,
  level: 1,
  xp: 0,
  unlockedCarIds: [DEFAULT_CAR_ID],
  equippedCarId: DEFAULT_CAR_ID,
  customization: {
    paintId: 'default',
    wheelId: 'default',
    trailId: 'none',
    turboEffectId: 'default',
    goalEffectId: 'default',
    // reservados pra quando adesivos/acessorios ganharem efeito visual
    stickerId: 'none',
    accessoryId: 'none'
  }
};

// Perfil do jogador (singleton do modulo, um unico objeto compartilhado
// por todo o jogo). Guarda moedas, nivel/xp e carros — por enquanto so
// em memoria (RAM), zera a cada recarregar a pagina. A Etapa 19
// adiciona persistencia via localStorage por cima desse mesmo objeto,
// sem precisar mudar quem ja le/escreve nele (mesmo padrao usado no
// RUSH DRIVE).
const PlayerProfile = {
  getCoins() {
    return state.coins;
  },

  addCoins(amount) {
    if (amount <= 0) return state.coins;
    state.coins += Math.floor(amount);
    return state.coins;
  },

  // Retorna true se conseguiu gastar (saldo suficiente), false se nao.
  spendCoins(amount) {
    if (amount <= 0 || amount > state.coins) return false;
    state.coins -= amount;
    return true;
  },

  canAfford(amount) {
    return amount <= state.coins;
  },

  isCarUnlocked(carId) {
    return state.unlockedCarIds.includes(carId);
  },

  unlockCar(carId) {
    if (!CARS[carId]) return false;
    if (!state.unlockedCarIds.includes(carId)) state.unlockedCarIds.push(carId);
    return true;
  },

  getUnlockedCarIds() {
    return [...state.unlockedCarIds];
  },

  getEquippedCarId() {
    return state.equippedCarId;
  },

  equipCar(carId) {
    if (!this.isCarUnlocked(carId)) return false;
    state.equippedCarId = carId;
    return true;
  },

  getCustomization() {
    return { ...state.customization };
  },

  setPaint(id) {
    state.customization.paintId = id;
  },

  setWheel(id) {
    state.customization.wheelId = id;
  },

  setTrail(id) {
    state.customization.trailId = id;
  },

  setTurboEffect(id) {
    state.customization.turboEffectId = id;
  },

  setGoalEffect(id) {
    state.customization.goalEffectId = id;
  },

  getLevel() {
    return state.level;
  },

  getXp() {
    return state.xp;
  },

  getXpToNextLevel() {
    return xpNeededForLevel(state.level);
  },

  // Soma XP e sobe de nivel automaticamente quantas vezes o total
  // permitir (ex.: um ganho grande pode subir 2+ niveis de uma vez).
  // Retorna informacao pra UI mostrar "subiu de nivel!" se for o caso.
  addXp(amount) {
    if (amount <= 0) {
      return { level: state.level, xp: state.xp, leveledUp: false, levelsGained: 0 };
    }

    state.xp += Math.floor(amount);
    let levelsGained = 0;
    while (state.xp >= xpNeededForLevel(state.level)) {
      state.xp -= xpNeededForLevel(state.level);
      state.level += 1;
      levelsGained += 1;
    }

    return { level: state.level, xp: state.xp, leveledUp: levelsGained > 0, levelsGained };
  },

  // Exposto pra debug/testes; a UI real de nivel/XP entra na Etapa 16.
  _debugState() {
    return { ...state, unlockedCarIds: [...state.unlockedCarIds] };
  }
};

export default PlayerProfile;
