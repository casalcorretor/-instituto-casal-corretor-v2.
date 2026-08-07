const MINIMAP_SIZE = 130;
const MINIMAP_MARGIN = 16;
const MINIMAP_PADDING = 10;

// Minimapa simples: desenha o traçado da pista reduzido dentro de uma
// caixa fixa no canto, e um ponto por carro (verde-agua para o
// jogador, cores dos adversarios para a IA) atualizado a cada frame.
export default class Minimap {
  constructor(scene, { track, x, y }) {
    this.scene = scene;
    this.track = track;
    this.gameObjects = [];

    const bounds = this._computeTrackBounds(track.points);
    this.bounds = bounds;
    this.scale = Math.min(
      (MINIMAP_SIZE - MINIMAP_PADDING * 2) / bounds.width,
      (MINIMAP_SIZE - MINIMAP_PADDING * 2) / bounds.height
    );

    this.originX = x;
    this.originY = y;

    this.bg = scene.add
      .rectangle(x, y, MINIMAP_SIZE, MINIMAP_SIZE, 0x0b1220, 0.55)
      .setStrokeStyle(2, 0x2a3550, 1)
      .setOrigin(0, 0)
      .setDepth(150);

    this.trackGraphics = scene.add.graphics().setDepth(151);
    this._drawTrack();

    this.dotsGraphics = scene.add.graphics().setDepth(152);

    this.gameObjects.push(this.bg, this.trackGraphics, this.dotsGraphics);
  }

  _computeTrackBounds(points) {
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    return { minX, minY, width: maxX - minX || 1, height: maxY - minY || 1 };
  }

  _toMinimapXY(worldX, worldY) {
    const x = this.originX + MINIMAP_PADDING + (worldX - this.bounds.minX) * this.scale;
    const y = this.originY + MINIMAP_PADDING + (worldY - this.bounds.minY) * this.scale;
    return { x, y };
  }

  _drawTrack() {
    const g = this.trackGraphics;
    g.lineStyle(2, 0x8ea0c8, 0.9);
    g.beginPath();

    this.track.points.forEach((p, i) => {
      const mp = this._toMinimapXY(p.x, p.y);
      if (i === 0) g.moveTo(mp.x, mp.y);
      else g.lineTo(mp.x, mp.y);
    });

    g.closePath();
    g.strokePath();
  }

  // racers: [{ x, y, color, isPlayer }]
  update(racers) {
    const g = this.dotsGraphics;
    g.clear();

    for (const racer of racers) {
      const mp = this._toMinimapXY(racer.x, racer.y);
      g.fillStyle(racer.color, 1);
      g.fillCircle(mp.x, mp.y, racer.isPlayer ? 4.5 : 3.5);
    }
  }
}

export { MINIMAP_SIZE, MINIMAP_MARGIN };
