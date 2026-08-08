import { CARS, DEFAULT_CAR_ID } from '../data/CarsData.js';
import { DEFAULT_ARENA_ID } from '../data/ArenasData.js';
import { STORAGE_KEY } from '../config/GameConfig.js';

// Bonus diario configuravel (spec pede 500 a 2000). A logica de "so
// pode resgatar uma vez por dia" depende de data salva em disco, que
// ja existe a partir desta etapa — falta so o botao de resgatar,
// preparado pra Etapa 17/UI futura.
export const DAILY_BONUS_RANGE = { min: 500, max: 2000 };

// Curva de XP necessaria pra passar de nivel: cresce linearmente (nivel
// 1->2 pede 500, 2->3 pede 750, 3->4 pede 1000, ...). Simples de
// prever e facil de ajustar num lugar so.
const LEVEL_BASE_XP = 500;
const LEVEL_XP_GROWTH = 250;

function xpNeededForLevel(level) {
  return LEVEL_BASE_XP + (level - 1) * LEVEL_XP_GROWTH;
}

function clampVolume(value) {
  return Math.max(0, Math.min(1, value));
}

function defaultCustomization() {
  return {
    paintId: 'default',
    wheelId: 'default',
    trailId: 'none',
    turboEffectId: 'default',
    goalEffectId: 'default',
    // reservados pra quando adesivos/acessorios ganharem efeito visual
    stickerId: 'none',
    accessoryId: 'none'
  };
}

const state = {
  coins: 0,
  level: 1,
  xp: 0,
  unlockedCarIds: [DEFAULT_CAR_ID],
  equippedCarId: DEFAULT_CAR_ID,
  customization: defaultCustomization(),
  lastArenaId: DEFAULT_ARENA_ID,
  botDifficulty: 'normal',
  musicVolume: 0.7,
  sfxVolume: 0.8
};

// Perfil do jogador (singleton do modulo, um unico objeto compartilhado
// por todo o jogo). Guarda moedas, nivel/xp, carros, personalizacao e
// configuracoes. Toda mudanca relevante chama save() sozinha (ver os
// metodos abaixo) — quem usa o PlayerProfile nao precisa lembrar de
// salvar manualmente. load() e chamado uma vez, bem cedo, em main.js,
// antes de qualquer cena ler o perfil.
const PlayerProfile = {
  getCoins() {
    return state.coins;
  },

  addCoins(amount) {
    if (amount <= 0) return state.coins;
    state.coins += Math.floor(amount);
    this.save();
    return state.coins;
  },

  // Retorna true se conseguiu gastar (saldo suficiente), false se nao.
  spendCoins(amount) {
    if (amount <= 0 || amount > state.coins) return false;
    state.coins -= amount;
    this.save();
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
    if (!state.unlockedCarIds.includes(carId)) {
      state.unlockedCarIds.push(carId);
      this.save();
    }
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
    this.save();
    return true;
  },

  getCustomization() {
    return { ...state.customization };
  },

  setPaint(id) {
    state.customization.paintId = id;
    this.save();
  },

  setWheel(id) {
    state.customization.wheelId = id;
    this.save();
  },

  setTrail(id) {
    state.customization.trailId = id;
    this.save();
  },

  setTurboEffect(id) {
    state.customization.turboEffectId = id;
    this.save();
  },

  setGoalEffect(id) {
    state.customization.goalEffectId = id;
    this.save();
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

    this.save();
    return { level: state.level, xp: state.xp, leveledUp: levelsGained > 0, levelsGained };
  },

  getLastArenaId() {
    return state.lastArenaId;
  },

  setLastArenaId(arenaId) {
    state.lastArenaId = arenaId;
    this.save();
  },

  getBotDifficulty() {
    return state.botDifficulty;
  },

  setBotDifficulty(difficulty) {
    state.botDifficulty = difficulty;
    this.save();
  },

  getMusicVolume() {
    return state.musicVolume;
  },

  setMusicVolume(value) {
    state.musicVolume = clampVolume(value);
    this.save();
  },

  getSfxVolume() {
    return state.sfxVolume;
  },

  setSfxVolume(value) {
    state.sfxVolume = clampVolume(value);
    this.save();
  },

  // Grava o estado atual no localStorage. Chamado automaticamente por
  // todo metodo que muda algo relevante — nao precisa chamar na mao.
  // Envolvido em try/catch porque localStorage pode falhar (modo
  // privado do navegador, quota cheia, etc.) — se isso acontecer o
  // jogo continua funcionando normalmente, so nao persiste entre
  // sessoes.
  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      console.warn('[PlayerProfile] falha ao salvar progresso:', e);
      return false;
    }
  },

  // Le o localStorage e aplica por cima do estado atual. Cada campo e
  // validado individualmente (tipo certo, carro/arena existente) antes
  // de ser aceito — assim um save antigo ou corrompido nunca deixa o
  // perfil num estado invalido, so ignora o que nao bate e mantem o
  // padrao pra aquele campo. Retorna true se encontrou e aplicou um
  // save existente.
  load() {
    let raw;
    try {
      raw = localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      console.warn('[PlayerProfile] falha ao ler progresso salvo:', e);
      return false;
    }
    if (!raw) return false;

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      console.warn('[PlayerProfile] save salvo esta corrompido, ignorando:', e);
      return false;
    }

    if (typeof parsed.coins === 'number' && parsed.coins >= 0) state.coins = parsed.coins;
    if (typeof parsed.level === 'number' && parsed.level >= 1) state.level = parsed.level;
    if (typeof parsed.xp === 'number' && parsed.xp >= 0) state.xp = parsed.xp;

    if (Array.isArray(parsed.unlockedCarIds)) {
      const valid = parsed.unlockedCarIds.filter((id) => CARS[id]);
      state.unlockedCarIds = valid.includes(DEFAULT_CAR_ID) ? valid : [DEFAULT_CAR_ID, ...valid];
    }

    if (typeof parsed.equippedCarId === 'string' && CARS[parsed.equippedCarId]) {
      state.equippedCarId = parsed.equippedCarId;
    }

    if (parsed.customization && typeof parsed.customization === 'object') {
      state.customization = { ...defaultCustomization(), ...parsed.customization };
    }

    if (typeof parsed.lastArenaId === 'string') state.lastArenaId = parsed.lastArenaId;
    if (typeof parsed.botDifficulty === 'string') state.botDifficulty = parsed.botDifficulty;
    if (typeof parsed.musicVolume === 'number') state.musicVolume = clampVolume(parsed.musicVolume);
    if (typeof parsed.sfxVolume === 'number') state.sfxVolume = clampVolume(parsed.sfxVolume);

    return true;
  },

  // Apaga o save e volta tudo ao estado inicial (usado pelo botao
  // "apagar progresso" das configuracoes, e util pra testes).
  resetSave() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('[PlayerProfile] falha ao apagar progresso salvo:', e);
    }

    state.coins = 0;
    state.level = 1;
    state.xp = 0;
    state.unlockedCarIds = [DEFAULT_CAR_ID];
    state.equippedCarId = DEFAULT_CAR_ID;
    state.customization = defaultCustomization();
    state.lastArenaId = DEFAULT_ARENA_ID;
    state.botDifficulty = 'normal';
    state.musicVolume = 0.7;
    state.sfxVolume = 0.8;
  },

  // Exposto pra debug/testes.
  _debugState() {
    return { ...state, unlockedCarIds: [...state.unlockedCarIds] };
  }
};

export default PlayerProfile;
