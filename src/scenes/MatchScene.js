import Phaser from 'phaser';
import { SCENE_KEYS, COLORS, GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig.js';
import Arena from '../entities/Arena.js';
import Car, { PARTICLE_TEXTURE_KEY } from '../entities/Car.js';
import Ball from '../entities/Ball.js';
import TurboPad from '../entities/TurboPad.js';
import TouchControls from '../ui/TouchControls.js';
import MatchManager from '../systems/MatchManager.js';
import AIController from '../systems/AIController.js';
import { ARENAS, DEFAULT_ARENA_ID, ARENA_WIDTH, ARENA_HEIGHT } from '../data/ArenasData.js';
import { CARS, DEFAULT_CAR_ID } from '../data/CarsData.js';
import PlayerProfile from '../systems/PlayerProfile.js';
import { PAINT_OPTIONS, WHEEL_OPTIONS, TRAIL_OPTIONS, TURBO_EFFECT_OPTIONS, GOAL_EFFECT_OPTIONS, getOption } from '../data/CustomizationData.js';
import { playSfx, createMatchMusic, EngineSound } from '../systems/AudioManager.js';

const COLLISION_SPEED_THRESHOLD = 60; // abaixo disso, nao toca som de colisao (evita spam parado encostado na bola)

// Le as escolhas de personalizacao do jogador (Etapa 15) e resolve os
// ids salvos em cores de verdade, prontas pro construtor do Car. Cor
// "null" (opcao "Padrao"/"Nenhum") significa "nao personalizar essa
// parte" — o Car usa a cor original do carro nesse caso.
function resolvePlayerCustomization() {
  const c = PlayerProfile.getCustomization();
  return {
    paintColor: getOption(PAINT_OPTIONS, c.paintId).color,
    wheelColor: getOption(WHEEL_OPTIONS, c.wheelId).color,
    trailColor: getOption(TRAIL_OPTIONS, c.trailId).color,
    turboColor: getOption(TURBO_EFFECT_OPTIONS, c.turboEffectId).color
  };
}

const BASE_HIT_IMPULSE = 420;
const VERTICAL_HIT_BASE = 380;
const GOAL_CELEBRATION_MS = 1500;

// Cena de partida. Constroi a arena, o carro do jogador (fisica de
// chao + altura simulada) e a bola, com controles touch/teclado, gols
// e placar. A camera principal enquadra o campo inteiro; uma segunda
// camera de UI (zoom fixo em 1, ignorando o mundo) exibe o HUD e os
// botoes — evita o bug de HUD distorcido pelo zoom da camera principal.
export default class MatchScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.MATCH);
  }

  init(data) {
    this.arenaId = data?.arenaId || PlayerProfile.getLastArenaId() || DEFAULT_ARENA_ID;
    this.carId = data?.carId || PlayerProfile.getEquippedCarId() || DEFAULT_CAR_ID;
    this.worldObjects = [];
    this.celebrating = false;
    this._resultTriggered = false;
    this._inputBuffer = { throttle: 0, brake: 0, steer: 0, jump: false, boost: false };
    this._zeroInputBuffer = { throttle: 0, brake: 0, steer: 0, jump: false, boost: false };
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.background);

    const arenaData = ARENAS[this.arenaId];
    this.arena = new Arena(this, arenaData);
    this.worldObjects.push(...this.arena.gameObjects);

    this.physics.world.setBounds(-80, -80, ARENA_WIDTH + 160, ARENA_HEIGHT + 160);

    this.matchManager = new MatchManager();

    this._createPlayerCar();
    this._createBall();
    this._createBotCar();
    this._createGoalSensors();
    this._createTurboPads();
    this._createKeyboardInput();
    this._createTouchControls();
    this._createUiCamera();

    this.cameras.main.centerOn(ARENA_WIDTH / 2, ARENA_HEIGHT / 2);
    this._fitCameraToArena();

    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.start(SCENE_KEYS.MENU);
    });

    this.matchMusic = createMatchMusic();
    this.matchMusic.start();
    this.engineSound = new EngineSound();

    this.events.once('shutdown', () => {
      this.matchMusic.stop();
      this.engineSound.stop();
    });
  }

  _createPlayerCar() {
    const carDef = CARS[this.carId];
    this.playerCar = new Car(this, {
      x: ARENA_WIDTH / 2 - 200,
      y: ARENA_HEIGHT / 2,
      angle: 0,
      carDef,
      textureKey: `car_${carDef.id}`,
      customization: resolvePlayerCustomization()
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

  // Carro adversario (time vermelho) controlado por IA. Defende o gol
  // direito (x = ARENA_WIDTH) e ataca o gol esquerdo (x = 0) — o
  // inverso do jogador. Usa a mesma classe Car e a mesma interface
  // setInput() do jogador; o unico diferencial e quem gera o input.
  _createBotCar() {
    const baseDef = CARS[this.carId] || CARS[DEFAULT_CAR_ID];
    const botDef = { ...baseDef, bodyColor: COLORS.secondary, accentColor: 0x2a0a12 };

    this.botCar = new Car(this, {
      x: ARENA_WIDTH / 2 + 200,
      y: ARENA_HEIGHT / 2,
      angle: Math.PI,
      carDef: botDef,
      textureKey: 'car_bot_red'
    });

    this.physics.add.collider(this.botCar.sprite, this.arena.walls);
    this.physics.add.collider(this.botCar.sprite, this.playerCar.sprite);
    this.physics.add.collider(this.botCar.sprite, this.ball.sprite, () =>
      this._onCarHitBall(this.botCar, this.ball)
    );
    this.worldObjects.push(this.botCar.shadow, this.botCar.visual);

    this.aiController = new AIController(this.botCar, {
      ball: this.ball,
      ownGoalX: ARENA_WIDTH,
      opponentGoalX: 0,
      arenaHeight: ARENA_HEIGHT,
      difficulty: PlayerProfile.getBotDifficulty()
    });
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

    if (carSpeed > COLLISION_SPEED_THRESHOLD) playSfx(this, 'collision');

    if (!car.isGrounded && ball.canBeHitVerticallyBy(car.z)) {
      ball.applyVerticalHit(VERTICAL_HIT_BASE * car.def.impact);
    }
  }

  _createGoalSensors() {
    // bola no sensor esquerdo (gol azul) = ponto pro time vermelho, e
    // vice-versa.
    this.physics.add.overlap(this.ball.sprite, this.arena.leftGoalSensor, () => this._onGoal('red'));
    this.physics.add.overlap(this.ball.sprite, this.arena.rightGoalSensor, () => this._onGoal('blue'));
  }

  _onGoal(scoringSide) {
    if (this.celebrating || this.matchManager.matchOver) return;

    this.celebrating = true;
    this.matchManager.registerGoal(scoringSide);
    playSfx(this, 'goal');

    const label = scoringSide === 'blue' ? 'GOL AZUL!' : 'GOL VERMELHO!';
    const color = scoringSide === 'blue' ? '#2fa8ff' : '#ff5a4d';
    this.goalText.setText(label).setColor(color).setAlpha(1);
    this._spawnGoalEffect(scoringSide);

    this.time.delayedCall(GOAL_CELEBRATION_MS, () => {
      this.goalText.setAlpha(0);
      this.ball.resetTo(ARENA_WIDTH / 2, ARENA_HEIGHT / 2);
      this.celebrating = false;
    });
  }

  // Explosao de particulas no gol. O time azul (jogador) usa a cor de
  // efeito de gol escolhida na garagem (Etapa 15); o vermelho (bot) usa
  // uma cor fixa, ja que bots nao tem personalizacao.
  _spawnGoalEffect(scoringSide) {
    const effectColor =
      scoringSide === 'blue'
        ? getOption(GOAL_EFFECT_OPTIONS, PlayerProfile.getCustomization().goalEffectId).color
        : 0xff5a4d;

    const emitter = this.add.particles(this.ball.x, this.ball.y, PARTICLE_TEXTURE_KEY, {
      speed: { min: 120, max: 260 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.4, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 500,
      tint: effectColor
    });
    emitter.explode(24);
    this.uiCamera.ignore(emitter);
    this.time.delayedCall(600, () => emitter.destroy());
  }

  _createTurboPads() {
    const w = ARENA_WIDTH;
    const h = ARENA_HEIGHT;
    const positions = [
      { x: w * 0.28, y: h * 0.22 },
      { x: w * 0.28, y: h * 0.78 },
      { x: w * 0.72, y: h * 0.22 },
      { x: w * 0.72, y: h * 0.78 },
      { x: w * 0.5, y: h * 0.12 },
      { x: w * 0.5, y: h * 0.88 }
    ];

    this.turboPads = positions.map(({ x, y }) => new TurboPad(this, { x, y }));
    this.turboPads.forEach((pad) => {
      this.worldObjects.push(pad.visual);
      this.physics.add.overlap(this.playerCar.sprite, pad.zone, () => pad.tryCollect(this.playerCar));
      this.physics.add.overlap(this.botCar.sprite, pad.zone, () => pad.tryCollect(this.botCar));
    });
  }

  _createKeyboardInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys('W,A,S,D,SPACE,SHIFT');
  }

  _createTouchControls() {
    this.touchControls = new TouchControls(this, { width: GAME_WIDTH, height: GAME_HEIGHT });
  }

  _createUiCamera() {
    this.scoreText = this.add
      .text(GAME_WIDTH / 2, 14, '', {
        fontFamily: 'Arial Black, Arial',
        fontSize: '26px',
        color: '#ffffff'
      })
      .setOrigin(0.5, 0)
      .setDepth(100);

    this.timeText = this.add
      .text(GAME_WIDTH / 2, 46, '', {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#8fb3c9'
      })
      .setOrigin(0.5, 0)
      .setDepth(100);

    this.goalText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, '', {
        fontFamily: 'Arial Black, Arial',
        fontSize: '44px',
        color: '#ffffff'
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(101);

    // Texto de debug: so existe em modo dev. Custa um redesenho de
    // canvas toda vez que muda (velocidade/altura mudam quase todo
    // frame), entao nao faz sentido pagar esse custo numa build de
    // producao (celular de verdade) so pra mostrar numero que ninguem
    // ve. Etapa 20 (otimizacao) — antes disso, funcionava mas rodava
    // sempre, mesmo em producao.
    if (import.meta.env.DEV) {
      this.debugText = this.add
        .text(16, 80, '', {
          fontFamily: 'Arial',
          fontSize: '14px',
          color: '#ffffff',
          backgroundColor: '#000000'
        })
        .setDepth(100);
    }

    this._createBoostBar();

    const uiObjects = [
      this.scoreText,
      this.timeText,
      this.goalText,
      this.boostBarBg,
      this.boostBarFill,
      this.boostLabel,
      ...this.touchControls.gameObjects
    ];
    if (this.debugText) uiObjects.push(this.debugText);

    this.uiCamera = this.cameras.add(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.uiCamera.setScroll(0, 0);
    this.uiCamera.ignore(this.worldObjects);
    this.cameras.main.ignore(uiObjects);
  }

  _createBoostBar() {
    const barWidth = 200;
    const barX = GAME_WIDTH - 16 - barWidth;
    const barY = GAME_HEIGHT - 210;

    this.boostLabel = this.add
      .text(barX, barY - 20, 'TURBO', { fontFamily: 'Arial Black, Arial', fontSize: '14px', color: '#ffc93c' })
      .setDepth(150);
    this.boostBarBg = this.add
      .rectangle(barX, barY, barWidth, 14, 0x0b1220, 0.7)
      .setOrigin(0, 0.5)
      .setStrokeStyle(2, 0xffc93c, 0.9)
      .setDepth(150);
    this.boostBarFill = this.add
      .rectangle(barX + 2, barY, barWidth - 4, 10, 0xffc93c, 1)
      .setOrigin(0, 0.5)
      .setDepth(151);
    this._boostBarFullWidth = barWidth - 4;
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

    // Buffer reaproveitado (nao cria objeto novo todo frame).
    const input = this._inputBuffer;
    input.throttle = up || touch.throttle ? 1 : 0;
    input.brake = down || touch.brake ? 1 : 0;
    input.steer = Phaser.Math.Clamp((left ? -1 : 0) + (right ? 1 : 0) + touch.steer, -1, 1);
    input.jump = jumpKey || touch.jump;
    input.boost = boostKey || touch.boost;
    return input;
  }

  update(time, delta) {
    const deltaSeconds = delta / 1000;
    const input = this._readInput();

    if (!this.matchManager.matchOver) {
      this.playerCar.setInput(input);
      this.aiController.update(deltaSeconds);
    } else {
      this.playerCar.setInput(this._zeroInputBuffer);
      this.botCar.setInput(this._zeroInputBuffer);
    }
    this.playerCar.update(deltaSeconds);
    this.botCar.update(deltaSeconds, this.aiController.settings.speedMultiplier);
    this.ball.update(deltaSeconds);
    this.matchManager.update(deltaSeconds);

    // So chama setText() quando o texto de verdade mudou — Phaser
    // redesenha a textura do texto (operacao de canvas, bem mais cara
    // que so trocar uma string) toda vez que setText() e chamado, e
    // placar/tempo mudam bem menos que 60x por segundo.
    const scoreLabel = `AZUL ${this.matchManager.score.blue}  x  ${this.matchManager.score.red} VERMELHO`;
    if (scoreLabel !== this._lastScoreLabel) {
      this.scoreText.setText(scoreLabel);
      this._lastScoreLabel = scoreLabel;
    }

    const timeLabel = this.matchManager.matchOver ? 'FIM DE JOGO' : this.matchManager.formatTime();
    if (timeLabel !== this._lastTimeLabel) {
      this.timeText.setText(timeLabel);
      this._lastTimeLabel = timeLabel;
    }

    if (this.matchManager.matchOver && !this.celebrating && !this._resultTriggered) {
      this._resultTriggered = true;
      this.time.delayedCall(1200, () => {
        this.scene.start(SCENE_KEYS.RESULT, {
          score: { ...this.matchManager.score },
          winner: this.matchManager.winner,
          coinRewards: this.matchManager.getCoinRewards(),
          xpRewards: this.matchManager.getXpRewards(),
          arenaId: this.arenaId,
          carId: this.carId
        });
      });
    }

    const speedRatio = Phaser.Math.Clamp(Math.abs(this.playerCar.speed) / this.playerCar.def.speed, 0, 1);
    this.engineSound.update(speedRatio, !this.matchManager.matchOver);

    const boostFraction = this.playerCar.getBoostFraction();
    this.boostBarFill.width = this._boostBarFullWidth * boostFraction;
    this.boostBarFill.fillColor = boostFraction < 0.15 ? 0xff3b3b : 0xffc93c;

    if (this.debugText) {
      this.debugText.setText(
        `WASD/setas, SHIFT turbo, ESPACO pula, ESC menu\n` +
          `carro: ${this.playerCar.getSpeedKmh().toFixed(0)} km/h | z=${this.playerCar.z.toFixed(0)}\n` +
          `turbo: ${(boostFraction * 100).toFixed(0)}% | usando: ${this.playerCar.boosting ? 'sim' : 'nao'}\n` +
          `bot: estado=${this.aiController.state} | ${this.botCar.getSpeedKmh().toFixed(0)} km/h`
      );
    }
  }
}
