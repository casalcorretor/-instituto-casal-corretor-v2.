// Dados das 3 pistas tematicas pedidas na spec. Cada uma usa o mesmo
// sistema de traçado (Track.js), só muda o formato dos waypoints, a
// largura da pista e o tema visual (ver TrackTheme.js).
export const TRACKS = {
  city: {
    id: 'city',
    name: 'Cidade',
    theme: 'city',
    difficulty: 'Fácil',
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
  },
  desert: {
    id: 'desert',
    name: 'Deserto',
    theme: 'desert',
    difficulty: 'Normal',
    roadWidth: 150,
    waypoints: [
      { x: 600, y: 300 },
      { x: 1800, y: 200 },
      { x: 2600, y: 600 },
      { x: 2500, y: 1400 },
      { x: 1600, y: 1700 },
      { x: 700, y: 1500 },
      { x: 200, y: 900 }
    ]
  },
  night: {
    id: 'night',
    name: 'Noite',
    theme: 'night',
    difficulty: 'Difícil',
    roadWidth: 130,
    waypoints: [
      { x: 500, y: 400 },
      { x: 1100, y: 200 },
      { x: 1800, y: 350 },
      { x: 1900, y: 800 },
      { x: 1400, y: 950 },
      { x: 1300, y: 1400 },
      { x: 700, y: 1500 },
      { x: 300, y: 1100 },
      { x: 600, y: 750 }
    ]
  }
};

export const DEFAULT_TRACK_ID = 'city';

export const TRACK_ORDER = ['city', 'desert', 'night'];
