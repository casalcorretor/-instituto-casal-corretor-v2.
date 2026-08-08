import Phaser from 'phaser';
import { SCENE_KEYS, COLORS, GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig.js';
import Track from '../entities/Track.js';
import Car from '../entities/Car.js';
import AICar from '../entities/AICar.js';
import { applyTrackTheme } from '../entities/TrackTheme.js';
import TouchControls from '../ui/TouchControls.js';
import RaceHud from '../ui/RaceHud.js';
import Minimap, { MINIMAP_SIZE } from '../ui/Minimap.js';
import RaceManager from '../systems/RaceManager.js';
import CoinSystem from '../systems/CoinSystem.js';
import { addCoins, recordRaceResult, unlockNextTrackIfWon } from '../systems/PlayerProfile.js';
import { TRACKS, DEFAULT_TRACK_ID } from '../data/TracksData.js';
import { CARS, DEFAULT_CAR_ID } from '../data/CarsData.js';
import { createRaceMusic, EngineSound, playSfx } from '../systems/AudioManager.js';

const COLLISION_SFX_COOLDOWN = 500;
const BRAKE_SFX_MIN_SPEED_RATIO = 0.35;

const TOTAL_LAPS = 3;
const FINISH_TO_RESULT_DELAY = 1400;

// Adversarios de IA da corrida de teste: 3 dificuldades exigidas pela
// spec (facil/normal/dificil), cada um com cor propria para dar pra
// distinguir na pista.
const AI_OPPONENTS = [
  {
    ...CARS.car1,
    id: 'ai_easy',
    name: 'IA Facil',
    difficulty: 'easy',
    bodyColor: 0x9bd66b,
    accentColor: 0x1c2e12
  },
  {
    ...CARS.car1,
    id: 'ai_normal',
    name: 'IA Normal',
    difficulty: 'normal',
    bodyColor: 0xff9e2d,
    accentColor: 0x33200a
  },
  {
    ...CARS.car1,
    id: 'ai_hard',
    name: 'IA Dificil',
    difficulty: 'hard',
    bodyColor: 0xb84dff,
    accentColor: 0x2a0a3d
  }
];

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
    this.trackId = data?.trackId || DEFAULT_TRACK_ID;
    this.carId = data?.carId || DEFAULT_CAR_ID;
    this.worldObjects = [];
    this.playerCoins = 0;
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

    const themeGraphics = applyTrackTheme(this, this.track, trackData.theme, bounds);
    if (themeGraphics) this.worldObjects.push(themeGraphics);

    this._markStart();
    this._createPlayerCar();
    this._createAiCars();
    this._createRaceManager();
    this._createCoins();
    this._createKeyboardInput();
    this._createTouchControls();
    this._createUiCamera();
    this._createMinimap();
    this._createAudio();

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
    this.worldObjects.push(this.playerCar.sprite, this.playerCar.nitroEmitter);
  }

  _createAiCars() {
    this.aiCars = [];
    this.aiGridOffsets = [];
    const startProgress = this.track.getClosestProgress(this.track.startPoint.x, this.track.startPoint.y);
    const lanes = [-45, 45, 0];

    AI_OPPONENTS.forEach((def, index) => {
      const backDistance = 70 + index * 70;
      this.aiGridOffsets.push(-backDistance);
      const gridPoint = this.track.getPointAtDistance(startProgress - backDistance);
      const normal = { x: -Math.sin(gridPoint.angle), y: Math.cos(gridPoint.angle) };
      const lane = lanes[index % lanes.length];

      const ai = new AICar(this, {
        x: gridPoint.x + normal.x * lane,
        y: gridPoint.y + normal.y * lane,
        angle: gridPoint.angle,
        carDef: def,
        textureKey: `car_${def.id}`,
        track: this.track,
        difficulty: def.difficulty
      });

      this.aiCars.push(ai);
      this.worldObjects.push(ai.sprite, ai.car.nitroEmitter);
    });
  }

  _createRaceManager() {
    this.raceManager = new RaceManager({ track: this.track, totalLaps: TOTAL_LAPS });
    this.raceManager.addRacer('player', this.playerCar, 0);
    this.aiCars.forEach((ai, index) => {
      this.raceManager.addRacer(AI_OPPONENTS[index].id, ai.car, this.aiGridOffsets[index]);
    });
  }

  _createCoins() {
    this.coinSystem = new CoinSystem(this, { track: this.track });
    this.worldObjects.push(...this.coinSystem.coinObjects);
    this.coinSystem.attachCollector(this.playerCar.sprite, () => {
      this.playerCoins = this.coinSystem.collected * 10;
    });
  }

  _createKeyboardInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys('W,A,S,D');
  }

  _createTouchControls() {
    this.touchControls = new TouchControls(this, { width: GAME_WIDTH, height: GAME_HEIGHT });
  }

  _createUiCamera() {
    this.raceHud = new RaceHud(this, { width: GAME_WIDTH, height: GAME_HEIGHT });

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

  _createMinimap() {
    this.minimap = new Minimap(this, {
      track: this.track,
      x: GAME_WIDTH - MINIMAP_SIZE - 16,
      y: 50
    });
    this.cameras.main.ignore(this.minimap.gameObjects);
  }

  _createAudio() {
    this.raceMusic = createRaceMusic();
    this.raceMusic.start();

    this.engineSound = new EngineSound();
    this.lastCollisionSfxAt = 0;
    this.lastBrakeSfxAt = 0;

    this.aiCars.forEach((ai) => {
      this.physics.add.collider(this.playerCar.sprite, ai.sprite, () => this._onCarCollision());
    });

    this.events.once('shutdown', () => {
      this.raceMusic.stop();
      this.engineSound.stop();
    });
  }

  _onCarCollision() {
    const now = this.time.now;
    if (now - this.lastCollisionSfxAt < COLLISION_SFX_COOLDOWN) return;
    this.lastCollisionSfxAt = now;
    playSfx(this, 'collision');
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

      const speedRatio = Math.abs(this.playerCar.speed) / this.playerCar.def.maxSpeed;
      if (input.brake && speedRatio > BRAKE_SFX_MIN_SPEED_RATIO) {
        const now = this.time.now;
        if (now - this.lastBrakeSfxAt > COLLISION_SFX_COOLDOWN) {
          this.lastBrakeSfxAt = now;
          playSfx(this, 'brake');
        }
      }
    } else {
      this.playerCar.setInput({ throttle: 0, brake: 0, steer: 0 });
    }
    this.playerCar.update(deltaSeconds);

    this.engineSound.update(
      Math.abs(this.playerCar.speed) / this.playerCar.def.maxSpeed,
      !playerRacer.finished
    );

    const avoidanceList = [...this.aiCars, { x: this.playerCar.x, y: this.playerCar.y }];
    this.aiCars.forEach((ai) => ai.update(deltaSeconds, avoidanceList));

    this.raceManager.update(deltaSeconds);

    const displayTime = playerRacer.finished ? playerRacer.finishTime : this.raceManager.raceTime;

    this.raceHud.update({
      position: playerRacer.position,
      totalRacers: this.raceManager.racers.length,
      lap: this.raceManager.getDisplayLap(playerRacer),
      totalLaps: TOTAL_LAPS,
      raceTime: displayTime,
      speedKmh: this.playerCar.getSpeedKmh(),
      nitroFraction: this.playerCar.getNitroFraction(),
      coins: this.playerCoins,
      formatTime: (s) => this.raceManager.formatTime(s)
    });

    this.minimap.update([
      { x: this.playerCar.x, y: this.playerCar.y, color: 0x00e5ff, isPlayer: true },
      ...this.aiCars.map((ai, index) => ({ x: ai.x, y: ai.y, color: AI_OPPONENTS[index].bodyColor, isPlayer: false }))
    ]);

    if (playerRacer.finished && this.statusText.text === '') {
      this.statusText.setText(
        `CORRIDA FINALIZADA\nTempo: ${this.raceManager.formatTime(playerRacer.finishTime)}`
      );
      this._goToResultScreen(playerRacer);
    }
  }

  _goToResultScreen(playerRacer) {
    const positionBonus = { 1: 100, 2: 50, 3: 25 }[playerRacer.position] ?? 0;
    const totalEarned = this.playerCoins + positionBonus;
    addCoins(totalEarned);
    const isNewBest = recordRaceResult(this.trackId, playerRacer.finishTime);
    const unlockedTrackId = unlockNextTrackIfWon(this.trackId, playerRacer.position);

    this.time.delayedCall(FINISH_TO_RESULT_DELAY, () => {
      this.scene.start(SCENE_KEYS.RESULT, {
        trackId: this.trackId,
        carId: this.carId,
        position: playerRacer.position,
        totalRacers: this.raceManager.racers.length,
        finishTime: playerRacer.finishTime,
        coinsCollected: this.playerCoins,
        positionBonus,
        totalEarned,
        isNewBest,
        unlockedTrackName: unlockedTrackId ? TRACKS[unlockedTrackId].name : null,
        formattedTime: this.raceManager.formatTime(playerRacer.finishTime)
      });
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
