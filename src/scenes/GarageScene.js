import Phaser from 'phaser';
import { SCENE_KEYS, COLORS, GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig.js';
import { CARS } from '../data/CarsData.js';
import { generateCarTexture } from '../entities/Car.js';
import { getRarity, rarityColorHex } from '../data/RarityData.js';
import { PAINT_OPTIONS, TRAIL_OPTIONS } from '../data/CustomizationData.js';
import PlayerProfile from '../systems/PlayerProfile.js';
import { enableVerticalScroll } from '../ui/ScrollableList.js';
import { playSfx } from '../systems/AudioManager.js';

const CARD_WIDTH = 150;
const CARD_HEIGHT = 190;
const CARD_GAP = 18;
const CARDS_PER_ROW = 5;
const GRID_START_Y = 245;
const BOTTOM_PADDING = 50;

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
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(10);

    this.statusText = this.add
      .text(GAME_WIDTH / 2, 62, '', {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: '#8fb3c9'
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(10);

    const backButton = this.add
      .text(20, GAME_HEIGHT - 30, '[ VOLTAR ]', {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#ffc93c'
      })
      .setInteractive({ useHandCursor: true })
      .setScrollFactor(0)
      .setDepth(10);
    backButton.on('pointerdown', () => {
      playSfx(this, 'click');
      this.scene.start(SCENE_KEYS.MENU);
    });

    this._createCustomizationPanel();
    this._buildCarList();
    this._refreshStatus();

    const rows = Math.ceil(Object.keys(CARS).length / CARDS_PER_ROW);
    const contentHeight = GRID_START_Y + rows * (CARD_HEIGHT + CARD_GAP) - CARD_GAP + BOTTOM_PADDING;
    enableVerticalScroll(this, { contentHeight, viewportHeight: GAME_HEIGHT });
  }

  // Personalizacao (Etapa 15): pintura e rastro do carro equipado.
  // Rodas/efeito de turbo/efeito de gol ja funcionam por baixo (via
  // PlayerProfile) mas ainda sem um seletor visual proprio — podem
  // ganhar linhas iguais a estas depois, sem mudar o resto do sistema.
  _createCustomizationPanel() {
    this.add
      .text(GAME_WIDTH / 2, 84, 'PERSONALIZAR (carro equipado)', {
        fontFamily: 'Arial',
        fontSize: '12px',
        color: '#8fb3c9'
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(10);

    this.paintSwatches = this._createSwatchRow(PAINT_OPTIONS, 106, (id) => {
      PlayerProfile.setPaint(id);
      this._refreshCustomizationPanel();
    });

    this.trailSwatches = this._createSwatchRow(TRAIL_OPTIONS, 130, (id) => {
      PlayerProfile.setTrail(id);
      this._refreshCustomizationPanel();
    });

    this._refreshCustomizationPanel();
  }

  _createSwatchRow(options, y, onSelect) {
    const spacing = 30;
    const startX = GAME_WIDTH / 2 - ((options.length - 1) * spacing) / 2;

    return options.map((opt, i) => {
      const x = startX + i * spacing;
      const color = opt.color ?? 0x333344;
      const circle = this.add
        .circle(x, y, 9, color)
        .setStrokeStyle(2, COLORS.panelBorder, 1)
        .setScrollFactor(0)
        .setDepth(10)
        .setInteractive({ useHandCursor: true });
      circle.optionId = opt.id;
      circle.on('pointerdown', () => {
        playSfx(this, 'click');
        onSelect(opt.id);
      });
      return circle;
    });
  }

  _refreshCustomizationPanel() {
    const c = PlayerProfile.getCustomization();
    this.paintSwatches.forEach((sw) => {
      const active = sw.optionId === c.paintId;
      sw.setStrokeStyle(active ? 3 : 2, active ? 0xffffff : COLORS.panelBorder, 1);
    });
    this.trailSwatches.forEach((sw) => {
      const active = sw.optionId === c.trailId;
      sw.setStrokeStyle(active ? 3 : 2, active ? 0xffffff : COLORS.panelBorder, 1);
    });
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
        playSfx(this, 'click');
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
