const MATCH_DURATION = 5 * 60; // 5 minutos, padrao da spec

// Administra placar e cronometro de uma partida. O sistema completo de
// fim-de-partida (vencedor, prorrogacao em empate, distribuicao de
// moedas) e construido na Etapa 9 (sistema de partidas); aqui so
// contamos gols e o tempo, que e a base que aquele sistema vai usar.
export default class MatchManager {
  constructor({ duration = MATCH_DURATION } = {}) {
    this.score = { blue: 0, red: 0 };
    this.timeRemaining = duration;
    this.matchOver = false;
  }

  update(deltaSeconds) {
    if (this.matchOver) return;

    this.timeRemaining = Math.max(0, this.timeRemaining - deltaSeconds);
    if (this.timeRemaining <= 0) {
      this.matchOver = true;
    }
  }

  // side: time que MARCOU o gol ('blue' ou 'red').
  registerGoal(side) {
    if (this.matchOver) return;
    this.score[side] += 1;
  }

  formatTime() {
    const total = Math.ceil(this.timeRemaining);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
}
