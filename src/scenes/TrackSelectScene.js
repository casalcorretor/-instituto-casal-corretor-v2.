import Phaser from 'phaser';
import { SCENE_KEYS, COLORS, GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig.js';
import { TRACKS, TRACK_ORDER } from '../data/TracksData.js';
import { buildClosedSpline } from '../utils/MathUtils.js';
import { getProfile, getBestTime, isTrackUnlocked } from '../systems/PlayerProfile.js';

const CARD_WIDTH = 280;
const CARD_HEIGHT = 380;
const CARD_GAP = 24;
const PREVIEW_SIZE = 150;

const THEME_PREVIEW_BG = {
  city: 0x121a2c,
  desert: 0x2a1f12,
  night: 0x05070f
};

// Tela de selecao de pistas: nome, preview do traçado, dificuldade e
// melhor tempo de cada uma, com botao pra iniciar a corrida. Pistas
// ainda nao desbloqueadas (ver PlayerProfile.unlockNextTrackIfWon)
// mostram o motivo em vez do botao.
export default class TrackSelectScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.TRACK_SELECT);
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.background);
    this.profile = getProfile();

    this.add
      .text(GAME_WIDTH / 2, 34, 'PISTAS', {
        fontFamily: 'Arial Black, Arial',
        fontSize: '32px',
        color: '#00e5ff'
      })
      .setOrigin(0.5);

    const totalWidth = TRACK_ORDER.length * CARD_WIDTH + (TRACK_ORDER.length - 1) * CARD_GAP;
    const startX = GAME_WIDTH / 2 - totalWidth / 2 + CARD_WIDTH / 2;

    TRACK_ORDER.forEach((trackId, index) => {
      const x = startX + index * (CARD_WIDTH + CARD_GAP);
      this._createTrackCard(x, 80, TRACKS[trackId]);
    });

    this._createBackButton();
  }

  _createTrackCard(x, y, trackData) {
    const unlocked = isTrackUnlocked(trackData.id);

    this.add
      .rectangle(x, y + CARD_HEIGHT / 2, CARD_WIDTH, CARD_HEIGHT, 0x0b1220, 0.55)
      .setStrokeStyle(2, unlocked ? 0x2a3550 : 0x1a2030, 1);

    this.add
      .text(x, y + 16, trackData.name, {
        fontFamily: 'Arial Black, Arial',
        fontSize: '22px',
        color: unlocked ? '#ffffff' : '#5a6788'
      })
      .setOrigin(0.5, 0);

    this._drawPreview(x, y + 55, trackData, unlocked);

    this.add
      .text(x, y + 55 + PREVIEW_SIZE + 14, `Dificuldade: ${trackData.difficulty}`, {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: '#8ea0c8'
      })
      .setOrigin(0.5, 0);

    const bestTime = getBestTime(trackData.id);
    this.add
      .text(x, y + 55 + PREVIEW_SIZE + 36, bestTime ? `Melhor: ${this._formatTime(bestTime)}` : 'Melhor: --:--', {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: '#8ea0c8'
      })
      .setOrigin(0.5, 0);

    if (unlocked) {
      const box = this.add
        .rectangle(x, y + CARD_HEIGHT - 34, CARD_WIDTH - 40, 42, 0x0b1220, 0.8)
        .setStrokeStyle(2, 0x2bd576, 1)
        .setInteractive({ useHandCursor: true });
      this.add
        .text(x, y + CARD_HEIGHT - 34, 'INICIAR', {
          fontFamily: 'Arial Black, Arial',
          fontSize: '16px',
          color: '#2bd576'
        })
        .setOrigin(0.5);

      box.on('pointerdown', () => {
        this.profile.selectedTrackId = trackData.id;
        this.scene.start(SCENE_KEYS.RACE, { trackId: trackData.id, carId: this.profile.selectedCarId });
      });
    } else {
      this.add
        .text(x, y + CARD_HEIGHT - 34, '🔒 vença a pista anterior', {
          fontFamily: 'Arial',
          fontSize: '13px',
          color: '#5a6788',
          align: 'center',
          wordWrap: { width: CARD_WIDTH - 60 }
        })
        .setOrigin(0.5);
    }
  }

  _drawPreview(x, y, trackData, unlocked) {
    const bg = THEME_PREVIEW_BG[trackData.theme] ?? 0x121a2c;
    const g = this.add.graphics();
    g.fillStyle(bg, 1);
    g.fillRoundedRect(x - PREVIEW_SIZE / 2, y, PREVIEW_SIZE, PREVIEW_SIZE, 8);

    const points = buildClosedSpline(trackData.waypoints, 16);
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const pad = 16;
    const scale = Math.min((PREVIEW_SIZE - pad * 2) / (maxX - minX), (PREVIEW_SIZE - pad * 2) / (maxY - minY));

    const toLocal = (p) => ({
      x: x - PREVIEW_SIZE / 2 + pad + (p.x - minX) * scale,
      y: y + pad + (p.y - minY) * scale
    });

    g.lineStyle(4, unlocked ? 0x00e5ff : 0x3a4260, 1);
    g.beginPath();
    points.forEach((p, i) => {
      const lp = toLocal(p);
      if (i === 0) g.moveTo(lp.x, lp.y);
      else g.lineTo(lp.x, lp.y);
    });
    g.closePath();
    g.strokePath();

    if (!unlocked) {
      g.fillStyle(0x000000, 0.45);
      g.fillRoundedRect(x - PREVIEW_SIZE / 2, y, PREVIEW_SIZE, PREVIEW_SIZE, 8);
    }
  }

  _createBackButton() {
    const box = this.add
      .rectangle(80, GAME_HEIGHT - 30, 120, 40, 0x0b1220, 0.7)
      .setStrokeStyle(2, 0xffffff, 0.8)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(80, GAME_HEIGHT - 30, 'VOLTAR', {
        fontFamily: 'Arial Black, Arial',
        fontSize: '15px',
        color: '#ffffff'
      })
      .setOrigin(0.5);

    box.on('pointerdown', () => this.scene.start(SCENE_KEYS.MENU));
  }

  _formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${s.toFixed(1).padStart(4, '0')}`;
  }
}
