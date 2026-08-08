// Decoracao visual de cada pista: predios pra cidade, dunas/montanhas
// pro deserto, predios escuros + placas neon pra noite. Tudo desenhado
// uma unica vez num Graphics estatico (nao recriado por frame — mesma
// logica de performance do resto do jogo), espalhado fora da faixa da
// pista pra nao atrapalhar a corrida.
const THEME_COLORS = {
  city: {
    background: 0x0b0f1a,
    buildings: [0x1c2333, 0x232b40, 0x161c2b],
    window: 0xffd400
  },
  desert: {
    background: 0x2a1f12,
    dunes: [0xc98a4b, 0xb5763a, 0xdba05c],
    mountains: 0x5a3a22
  },
  night: {
    background: 0x05070f,
    buildings: [0x11121c, 0x191b2c, 0x0d0f1a],
    neon: [0xff2d78, 0x00e5ff, 0xb84dff, 0xffd400],
    window: 0x8ea0c8
  }
};

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randRange(min, max) {
  return min + Math.random() * (max - min);
}

function distanceToTrack(track, x, y) {
  let best = Infinity;
  for (const p of track.points) {
    const d = (p.x - x) ** 2 + (p.y - y) ** 2;
    if (d < best) best = d;
  }
  return Math.sqrt(best);
}

function drawCityBuilding(g, colors, x, y) {
  const w = randRange(30, 70);
  const h = randRange(50, 130);

  g.fillStyle(pick(colors.buildings), 1);
  g.fillRect(x - w / 2, y - h / 2, w, h);

  // janelas iluminadas, em grade simples
  const cols = Math.max(1, Math.floor(w / 14));
  const rows = Math.max(1, Math.floor(h / 18));
  g.fillStyle(colors.window, 0.85);
  for (let cx = 0; cx < cols; cx++) {
    for (let cy = 0; cy < rows; cy++) {
      if (Math.random() > 0.6) continue;
      const wx = x - w / 2 + 6 + cx * 14;
      const wy = y - h / 2 + 8 + cy * 18;
      g.fillRect(wx, wy, 5, 6);
    }
  }
}

function drawNightBuilding(g, colors, x, y) {
  const w = randRange(28, 65);
  const h = randRange(60, 160);

  g.fillStyle(pick(colors.buildings), 1);
  g.fillRect(x - w / 2, y - h / 2, w, h);

  g.fillStyle(colors.window, 0.5);
  const rows = Math.max(1, Math.floor(h / 20));
  for (let cy = 0; cy < rows; cy++) {
    if (Math.random() > 0.5) continue;
    g.fillRect(x - w / 2 + 4, y - h / 2 + 8 + cy * 20, w - 8, 4);
  }

  if (Math.random() < 0.35) {
    const neon = pick(colors.neon);
    g.fillStyle(neon, 1);
    g.fillRect(x - 16, y - h / 2 - 16, 32, 12);
    g.fillStyle(neon, 0.25);
    g.fillRect(x - 24, y - h / 2 - 22, 48, 24);
  }
}

function drawDune(g, colors, x, y) {
  const r = randRange(18, 55);
  g.fillStyle(pick(colors.dunes), 0.85);
  g.fillEllipse(x, y, r * 2, r);
}

function drawMountain(g, colors, x, y) {
  const w = randRange(90, 220);
  const h = randRange(60, 150);
  g.fillStyle(colors.mountains, 0.7);
  g.fillTriangle(x - w / 2, y + h / 2, x + w / 2, y + h / 2, x, y - h / 2);
}

// bounds: { x, y, width, height } — a mesma bounding box usada pela
// camera/mundo fisico em RaceScene.
export function applyTrackTheme(scene, track, theme, bounds) {
  const colors = THEME_COLORS[theme];
  if (!colors) return null;

  scene.cameras.main.setBackgroundColor(colors.background);

  const g = scene.add.graphics().setDepth(-2);
  const minDist = track.roadWidth / 2 + 45;

  if (theme === 'desert') {
    // montanhas mais espaçadas ao fundo, dunas mais numerosas por perto
    for (let i = 0; i < 20; i++) {
      const x = randRange(bounds.x, bounds.x + bounds.width);
      const y = randRange(bounds.y, bounds.y + bounds.height);
      if (distanceToTrack(track, x, y) < minDist * 2.2) continue;
      drawMountain(g, colors, x, y);
    }
    for (let i = 0; i < 110; i++) {
      const x = randRange(bounds.x, bounds.x + bounds.width);
      const y = randRange(bounds.y, bounds.y + bounds.height);
      if (distanceToTrack(track, x, y) < minDist) continue;
      drawDune(g, colors, x, y);
    }
  } else {
    const drawBuilding = theme === 'night' ? drawNightBuilding : drawCityBuilding;
    for (let i = 0; i < 140; i++) {
      const x = randRange(bounds.x, bounds.x + bounds.width);
      const y = randRange(bounds.y, bounds.y + bounds.height);
      if (distanceToTrack(track, x, y) < minDist) continue;
      drawBuilding(g, colors, x, y);
    }
  }

  return g;
}
