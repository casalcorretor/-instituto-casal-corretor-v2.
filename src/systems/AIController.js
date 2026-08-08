import { clamp, angleDiff } from '../utils/MathUtils.js';

// Ajustes por dificuldade: bots faceis reagem mais devagar, miram pior
// e usam turbo/pulo com menos frequencia; bots dificeis quase nao
// erram. speedMultiplier e repassado pro Car.update() (mesmo parametro
// que a fisica ja aceitava desde a Etapa 3).
const DIFFICULTIES = {
  easy: { reactionDelay: 0.35, aimError: 0.35, turboChance: 0.15, jumpSkill: 0.2, speedMultiplier: 0.85 },
  normal: { reactionDelay: 0.18, aimError: 0.18, turboChance: 0.35, jumpSkill: 0.5, speedMultiplier: 1 },
  hard: { reactionDelay: 0.06, aimError: 0.06, turboChance: 0.6, jumpSkill: 0.85, speedMultiplier: 1.08 }
};

// IA simples por maquina de estados, sem pathfinding: decide um ponto
// alvo no campo a cada "reactionDelay" segundos (nao todo frame — isso
// e o que da o efeito de reacao humana, nao de robo perfeito) e dirige
// o carro ate la com Car.setInput(), a mesma interface usada pelo
// jogador. Tres estados:
//  - "defend": bola perto do proprio gol -> se posiciona entre a bola
//    e o gol (como um goleiro).
//  - "attack": bola no campo de ataque -> persegue a bola, mirando um
//    pouco atras dela (do lado do gol adversario) pra empurrar em vez
//    de so bater de frente.
//  - "recover": bola no meio-campo neutro -> volta pra uma posicao de
//    prontidao no proprio lado, ainda de olho na bola.
export default class AIController {
  constructor(car, { ball, ownGoalX, opponentGoalX, arenaHeight, difficulty = 'normal' }) {
    this.car = car;
    this.ball = ball;
    this.ownGoalX = ownGoalX;
    this.opponentGoalX = opponentGoalX;
    this.arenaHeight = arenaHeight;
    this.settings = DIFFICULTIES[difficulty] || DIFFICULTIES.normal;

    this.state = 'recover';
    this._targetX = car.x;
    this._targetY = car.y;
    this._retargetTimer = 0;
    this._jumpCooldown = 0;
    this._wantsBoost = false;
  }

  update(deltaSeconds) {
    this._retargetTimer -= deltaSeconds;
    if (this._retargetTimer <= 0) {
      this._retargetTimer = this.settings.reactionDelay;
      this._pickTarget();
    }

    const dx = this._targetX - this.car.x;
    const dy = this._targetY - this.car.y;
    const dist = Math.hypot(dx, dy);

    const desiredAngle = Math.atan2(dy, dx);
    const error = (Math.random() * 2 - 1) * this.settings.aimError;
    const diff = angleDiff(this.car.angle, desiredAngle) + error;

    const steer = clamp(diff * 1.8, -1, 1);
    const facingAway = Math.abs(diff) > Math.PI * 0.55;
    const throttle = dist > 18 && !facingAway ? 1 : 0;
    const brake = facingAway || dist <= 18 ? 1 : 0;

    this._jumpCooldown -= deltaSeconds;
    let jump = false;
    const ballDist = Math.hypot(this.ball.x - this.car.x, this.ball.y - this.car.y);
    if (this.ball.z > 40 && ballDist < 160 && this._jumpCooldown <= 0 && Math.random() < this.settings.jumpSkill) {
      jump = true;
      this._jumpCooldown = 1.2;
    }

    this.car.setInput({
      throttle,
      brake,
      steer,
      jump,
      boost: this._wantsBoost && dist > 40
    });
  }

  _pickTarget() {
    const ball = this.ball;
    const ownGoalX = this.ownGoalX;
    const oppGoalX = this.opponentGoalX;
    const fieldWidth = Math.abs(oppGoalX - ownGoalX);
    const distBallToOwn = Math.abs(ball.x - ownGoalX);
    const distBallToOpp = Math.abs(ball.x - oppGoalX);

    if (distBallToOwn < fieldWidth * 0.32) {
      this.state = 'defend';
      this._targetX = ownGoalX + (ball.x - ownGoalX) * 0.45;
      this._targetY = this.arenaHeight / 2 + (ball.y - this.arenaHeight / 2) * 0.6;
    } else if (distBallToOpp < fieldWidth * 0.55) {
      this.state = 'attack';
      const behindSign = Math.sign(ball.x - oppGoalX) || 1;
      this._targetX = ball.x + behindSign * 35;
      this._targetY = ball.y;
    } else {
      this.state = 'recover';
      const homeX = ownGoalX + (oppGoalX - ownGoalX) * 0.3;
      this._targetX = (homeX + ball.x) / 2;
      this._targetY = this.arenaHeight / 2 + (ball.y - this.arenaHeight / 2) * 0.3;
    }

    this._wantsBoost = this.car.boostAmount > 25 && Math.random() < this.settings.turboChance;
  }
}
