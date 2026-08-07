import { clamp } from '../utils/MathUtils.js';
import { playSfx } from '../systems/AudioManager.js';

const CAR_WIDTH = 34;
const CAR_HEIGHT = 18;

const NITRO_MAX_SPEED_MULTIPLIER = 1.35;
const NITRO_ACCEL_MULTIPLIER = 1.6;
const NITRO_DRAIN_TIME = 2.2; // segundos para esvaziar a barra cheia
const NITRO_RECHARGE_TIME = 6; // segundos para reencher a barra vazia
const NITRO_MIN_SPEED_TO_USE = 20;

const NITRO_PARTICLE_TEXTURE = 'nitro_particle';

// Desenha, uma unica vez, a textura de um carro (visto de cima) e a
// registra na textura manager da cena. Chamado no preload/criacao das
// cenas que precisam do carro, nunca a cada frame (gera a imagem uma vez
// e reaproveita, o que é essencial para performance em celular).
export function generateCarTexture(scene, textureKey, bodyColor, accentColor) {
  if (scene.textures.exists(textureKey)) return;

  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  const w = CAR_WIDTH;
  const h = CAR_HEIGHT;
  const cx = w / 2;
  const cy = h / 2;

  // Carroceria principal.
  g.fillStyle(bodyColor, 1);
  g.fillRoundedRect(0, 0, w, h, 5);

  // Cabine / para-brisa.
  g.fillStyle(accentColor, 1);
  g.fillRoundedRect(w * 0.42, 2, w * 0.32, h - 4, 3);

  // Spoiler traseiro.
  g.fillStyle(accentColor, 1);
  g.fillRect(1, -1 + 1, 3, h - 2);

  // Farois dianteiros.
  g.fillStyle(0xffffff, 1);
  g.fillRect(w - 3, 2, 2, 3);
  g.fillRect(w - 3, h - 5, 2, 3);

  // Faixa lateral (identidade visual do carro).
  g.fillStyle(0xffffff, 0.5);
  g.fillRect(w * 0.15, cy - 1.5, w * 0.55, 3);

  g.generateTexture(textureKey, w, h);
  g.destroy();
}

function generateNitroParticleTexture(scene) {
  if (scene.textures.exists(NITRO_PARTICLE_TEXTURE)) return;

  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(4, 4, 4);
  g.generateTexture(NITRO_PARTICLE_TEXTURE, 8, 8);
  g.destroy();
}

// Entidade de carro com física arcade simples: aceleração, frenagem,
// atrito e curva dependente da velocidade, mais o sistema de nitro
// (barra que drena ao usar, recarrega sozinha, e da um boost temporario
// de velocidade/aceleracao com rastro de particulas). Serve tanto para
// o jogador quanto para adversários de IA.
export default class Car {
  constructor(scene, { x, y, angle = 0, carDef, textureKey }) {
    this.scene = scene;
    this.def = carDef;

    generateCarTexture(scene, textureKey, carDef.bodyColor, carDef.accentColor);
    generateNitroParticleTexture(scene);

    this.sprite = scene.physics.add.image(x, y, textureKey);
    this.sprite.setRotation(angle);
    this.sprite.body.setSize(CAR_WIDTH, CAR_HEIGHT, true);
    this.sprite.setDamping(false);
    this.sprite.setDrag(0);
    this.sprite.setMaxVelocity(carDef.maxSpeed * 1.5 * NITRO_MAX_SPEED_MULTIPLIER);

    this.speed = 0;
    this.angle = angle;

    this.input = { throttle: 0, brake: 0, steer: 0, nitro: false };

    this.nitroCapacity = carDef.nitroCapacity;
    this.nitroAmount = carDef.nitroCapacity;
    this.nitroActive = false;

    this.nitroEmitter = scene.add.particles(0, 0, NITRO_PARTICLE_TEXTURE, {
      speed: { min: 30, max: 90 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      alpha: { start: 0.9, end: 0 },
      lifespan: 260,
      tint: [0x00e5ff, 0xffffff, 0xff9e2d],
      emitting: false
    });
    // Acima da pista e do proprio carro (que ficam no depth padrao 0),
    // senao o rastro de particulas fica desenhado por baixo do asfalto.
    this.nitroEmitter.setDepth(1);
  }

  get x() {
    return this.sprite.x;
  }

  get y() {
    return this.sprite.y;
  }

  setInput(input) {
    this.input.throttle = clamp(input.throttle ?? 0, 0, 1);
    this.input.brake = clamp(input.brake ?? 0, 0, 1);
    this.input.steer = clamp(input.steer ?? 0, -1, 1);
    this.input.nitro = !!input.nitro;
  }

  // externalSpeedMultiplier permite ajustes de fora (ex.: dificuldade da IA).
  update(deltaSeconds, externalSpeedMultiplier = 1) {
    const def = this.def;
    const { throttle, brake, steer } = this.input;

    this._updateNitro(deltaSeconds);

    const nitroSpeedMul = this.nitroActive ? NITRO_MAX_SPEED_MULTIPLIER : 1;
    const nitroAccelMul = this.nitroActive ? NITRO_ACCEL_MULTIPLIER : 1;
    const maxSpeed = def.maxSpeed * externalSpeedMultiplier * nitroSpeedMul;

    if (throttle > 0) {
      this.speed += def.acceleration * nitroAccelMul * throttle * deltaSeconds;
    } else if (brake > 0 && this.speed > 0) {
      this.speed -= def.braking * brake * deltaSeconds;
    } else if (brake > 0 && this.speed <= 0) {
      // Sem re marcha dedicada: freio no carro parado engata ré leve.
      this.speed -= def.acceleration * 0.5 * brake * deltaSeconds;
    } else {
      // Atrito natural quando nao ha aceleracao nem freio.
      const friction = def.acceleration * 0.6 * deltaSeconds;
      if (this.speed > 0) this.speed = Math.max(0, this.speed - friction);
      else if (this.speed < 0) this.speed = Math.min(0, this.speed + friction);
    }

    this.speed = clamp(this.speed, -maxSpeed * 0.4, maxSpeed);

    // Carro vira menos parado e mais em movimento, mas nunca zero, para
    // conseguir sair da largada girando as rodas.
    const speedRatio = clamp(Math.abs(this.speed) / def.maxSpeed, 0.12, 1);
    const turnDirection = this.speed >= 0 ? 1 : -1;
    this.angle += steer * def.control * speedRatio * turnDirection * deltaSeconds;

    const vx = Math.cos(this.angle) * this.speed;
    const vy = Math.sin(this.angle) * this.speed;

    this.sprite.setVelocity(vx, vy);
    this.sprite.setRotation(this.angle);

    this._updateNitroEffect();
  }

  _updateNitro(deltaSeconds) {
    const wantsNitro = this.input.nitro && this.nitroAmount > 0 && Math.abs(this.speed) > NITRO_MIN_SPEED_TO_USE;

    if (wantsNitro) {
      if (!this.nitroActive) playSfx(this.scene, 'nitro');
      this.nitroActive = true;
      this.nitroAmount = clamp(this.nitroAmount - (this.nitroCapacity / NITRO_DRAIN_TIME) * deltaSeconds, 0, this.nitroCapacity);
    } else {
      this.nitroActive = false;
      this.nitroAmount = clamp(this.nitroAmount + (this.nitroCapacity / NITRO_RECHARGE_TIME) * deltaSeconds, 0, this.nitroCapacity);
    }
  }

  _updateNitroEffect() {
    if (!this.nitroActive) return;

    const rearX = this.x - Math.cos(this.angle) * (CAR_WIDTH * 0.5);
    const rearY = this.y - Math.sin(this.angle) * (CAR_WIDTH * 0.5);
    this.nitroEmitter.emitParticleAt(rearX, rearY, 2);
  }

  getSpeedKmh() {
    // Conversao puramente cosmética (px/s -> um "km/h" plausível de HUD).
    return Math.abs(this.speed) * 0.6;
  }

  getNitroFraction() {
    return this.nitroCapacity > 0 ? this.nitroAmount / this.nitroCapacity : 0;
  }

  destroy() {
    this.sprite.destroy();
    this.nitroEmitter.destroy();
  }
}
