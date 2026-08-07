// Gerencia voltas, tempo e posição de uma corrida. Funciona com
// qualquer número de "racers" (carro do jogador e, a partir da
// Etapa 6, carros de IA), todos comparados pela mesma métrica de
// progresso total (volta atual * comprimento da pista + distância
// percorrida na volta).
const FINISH_CROSS_COOLDOWN = 3;

export default class RaceManager {
  constructor({ track, totalLaps = 3 }) {
    this.track = track;
    this.totalLaps = totalLaps;
    this.racers = [];
    this.raceTime = 0;
    this.raceFinished = false;
  }

  addRacer(id, car) {
    const startProgress = this.track.getClosestProgress(car.x, car.y);

    this.racers.push({
      id,
      car,
      lap: 1,
      lastProgress: startProgress,
      totalProgress: startProgress,
      lapStartTime: 0,
      lapTimes: [],
      finished: false,
      finishTime: null,
      position: 1,
      crossCooldown: 0
    });
  }

  getRacer(id) {
    return this.racers.find((r) => r.id === id);
  }

  update(deltaSeconds) {
    if (this.raceFinished) return;
    this.raceTime += deltaSeconds;

    const total = this.track.totalLength;

    for (const racer of this.racers) {
      if (racer.finished) continue;

      racer.crossCooldown = Math.max(0, racer.crossCooldown - deltaSeconds);
      const progress = this.track.getClosestProgress(racer.car.x, racer.car.y);

      const crossedFinishLine =
        racer.crossCooldown === 0 && racer.lastProgress > total * 0.8 && progress < total * 0.2;

      if (crossedFinishLine) {
        const lapTime = this.raceTime - racer.lapStartTime;
        racer.lapTimes.push(lapTime);
        racer.lapStartTime = this.raceTime;
        racer.crossCooldown = FINISH_CROSS_COOLDOWN;

        if (racer.lap >= this.totalLaps) {
          racer.finished = true;
          racer.finishTime = this.raceTime;
        } else {
          racer.lap += 1;
        }
      }

      racer.lastProgress = progress;
      racer.totalProgress = (racer.lap - 1) * total + progress;
    }

    this._updatePositions();

    if (this.racers.length > 0 && this.racers.every((r) => r.finished)) {
      this.raceFinished = true;
    }
  }

  _updatePositions() {
    const sorted = [...this.racers].sort((a, b) => b.totalProgress - a.totalProgress);
    sorted.forEach((racer, index) => {
      racer.position = index + 1;
    });
  }

  formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${s.toFixed(1).padStart(4, '0')}`;
  }
}
