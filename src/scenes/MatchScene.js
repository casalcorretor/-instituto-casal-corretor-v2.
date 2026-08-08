import Phaser from 'phaser';
import { SCENE_KEYS, COLORS } from '../config/GameConfig.js';
import Arena from '../entities/Arena.js';
import { ARENAS, DEFAULT_ARENA_ID, ARENA_WIDTH, ARENA_HEIGHT } from '../data/ArenasData.js';

// Cena de partida. Nesta etapa so constroi e exibe a arena, com a
// camera enquadrando o campo inteiro. Carro, bola, gols e o resto do
// jogo entram nas proximas etapas.
export default class MatchScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.MATCH);
  }

  init(data) {
    this.arenaId = data?.arenaId || DEFAULT_ARENA_ID;
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.background);

    const arenaData = ARENAS[this.arenaId];
    this.arena = new Arena(this, arenaData);

    this.physics.world.setBounds(-80, -80, ARENA_WIDTH + 160, ARENA_HEIGHT + 160);

    this.cameras.main.centerOn(ARENA_WIDTH / 2, ARENA_HEIGHT / 2);
    this._fitCameraToArena();

    this.add
      .text(16, 16, 'Etapa 2: arena (ESC volta ao menu)', {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#ffffff',
        backgroundColor: '#000000'
      })
      .setScrollFactor(0)
      .setDepth(100);

    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.start(SCENE_KEYS.MENU);
    });
  }

  _fitCameraToArena() {
    const zoomX = this.scale.width / (ARENA_WIDTH + 160);
    const zoomY = this.scale.height / (ARENA_HEIGHT + 160);
    this.cameras.main.setZoom(Math.min(zoomX, zoomY));
  }
}
