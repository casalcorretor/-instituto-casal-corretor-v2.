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

// Tela de garagem: mostra todos os carros do catalogo (so 1 por
// enquanto — a Etapa 14 adiciona o catalogo completo com todas as
// raridades), qual esta equipado, e deixa trocar entre os
// desbloqueados. Nao vende carro (isso e a Loja, Etapa 12) — so
// mostra "bloqueado" com o preco pros que ainda faltam comprar. A
// grade e generica: quando o catalogo crescer, mais cartas aparecem
// sozinhas, sem precisar mudar este arquivo.
export default class GarageScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.GARAGE);
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.background);
    this.cardEls = [];

    this.add
      .text(GAME_WIDTH / 2, 30, 'GARAGEM', {
        fontFamily: 'Arial Black, Arial',
        fontSize: '32px',
        color: '#21e6c1'
      })
      .setOrigin(0.5);

    this.statusText = this.add
      .text(GAME_WIDTH / 2, 62, '', {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: '#8fb3c9'
      })
      .setOrigin(0.5);

    const backButton = this.add
      .text(20, GAME_HEIGHT - 30, '[ VOLTAR ]', {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#ffc93c'
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
      this._createCard(carId, x, y);
    });
  }

  _createCard(carId, x, y) {
    const carDef = CARS[carId];
    const unlocked = PlayerProfile.isCarUnlocked(carId);
    const equipped = PlayerProfile.getEquippedCarId() === carId;

    const bg = this.add
      .rectangle(x, y, CARD_WIDTH, CARD_HEIGHT, COLORS.panel, 0.92)
      .setStrokeStyle(2, equipped ? COLORS.primary : COLORS.panelBorder, 1);

    const textureKey = `car_${carId}`;
    generateCarTexture(this, textureKey, carDef.bodyColor, carDef.accentColor);
    const preview = this.add.image(x, y - 55, textureKey).setScale(2.2).setRotation(-Math.PI / 2);
    if (!unlocked) preview.setTint(0x555555);

    const nameText = this.add
      .text(x, y - 5, carDef.name, {
        fontFamily: 'Arial Black, Arial',
        fontSize: '13px',
        color: unlocked ? '#ffffff' : '#8fb3c9'
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
    if (equipped) actionLabel = 'EQUIPADO';
    else if (unlocked) actionLabel = '[ EQUIPAR ]';
    else actionLabel = carDef.price > 0 ? `BLOQUEADO (${carDef.price})` : 'BLOQUEADO';

    const actionText = this.add
      .text(x, y + 68, actionLabel, {
        fontFamily: 'Arial',
        fontSize: '11px',
        color: equipped ? '#2bd576' : unlocked ? '#21e6c1' : '#ff4d6d'
      })
      .setOrigin(0.5);

    if (unlocked && !equipped) {
      actionText.setInteractive({ useHandCursor: true });
      actionText.on('pointerdown', () => {
        PlayerProfile.equipCar(carId);
        this._rebuildList();
      });
    }

    this.cardEls.push(bg, preview, nameText, rarityText, statsText, actionText);
  }

  _rebuildList() {
    this.cardEls.forEach((el) => el.destroy());
    this.cardEls = [];
    this._buildCarList();
    this._refreshStatus();
  }

  _refreshStatus() {
    const equippedDef = CARS[PlayerProfile.getEquippedCarId()];
    this.statusText.setText(`moedas: ${PlayerProfile.getCoins()} | equipado: ${equippedDef.name}`);
  }
}
