import { ARENA_WIDTH, ARENA_HEIGHT, WALL_THICKNESS, GOAL_WIDTH } from '../data/ArenasData.js';

const FIELD_COLOR = 0x123a2e;
const FIELD_LINE_COLOR = 0x2fae86;
const WALL_COLOR = 0x1c3444;
const GOAL_LEFT_COLOR = 0x2fa8ff;
const GOAL_RIGHT_COLOR = 0xff5a4d;
const STAND_COLOR = 0x0d1b26;

// Constroi o campo: grama, marcacoes (linha central, circulo central,
// areas de gol), paredes fisicas com abertura pros gols (o jogador e a
// bola colidem com o campo mas atravessam a abertura do gol), e uma
// decoracao simples de arquibancada ao redor. As paredes sao retas
// (Arcade Physics so suporta caixas alinhadas aos eixos, sem rotacao
// real na colisao) — suficiente pra um campo estilo arcade.
export default class Arena {
  constructor(scene, arenaData) {
    this.scene = scene;
    this.width = ARENA_WIDTH;
    this.height = ARENA_HEIGHT;
    this.theme = arenaData.theme;

    this.goalTop = this.height / 2 - GOAL_WIDTH / 2;
    this.goalBottom = this.height / 2 + GOAL_WIDTH / 2;

    this.walls = scene.physics.add.staticGroup();
    this.gameObjects = [];

    this._drawField();
    this._drawStands();
    this._buildWalls();
    this._drawGoalFrames();
  }

  _drawField() {
    const g = this.scene.add.graphics().setDepth(0);

    g.fillStyle(FIELD_COLOR, 1);
    g.fillRect(0, 0, this.width, this.height);

    // linha central
    g.lineStyle(4, FIELD_LINE_COLOR, 0.6);
    g.beginPath();
    g.moveTo(this.width / 2, 0);
    g.lineTo(this.width / 2, this.height);
    g.strokePath();

    // circulo central
    g.strokeCircle(this.width / 2, this.height / 2, 110);

    // areas de gol (retangulos na frente de cada gol)
    const boxWidth = 130;
    const boxHeight = GOAL_WIDTH + 140;
    const boxY = this.height / 2 - boxHeight / 2;
    g.strokeRect(0, boxY, boxWidth, boxHeight);
    g.strokeRect(this.width - boxWidth, boxY, boxWidth, boxHeight);

    // borda externa do campo
    g.lineStyle(4, FIELD_LINE_COLOR, 0.35);
    g.strokeRect(2, 2, this.width - 4, this.height - 4);

    this.gameObjects.push(g);
  }

  _drawStands() {
    const g = this.scene.add.graphics().setDepth(-1);
    const pad = 60;

    g.fillStyle(STAND_COLOR, 1);
    g.fillRect(-pad, -pad, this.width + pad * 2, pad);
    g.fillRect(-pad, this.height, this.width + pad * 2, pad);
    g.fillRect(-pad, 0, pad, this.height);
    g.fillRect(this.width, 0, pad, this.height);

    // fileiras simples de arquibancada (retangulos claros alternados)
    g.fillStyle(0x18303f, 1);
    for (let x = 0; x < this.width; x += 40) {
      g.fillRect(x, -pad + 8, 26, pad - 16);
      g.fillRect(x, this.height + 8, 26, pad - 16);
    }

    this.gameObjects.push(g);
  }

  _buildWalls() {
    const t = WALL_THICKNESS;
    const w = this.width;
    const h = this.height;

    // paredes horizontais (topo e base), inteiras
    this._addWall(w / 2, t / 2, w, t);
    this._addWall(w / 2, h - t / 2, w, t);

    // paredes verticais (esquerda e direita), com abertura pro gol
    this._addWall(t / 2, this.goalTop / 2, t, this.goalTop);
    this._addWall(t / 2, this.goalBottom + (h - this.goalBottom) / 2, t, h - this.goalBottom);

    this._addWall(w - t / 2, this.goalTop / 2, t, this.goalTop);
    this._addWall(w - t / 2, this.goalBottom + (h - this.goalBottom) / 2, t, h - this.goalBottom);
  }

  _addWall(x, y, width, height) {
    const rect = this.scene.add.rectangle(x, y, width, height, WALL_COLOR, 1).setDepth(3);
    this.scene.physics.add.existing(rect, true);
    this.walls.add(rect);
    this.gameObjects.push(rect);
    return rect;
  }

  _drawGoalFrames() {
    const g = this.scene.add.graphics().setDepth(2);
    const depth = 46;

    g.fillStyle(GOAL_LEFT_COLOR, 0.18);
    g.fillRect(-depth, this.goalTop, depth, GOAL_WIDTH);
    g.lineStyle(5, GOAL_LEFT_COLOR, 0.9);
    g.strokeRect(-depth, this.goalTop, depth, GOAL_WIDTH);

    g.fillStyle(GOAL_RIGHT_COLOR, 0.18);
    g.fillRect(this.width, this.goalTop, depth, GOAL_WIDTH);
    g.lineStyle(5, GOAL_RIGHT_COLOR, 0.9);
    g.strokeRect(this.width, this.goalTop, depth, GOAL_WIDTH);

    this.gameObjects.push(g);
  }

  // Ponto central da linha de gol (usado por gols/IA/camera).
  getGoalCenter(side) {
    const y = this.height / 2;
    return side === 'left' ? { x: 0, y } : { x: this.width, y };
  }
}
