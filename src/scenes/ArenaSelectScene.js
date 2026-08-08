import Phaser from 'phaser';
import { SCENE_KEYS, COLORS, GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig.js';
import { ARENAS } from '../data/ArenasData.js';
import PlayerProfile from '../systems/PlayerProfile.js';
import { playSfx } from '../systems/AudioManager.js';

const CARD_WIDTH = 260;
const CARD_HEIGHT = 170;
const CARD_GAP = 30;
const THEME_PREVIEW_COLORS = { urban: 0x123a2e, futuristic: 0x0a1a33, night: 0x14102a };

// Tela de selecao de arena: escolher aqui ja leva direto pra partida
// (fluxo simples, tipico de jogo arcade mobile). Guarda a escolha em
// PlayerProfile.lastArenaId, que o botao "JOGAR" do menu principal usa
// como padrao da proxima vez.
export default class ArenaSelectScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.ARENA_SELECT);
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.background);

    this.add
      .text(GAME_WIDTH / 2, 44, 'ESCOLHA A ARENA', {
        fontFamily: 'Arial Black, Arial',
        fontSize: '30px',
        color: '#21e6c1'
      })
      .setOrigin(0.5);

    const backButton = this.add
      .text(20, GAME_HEIGHT - 30, '[ VOLTAR ]', {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#ffc93c'
      })
      .setInteractive({ useHandCursor: true });
    backButton.on('pointerdown', () => {
      playSfx(this, 'click');
      this.scene.start(SCENE_KEYS.MENU);
    });

    const ids = Object.keys(ARENAS);
    const totalWidth = ids.length * CARD_WIDTH + (ids.length - 1) * CARD_GAP;
    const startX = GAME_WIDTH / 2 - totalWidth / 2 + CARD_WIDTH / 2;
    const y = GAME_HEIGHT / 2 + 10;

    ids.forEach((arenaId, i) => {
      const x = startX + i * (CARD_WIDTH + CARD_GAP);
      this._createArenaCard(arenaId, x, y);
    });
  }

  _createArenaCard(arenaId, x, y) {
    const arenaData = ARENAS[arenaId];
    const isCurrent = PlayerProfile.getLastArenaId() === arenaId;

    this.add
      .rectangle(x, y, CARD_WIDTH, CARD_HEIGHT, COLORS.panel, 0.92)
      .setStrokeStyle(2, isCurrent ? COLORS.primary : COLORS.panelBorder, 1);

    this.add.rectangle(x, y - 35, CARD_WIDTH - 30, 80, THEME_PREVIEW_COLORS[arenaData.theme] ?? 0x123a2e, 1);

    this.add
      .text(x, y + 25, arenaData.name, {
        fontFamily: 'Arial Black, Arial',
        fontSize: '16px',
        color: '#ffffff'
      })
      .setOrigin(0.5);

    if (isCurrent) {
      this.add
        .text(x, y + 45, 'ULTIMA ESCOLHIDA', {
          fontFamily: 'Arial',
          fontSize: '10px',
          color: '#21e6c1'
        })
        .setOrigin(0.5);
    }

    const playLabel = this.add
      .text(x, y + 65, '[ JOGAR ]', {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: '#ffc93c'
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    playLabel.on('pointerdown', () => {
      playSfx(this, 'click');
      PlayerProfile.setLastArenaId(arenaId);
      this.scene.start(SCENE_KEYS.MATCH, { arenaId });
    });
  }
}
