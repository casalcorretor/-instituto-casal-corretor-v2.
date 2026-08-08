import Phaser from 'phaser';
import { SCENE_KEYS, COLORS, GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig.js';
import { playSfx } from '../systems/AudioManager.js';

// Tela de resultado ao fim da corrida: posicao, tempo, moedas ganhas,
// recompensa por posicao, e os botoes PROXIMA CORRIDA / MENU pedidos
// pela spec. Substitui o texto simples que a Etapa 5 usava como
// placeholder.
export default class ResultScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.RESULT);
  }

  init(data) {
    this.result = data;
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.background);
    const {
      position,
      totalRacers,
      formattedTime,
      coinsCollected,
      positionBonus,
      totalEarned,
      isNewBest,
      unlockedTrackName
    } = this.result;

    const isWin = position === 1;
    playSfx(this, isWin ? 'victory' : 'defeat');

    this.add
      .text(GAME_WIDTH / 2, 70, isWin ? 'VITÓRIA!' : `${position}º LUGAR`, {
        fontFamily: 'Arial Black, Arial',
        fontSize: '52px',
        color: isWin ? '#ffd400' : '#00e5ff'
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 125, `${position}º de ${totalRacers} corredores`, {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#8ea0c8'
      })
      .setOrigin(0.5);

    const lines = [
      ['Tempo', formattedTime],
      ['Moedas coletadas', `${coinsCollected}`],
      ['Bônus de posição', `+${positionBonus}`],
      ['Total ganho', `${totalEarned} moedas`]
    ];

    let y = 200;
    lines.forEach(([label, value]) => {
      this.add.text(GAME_WIDTH / 2 - 160, y, label, {
        fontFamily: 'Arial',
        fontSize: '20px',
        color: '#ffffff'
      });
      this.add
        .text(GAME_WIDTH / 2 + 160, y, value, {
          fontFamily: 'Arial Black, Arial',
          fontSize: '20px',
          color: '#ffd400'
        })
        .setOrigin(1, 0);
      y += 34;
    });

    if (isNewBest) {
      this.add
        .text(GAME_WIDTH / 2, y + 10, '★ NOVO RECORDE NA PISTA ★', {
          fontFamily: 'Arial Black, Arial',
          fontSize: '18px',
          color: '#2bd576'
        })
        .setOrigin(0.5);
      y += 26;
    }

    if (unlockedTrackName) {
      this.add
        .text(GAME_WIDTH / 2, y + 10, `🔓 Pista desbloqueada: ${unlockedTrackName}`, {
          fontFamily: 'Arial Black, Arial',
          fontSize: '16px',
          color: '#ffd400'
        })
        .setOrigin(0.5);
    }

    this._createButton(GAME_WIDTH / 2 - 130, GAME_HEIGHT - 60, 'PRÓXIMA CORRIDA', 0x2bd576, () => {
      this.scene.start(SCENE_KEYS.RACE, { trackId: this.result.trackId, carId: this.result.carId });
    });

    this._createButton(GAME_WIDTH / 2 + 130, GAME_HEIGHT - 60, 'MENU', 0x00e5ff, () => {
      this.scene.start(SCENE_KEYS.MENU);
    });
  }

  _createButton(x, y, label, color, onClick) {
    const width = 220;
    const height = 52;
    const colorHex = `#${color.toString(16).padStart(6, '0')}`;

    const box = this.add
      .rectangle(x, y, width, height, 0x0b1220, 0.7)
      .setStrokeStyle(2, color, 1)
      .setInteractive({ useHandCursor: true });

    const text = this.add
      .text(x, y, label, { fontFamily: 'Arial Black, Arial', fontSize: '18px', color: colorHex })
      .setOrigin(0.5);

    box.on('pointerdown', onClick);
    box.on('pointerover', () => box.setFillStyle(0x0b1220, 0.95));
    box.on('pointerout', () => box.setFillStyle(0x0b1220, 0.7));

    return { box, text };
  }
}
