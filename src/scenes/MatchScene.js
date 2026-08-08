import Phaser from 'phaser';
import { SCENE_KEYS, COLORS, GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig.js';
import Arena from '../entities/Arena.js';
import Car from '../entities/Car.js';
import Ball from '../entities/Ball.js';
import TouchControls from '../ui/TouchControls.js';
import { ARENAS, DEFAULT_ARENA_ID, ARENA_WIDTH, ARENA_HEIGHT } from '../data/ArenasData.js';
import { CARS, DEFAULT_CAR_ID } from '../data/CarsData.js';

const BASE_HIT_IMPULSE = 420;
const VERTICAL_HIT_BASE = 380;

// Cena de partida. Constroi a arena e o carro do jogador com fisica
// (chao + altura simulada pro pulo) e controles touch/teclado. A
// camera principal enquadra o campo inteiro; uma segunda camera de UI
// (zoom fixo em 1, ignorando o mundo) exibe o HUD e os botoes — evita
// o bug de HUD distorcido pelo zoom da camera principal.
export default class MatchScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.MATCH);
  }

  init(data) {
    this.arenaId = data?.arenaId || DEFAULT_ARENA_ID;
    this.carId = data?.carId || DEFAULT_CAR_ID;
    this.worldObjects = [];
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.background);

    const arenaData = ARENAS[this.arenaId];
    this.arena = new Arena(this, arenaData);
    this.worldObjects.push(...this.arena.gameObjects);

    this.physics.world.setBounds(-80, -80, ARENA_WIDTH + 160, ARENA_HEIGHT + 160);

    this._createPlayerCar();
    this._createBall();
    this._createKeyboardInput();
    this._createTouchControls();
    this._createUiCamera();

    this.cameras.main.centerOn(ARENA_WIDTH / 2, ARENA_HEIGHT / 2);
    this._fitCameraToArena();

    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.start(SCENE_KEYS.MENU);
    });
  }

  _createPlayerCar() {
    const carDef = CARS[this.carId];
    this.playerCar = new Car(this, {
      x: ARENA_WIDTH / 2 - 200,
      y: ARENA_HEIGHT / 2,
      angle: 0,
      carDef,
      textureKey: `car_${carDef.id}`
    });

    this.physics.add.collider(this.playerCar.sprite, this.arena.walls);
    this.worldObjects.push(this.playerCar.shadow, this.playerCar.visual);
  }

  _createBall() {
    this.ball = new Ball(this, { x: ARENA_WIDTH / 2, y: ARENA_HEIGHT / 2 });
    this.worldObjects.push(this.ball.shadow, this.ball.visual);

    this.physics.add.collider(this.ball.sprite, this.arena.walls);
    this.physics.add.collider(this.playerCar.sprite, this.ball.sprite, () =>
      this._onCarHitBall(this.playerCar, this.ball)
    );
  }

  // Colisao carro-bola: alem da resposta fisica automatica do Arcade
  // (massa/bounce), aplica um empurrao adicional na direcao carro->bola
  // escalado pelo atributo "impact" do carro (carros mais pesados/
  // impactantes chutam mais forte). Se o carro estiver no ar e perto o
  // suficiente da altura da bola, tambem da um impulso vertical —
  // assim da pra "cabecear" a bola pro alto pulando nela.
  _onCarHitBall(car, ball) {
    const dx = ball.x - car.x;
    const dy = ball.y - car.y;
    const dist = Math.hypot(dx, dy) || 1;
    const dirX = dx / dist;
    const dirY = dy / dist;

    const carSpeed = Math.abs(car.speed);
    const pushStrength = (BASE_HIT_IMPULSE + carSpeed) * car.def.impact;

    ball.sprite.body.velocity.x += dirX * pushStrength * 0.016;
    ball.sprite.body.velocity.y += dirY * pushStrength * 0.016;

    if (!car.isGrounded && ball.canBeHitVerticallyBy(car.z)) {
      ball.applyVerticalHit(VERTICAL_HIT_BASE * car.def.impact);
    }
  }

  _createKeyboardInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys('W,A,S,D,SPACE,SHIFT');
  }

  _createTouchControls() {
    this.touchControls = new TouchControls(this, { width: GAME_WIDTH, height: GAME_HEIGHT });
  }

  _createUiCamera() {
    this.debugText = this.add
      .text(16, 16, '', {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#ffffff',
        backgroundColor: '#000000'
      })
      .setDepth(100);

    const uiObjects = [this.debugText, ...this.touchControls.gameObjects];

    this.uiCamera = this.cameras.add(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.uiCamera.setScroll(0, 0);
    this.uiCamera.ignore(this.worldObjects);
    this.cameras.main.ignore(uiObjects);
  }

  _fitCameraToArena() {
    const zoomX = this.scale.width / (ARENA_WIDTH + 160);
    const zoomY = this.scale.height / (ARENA_HEIGHT + 160);
    this.cameras.main.setZoom(Math.min(zoomX, zoomY));
  }

  _readInput() {
    const up = this.cursors.up.isDown || this.wasd.W.isDown;
    const down = this.cursors.down.isDown || this.wasd.S.isDown;
    const left = this.cursors.left.isDown || this.wasd.A.isDown;
    const right = this.cursors.right.isDown || this.wasd.D.isDown;
    const jumpKey = this.wasd.SPACE.isDown;
    const boostKey = this.wasd.SHIFT.isDown;

    const touch = this.touchControls.getState();

    return {
      throttle: up || touch.throttle ? 1 : 0,
      brake: down || touch.brake ? 1 : 0,
      steer: Phaser.Math.Clamp((left ? -1 : 0) + (right ? 1 : 0) + touch.steer, -1, 1),
      jump: jumpKey || touch.jump,
      boost: boostKey || touch.boost
    };
  }

  update(time, delta) {
    const deltaSeconds = delta / 1000;
    const input = this._readInput();

    this.playerCar.setInput(input);
    this.playerCar.update(deltaSeconds);
    this.ball.update(deltaSeconds);

    this.debugText.setText(
      [
        'Etapa 5: bola (WASD/setas, ESPACO pula, ESC volta ao menu)',
        `carro: ${this.playerCar.getSpeedKmh().toFixed(0)} km/h | z=${this.playerCar.z.toFixed(0)}`,
        `bola: z=${this.ball.z.toFixed(0)} | vel=${Math.hypot(this.ball.sprite.body.velocity.x, this.ball.sprite.body.velocity.y).toFixed(0)}`
      ].join('\n')
    );
  }
}
