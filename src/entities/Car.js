import { clamp } from '../utils/MathUtils.js';

const CAR_WIDTH = 34;
const CAR_HEIGHT = 18;

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

// Entidade de carro com física arcade simples: aceleração, frenagem,
// atrito e curva dependente da velocidade. Serve tanto para o jogador
// (Etapa 4 acopla os controles touch) quanto para adversários de IA
// (Etapa 6 acopla o comportamento automático).
export default class Car {
  constructor(scene, { x, y, angle = 0, carDef, textureKey }) {
    this.scene = scene;
    this.def = carDef;

    generateCarTexture(scene, textureKey, carDef.bodyColor, carDef.accentColor);

    this.sprite = scene.physics.add.image(x, y, textureKey);
    this.sprite.setRotation(angle);
    this.sprite.body.setSize(CAR_WIDTH, CAR_HEIGHT, true);
    this.sprite.setDamping(false);
    this.sprite.setDrag(0);
    this.sprite.setMaxVelocity(carDef.maxSpeed * 1.5);

    this.speed = 0;
    this.angle = angle;

    this.input = { throttle: 0, brake: 0, steer: 0 };
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
  }

  // speedMultiplier permite boosts temporarios (nitro, Etapa 7).
  update(deltaSeconds, speedMultiplier = 1) {
    const def = this.def;
    const { throttle, brake, steer } = this.input;

    const maxSpeed = def.maxSpeed * speedMultiplier;

    if (throttle > 0) {
      this.speed += def.acceleration * throttle * deltaSeconds;
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
  }

  getSpeedKmh() {
    // Conversao puramente cosmética (px/s -> um "km/h" plausível de HUD).
    return Math.abs(this.speed) * 0.6;
  }

  destroy() {
    this.sprite.destroy();
  }
}
