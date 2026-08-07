import { buildClosedSpline, normalBetween, distance } from '../utils/MathUtils.js';

const ASPHALT_COLOR = 0x2b2f3a;
const ASPHALT_EDGE_COLOR = 0x1a1d24;
const CURB_RED = 0xd6362f;
const CURB_WHITE = 0xf2f2f2;
const CENTER_LINE_COLOR = 0xf2d24a;

// Representa uma pista fechada, construída a partir de poucos waypoints
// suavizados em uma spline. Cuida de desenhar o asfalto, meio-fio, linha
// central e linha de largada/chegada, e também expõe utilidades de
// progresso ao longo da pista (usadas por voltas, IA e minimapa).
export default class Track {
  constructor(scene, { waypoints, roadWidth = 140, samplesPerSegment = 24 }) {
    this.scene = scene;
    this.roadWidth = roadWidth;
    this.waypoints = waypoints;

    this.points = buildClosedSpline(waypoints, samplesPerSegment);
    this._buildCumulativeDistances();

    this.startPoint = this.points[0];
    this.startDirection = normalBetween(this.points[0], this.points[1]);

    this.graphics = scene.add.graphics();
    this.graphics.setDepth(0);
  }

  _buildCumulativeDistances() {
    const distances = [0];
    for (let i = 1; i <= this.points.length; i++) {
      const a = this.points[i - 1];
      const b = this.points[i % this.points.length];
      distances.push(distances[i - 1] + distance(a.x, a.y, b.x, b.y));
    }
    this.cumulativeDistances = distances;
    this.totalLength = distances[distances.length - 1];
  }

  draw() {
    const g = this.graphics;
    g.clear();

    // Base escura (sombra/borda do asfalto), levemente maior que a pista.
    g.lineStyle(this.roadWidth + 14, ASPHALT_EDGE_COLOR, 1);
    g.strokePoints(this.points, true, true);

    // Asfalto principal.
    g.lineStyle(this.roadWidth, ASPHALT_COLOR, 1);
    g.strokePoints(this.points, true, true);

    this._drawCurbs();
    this._drawCenterLine();
    this._drawStartFinishLine();
  }

  _drawCurbs() {
    const g = this.graphics;
    const half = this.roadWidth / 2 + 6;
    const dashLen = 3;

    for (let side = -1; side <= 1; side += 2) {
      for (let i = 0; i < this.points.length; i += dashLen) {
        const a = this.points[i];
        const b = this.points[(i + dashLen) % this.points.length];
        const n = normalBetween(a, b);

        const ax = a.x + n.x * half * side;
        const ay = a.y + n.y * half * side;
        const bx = b.x + n.x * half * side;
        const by = b.y + n.y * half * side;

        const dashIndex = Math.floor(i / dashLen);
        g.lineStyle(8, dashIndex % 2 === 0 ? CURB_RED : CURB_WHITE, 1);
        g.beginPath();
        g.moveTo(ax, ay);
        g.lineTo(bx, by);
        g.strokePath();
      }
    }
  }

  _drawCenterLine() {
    const g = this.graphics;
    const dashLen = 4;
    const gapLen = 4;
    let i = 0;

    while (i < this.points.length) {
      const a = this.points[i];
      const bIndex = Math.min(i + dashLen, this.points.length - 1);
      const b = this.points[bIndex];

      g.lineStyle(4, CENTER_LINE_COLOR, 0.9);
      g.beginPath();
      g.moveTo(a.x, a.y);
      g.lineTo(b.x, b.y);
      g.strokePath();

      i += dashLen + gapLen;
    }
  }

  _drawStartFinishLine() {
    const g = this.graphics;
    const p = this.points[0];
    const n = normalBetween(this.points[0], this.points[1]);
    const half = this.roadWidth / 2;

    const squares = 8;
    const squareSize = this.roadWidth / squares;

    for (let i = 0; i < squares; i++) {
      const offset = -half + i * squareSize;
      const cx = p.x + n.x * (offset + squareSize / 2);
      const cy = p.y + n.y * (offset + squareSize / 2);
      const color = i % 2 === 0 ? 0xffffff : 0x111111;

      g.fillStyle(color, 1);
      g.save();
      g.translateCanvas(cx, cy);
      g.rotateCanvas(Math.atan2(n.y, n.x));
      g.fillRect(-4, -squareSize / 2, 8, squareSize);
      g.restore();
    }
  }

  // Retorna o ponto e o ângulo de direção mais próximos de uma distância
  // percorrida ao longo da pista (usado por carros de IA e checkpoints).
  getPointAtDistance(dist) {
    const total = this.totalLength;
    let d = dist % total;
    if (d < 0) d += total;

    let idx = 0;
    while (idx < this.cumulativeDistances.length - 1 && this.cumulativeDistances[idx + 1] < d) {
      idx++;
    }

    const a = this.points[idx % this.points.length];
    const b = this.points[(idx + 1) % this.points.length];
    const segStart = this.cumulativeDistances[idx];
    const segLen = this.cumulativeDistances[idx + 1] - segStart || 1;
    const t = (d - segStart) / segLen;

    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
      angle: Math.atan2(b.y - a.y, b.x - a.x)
    };
  }

  // Progresso aproximado (0..totalLength) do ponto (x,y) mais próximo na
  // pista, feito por varredura simples — suficiente para o número de
  // pontos desta spline e chamado poucas vezes por frame.
  getClosestProgress(x, y) {
    let bestDist = Infinity;
    let bestIndex = 0;

    for (let i = 0; i < this.points.length; i++) {
      const p = this.points[i];
      const d = (p.x - x) ** 2 + (p.y - y) ** 2;
      if (d < bestDist) {
        bestDist = d;
        bestIndex = i;
      }
    }

    return this.cumulativeDistances[bestIndex];
  }
}
