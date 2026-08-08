import { clamp } from '../utils/MathUtils.js';

const CAR_WIDTH = 38;
const CAR_HEIGHT = 22;
const GRAVITY = 1400;
const HEIGHT_SCALE = 0.62; // quanto a altura "z" desloca o sprite na tela
const SHADOW_MAX_ALPHA = 0.45;
const SHADOW_MIN_SCALE = 0.35;
const AIR_STEER_FACTOR = 0.35; // controle aereo e mais lento que no chao

// Desenha, uma unica vez, a textura de um carro (visto de cima) e a
// registra na textura manager da cena. Nunca chamado por frame — gera
// a imagem uma vez e reaproveita (essencial pra performance mobile).
export function generateCarTexture(scene, textureKey, bodyColor, accentColor) {
  if (scene.textures.exists(textureKey)) return;

  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  const w = CAR_WIDTH;
  const h = CAR_HEIGHT;

  // carroceria
  g.fillStyle(bodyColor, 1);
  g.fillRoundedRect(0, 0, w, h, 6);

  // cabine
  g.fillStyle(accentColor, 1);
  g.fillRoundedRect(w * 0.4, 3, w * 0.34, h - 6, 4);

  // spoiler traseiro
  g.fillStyle(accentColor, 1);
  g.fillRect(1, 1, 3, h - 2);

  // farois
  g.fillStyle(0xffffff, 1);
  g.fillRect(w - 4, 3, 3, 4);
  g.fillRect(w - 4, h - 7, 3, 4);

  // faixa lateral
  g.fillStyle(0xffffff, 0.5);
  g.fillRect(w * 0.15, h / 2 - 2, w * 0.55, 4);

  g.generateTexture(textureKey, w, h);
  g.destroy();
}

function generateShadowTexture(scene) {
  const key = 'car_shadow';
  if (scene.textures.exists(key)) return key;

  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(0x000000, 1);
  g.fillEllipse(24, 12, 48, 24);
  g.generateTexture(key, 48, 24);
  g.destroy();
  return key;
}

// Carro com fisica arcade no plano do chao (acelerar/frear/virar) mais
// um eixo Z simulado (altura) pra pulo e disputa de bola no ar — sem
// precisar de um motor de fisica 3D. Enquanto no ar, o acelerador e o
// freio nao fazem nada (rodas nao tocam o chao), mas ainda da pra
// virar (controle aereo basico), mais lento que no chao.
export default class Car {
  constructor(scene, { x, y, angle = 0, carDef, textureKey }) {
    this.scene = scene;
    this.def = carDef;

    generateCarTexture(scene, textureKey, carDef.bodyColor, carDef.accentColor);
    const shadowKey = generateShadowTexture(scene);

    this.shadow = scene.add.image(x, y, shadowKey).setDepth(4).setAlpha(SHADOW_MAX_ALPHA);

    this.sprite = scene.physics.add.image(x, y, textureKey);
    this.sprite.setDepth(5);
    this.sprite.setRotation(angle);
    this.sprite.body.setSize(CAR_WIDTH, CAR_HEIGHT, true);
    this.sprite.setDamping(false);
    this.sprite.setDrag(0);
    this.sprite.setMaxVelocity(carDef.speed * 1.6);
    this.sprite.setBounce(0.35);

    this.speed = 0;
    this.angle = angle;
    this.z = 0;
    this.vz = 0;
    this.grounded = true;

    this.input = { throttle: 0, brake: 0, steer: 0, jump: false, boost: false };
    this._jumpHeld = false;
  }

  get x() {
    return this.sprite.x;
  }

  get y() {
    return this.sprite.y;
  }

  get isGrounded() {
    return this.grounded;
  }

  setInput(input) {
    this.input.throttle = clamp(input.throttle ?? 0, 0, 1);
    this.input.brake = clamp(input.brake ?? 0, 0, 1);
    this.input.steer = clamp(input.steer ?? 0, -1, 1);
    this.input.boost = !!input.boost;

    const wantsJump = !!input.jump;
    if (wantsJump && !this._jumpHeld) this._tryJump();
    this._jumpHeld = wantsJump;
  }

  _tryJump() {
    if (!this.grounded) return;
    const v0 = Math.sqrt(2 * GRAVITY * this.def.jumpHeight);
    this.vz = v0;
    this.grounded = false;
  }

  // externalSpeedMultiplier permite ajustes de fora (ex.: turbo, IA).
  update(deltaSeconds, externalSpeedMultiplier = 1) {
    this._updateHeight(deltaSeconds);
    this._updateGroundPhysics(deltaSeconds, externalSpeedMultiplier);
    this._updateVisualHeightOffset();
  }

  _updateHeight(deltaSeconds) {
    if (this.grounded && this.z <= 0 && this.vz <= 0) return;

    this.vz -= GRAVITY * deltaSeconds;
    this.z += this.vz * deltaSeconds;

    if (this.z <= 0) {
      this.z = 0;
      this.vz = 0;
      this.grounded = true;
    }
  }

  _updateGroundPhysics(deltaSeconds, externalSpeedMultiplier) {
    const def = this.def;
    const { throttle, brake, steer } = this.input;
    const maxSpeed = def.speed * externalSpeedMultiplier;

    if (this.grounded) {
      if (throttle > 0) {
        this.speed += (def.acceleration / def.weight) * throttle * deltaSeconds;
      } else if (brake > 0 && this.speed > 0) {
        this.speed -= def.acceleration * 1.5 * brake * deltaSeconds;
      } else if (brake > 0 && this.speed <= 0) {
        this.speed -= def.acceleration * 0.5 * brake * deltaSeconds;
      } else {
        const friction = def.acceleration * 0.55 * deltaSeconds;
        if (this.speed > 0) this.speed = Math.max(0, this.speed - friction);
        else if (this.speed < 0) this.speed = Math.min(0, this.speed + friction);
      }

      this.speed = clamp(this.speed, -maxSpeed * 0.4, maxSpeed);

      const speedRatio = clamp(Math.abs(this.speed) / def.speed, 0.15, 1);
      const turnDirection = this.speed >= 0 ? 1 : -1;
      this.angle += steer * def.handling * speedRatio * turnDirection * deltaSeconds;
    } else {
      // no ar: sem tracao, so controle aereo (vira mais devagar)
      this.angle += steer * def.handling * AIR_STEER_FACTOR * deltaSeconds;
    }

    const vx = Math.cos(this.angle) * this.speed;
    const vy = Math.sin(this.angle) * this.speed;
    this.sprite.setVelocity(vx, vy);
    this.sprite.setRotation(this.angle);
  }

  // Phaser resincroniza sprite.x/y a partir do corpo fisico (a fonte
  // real da posicao) no inicio de cada frame, antes deste update()
  // rodar — entao deslocar sprite.y aqui pra "subir" o desenho com a
  // altura e seguro: no proximo frame a fisica resincroniza de novo
  // antes de eu aplicar o deslocamento outra vez. A sombra fica na
  // posicao real (chao), o carro desenhado sobe visualmente.
  _updateVisualHeightOffset() {
    this.shadow.setPosition(this.sprite.x, this.sprite.y);
    const shadowScale = clamp(1 - this.z / 260, SHADOW_MIN_SCALE, 1);
    this.shadow.setScale(shadowScale);
    this.shadow.setAlpha(SHADOW_MAX_ALPHA * shadowScale);

    this.sprite.y -= this.z * HEIGHT_SCALE;
  }

  getSpeedKmh() {
    return Math.abs(this.speed) * 0.6;
  }

  destroy() {
    this.sprite.destroy();
    this.shadow.destroy();
  }
}
