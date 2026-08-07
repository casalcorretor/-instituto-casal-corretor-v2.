// Atributos dos carros. Valores em pixels/segundo (pista roda em
// coordenadas de mundo, não em km/h reais). Design original: formas
// geometricas proprias, sem referencia a veiculos ou marcas reais.
export const CARS = {
  car1: {
    id: 'car1',
    name: 'Vetor',
    description: 'Equilibrado entre velocidade, aceleracao e controle.',
    bodyColor: 0x00e5ff,
    accentColor: 0x0a2a33,
    maxSpeed: 520,
    acceleration: 260,
    braking: 420,
    control: 2.6,
    nitroCapacity: 100,
    unlockCost: 0
  },
  car2: {
    id: 'car2',
    name: 'Fantasma',
    description: 'Muito rapido, porem mais dificil de controlar.',
    bodyColor: 0xff2d78,
    accentColor: 0x330014,
    maxSpeed: 620,
    acceleration: 230,
    braking: 380,
    control: 1.9,
    nitroCapacity: 90,
    unlockCost: 1500
  },
  car3: {
    id: 'car3',
    name: 'Rocha',
    description: 'Mais lento, mas acelera rapido e faz curvas com facilidade.',
    bodyColor: 0xffd400,
    accentColor: 0x332900,
    maxSpeed: 460,
    acceleration: 320,
    braking: 460,
    control: 3.2,
    nitroCapacity: 110,
    unlockCost: 2500
  }
};

export const DEFAULT_CAR_ID = 'car1';
