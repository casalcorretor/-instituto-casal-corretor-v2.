import Phaser from 'phaser';
import { clamp } from '../utils/MathUtils.js';
import { playSfx } from '../systems/AudioManager.js';
import { getRarity } from '../data/RarityData.js';

const CAR_WIDTH = 38;
const CAR_HEIGHT = 22;
const GRAVITY = 1400;
const HEIGHT_SCALE = 0.62; // quanto a altura "z" desloca o desenho na tela
const SHADOW_MAX_ALPHA = 0.45;
const SHADOW_MIN_SCALE = 0.35;
const AIR_STEER_FACTOR = 0.35; // controle aereo e mais lento que no chao

const BOOST_DRAIN_TIME = 3; // segundos pra esvaziar a barra cheia em uso continuo
const BOOST_THRUST = 700; // aceleracao extra por segundo enquanto o turbo esta ativo
const BOOST_SPEED_MULTIPLIER = 1.35; // teto de velocidade sobe enquanto usa turbo
const BOOST_MIN_TO_START = 4; // precisa desse tanto na barra pra comecar a usar

export const PARTICLE_TEXTURE_KEY = 'car_boost_particle';
const AURA_TEXTURE_KEY = 'car_aura_particle';
const AURA_ORBIT_RADIUS = 26; // raio em que as particulas do efeito exclusivo orbitam o carro

// Desenha, uma unica vez, a textura de um carro (visto de cima) e a
// registra na textura manager da cena. Nunca chamado por frame — gera
// a imagem uma vez e reaproveita (essencial pra performance mobile).
export function generateCarTexture(scene, textureKey, bodyColor, accentColor, wheelColor = 0x141414) {
  if (scene.textures.exists(textureKey)) return;

  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  const w = CAR_WIDTH;
  const h = CAR_HEIGHT;

  // carroceria
  g.fillStyle(bodyColor, 1);
  g.fillRoundedRect(0, 0, w, h, 6);

  // rodas (vista de cima, faixas nas bordas de cima/baixo)
  g.fillStyle(wheelColor, 1);
  g.fillRect(w * 0.22, 0, w * 0.14, 3);
  g.fillRect(w * 0.22, h - 3, w * 0.14, 3);
  g.fillRect(w * 0.62, 0, w * 0.14, 3);
  g.fillRect(w * 0.62, h - 3, w * 0.14, 3);

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

function generateBoostParticleTexture(scene) {
  if (scene.textures.exists(PARTICLE_TEXTURE_KEY)) return;

  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(4, 4, 4);
  g.generateTexture(PARTICLE_TEXTURE_KEY, 8, 8);
  g.destroy();
}

// Particula de "brilho" (sparkle), usada so pelo efeito visual
// exclusivo dos carros lendarios/misticos (RarityData.specialEffect).
function generateAuraParticleTexture(scene) {
  if (scene.textures.exists(AURA_TEXTURE_KEY)) return;

  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(5, 5, 2);
  g.fillTriangle(5, 0, 6.4, 5, 3.6, 5);
  g.fillTriangle(5, 10, 6.4, 5, 3.6, 5);
  g.fillTriangle(0, 5, 5, 6.4, 5, 3.6);
  g.fillTriangle(10, 5, 5, 6.4, 5, 3.6);
  g.generateTexture(AURA_TEXTURE_KEY, 10, 10);
  g.destroy();
}

// Carro com fisica arcade no plano do chao (acelerar/frear/virar) mais
// um eixo Z simulado (altura) pra pulo e disputa de bola no ar — sem
// precisar de um motor de fisica 3D. Enquanto no ar, o acelerador e o
// freio nao fazem nada (rodas nao tocam o chao), mas ainda da pra
// virar (controle aereo basico), mais lento que no chao. O turbo
// funciona tanto no chao quanto no ar (empurra pra frente na direcao
// que o carro esta olhando), o que permite "voar" ate a bola.
//
// O corpo fisico (this.sprite) fica sempre na posicao real de chao e
// NUNCA e deslocado visualmente — testei deslocar sprite.y direto pra
// simular altura e descobri que o Arcade Physics absorve essa mudanca
// de volta no corpo fisico no frame seguinte (ele resincroniza o corpo
// a partir do transform do GameObject), causando deriva de posicao
// que ia se acumulando. A correcao: um sprite visual SEPARADO, sem
// fisica, que so copia a posicao do corpo fisico e recebe o
// deslocamento de altura pra desenho.
export default class Car {
  // customization (opcional): { paintColor, wheelColor, trailColor,
  // turboColor } — cores ja resolvidas (nao ids), preparadas pelo
  // chamador a partir de CustomizationData.js. Sem customization,
  // usa as cores originais do carro. So o carro do jogador recebe
  // personalizacao por enquanto; bots usam sempre a aparencia padrao.
  constructor(scene, { x, y, angle = 0, carDef, textureKey, customization = null }) {
    this.scene = scene;
    this.def = carDef;
    this.customization = customization;

    const paintColor = customization?.paintColor ?? carDef.bodyColor;
    const wheelColor = customization?.wheelColor ?? 0x141414;
    const effectiveTextureKey = customization
      ? `${textureKey}_p${paintColor.toString(16)}_w${wheelColor.toString(16)}`
      : textureKey;

    generateCarTexture(scene, effectiveTextureKey, paintColor, carDef.accentColor, wheelColor);
    const shadowKey = generateShadowTexture(scene);
    generateBoostParticleTexture(scene);

    this.shadow = scene.add.image(x, y, shadowKey).setDepth(4).setAlpha(SHADOW_MAX_ALPHA);

    this.sprite = scene.physics.add.image(x, y, effectiveTextureKey);
    this.sprite.setVisible(false);
    this.sprite.body.setSize(CAR_WIDTH, CAR_HEIGHT, true);
    this.sprite.setDamping(false);
    this.sprite.setDrag(0);
    this.sprite.setMaxVelocity(carDef.speed * 1.6 * BOOST_SPEED_MULTIPLIER);
    this.sprite.setBounce(0.35);

    this.visual = scene.add.image(x, y, effectiveTextureKey);
    this.visual.setDepth(5);
    this.visual.setRotation(angle);

    const turboTint = customization?.turboColor
      ? [customization.turboColor, 0xffffff]
      : [carDef.bodyColor, 0xffffff, 0xffc93c];
    this.boostEmitter = scene.add.particles(0, 0, PARTICLE_TEXTURE_KEY, {
      speed: { min: 30, max: 90 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      alpha: { start: 0.9, end: 0 },
      lifespan: 260,
      tint: turboTint,
      emitting: false
    });
    this.boostEmitter.setDepth(4);

    // Rastro continuo enquanto anda no chao (independente do turbo) —
    // so existe se o jogador escolheu uma cor de rastro na garagem.
    this.trailEmitter = null;
    if (customization?.trailColor) {
      this.trailEmitter = scene.add.particles(0, 0, PARTICLE_TEXTURE_KEY, {
        speed: { min: 5, max: 20 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.5, end: 0 },
        alpha: { start: 0.5, end: 0 },
        lifespan: 400,
        frequency: 60,
        tint: customization.trailColor,
        emitting: false
      });
      this.trailEmitter.setDepth(3);
    }

    // Efeito visual exclusivo pra carros lendarios/misticos: um brilho
    // orbitando o carro o tempo todo (nao so ao usar turbo), pra
    // diferenciar essas raridades a distancia mesmo parado.
    this.rarity = getRarity(carDef.rarity);
    if (this.rarity.specialEffect) {
      generateAuraParticleTexture(scene);
      this.auraEmitter = scene.add.particles(0, 0, AURA_TEXTURE_KEY, {
        emitZone: { type: 'random', source: new Phaser.Geom.Circle(0, 0, AURA_ORBIT_RADIUS) },
        speed: { min: 4, max: 14 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.7, end: 0 },
        alpha: { start: 0.9, end: 0 },
        lifespan: 650,
        frequency: 70,
        tint: this.rarity.color
      });
      this.auraEmitter.setDepth(4);
    } else {
      this.auraEmitter = null;
    }

    this.speed = 0;
    this.angle = angle;
    this.z = 0;
    this.vz = 0;
    this.grounded = true;

    this.boostCapacity = carDef.boost;
    this.boostAmount = carDef.boost;
    this.boosting = false;

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

  // externalSpeedMultiplier permite ajustes de fora (ex.: IA).
  update(deltaSeconds, externalSpeedMultiplier = 1) {
    this._updateHeight(deltaSeconds);
    this._updateBoost(deltaSeconds);
    this._updateGroundPhysics(deltaSeconds, externalSpeedMultiplier);
    this._updateVisual();
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

  _updateBoost(deltaSeconds) {
    const canUse = this.boosting ? this.boostAmount > 0 : this.boostAmount >= BOOST_MIN_TO_START;
    const wantsBoost = this.input.boost && canUse;

    if (wantsBoost) {
      if (!this.boosting) playSfx(this.scene, 'boost');
      this.boosting = true;
      this.boostAmount = clamp(
        this.boostAmount - (this.boostCapacity / BOOST_DRAIN_TIME) * deltaSeconds,
        0,
        this.boostCapacity
      );
    } else {
      this.boosting = false;
    }
  }

  _updateGroundPhysics(deltaSeconds, externalSpeedMultiplier) {
    const def = this.def;
    const { throttle, brake, steer } = this.input;
    const boostSpeedMul = this.boosting ? BOOST_SPEED_MULTIPLIER : 1;
    const maxSpeed = def.speed * externalSpeedMultiplier * boostSpeedMul;

    if (this.grounded) {
      if (throttle > 0) {
        this.speed += (def.acceleration / def.weight) * throttle * deltaSeconds;
      } else if (brake > 0 && this.speed > 0) {
        this.speed -= def.acceleration * 1.5 * brake * deltaSeconds;
      } else if (brake > 0 && this.speed <= 0) {
        this.speed -= def.acceleration * 0.5 * brake * deltaSeconds;
      } else if (!this.boosting) {
        const friction = def.acceleration * 0.55 * deltaSeconds;
        if (this.speed > 0) this.speed = Math.max(0, this.speed - friction);
        else if (this.speed < 0) this.speed = Math.min(0, this.speed + friction);
      }

      if (this.boosting) this.speed += (BOOST_THRUST / def.weight) * deltaSeconds;

      this.speed = clamp(this.speed, -maxSpeed * 0.4, maxSpeed);

      const speedRatio = clamp(Math.abs(this.speed) / def.speed, 0.15, 1);
      const turnDirection = this.speed >= 0 ? 1 : -1;
      this.angle += steer * def.handling * speedRatio * turnDirection * deltaSeconds;
    } else {
      // no ar: sem tracao, so controle aereo (vira mais devagar); o
      // turbo ainda funciona (e assim que da pra "voar" ate a bola).
      if (this.boosting) {
        this.speed += (BOOST_THRUST / def.weight) * deltaSeconds;
        this.speed = clamp(this.speed, -maxSpeed * 0.4, maxSpeed);
      }
      this.angle += steer * def.handling * AIR_STEER_FACTOR * deltaSeconds;
    }

    const vx = Math.cos(this.angle) * this.speed;
    const vy = Math.sin(this.angle) * this.speed;
    this.sprite.setVelocity(vx, vy);
  }

  _updateVisual() {
    this.shadow.setPosition(this.sprite.x, this.sprite.y);
    const shadowScale = clamp(1 - this.z / 260, SHADOW_MIN_SCALE, 1);
    this.shadow.setScale(shadowScale);
    this.shadow.setAlpha(SHADOW_MAX_ALPHA * shadowScale);

    const visualY = this.sprite.y - this.z * HEIGHT_SCALE;
    this.visual.setPosition(this.sprite.x, visualY);
    this.visual.setRotation(this.angle);

    if (this.boosting) {
      const rearX = this.sprite.x - Math.cos(this.angle) * (CAR_WIDTH * 0.5);
      const rearY = visualY - Math.sin(this.angle) * (CAR_WIDTH * 0.5);
      this.boostEmitter.emitParticleAt(rearX, rearY, 2);
    }

    if (this.auraEmitter) {
      this.auraEmitter.setPosition(this.sprite.x, visualY);
    }

    if (this.trailEmitter) {
      this.trailEmitter.setPosition(this.sprite.x, visualY);
      if (this.grounded && Math.abs(this.speed) > 40) {
        this.trailEmitter.start();
      } else {
        this.trailEmitter.stop();
      }
    }
  }

  getSpeedKmh() {
    return Math.abs(this.speed) * 0.6;
  }

  getBoostFraction() {
    return this.boostCapacity > 0 ? this.boostAmount / this.boostCapacity : 0;
  }

  refillBoost(amount) {
    this.boostAmount = clamp(this.boostAmount + amount, 0, this.boostCapacity);
  }

  destroy() {
    this.sprite.destroy();
    this.shadow.destroy();
    this.visual.destroy();
    this.boostEmitter.destroy();
    if (this.auraEmitter) this.auraEmitter.destroy();
    if (this.trailEmitter) this.trailEmitter.destroy();
  }
}
