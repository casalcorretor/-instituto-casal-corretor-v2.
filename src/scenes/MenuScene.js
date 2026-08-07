import Phaser from 'phaser';
import { SCENE_KEYS, COLORS, GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig.js';

// Placeholder da Etapa 1: apenas prova que o pipeline Boot -> Preload -> Menu
// funciona de ponta a ponta. O menu real (botões JOGAR/GARAGEM/PISTAS/
// CONFIGURAÇÕES) é construído na Etapa 9.
export default class MenuScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.MENU);
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.background);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, 'RUSH DRIVE', {
        fontFamily: 'Arial Black, Arial',
        fontSize: '64px',
        color: '#00e5ff'
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30, 'Etapa 1 concluida: projeto e arquitetura no ar', {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#8ea0c8'
      })
      .setOrigin(0.5);
  }
}
