// Gerencia voltas, tempo e posição de uma corrida. Funciona com
// qualquer número de "racers" (carro do jogador e carros de IA).
//
// Em vez de comparar a posição "bruta" na spline (0..totalLength), que
// da problema perto da linha de largada/chegada (um carro fisicamente
// atras no grid pode cair num ponto da spline com valor bruto MAIOR,
// por causa do wraparound do laço fechado), cada racer acumula uma
// "raceDistance" monotonica: a cada frame somamos o deslocamento real
// ao longo da pista (positivo andando pra frente, negativo de re),
// desembrulhando a transição pela linha de largada. Isso da um numero
// sempre comparavel entre carros, incluindo os que comecam atras no
// grid (raceDistance inicial negativa).
const FINISH_LINE_REVERSE_GUARD = 0.5; // fracao do comprimento da pista

export default class RaceManager {
  constructor({ track, totalLaps = 3 }) {
    this.track = track;
    this.totalLaps = totalLaps;
    this.racers = [];
    this.raceTime = 0;
    this.raceFinished = false;
  }

  // startDistanceOffset: quao atras da linha de largada o carro comeca
  // (em unidades de mundo, negativo = atras). Usado so para o grid.
  addRacer(id, car, startDistanceOffset = 0) {
    const rawProgress = this.track.getClosestProgress(car.x, car.y);

    this.racers.push({
      id,
      car,
      lastRawProgress: rawProgress,
      raceDistance: startDistanceOffset,
      lapsCompleted: 0,
      lapStartTime: 0,
      lapTimes: [],
      finished: false,
      finishTime: null,
      position: 1
    });
  }

  getRacer(id) {
    return this.racers.find((r) => r.id === id);
  }

  update(deltaSeconds) {
    if (this.raceFinished) return;
    this.raceTime += deltaSeconds;

    const total = this.track.totalLength;
    const guard = total * FINISH_LINE_REVERSE_GUARD;

    for (const racer of this.racers) {
      if (racer.finished) continue;

      const rawProgress = this.track.getClosestProgress(racer.car.x, racer.car.y);
      let delta = rawProgress - racer.lastRawProgress;

      // desembrulha a passagem pela linha de largada/chegada (0 <-> total)
      if (delta > guard) delta -= total;
      else if (delta < -guard) delta += total;

      racer.raceDistance += delta;
      racer.lastRawProgress = rawProgress;

      const lapsNow = Math.max(0, Math.floor(racer.raceDistance / total));
      if (lapsNow > racer.lapsCompleted) {
        for (let lap = racer.lapsCompleted; lap < lapsNow; lap++) {
          racer.lapTimes.push(this.raceTime - racer.lapStartTime);
          racer.lapStartTime = this.raceTime;
        }
        racer.lapsCompleted = lapsNow;

        if (racer.lapsCompleted >= this.totalLaps) {
          racer.finished = true;
          racer.finishTime = this.raceTime;
        }
      }
    }

    this._updatePositions();

    if (this.racers.length > 0 && this.racers.every((r) => r.finished)) {
      this.raceFinished = true;
    }
  }

  _updatePositions() {
    // Ordena o array em si (nada depende da ordem original de insercao)
    // em vez de copiar pra um array novo a cada frame — evita alocacao
    // desnecessaria 60x por segundo.
    this.racers.sort((a, b) => b.raceDistance - a.raceDistance);
    for (let i = 0; i < this.racers.length; i++) {
      this.racers[i].position = i + 1;
    }
  }

  // Volta exibida ao jogador (1-indexado, nunca passa de totalLaps).
  getDisplayLap(racer) {
    return Math.min(racer.lapsCompleted + 1, this.totalLaps);
  }

  formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${s.toFixed(1).padStart(4, '0')}`;
  }
}
