const PAD_RADIUS = 26;
const RESPAWN_TIME = 5000; // ms ate o ponto reaparecer depois de usado
const REFILL_AMOUNT = 60;

function generatePadTexture(scene) {
  const key = 'turbo_pad';
  if (scene.textures.exists(key)) return key;

  const d = PAD_RADIUS * 2;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(0xffc93c, 0.85);
  g.fillCircle(PAD_RADIUS, PAD_RADIUS, PAD_RADIUS);
  g.fillStyle(0x0a1420, 1);
  g.fillCircle(PAD_RADIUS, PAD_RADIUS, PAD_RADIUS * 0.6);
  g.fillStyle(0xffc93c, 1);
  // raio estilizado no meio do ponto
  g.fillTriangle(PAD_RADIUS - 4, PAD_RADIUS - 12, PAD_RADIUS + 6, PAD_RADIUS - 2, PAD_RADIUS - 1, PAD_RADIUS - 2);
  g.fillTriangle(PAD_RADIUS - 1, PAD_RADIUS - 2, PAD_RADIUS + 4, PAD_RADIUS - 2, PAD_RADIUS - 6, PAD_RADIUS + 12);
  g.generateTexture(key, d, d);
  g.destroy();
  return key;
}

// Ponto de recarga de turbo espalhado pela arena: enche a barra de
// turbo de quem passar por cima, some por alguns segundos, e volta a
// aparecer sozinho. E o unico jeito de recarregar turbo nesse jogo
// (sem regeneracao passiva) — pedido explicito da spec.
export default class TurboPad {
  constructor(scene, { x, y }) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.active = true;

    const textureKey = generatePadTexture(scene);
    this.zone = scene.add.zone(x, y, PAD_RADIUS * 2, PAD_RADIUS * 2);
    scene.physics.add.existing(this.zone, true);

    this.visual = scene.add.image(x, y, textureKey).setDepth(1);

    this.scene.tweens.add({
      targets: this.visual,
      scale: { from: 0.9, to: 1.05 },
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  tryCollect(car) {
    if (!this.active) return false;

    this.active = false;
    car.refillBoost(REFILL_AMOUNT);
    this.visual.setVisible(false);
    this.zone.body.enable = false;

    this.scene.time.delayedCall(RESPAWN_TIME, () => {
      this.active = true;
      this.visual.setVisible(true);
      this.zone.body.enable = true;
    });

    return true;
  }

  destroy() {
    this.visual.destroy();
    this.zone.destroy();
  }
}
