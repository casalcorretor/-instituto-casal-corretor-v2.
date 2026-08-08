import { clamp } from '../utils/MathUtils.js';

export const BALL_RADIUS = 34;
const GRAVITY = 1300;
const BOUNCE_RESTITUTION = 0.58;
const MIN_BOUNCE_VZ = 60; // abaixo disso, para de quicar e assenta
const ROLL_FRICTION = 70; // perda de velocidade horizontal por segundo, rolando
const HEIGHT_SCALE = 0.62;
const HIT_HEIGHT_TOLERANCE = 70; // o quao perto em z o carro precisa estar pra "cabecear" a bola

function generateBallTexture(scene) {
  const key = 'ball';
  if (scene.textures.exists(key)) return key;

  const d = BALL_RADIUS * 2;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);

  g.fillStyle(0xf2f5f7, 1);
  g.fillCircle(BALL_RADIUS, BALL_RADIUS, BALL_RADIUS);

  // gomos estilo bola de futebol, mas nas cores do jogo
  g.fillStyle(0x0f1b2b, 1);
  g.fillCircle(BALL_RADIUS, BALL_RADIUS * 0.55, BALL_RADIUS * 0.3);
  const spokes = 5;
  for (let i = 0; i < spokes; i++) {
    const angle = (i / spokes) * Math.PI * 2 - Math.PI / 2;
    const px = BALL_RADIUS + Math.cos(angle) * BALL_RADIUS * 0.62;
    const py = BALL_RADIUS + Math.sin(angle) * BALL_RADIUS * 0.62;
    g.fillCircle(px, py, BALL_RADIUS * 0.22);
  }

  g.lineStyle(2, 0x0f1b2b, 0.5);
  g.strokeCircle(BALL_RADIUS, BALL_RADIUS, BALL_RADIUS - 1);

  g.generateTexture(key, d, d);
  g.destroy();
  return key;
}

function generateShadowTexture(scene) {
  const key = 'ball_shadow';
  if (scene.textures.exists(key)) return key;

  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(0x000000, 1);
  g.fillEllipse(BALL_RADIUS, BALL_RADIUS * 0.5, BALL_RADIUS * 2, BALL_RADIUS);
  g.generateTexture(key, BALL_RADIUS * 2, BALL_RADIUS);
  g.destroy();
  return key;
}

// Bola com fisica no plano do chao (Arcade Physics: quica nas paredes,
// e empurrada por colisao com os carros) mais o mesmo truque de eixo Z
// simulado usado no carro — aqui o pouso quica de verdade (perde parte
// da energia a cada batida) em vez de parar seco.
//
// O corpo fisico (this.sprite) fica sempre na posicao real de chao e
// nunca e deslocado visualmente (ver comentario em Car.js sobre por
// que isso causa deriva de posicao no Arcade Physics). this.visual e
// um sprite separado, sem fisica, que so copia a posicao do corpo e
// recebe o deslocamento de altura pra desenho.
export default class Ball {
  constructor(scene, { x, y }) {
    this.scene = scene;

    const textureKey = generateBallTexture(scene);
    const shadowKey = generateShadowTexture(scene);

    this.shadow = scene.add.image(x, y, shadowKey).setDepth(4).setAlpha(0.4);

    this.sprite = scene.physics.add.image(x, y, textureKey);
    this.sprite.setVisible(false);
    this.sprite.body.setCircle(BALL_RADIUS);
    this.sprite.setBounce(1);
    this.sprite.setDamping(false);
    this.sprite.setDrag(0);
    this.sprite.setMaxVelocity(1400);
    this.sprite.setMass(0.45);

    this.visual = scene.add.image(x, y, textureKey).setDepth(6);

    this.z = 0;
    this.vz = 0;
  }

  get x() {
    return this.sprite.x;
  }

  get y() {
    return this.sprite.y;
  }

  get isGrounded() {
    return this.z <= 0;
  }

  update(deltaSeconds) {
    this._updateHeight(deltaSeconds);
    this._updateRollFriction(deltaSeconds);
    this._updateVisual();
  }

  _updateHeight(deltaSeconds) {
    if (this.z <= 0 && this.vz === 0) return;

    this.vz -= GRAVITY * deltaSeconds;
    this.z += this.vz * deltaSeconds;

    if (this.z <= 0) {
      this.z = 0;
      if (Math.abs(this.vz) > MIN_BOUNCE_VZ) {
        this.vz = -this.vz * BOUNCE_RESTITUTION;
      } else {
        this.vz = 0;
      }
    }
  }

  _updateRollFriction(deltaSeconds) {
    if (this.z > 0) return;

    const body = this.sprite.body;
    const speed = Math.hypot(body.velocity.x, body.velocity.y);
    if (speed <= 0) return;

    const loss = ROLL_FRICTION * deltaSeconds;
    const newSpeed = Math.max(0, speed - loss);
    const scale = newSpeed / speed;
    body.velocity.x *= scale;
    body.velocity.y *= scale;
  }

  _updateVisual() {
    this.shadow.setPosition(this.sprite.x, this.sprite.y);
    const shadowScale = clamp(1 - this.z / 320, 0.3, 1);
    this.shadow.setScale(shadowScale);
    this.shadow.setAlpha(0.4 * shadowScale);

    this.visual.setPosition(this.sprite.x, this.sprite.y - this.z * HEIGHT_SCALE);

    const body = this.sprite.body;
    const rollSpeed = Math.hypot(body.velocity.x, body.velocity.y);
    this.visual.rotation += (rollSpeed / BALL_RADIUS) * 0.016 * Math.sign(body.velocity.x || 1);
  }

  // Impulso vertical aplicado quando um carro no ar acerta a bola perto
  // o suficiente em altura (ver Car.z) — permite "cabecear"/chutar a
  // bola pro alto. amount e a forca do impulso.
  applyVerticalHit(amount) {
    this.vz = Math.max(this.vz, amount);
  }

  canBeHitVerticallyBy(carZ) {
    return Math.abs(carZ - this.z) <= HIT_HEIGHT_TOLERANCE;
  }

  resetTo(x, y) {
    this.sprite.setPosition(x, y);
    this.sprite.setVelocity(0, 0);
    this.z = 0;
    this.vz = 0;
  }

  destroy() {
    this.sprite.destroy();
    this.shadow.destroy();
    this.visual.destroy();
  }
}
