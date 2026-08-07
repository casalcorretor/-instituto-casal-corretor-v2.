import Phaser from 'phaser';
import { SCENE_KEYS, COLORS, GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig.js';
import Track from '../entities/Track.js';
import Car from '../entities/Car.js';
import TouchControls from '../ui/TouchControls.js';
import RaceHud from '../ui/RaceHud.js';
import RaceManager from '../systems/RaceManager.js';
import { TRACKS } from '../data/TracksData.js';
import { CARS, DEFAULT_CAR_ID } from '../data/CarsData.js';

const TOTAL_LAPS = 3;

// Cena de corrida. Constroi a pista e o carro do jogador com fisica de
// direcao arcade, controles touch/teclado, e o sistema de corrida
// (voltas, tempo, posicao) via RaceManager. A camera principal segue o
// carro com zoom; uma segunda camera de UI (zoom fixo em 1, ignorando o
// mundo) exibe o HUD — esse e o padrao correto do Phaser para HUD nao
// se distorcer com o zoom/follow da camera de jogo.
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
    this._createRaceManager();
    this._createKeyboardInput();
    this._createTouchControls();
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

  _createRaceManager() {
    this.raceManager = new RaceManager({ track: this.track, totalLaps: TOTAL_LAPS });
    this.raceManager.addRacer('player', this.playerCar);
  }

  _createKeyboardInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys('W,A,S,D');
  }

  _createTouchControls() {
    this.touchControls = new TouchControls(this, { width: GAME_WIDTH, height: GAME_HEIGHT });
  }

  _createUiCamera() {
    this.raceHud = new RaceHud(this, { width: GAME_WIDTH });

    this.statusText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '', {
        fontFamily: 'Arial Black, Arial',
        fontSize: '40px',
        color: '#2bd576',
        align: 'center'
      })
      .setOrigin(0.5)
      .setDepth(150);

    const uiObjects = [this.statusText, ...this.raceHud.gameObjects, ...this.touchControls.gameObjects];

    this.uiCamera = this.cameras.add(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.uiCamera.setScroll(0, 0);
    this.uiCamera.ignore(this.worldObjects);
    this.cameras.main.ignore(uiObjects);
  }

  _readInput() {
    const up = this.cursors.up.isDown || this.wasd.W.isDown;
    const down = this.cursors.down.isDown || this.wasd.S.isDown;
    const left = this.cursors.left.isDown || this.wasd.A.isDown;
    const right = this.cursors.right.isDown || this.wasd.D.isDown;

    const touch = this.touchControls.getState();

    return {
      throttle: up || touch.throttle ? 1 : 0,
      brake: down || touch.brake ? 1 : 0,
      steer: Phaser.Math.Clamp((left ? -1 : 0) + (right ? 1 : 0) + touch.steer, -1, 1),
      nitro: touch.nitro
    };
  }

  update(time, delta) {
    const deltaSeconds = delta / 1000;
    const playerRacer = this.raceManager.getRacer('player');

    if (!playerRacer.finished) {
      const input = this._readInput();
      this.playerCar.setInput(input);
      this.playerCar.update(deltaSeconds);
      this.raceManager.update(deltaSeconds);
    } else {
      this.playerCar.setInput({ throttle: 0, brake: 0, steer: 0 });
      this.playerCar.update(deltaSeconds);
    }

    this.raceHud.update({
      position: playerRacer.position,
      totalRacers: this.raceManager.racers.length,
      lap: playerRacer.lap,
      totalLaps: TOTAL_LAPS,
      raceTime: this.raceManager.raceTime,
      speedKmh: this.playerCar.getSpeedKmh(),
      formatTime: (s) => this.raceManager.formatTime(s)
    });

    if (playerRacer.finished && this.statusText.text === '') {
      this.statusText.setText(
        `CORRIDA FINALIZADA\nTempo: ${this.raceManager.formatTime(playerRacer.finishTime)}\n(ESC volta ao menu)`
      );
    }
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
