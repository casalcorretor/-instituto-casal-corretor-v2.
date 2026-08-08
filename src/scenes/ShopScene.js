import Phaser from 'phaser';
import { SCENE_KEYS, COLORS, GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig.js';
import { CARS } from '../data/CarsData.js';
import { generateCarTexture } from '../entities/Car.js';
import { getRarity, rarityColorHex } from '../data/RarityData.js';
import PlayerProfile from '../systems/PlayerProfile.js';

const CARD_WIDTH = 150;
const CARD_HEIGHT = 190;
const CARD_GAP = 18;
const CARDS_PER_ROW = 5;
const GRID_START_Y = 130;
const MESSAGE_DURATION_MS = 1400;

// Loja: onde o jogador gasta moedas pra comprar/desbloquear carros do
// catalogo (a garagem, Etapa 11, so mostra e troca entre os que ja
// tem). Assim como a garagem, a grade e generica — le direto de
// CarsData.js, entao cresce sozinha quando o catalogo completo entrar
// na Etapa 14.
export default class ShopScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.SHOP);
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.background);
    this.cardEls = [];

    this.add
      .text(GAME_WIDTH / 2, 30, 'LOJA', {
        fontFamily: 'Arial Black, Arial',
        fontSize: '32px',
        color: '#ffc93c'
      })
      .setOrigin(0.5);

    this.statusText = this.add
      .text(GAME_WIDTH / 2, 62, '', {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: '#8fb3c9'
      })
      .setOrigin(0.5);

    this.messageText = this.add
      .text(GAME_WIDTH / 2, 86, '', {
        fontFamily: 'Arial',
        fontSize: '13px',
        color: '#ff4d6d'
      })
      .setOrigin(0.5)
      .setAlpha(0);

    const backButton = this.add
      .text(20, GAME_HEIGHT - 30, '[ VOLTAR ]', {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#8fb3c9'
      })
      .setInteractive({ useHandCursor: true });
    backButton.on('pointerdown', () => this.scene.start(SCENE_KEYS.MENU));

    this._buildCarList();
    this._refreshStatus();
  }

  _buildCarList() {
    const ids = Object.keys(CARS);
    const perRow = Math.min(ids.length, CARDS_PER_ROW);
    const rowWidth = perRow * CARD_WIDTH + (perRow - 1) * CARD_GAP;
    const startX = GAME_WIDTH / 2 - rowWidth / 2 + CARD_WIDTH / 2;

    ids.forEach((carId, i) => {
      const col = i % CARDS_PER_ROW;
      const row = Math.floor(i / CARDS_PER_ROW);
      const x = startX + col * (CARD_WIDTH + CARD_GAP);
      const y = GRID_START_Y + row * (CARD_HEIGHT + CARD_GAP);
      this._createCard(ids[i], x, y);
    });
  }

  _createCard(carId, x, y) {
    const carDef = CARS[carId];
    const owned = PlayerProfile.isCarUnlocked(carId);

    const bg = this.add
      .rectangle(x, y, CARD_WIDTH, CARD_HEIGHT, COLORS.panel, 0.92)
      .setStrokeStyle(2, owned ? COLORS.success : COLORS.panelBorder, 1);

    const textureKey = `car_${carId}`;
    generateCarTexture(this, textureKey, carDef.bodyColor, carDef.accentColor);
    const preview = this.add.image(x, y - 55, textureKey).setScale(2.2).setRotation(-Math.PI / 2);
    if (owned) preview.setAlpha(0.6);

    const nameText = this.add
      .text(x, y - 5, carDef.name, {
        fontFamily: 'Arial Black, Arial',
        fontSize: '13px',
        color: '#ffffff'
      })
      .setOrigin(0.5);

    const rarityText = this.add
      .text(x, y + 12, getRarity(carDef.rarity).label.toUpperCase(), {
        fontFamily: 'Arial',
        fontSize: '10px',
        color: rarityColorHex(carDef.rarity)
      })
      .setOrigin(0.5);

    const statsLine = `VEL ${carDef.speed} | ACL ${carDef.acceleration} | MAN ${carDef.handling.toFixed(1)}`;
    const statsText = this.add
      .text(x, y + 30, statsLine, {
        fontFamily: 'Arial',
        fontSize: '9px',
        color: '#8fb3c9'
      })
      .setOrigin(0.5);

    let actionLabel;
    if (owned) actionLabel = 'COMPRADO';
    else actionLabel = carDef.price > 0 ? `[ COMPRAR ${carDef.price} ]` : '[ RESGATAR GRATIS ]';

    const actionText = this.add
      .text(x, y + 68, actionLabel, {
        fontFamily: 'Arial',
        fontSize: '11px',
        color: owned ? '#2bd576' : '#ffc93c'
      })
      .setOrigin(0.5);

    if (!owned) {
      actionText.setInteractive({ useHandCursor: true });
      actionText.on('pointerdown', () => this._tryBuy(carId));
    }

    this.cardEls.push(bg, preview, nameText, rarityText, statsText, actionText);
  }

  _tryBuy(carId) {
    const carDef = CARS[carId];
    if (PlayerProfile.isCarUnlocked(carId)) return;

    if (carDef.price === 0) {
      PlayerProfile.unlockCar(carId);
      this._showMessage(`${carDef.name} liberado!`, '#2bd576');
      this._rebuildList();
      return;
    }

    if (!PlayerProfile.canAfford(carDef.price)) {
      this._showMessage('moedas insuficientes', '#ff4d6d');
      return;
    }

    PlayerProfile.spendCoins(carDef.price);
    PlayerProfile.unlockCar(carId);
    this._showMessage(`${carDef.name} comprado!`, '#2bd576');
    this._rebuildList();
  }

  _showMessage(text, color) {
    this.messageText.setText(text).setColor(color).setAlpha(1);
    if (this._msgTimer) this._msgTimer.remove();
    this._msgTimer = this.time.delayedCall(MESSAGE_DURATION_MS, () => this.messageText.setAlpha(0));
  }

  _rebuildList() {
    this.cardEls.forEach((el) => el.destroy());
    this.cardEls = [];
    this._buildCarList();
    this._refreshStatus();
  }

  _refreshStatus() {
    this.statusText.setText(`moedas: ${PlayerProfile.getCoins()}`);
  }
}
