import Phaser from 'phaser';
import { SCENE_KEYS, COLORS, GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig.js';

// Placeholder da Etapa 1: prova que o pipeline Boot -> Preload -> Menu
// funciona de ponta a ponta. O menu real (JOGAR/GARAGEM/LOJA/ARENAS/
// CONFIGURACOES) e construido na Etapa 17.
export default class MenuScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.MENU);
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.background);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, 'CAR SOCCER', {
        fontFamily: 'Arial Black, Arial',
        fontSize: '64px',
        color: '#21e6c1'
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30, 'Etapa 1 concluida: projeto e arquitetura no ar', {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#8fb3c9'
      })
      .setOrigin(0.5);
  }
}
