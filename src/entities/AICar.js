import Car from './Car.js';
import { angleDiff, clamp } from '../utils/MathUtils.js';

// Presets de dificuldade: velocidade (multiplicador do maxSpeed do
// carro), distancia de antecipacao da curva, agressividade da direcao
// e frequencia/duracao dos "erros" ocasionais exigidos pela spec.
const DIFFICULTY_PRESETS = {
  easy: { speedMultiplier: 0.76, lookahead: 130, steerGain: 2.1, mistakeChance: 0.012, mistakeDuration: 0.7 },
  normal: { speedMultiplier: 0.9, lookahead: 165, steerGain: 2.7, mistakeChance: 0.006, mistakeDuration: 0.45 },
  hard: { speedMultiplier: 1.02, lookahead: 195, steerGain: 3.3, mistakeChance: 0.002, mistakeDuration: 0.25 }
};

const OVERTAKE_LOOKAHEAD = 90;
const OVERTAKE_LANE_OFFSET = 60;

// Adversario controlado por IA: segue a pista mirando um ponto a frente
// (lookahead) sobre a spline, reduz o acelerador em curvas fechadas, e
// se afasta lateralmente quando ha outro carro logo a frente (tentativa
// simples de ultrapassagem). Comete pequenos erros de direcao de tempos
// em tempos, conforme a dificuldade.
export default class AICar {
  constructor(scene, { x, y, angle, carDef, textureKey, track, difficulty = 'normal' }) {
    this.car = new Car(scene, { x, y, angle, carDef, textureKey });
    this.track = track;
    this.preset = DIFFICULTY_PRESETS[difficulty] ?? DIFFICULTY_PRESETS.normal;
    this.difficulty = difficulty;
    this.mistakeTimer = 0;
  }

  get sprite() {
    return this.car.sprite;
  }

  get x() {
    return this.car.x;
  }

  get y() {
    return this.car.y;
  }

  update(deltaSeconds, otherRacers = []) {
    const track = this.track;
    const progress = track.getClosestProgress(this.car.x, this.car.y);

    const lateralOffset = this._computeOvertakeOffset(progress, otherRacers);
    const targetPoint = track.getPointAtDistance(progress + this.preset.lookahead);

    const normal = { x: -Math.sin(targetPoint.angle), y: Math.cos(targetPoint.angle) };
    const aimX = targetPoint.x + normal.x * lateralOffset;
    const aimY = targetPoint.y + normal.y * lateralOffset;

    const desiredAngle = Math.atan2(aimY - this.car.y, aimX - this.car.x);
    let steerError = angleDiff(this.car.angle, desiredAngle);

    steerError += this._updateMistake(deltaSeconds);

    const steer = clamp(steerError * this.preset.steerGain, -1, 1);

    const sharpness = clamp(Math.abs(steerError) / (Math.PI / 2), 0, 1);
    const throttle = clamp(1 - sharpness * 0.7, 0.25, 1);
    const brake = sharpness > 0.75 ? 0.4 : 0;

    this.car.setInput({ throttle, brake, steer });
    this.car.update(deltaSeconds, this.preset.speedMultiplier);
  }

  _computeOvertakeOffset(progress, otherRacers) {
    const total = this.track.totalLength;

    for (const other of otherRacers) {
      if (other === this) continue;
      const otherProgress = this.track.getClosestProgress(other.x, other.y);
      let ahead = otherProgress - progress;
      if (ahead < 0) ahead += total;

      if (ahead > 0 && ahead < OVERTAKE_LOOKAHEAD) {
        return OVERTAKE_LANE_OFFSET;
      }
    }

    return 0;
  }

  _updateMistake(deltaSeconds) {
    this.mistakeTimer -= deltaSeconds;

    if (this.mistakeTimer <= 0 && Math.random() < this.preset.mistakeChance) {
      this.mistakeTimer = this.preset.mistakeDuration;
      this._mistakeOffset = (Math.random() - 0.5) * 0.9;
    }

    return this.mistakeTimer > 0 ? this._mistakeOffset : 0;
  }
}
