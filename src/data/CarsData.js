// Catalogo de carros. Etapa 3 cria so o carro inicial (necessario pra
// testar a fisica); o catalogo completo com todas as raridades entra
// na Etapa 14. Atributos seguem o formato centralizado pedido: id,
// name, rarity, price, speed, acceleration, handling, weight, power,
// boost, impact, model (cor/estilo, ja que nao ha modelos 3D),
// thumbnail (gerado em codigo), unlocked.
export const CARS = {
  urban_hatch: {
    id: 'urban_hatch',
    name: 'Urban Hatch',
    rarity: 'inicial',
    price: 0,
    speed: 420,
    acceleration: 260,
    handling: 2.8,
    weight: 1,
    power: 1,
    boost: 100,
    impact: 1,
    jumpHeight: 150,
    bodyColor: 0x21e6c1,
    accentColor: 0x0a2a26,
    unlocked: true
  }
};

export const DEFAULT_CAR_ID = 'urban_hatch';
