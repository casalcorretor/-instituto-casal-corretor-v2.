import Phaser from 'phaser';
import { SCENE_KEYS, COLORS, GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig.js';
import { CARS } from '../data/CarsData.js';
import { validateCarsAgainstRarities } from '../data/RarityData.js';

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

    if (import.meta.env.DEV) {
      const problems = validateCarsAgainstRarities(CARS);
      problems.forEach((msg) => console.warn(`[CarsData] ${msg}`));
    }

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
