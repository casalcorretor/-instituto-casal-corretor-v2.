import Phaser from 'phaser';
import { SCENE_KEYS, COLORS, GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig.js';
import Arena from '../entities/Arena.js';
import Car from '../entities/Car.js';
import { ARENAS, DEFAULT_ARENA_ID, ARENA_WIDTH, ARENA_HEIGHT } from '../data/ArenasData.js';
import { CARS, DEFAULT_CAR_ID } from '../data/CarsData.js';

// Cena de partida. Constroi a arena e o carro do jogador com fisica
// (chao + altura simulada pro pulo). A camera principal enquadra o
// campo inteiro; uma segunda camera de UI (zoom fixo em 1, ignorando o
// mundo) exibe o HUD de debug — evita o bug de HUD distorcido pelo
// zoom da camera principal (scrollFactor(0) sozinho nao cancela zoom).
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
    this._createKeyboardInput();
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
    this.worldObjects.push(this.playerCar.sprite, this.playerCar.shadow);
  }

  _createKeyboardInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys('W,A,S,D,SPACE,SHIFT');
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

    this.uiCamera = this.cameras.add(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.uiCamera.setScroll(0, 0);
    this.uiCamera.ignore(this.worldObjects);
    this.cameras.main.ignore([this.debugText]);
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
    const jump = this.wasd.SPACE.isDown;
    const boost = this.wasd.SHIFT.isDown;

    return {
      throttle: up ? 1 : 0,
      brake: down ? 1 : 0,
      steer: (left ? -1 : 0) + (right ? 1 : 0),
      jump,
      boost
    };
  }

  update(time, delta) {
    const deltaSeconds = delta / 1000;
    const input = this._readInput();

    this.playerCar.setInput(input);
    this.playerCar.update(deltaSeconds);

    this.debugText.setText(
      [
        'Etapa 3: carro e fisica (WASD/setas, ESPACO pula, ESC volta ao menu)',
        `velocidade: ${this.playerCar.getSpeedKmh().toFixed(0)} km/h`,
        `altura (z): ${this.playerCar.z.toFixed(0)}`,
        `no chao: ${this.playerCar.isGrounded ? 'sim' : 'nao'}`
      ].join('\n')
    );
  }
}
