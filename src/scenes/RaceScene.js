import Phaser from 'phaser';
import { SCENE_KEYS, COLORS } from '../config/GameConfig.js';
import Track from '../entities/Track.js';
import { TRACKS } from '../data/TracksData.js';

// Cena de corrida. Nesta etapa só constrói e exibe a pista, com a câmera
// livre para conferir o traçado inteiro. Carro, física e câmera de
// perseguição chegam nas próximas etapas.
export default class RaceScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.RACE);
  }

  init(data) {
    this.trackId = data?.trackId || 'test';
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.background);

    const trackData = TRACKS[this.trackId];
    this.track = new Track(this, trackData);
    this.track.draw();

    const bounds = this._computeTrackBounds(trackData.waypoints, trackData.roadWidth);
    this.cameras.main.setBounds(bounds.x, bounds.y, bounds.width, bounds.height);
    this.physics.world.setBounds(bounds.x, bounds.y, bounds.width, bounds.height);

    this._markStart();

    this.add
      .text(16, 16, 'Etapa 2: pista basica (ESC volta ao menu)', {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#ffffff',
        backgroundColor: '#000000'
      })
      .setScrollFactor(0)
      .setDepth(100);

    this.cameras.main.centerOn(this.track.startPoint.x, this.track.startPoint.y);
    this.cameras.main.setZoom(0.45);

    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.start(SCENE_KEYS.MENU);
    });
  }

  _computeTrackBounds(waypoints, roadWidth) {
    const pad = roadWidth + 200;
    const xs = waypoints.map((p) => p.x);
    const ys = waypoints.map((p) => p.y);
    const minX = Math.min(...xs) - pad;
    const maxX = Math.max(...xs) + pad;
    const minY = Math.min(...ys) - pad;
    const maxY = Math.max(...ys) + pad;

    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }

  _markStart() {
    const p = this.track.startPoint;
    this.add.circle(p.x, p.y, 14, 0x2bd576).setDepth(5);
    this.add
      .text(p.x, p.y - 40, 'LARGADA', {
        fontFamily: 'Arial',
        fontSize: '20px',
        color: '#2bd576'
      })
      .setOrigin(0.5)
      .setDepth(5);
  }
}
