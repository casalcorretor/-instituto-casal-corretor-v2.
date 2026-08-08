const BUTTON_ALPHA = 0.32;
const BUTTON_ALPHA_ACTIVE = 0.7;

// Controles touch: esquerda, direita, acelerar, frear, pular, turbo.
// Cada botao rastreia o id do ponteiro que o pressionou; um listener
// global de pointerup/pointercancel solta o botao mesmo que o dedo
// deslize pra fora antes de levantar (evita o classico bug de
// "acelerador travado" em touch). getState() expoe um formato unico,
// pensado pra no futuro trocar a direcao por inclinacao do celular
// sem mudar o resto do jogo.
export default class TouchControls {
  constructor(scene, { width, height }) {
    this.scene = scene;
    this.gameObjects = [];
    this.buttons = {};
    this._circles = {};

    const steerY = height - 100;
    this._createButton('steerLeft', { x: 95, y: steerY, radius: 56, label: '◀' });
    this._createButton('steerRight', { x: 223, y: steerY, radius: 56, label: '▶' });

    this._createButton('brake', { x: width - 200, y: height - 70, radius: 45, label: '■', color: 0xff3b3b });
    this._createButton('throttle', { x: width - 80, y: height - 90, radius: 65, label: '▲', color: 0x2bd576 });
    this._createButton('jump', { x: width - 190, y: height - 190, radius: 40, label: '⤒', color: 0xffc93c });
    this._createButton('boost', { x: width - 300, y: height - 240, radius: 40, label: '⚡', color: 0x21e6c1 });

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
        fontSize: `${Math.round(radius * 0.85)}px`,
        color: '#ffffff'
      })
      .setOrigin(0.5)
      .setDepth(201);

    const state = { held: false, pointerId: null };
    this.buttons[key] = state;
    this._circles[key] = circle;

    circle.on('pointerdown', (pointer) => {
      state.held = true;
      state.pointerId = pointer.id;
      circle.setFillStyle(0x0b1220, BUTTON_ALPHA_ACTIVE);
    });

    this.gameObjects.push(circle, text);
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

  getState() {
    const left = this.buttons.steerLeft.held;
    const right = this.buttons.steerRight.held;

    return {
      throttle: this.buttons.throttle.held ? 1 : 0,
      brake: this.buttons.brake.held ? 1 : 0,
      steer: (left ? -1 : 0) + (right ? 1 : 0),
      jump: this.buttons.jump.held,
      boost: this.buttons.boost.held
    };
  }

  destroy() {
    this.gameObjects.forEach((obj) => obj.destroy());
  }
}
