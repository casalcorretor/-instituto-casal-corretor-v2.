import { clamp } from '../utils/MathUtils.js';

const NITRO_BAR_WIDTH = 200;
const NITRO_BAR_HEIGHT = 14;

// HUD de corrida: posição, volta, tempo, velocidade e barra de nitro.
// Vive na camera de UI (ver RaceScene) para nao ser afetado pelo
// zoom/follow da camera principal. Moedas e minimapa entram aqui na
// Etapa 8/9 sem precisar recriar o layout.
export default class RaceHud {
  constructor(scene, { width, height }) {
    this.scene = scene;
    this.gameObjects = [];

    const panelStyle = {
      fontFamily: 'Arial Black, Arial',
      fontSize: '22px',
      color: '#ffffff'
    };

    this.positionText = scene.add.text(16, 14, '', panelStyle).setDepth(150);
    this.lapText = scene.add.text(16, 44, '', { ...panelStyle, fontSize: '18px' }).setDepth(150);
    this.timeText = scene.add
      .text(width / 2, 14, '', { ...panelStyle, fontSize: '20px' })
      .setOrigin(0.5, 0)
      .setDepth(150);
    this.speedText = scene.add
      .text(width - 16, 14, '', { ...panelStyle, fontSize: '18px' })
      .setOrigin(1, 0)
      .setDepth(150);

    const barX = width - 16 - NITRO_BAR_WIDTH;
    const barY = height - 210;

    this.nitroLabel = scene.add
      .text(barX, barY - 20, 'NITRO', { ...panelStyle, fontSize: '14px', color: '#00e5ff' })
      .setDepth(150);
    this.nitroBarBg = scene.add
      .rectangle(barX, barY, NITRO_BAR_WIDTH, NITRO_BAR_HEIGHT, 0x0b1220, 0.7)
      .setOrigin(0, 0.5)
      .setStrokeStyle(2, 0x00e5ff, 0.9)
      .setDepth(150);
    this.nitroBarFill = scene.add
      .rectangle(barX + 2, barY, NITRO_BAR_WIDTH - 4, NITRO_BAR_HEIGHT - 4, 0x00e5ff, 1)
      .setOrigin(0, 0.5)
      .setDepth(151);
    this._nitroFullWidth = NITRO_BAR_WIDTH - 4;

    this.gameObjects.push(
      this.positionText,
      this.lapText,
      this.timeText,
      this.speedText,
      this.nitroLabel,
      this.nitroBarBg,
      this.nitroBarFill
    );
  }

  update({ position, totalRacers, lap, totalLaps, raceTime, speedKmh, nitroFraction, formatTime }) {
    this.positionText.setText(`${position}º / ${totalRacers}`);
    this.lapText.setText(`Volta ${Math.min(lap, totalLaps)}/${totalLaps}`);
    this.timeText.setText(formatTime(raceTime));
    this.speedText.setText(`${speedKmh.toFixed(0)} km/h`);

    const fraction = clamp(nitroFraction ?? 0, 0, 1);
    this.nitroBarFill.width = this._nitroFullWidth * fraction;
    this.nitroBarFill.fillColor = fraction < 0.2 ? 0xff3b3b : 0x00e5ff;
  }
}
