const MATCH_DURATION = 5 * 60; // 5 minutos, padrao da spec

// Recompensas em moedas por resultado (todas configuráveis aqui, num
// único lugar, como pedido na spec). O sistema de economia completo
// (salvar saldo, loja) entra na Etapa 10/19 — aqui só calculamos
// quanto cada lado ganhou ao final da partida.
export const COIN_REWARDS = {
  victory: 1000,
  defeat: 400,
  draw: 700,
  goal: 100,
  assist: 50, // reservado pra quando houver times com mais de um carro (2v2/3v3)
  matchBonus: 200
};

// Administra placar, cronômetro e o fim de uma partida:
//  - Tempo normal: 5 minutos (MATCH_DURATION).
//  - Se o tempo acaba empatado, entra em "morte súbita" (overtime):
//    o cronômetro para de contar, e o primeiro gol marcado a partir
//    daí termina a partida na hora (golden goal). Nunca termina em
//    empate de verdade.
//  - Ao terminar, calcula moedas ganhas por cada lado com base no
//    resultado + gols marcados, usando COIN_REWARDS.
export default class MatchManager {
  constructor({ duration = MATCH_DURATION } = {}) {
    this.score = { blue: 0, red: 0 };
    this.timeRemaining = duration;
    this.matchOver = false;
    this.overtime = false;
    this.winner = null; // 'blue' | 'red' | 'draw' (nunca deveria ficar 'draw' apos overtime)
  }

  update(deltaSeconds) {
    if (this.matchOver || this.overtime) return;

    this.timeRemaining = Math.max(0, this.timeRemaining - deltaSeconds);
    if (this.timeRemaining <= 0) {
      if (this.score.blue === this.score.red) {
        this.overtime = true;
      } else {
        this._endMatch(this.score.blue > this.score.red ? 'blue' : 'red');
      }
    }
  }

  // side: time que MARCOU o gol ('blue' ou 'red').
  registerGoal(side) {
    if (this.matchOver) return;
    this.score[side] += 1;

    if (this.overtime) {
      this._endMatch(side);
    }
  }

  _endMatch(winner) {
    this.matchOver = true;
    this.winner = winner;
  }

  // Quanto cada lado ganhou de moeda nessa partida (vitoria/derrota +
  // bonus de gols marcados). Chamado depois que matchOver vira true.
  getCoinRewards() {
    const blueResult = this.winner === 'blue' ? 'victory' : this.winner === 'red' ? 'defeat' : 'draw';
    const redResult = this.winner === 'red' ? 'victory' : this.winner === 'blue' ? 'defeat' : 'draw';

    return {
      blue: COIN_REWARDS[blueResult] + this.score.blue * COIN_REWARDS.goal + COIN_REWARDS.matchBonus,
      red: COIN_REWARDS[redResult] + this.score.red * COIN_REWARDS.goal + COIN_REWARDS.matchBonus
    };
  }

  formatTime() {
    if (this.overtime) return 'MORTE SUBITA';
    const total = Math.ceil(this.timeRemaining);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
}
