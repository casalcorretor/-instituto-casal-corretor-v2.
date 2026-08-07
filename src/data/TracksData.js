// Dados das pistas. Nesta etapa existe apenas a pista de teste, usada
// para validar o sistema de traçado. As 3 pistas temáticas (cidade,
// deserto, noite) usam a mesma estrutura e serão adicionadas na
// Etapa 11 (seleção de pistas).
export const TRACKS = {
  test: {
    id: 'test',
    name: 'Pista de Teste',
    theme: 'test',
    roadWidth: 140,
    waypoints: [
      { x: 500, y: 250 },
      { x: 1300, y: 180 },
      { x: 2000, y: 350 },
      { x: 2200, y: 900 },
      { x: 1700, y: 1350 },
      { x: 900, y: 1300 },
      { x: 350, y: 950 },
      { x: 250, y: 550 }
    ]
  }
};
