import Phaser from 'phaser';
import { SCENE_KEYS, COLORS, GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig.js';

// Placeholder das primeiras etapas: prova que o pipeline Boot -> Preload ->
// Menu funciona, e por enquanto oferece um botão de teste para entrar na
// pista. O menu real (JOGAR/GARAGEM/PISTAS/CONFIGURAÇÕES) é construído na
// Etapa 9, quando este botão de teste é substituído.
export default class MenuScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.MENU);
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.background);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, 'RUSH DRIVE', {
        fontFamily: 'Arial Black, Arial',
        fontSize: '64px',
        color: '#00e5ff'
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 10, 'Etapa 2: pista basica', {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#8ea0c8'
      })
      .setOrigin(0.5);

    const testButton = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50, '[ VER PISTA DE TESTE ]', {
        fontFamily: 'Arial',
        fontSize: '20px',
        color: '#ffd400'
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    testButton.on('pointerdown', () => {
      this.scene.start(SCENE_KEYS.RACE, { trackId: 'test' });
    });
  }
}
