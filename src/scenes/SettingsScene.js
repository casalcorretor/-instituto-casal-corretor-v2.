import Phaser from 'phaser';
import { SCENE_KEYS, COLORS, GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig.js';
import { getProfile } from '../systems/PlayerProfile.js';

const BAR_WIDTH = 220;
const BAR_HEIGHT = 14;

// Configuracoes: volume da musica, volume dos efeitos, vibracao,
// modo de controle e botao voltar. Os valores ficam em
// PlayerProfile.settings — a Etapa 12 le musicVolume/sfxVolume para
// tocar audio de verdade, e a Etapa 13 persiste tudo isso.
export default class SettingsScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.SETTINGS);
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.background);
    this.profile = getProfile();

    this.add
      .text(GAME_WIDTH / 2, 50, 'CONFIGURAÇÕES', {
        fontFamily: 'Arial Black, Arial',
        fontSize: '32px',
        color: '#00e5ff'
      })
      .setOrigin(0.5);

    let y = 140;
    this._createVolumeRow(y, 'Música', 'musicVolume');
    y += 60;
    this._createVolumeRow(y, 'Efeitos', 'sfxVolume');
    y += 70;
    this._createToggleRow(y, 'Vibração', 'vibration');
    y += 60;
    this._createControlModeRow(y);

    this._createBackButton();
  }

  _createVolumeRow(y, label, key) {
    const centerX = GAME_WIDTH / 2;

    this.add.text(centerX - 260, y - 10, label, {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#ffffff'
    });

    const barX = centerX - 90;
    const bg = this.add
      .rectangle(barX, y, BAR_WIDTH, BAR_HEIGHT, 0x0b1220, 0.7)
      .setStrokeStyle(2, 0x00e5ff, 0.8)
      .setOrigin(0, 0.5);
    const fill = this.add.rectangle(barX + 2, y, 1, BAR_HEIGHT - 4, 0x00e5ff, 1).setOrigin(0, 0.5);

    const render = () => {
      fill.width = (BAR_WIDTH - 4) * this.profile.settings[key];
    };
    render();

    this._createStepButton(barX + BAR_WIDTH + 30, y, '-', () => {
      this.profile.settings[key] = Phaser.Math.Clamp(this.profile.settings[key] - 0.1, 0, 1);
      render();
    });
    this._createStepButton(barX + BAR_WIDTH + 70, y, '+', () => {
      this.profile.settings[key] = Phaser.Math.Clamp(this.profile.settings[key] + 0.1, 0, 1);
      render();
    });
  }

  _createToggleRow(y, label, key) {
    const centerX = GAME_WIDTH / 2;

    this.add.text(centerX - 260, y - 10, label, {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#ffffff'
    });

    const box = this.add
      .rectangle(centerX - 30, y, 110, 34, 0x0b1220, 0.7)
      .setStrokeStyle(2, 0x2bd576, 1)
      .setInteractive({ useHandCursor: true });
    const text = this.add
      .text(centerX - 30, y, this.profile.settings[key] ? 'LIGADO' : 'DESLIGADO', {
        fontFamily: 'Arial Black, Arial',
        fontSize: '14px',
        color: '#2bd576'
      })
      .setOrigin(0.5);

    box.on('pointerdown', () => {
      this.profile.settings[key] = !this.profile.settings[key];
      text.setText(this.profile.settings[key] ? 'LIGADO' : 'DESLIGADO');
    });
  }

  _createControlModeRow(y) {
    const centerX = GAME_WIDTH / 2;
    const modes = { buttons: 'BOTÕES', tilt: 'INCLINAÇÃO (em breve)' };

    this.add.text(centerX - 260, y - 10, 'Controle', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#ffffff'
    });

    const box = this.add
      .rectangle(centerX - 20, y, 220, 34, 0x0b1220, 0.7)
      .setStrokeStyle(2, 0xff9e2d, 1)
      .setInteractive({ useHandCursor: true });
    const text = this.add
      .text(centerX - 20, y, modes[this.profile.settings.controlMode], {
        fontFamily: 'Arial Black, Arial',
        fontSize: '13px',
        color: '#ff9e2d'
      })
      .setOrigin(0.5);

    box.on('pointerdown', () => {
      // Por enquanto so alterna a preferencia salva; a entrada por
      // inclinacao de verdade fica pra depois, mas o resto do jogo ja
      // consome os controles atraves de um unico formato (ver
      // TouchControls.getState), entao plugar o sensor no futuro nao
      // exige mudar RaceScene nem Car.
      this.profile.settings.controlMode = this.profile.settings.controlMode === 'buttons' ? 'tilt' : 'buttons';
      text.setText(modes[this.profile.settings.controlMode]);
    });
  }

  _createStepButton(x, y, label, onClick) {
    const box = this.add
      .rectangle(x, y, 32, 32, 0x0b1220, 0.7)
      .setStrokeStyle(2, 0x8ea0c8, 1)
      .setInteractive({ useHandCursor: true });
    const text = this.add
      .text(x, y, label, { fontFamily: 'Arial Black, Arial', fontSize: '18px', color: '#ffffff' })
      .setOrigin(0.5);

    box.on('pointerdown', onClick);
    return { box, text };
  }

  _createBackButton() {
    const box = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 60, 200, 46, 0x0b1220, 0.7)
      .setStrokeStyle(2, 0xffffff, 0.8)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 60, 'VOLTAR', {
        fontFamily: 'Arial Black, Arial',
        fontSize: '18px',
        color: '#ffffff'
      })
      .setOrigin(0.5);

    box.on('pointerdown', () => this.scene.start(SCENE_KEYS.MENU));
  }
}
