import Phaser from 'phaser';
import { SCENE_KEYS, COLORS, GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig.js';
import { getProfile, getBestTime } from '../systems/PlayerProfile.js';

// Menu principal: RUSH DRIVE, botoes JOGAR/GARAGEM/PISTAS/CONFIGURACOES,
// moedas e melhor resultado. Garagem e Pistas ja tem cena dedicada nas
// Etapas 10/11; ate la mostram um aviso em vez de navegar para uma
// cena que ainda nao existe.
export default class MenuScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.MENU);
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.background);
    const profile = getProfile();

    this.add
      .text(GAME_WIDTH / 2, 90, 'RUSH DRIVE', {
        fontFamily: 'Arial Black, Arial',
        fontSize: '64px',
        color: '#00e5ff'
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 145, 'corrida arcade', {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#8ea0c8'
      })
      .setOrigin(0.5);

    const bestTime = getBestTime(profile.selectedTrackId);
    this.add
      .text(16, 16, `🪙 ${profile.coins}`, {
        fontFamily: 'Arial Black, Arial',
        fontSize: '20px',
        color: '#ffd400'
      })
      .setOrigin(0, 0);

    this.add
      .text(GAME_WIDTH - 16, 16, bestTime ? `Melhor: ${this._formatTime(bestTime)}` : 'Melhor: --:--', {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#8ea0c8'
      })
      .setOrigin(1, 0);

    const buttons = [
      {
        label: 'JOGAR',
        color: 0x2bd576,
        onClick: () =>
          this.scene.start(SCENE_KEYS.RACE, { carId: profile.selectedCarId, trackId: profile.selectedTrackId })
      },
      { label: 'GARAGEM', color: 0x00e5ff, onClick: () => this._goToOrNotify(SCENE_KEYS.GARAGE, 'GARAGEM') },
      { label: 'PISTAS', color: 0xff9e2d, onClick: () => this._goToOrNotify(SCENE_KEYS.TRACK_SELECT, 'PISTAS') },
      {
        label: 'CONFIGURAÇÕES',
        color: 0xb84dff,
        onClick: () => this._goToOrNotify(SCENE_KEYS.SETTINGS, 'CONFIGURAÇÕES')
      }
    ];

    const startY = 220;
    const spacing = 64;

    buttons.forEach((btn, index) => {
      this._createMenuButton(GAME_WIDTH / 2, startY + index * spacing, btn.label, btn.color, btn.onClick);
    });
  }

  _goToOrNotify(sceneKey, label) {
    if (this.scene.get(sceneKey)) {
      this.scene.start(sceneKey);
      return;
    }

    this._showToast(`${label} chega em breve numa próxima etapa`);
  }

  _showToast(message) {
    const toast = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 40, message, {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#ffffff',
        backgroundColor: '#0b1220'
      })
      .setOrigin(0.5)
      .setPadding(10, 6, 10, 6)
      .setAlpha(0);

    this.tweens.add({
      targets: toast,
      alpha: 1,
      duration: 200,
      yoyo: true,
      hold: 1200,
      onComplete: () => toast.destroy()
    });
  }

  _createMenuButton(x, y, label, color, onClick) {
    const width = 320;
    const height = 50;
    const colorHex = `#${color.toString(16).padStart(6, '0')}`;

    const box = this.add
      .rectangle(x, y, width, height, 0x0b1220, 0.7)
      .setStrokeStyle(2, color, 1)
      .setInteractive({ useHandCursor: true });

    const text = this.add
      .text(x, y, label, { fontFamily: 'Arial Black, Arial', fontSize: '20px', color: colorHex })
      .setOrigin(0.5);

    box.on('pointerdown', onClick);
    box.on('pointerover', () => box.setFillStyle(0x0b1220, 0.95));
    box.on('pointerout', () => box.setFillStyle(0x0b1220, 0.7));

    return { box, text };
  }

  _formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${s.toFixed(1).padStart(4, '0')}`;
  }
}
