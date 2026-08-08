// Definicao central das 6 raridades de carro pedidas na spec — faixas
// de preco, cor de identificacao (usada na garagem/loja) e se a
// raridade tem efeito visual exclusivo (lendario/mistico). Um unico
// lugar pra ajustar precos/cores; o catalogo completo de carros entra
// na Etapa 14 e cada carro so referencia um desses ids.
export const RARITIES = {
  inicial: {
    id: 'inicial',
    label: 'Inicial',
    color: 0x8fb3c9,
    minPrice: 0,
    maxPrice: 0,
    specialEffect: false
  },
  comum: {
    id: 'comum',
    label: 'Comum',
    color: 0x9fe6ff,
    minPrice: 5000,
    maxPrice: 15000,
    specialEffect: false
  },
  esportivo: {
    id: 'esportivo',
    label: 'Esportivo',
    color: 0x21e6c1,
    minPrice: 20000,
    maxPrice: 50000,
    specialEffect: false
  },
  superesportivo: {
    id: 'superesportivo',
    label: 'Superesportivo',
    color: 0xffc93c,
    minPrice: 60000,
    maxPrice: 150000,
    specialEffect: false
  },
  lendario: {
    id: 'lendario',
    label: 'Lendario',
    color: 0xff9d2f,
    minPrice: 200000,
    maxPrice: 499000,
    specialEffect: true
  },
  mistico: {
    id: 'mistico',
    label: 'Mistico',
    color: 0xb46bff,
    minPrice: 500000,
    maxPrice: 1000000,
    specialEffect: true
  }
};

export const RARITY_ORDER = ['inicial', 'comum', 'esportivo', 'superesportivo', 'lendario', 'mistico'];

export function getRarity(rarityId) {
  return RARITIES[rarityId] || RARITIES.comum;
}

export function isPriceInRarityRange(rarityId, price) {
  const r = getRarity(rarityId);
  return price >= r.minPrice && price <= r.maxPrice;
}

export function rarityColorHex(rarityId) {
  return `#${getRarity(rarityId).color.toString(16).padStart(6, '0')}`;
}

// Confere se todo carro do catalogo tem um preco dentro da faixa da
// sua raridade — chamado uma vez no boot (so em dev) pra pegar erro de
// digitação assim que um carro novo for adicionado na Etapa 14, sem
// precisar abrir a garagem/loja pra notar.
export function validateCarsAgainstRarities(cars) {
  const problems = [];
  Object.values(cars).forEach((car) => {
    if (!isPriceInRarityRange(car.rarity, car.price)) {
      const r = getRarity(car.rarity);
      problems.push(
        `${car.id}: preco ${car.price} fora da faixa de "${car.rarity}" (${r.minPrice}-${r.maxPrice})`
      );
    }
  });
  return problems;
}
