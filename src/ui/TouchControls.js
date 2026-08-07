const BUTTON_ALPHA = 0.32;
const BUTTON_ALPHA_ACTIVE = 0.7;

// Controles touch: esquerda, direita, acelerador, freio e nitro.
// Cada botao guarda o id do ponteiro que o pressionou, e um listener
// global de pointerup/pointercancel solta o botao mesmo que o dedo
// deslize para fora antes de levantar — essencial para nao "travar"
// o acelerador em um celular real. A arquitetura (cada botao le seu
// proprio estado held em getState()) deixa facil no futuro trocar a
// direcao por inclinacao do celular sem mexer no resto do jogo: basta
// outra fonte alimentar os mesmos campos de steer/throttle/brake/nitro.
export default class TouchControls {
  constructor(scene, { width, height }) {
    this.scene = scene;
    this.gameObjects = [];
    this.buttons = {};

    const steerY = height - 100;
    this._createButton('steerLeft', { x: 95, y: steerY, radius: 58, label: '◀' });
    this._createButton('steerRight', { x: 225, y: steerY, radius: 58, label: '▶' });

    this._createButton('brake', {
      x: width - 200,
      y: height - 70,
      radius: 48,
      label: '■',
      color: 0xff3b3b
    });
    this._createButton('throttle', {
      x: width - 80,
      y: height - 90,
      radius: 68,
      label: '▲',
      color: 0x2bd576
    });
    this._createButton('nitro', {
      x: width - 190,
      y: height - 180,
      radius: 40,
      label: 'N',
      color: 0x00e5ff
    });

    scene.input.on('pointerup', (pointer) => this._releasePointer(pointer.id));
    scene.input.on('pointercancel', (pointer) => this._releasePointer(pointer.id));
  }

  _createButton(key, { x, y, radius, label, color = 0xffffff }) {
    const circle = this.scene.add
      .circle(x, y, radius, 0x0b1220, BUTTON_ALPHA)
      .setStrokeStyle(3, color, 0.85)
      .setDepth(200)
      .setInteractive({ useHandCursor: false });

    const text = this.scene.add
      .text(x, y, label, {
        fontFamily: 'Arial Black, Arial',
        fontSize: `${Math.round(radius * 0.9)}px`,
        color: '#ffffff'
      })
      .setOrigin(0.5)
      .setDepth(201);

    const state = { held: false, pointerId: null };
    this.buttons[key] = state;

    circle.on('pointerdown', (pointer) => {
      state.held = true;
      state.pointerId = pointer.id;
      circle.setFillStyle(0x0b1220, BUTTON_ALPHA_ACTIVE);
    });

    this.gameObjects.push(circle, text);
    this._circles = this._circles || {};
    this._circles[key] = circle;
  }

  _releasePointer(pointerId) {
    for (const key of Object.keys(this.buttons)) {
      const state = this.buttons[key];
      if (state.pointerId === pointerId) {
        state.held = false;
        state.pointerId = null;
        this._circles[key].setFillStyle(0x0b1220, BUTTON_ALPHA);
      }
    }
  }

  // Le o estado atual dos botoes e traduz para o formato de input do
  // carro (throttle/brake 0..1, steer -1..1, nitro booleano).
  getState() {
    const left = this.buttons.steerLeft.held;
    const right = this.buttons.steerRight.held;

    return {
      throttle: this.buttons.throttle.held ? 1 : 0,
      brake: this.buttons.brake.held ? 1 : 0,
      steer: (left ? -1 : 0) + (right ? 1 : 0),
      nitro: this.buttons.nitro.held
    };
  }

  destroy() {
    this.gameObjects.forEach((obj) => obj.destroy());
  }
}
