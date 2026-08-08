import Phaser from 'phaser';
import { SCENE_KEYS, COLORS, GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig.js';

// Todo o visual do jogo (carros, bola, arenas) e gerado por codigo
// (formas, gradientes, particulas), entao nao ha imagens externas pra
// baixar aqui. Esta cena existe como ponto unico onde texturas
// geradas e audio serao preparados antes do menu abrir.
export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.PRELOAD);
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.background);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'carregando...', {
        fontFamily: 'Arial',
        fontSize: '20px',
        color: '#ffffff'
      })
      .setOrigin(0.5);

    this.time.delayedCall(200, () => {
      this.scene.start(SCENE_KEYS.MENU);
    });
  }
}
