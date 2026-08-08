import Phaser from 'phaser';
import { SCENE_KEYS, COLORS, GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig.js';

// Primeira cena: confirma que o motor Phaser esta de pe e segue para
// o carregamento de assets.
export default class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.BOOT);
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.background);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, 'CAR SOCCER', {
        fontFamily: 'Arial Black, Arial',
        fontSize: '56px',
        color: '#21e6c1'
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40, 'inicializando...', {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#ffffff'
      })
      .setOrigin(0.5);

    this.time.delayedCall(400, () => {
      this.scene.start(SCENE_KEYS.PRELOAD);
    });
  }
}
