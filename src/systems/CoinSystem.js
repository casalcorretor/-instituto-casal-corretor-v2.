import { playSfx } from './AudioManager.js';

const COIN_VALUE = 10;
const COIN_RADIUS = 10;
const COIN_SPACING = 220;
// Deslocamento lateral pequeno o suficiente para o carro pegar a moeda
// mesmo dirigindo praticamente no centro da pista (raio do carro ~17 +
// raio da moeda 10 = alcance combinado de ~27px).
const COIN_LATERAL_OFFSET = 16;
const COIN_TEXTURE_KEY = 'coin';

function generateCoinTexture(scene) {
  if (scene.textures.exists(COIN_TEXTURE_KEY)) return COIN_TEXTURE_KEY;

  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(0xb8860b, 1);
  g.fillCircle(COIN_RADIUS, COIN_RADIUS, COIN_RADIUS);
  g.fillStyle(0xffd400, 1);
  g.fillCircle(COIN_RADIUS, COIN_RADIUS, COIN_RADIUS - 1.5);
  g.fillStyle(0xfff6c8, 1);
  g.fillCircle(COIN_RADIUS, COIN_RADIUS, COIN_RADIUS * 0.5);
  g.generateTexture(COIN_TEXTURE_KEY, COIN_RADIUS * 2, COIN_RADIUS * 2);
  g.destroy();

  return COIN_TEXTURE_KEY;
}

// Espalha moedas coletaveis ao longo da pista (alternando de lado) e
// cuida da coleta: destroi a moeda, soma no saldo da sessao, toca som
// e mostra uma pequena animacao de "+10" com um brilho que se
// expande e desaparece. O saldo acumulado entre corridas e persistido
// pela Etapa 13 (save); aqui so contamos a sessao atual.
export default class CoinSystem {
  constructor(scene, { track }) {
    this.scene = scene;
    this.collected = 0;

    const key = generateCoinTexture(scene);
    this.group = scene.physics.add.group({ allowGravity: false, immovable: true });
    this.coinObjects = [];

    const total = track.totalLength;
    let side = 1;

    for (let d = COIN_SPACING; d < total - COIN_SPACING; d += COIN_SPACING) {
      const p = track.getPointAtDistance(d);
      const normal = { x: -Math.sin(p.angle), y: Math.cos(p.angle) };
      const x = p.x + normal.x * COIN_LATERAL_OFFSET * side;
      const y = p.y + normal.y * COIN_LATERAL_OFFSET * side;

      const coin = this.group.create(x, y, key);
      coin.body.setCircle(COIN_RADIUS);
      coin.setDepth(3);

      this.coinObjects.push(coin);
      side *= -1;
    }
  }

  // onCollect(value, totalCollected) e chamado a cada moeda pega.
  attachCollector(carSprite, onCollect) {
    this.scene.physics.add.overlap(carSprite, this.group, (_car, coin) => {
      if (!coin.active) return;
      coin.disableBody(true, true);

      this.collected += 1;
      this._playCollectEffect(coin.x, coin.y);
      onCollect?.(COIN_VALUE, this.collected);
    });
  }

  _playCollectEffect(x, y) {
    playSfx(this.scene, 'coin');

    const label = this.scene.add
      .text(x, y, `+${COIN_VALUE}`, {
        fontFamily: 'Arial Black, Arial',
        fontSize: '16px',
        color: '#ffd400'
      })
      .setOrigin(0.5)
      .setDepth(50);

    const glow = this.scene.add.circle(x, y, 12, 0xffd400, 0.6).setDepth(49);

    if (this.scene.uiCamera) {
      this.scene.uiCamera.ignore([label, glow]);
    }

    this.scene.tweens.add({
      targets: label,
      y: y - 32,
      alpha: 0,
      duration: 600,
      onComplete: () => label.destroy()
    });

    this.scene.tweens.add({
      targets: glow,
      scale: 2.2,
      alpha: 0,
      duration: 350,
      onComplete: () => glow.destroy()
    });
  }
}
