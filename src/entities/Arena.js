import { ARENA_WIDTH, ARENA_HEIGHT, WALL_THICKNESS, GOAL_WIDTH } from '../data/ArenasData.js';

// Paleta de cada tema (Etapa 17 adiciona Futurista/Noturna reaproveitando
// o mesmo sistema de campo/paredes/decoracao da Urbana, so trocando
// cores + um pequeno toque decorativo proprio de cada uma).
const THEMES = {
  urban: {
    field: 0x123a2e,
    fieldLine: 0x2fae86,
    wall: 0x1c3444,
    stand: 0x0d1b26,
    standAccent: 0x18303f
  },
  futuristic: {
    field: 0x0a1a33,
    fieldLine: 0x2fa8ff,
    wall: 0x14243d,
    stand: 0x081019,
    standAccent: 0x122a4a
  },
  night: {
    field: 0x14102a,
    fieldLine: 0x9b59ff,
    wall: 0x1e1830,
    stand: 0x0a0714,
    standAccent: 0x1c1430
  }
};

const GOAL_LEFT_COLOR = 0x2fa8ff;
const GOAL_RIGHT_COLOR = 0xff5a4d;
const GOAL_DEPTH = 46;

// Constroi o campo: grama, marcacoes (linha central, circulo central,
// areas de gol), paredes fisicas com abertura pros gols (o jogador e a
// bola colidem com o campo mas atravessam a abertura do gol), e uma
// decoracao simples de arquibancada ao redor. As paredes sao retas
// (Arcade Physics so suporta caixas alinhadas aos eixos, sem rotacao
// real na colisao) — suficiente pra um campo estilo arcade. A cor e um
// pequeno detalhe decorativo mudam conforme o tema da arena.
export default class Arena {
  constructor(scene, arenaData) {
    this.scene = scene;
    this.width = ARENA_WIDTH;
    this.height = ARENA_HEIGHT;
    this.theme = arenaData.theme;
    this.colors = THEMES[this.theme] || THEMES.urban;

    this.goalTop = this.height / 2 - GOAL_WIDTH / 2;
    this.goalBottom = this.height / 2 + GOAL_WIDTH / 2;

    this.walls = scene.physics.add.staticGroup();
    this.gameObjects = [];

    this._drawField();
    this._drawStands();
    this._buildWalls();
    this._buildGoalNetWalls();
    this._buildGoalSensors();
    this._drawGoalFrames();
  }

  _drawField() {
    const g = this.scene.add.graphics().setDepth(0);
    const c = this.colors;

    g.fillStyle(c.field, 1);
    g.fillRect(0, 0, this.width, this.height);

    // linha central
    g.lineStyle(4, c.fieldLine, 0.6);
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
    g.lineStyle(4, c.fieldLine, 0.35);
    g.strokeRect(2, 2, this.width - 4, this.height - 4);

    if (this.theme === 'futuristic') {
      // grade neon fina cruzando o campo, ao estilo "arena digital"
      g.lineStyle(1, c.fieldLine, 0.15);
      for (let x = 0; x < this.width; x += 80) {
        g.beginPath();
        g.moveTo(x, 0);
        g.lineTo(x, this.height);
        g.strokePath();
      }
      for (let y = 0; y < this.height; y += 80) {
        g.beginPath();
        g.moveTo(0, y);
        g.lineTo(this.width, y);
        g.strokePath();
      }
    }

    this.gameObjects.push(g);
  }

  _drawStands() {
    const g = this.scene.add.graphics().setDepth(-1);
    const c = this.colors;
    const pad = 60;

    g.fillStyle(c.stand, 1);
    g.fillRect(-pad, -pad, this.width + pad * 2, pad);
    g.fillRect(-pad, this.height, this.width + pad * 2, pad);
    g.fillRect(-pad, 0, pad, this.height);
    g.fillRect(this.width, 0, pad, this.height);

    if (this.theme === 'night') {
      // ceu estrelado na arquibancada, ao inves das fileiras xadrez
      g.fillStyle(0xffffff, 0.6);
      for (let i = 0; i < 140; i += 1) {
        const x = (i * 977) % (this.width + pad * 2) - pad;
        const y = (i * 613) % pad;
        const onTop = i % 2 === 0;
        g.fillRect(x, onTop ? -pad + y : this.height + y, 2, 2);
      }
    } else {
      // fileiras simples de arquibancada (retangulos claros alternados)
      g.fillStyle(c.standAccent, 1);
      for (let x = 0; x < this.width; x += 40) {
        g.fillRect(x, -pad + 8, 26, pad - 16);
        g.fillRect(x, this.height + 8, 26, pad - 16);
      }
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

  // "Rede" do gol: uma parede atras da linha de gol, pra bola nao sair
  // voando pra sempre depois de entrar — quica ali e fica dentro do
  // gol ate o reset.
  _buildGoalNetWalls() {
    const t = 10;
    this._addWall(-GOAL_DEPTH + t / 2, this.height / 2, t, GOAL_WIDTH);
    this._addWall(this.width + GOAL_DEPTH - t / 2, this.height / 2, t, GOAL_WIDTH);
  }

  // Zonas sensoras (sem corpo solido, so overlap) que detectam quando a
  // bola entrou de fato no gol — usadas pela MatchScene pra contar o
  // ponto e resetar a bola.
  _buildGoalSensors() {
    this.leftGoalSensor = this.scene.add.zone(-GOAL_DEPTH / 2, this.height / 2, GOAL_DEPTH, GOAL_WIDTH);
    this.scene.physics.add.existing(this.leftGoalSensor, true);

    this.rightGoalSensor = this.scene.add.zone(this.width + GOAL_DEPTH / 2, this.height / 2, GOAL_DEPTH, GOAL_WIDTH);
    this.scene.physics.add.existing(this.rightGoalSensor, true);
  }

  _addWall(x, y, width, height) {
    const rect = this.scene.add.rectangle(x, y, width, height, this.colors.wall, 1).setDepth(3);
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
