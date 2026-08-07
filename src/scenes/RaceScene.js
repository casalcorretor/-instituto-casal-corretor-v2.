import Phaser from 'phaser';
import { SCENE_KEYS, COLORS, GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig.js';
import Track from '../entities/Track.js';
import Car from '../entities/Car.js';
import { TRACKS } from '../data/TracksData.js';
import { CARS, DEFAULT_CAR_ID } from '../data/CarsData.js';

// Cena de corrida. Constroi a pista e o carro do jogador com fisica de
// direcao arcade. A camera principal segue o carro com zoom; uma segunda
// camera de UI (zoom fixo em 1, ignorando o mundo) exibe o HUD de debug —
// esse e o padrao correto do Phaser para HUD nao se distorcer com o zoom
// da camera de jogo, e sera reaproveitado pelo HUD completo na Etapa 9.
export default class RaceScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.RACE);
  }

  init(data) {
    this.trackId = data?.trackId || 'test';
    this.carId = data?.carId || DEFAULT_CAR_ID;
    this.worldObjects = [];
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.background);

    const trackData = TRACKS[this.trackId];
    this.track = new Track(this, trackData);
    this.track.draw();
    this.worldObjects.push(this.track.graphics);

    const bounds = this._computeTrackBounds(trackData.waypoints, trackData.roadWidth);
    this.cameras.main.setBounds(bounds.x, bounds.y, bounds.width, bounds.height);
    this.physics.world.setBounds(bounds.x, bounds.y, bounds.width, bounds.height);

    this._markStart();
    this._createPlayerCar();
    this._createKeyboardInput();
    this._createUiCamera();

    this.cameras.main.setZoom(1.4);
    this.cameras.main.startFollow(this.playerCar.sprite, true, 0.08, 0.08);

    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.start(SCENE_KEYS.MENU);
    });
  }

  _createPlayerCar() {
    const carDef = CARS[this.carId];
    const start = this.track.startPoint;

    this.playerCar = new Car(this, {
      x: start.x,
      y: start.y,
      angle: this.track.startDirectionAngle,
      carDef,
      textureKey: `car_${carDef.id}`
    });
    this.worldObjects.push(this.playerCar.sprite);
  }

  _createKeyboardInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys('W,A,S,D');
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

  update(time, delta) {
    const deltaSeconds = delta / 1000;

    const up = this.cursors.up.isDown || this.wasd.W.isDown;
    const down = this.cursors.down.isDown || this.wasd.S.isDown;
    const left = this.cursors.left.isDown || this.wasd.A.isDown;
    const right = this.cursors.right.isDown || this.wasd.D.isDown;

    this.playerCar.setInput({
      throttle: up ? 1 : 0,
      brake: down ? 1 : 0,
      steer: (left ? -1 : 0) + (right ? 1 : 0)
    });

    this.playerCar.update(deltaSeconds);

    this.debugText.setText(
      [
        'Etapa 3: carro e fisica de direcao (WASD/setas, ESC volta ao menu)',
        `carro: ${this.playerCar.def.name}`,
        `velocidade: ${this.playerCar.getSpeedKmh().toFixed(0)} km/h`
      ].join('\n')
    );
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
    const circle = this.add.circle(p.x, p.y, 14, 0x2bd576).setDepth(5);
    const label = this.add
      .text(p.x, p.y - 40, 'LARGADA', {
        fontFamily: 'Arial',
        fontSize: '20px',
        color: '#2bd576'
      })
      .setOrigin(0.5)
      .setDepth(5);

    this.worldObjects.push(circle, label);
  }
}
