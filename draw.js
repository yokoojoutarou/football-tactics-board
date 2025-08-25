// 描画レイヤーとツール
const fieldEl = document.getElementById('field');
const canvas = document.getElementById('drawLayer');
const penBtn = document.getElementById('penBtn');
const eraserBtn = document.getElementById('eraserBtn');
const clearBtn = document.getElementById('clearBtn');
const doneBtn = document.getElementById('doneBtn');
const colorPicker = document.getElementById('colorPicker');
const sizeRange = document.getElementById('sizeRange');
// シーン: ストローク配列（ひと筆単位）
// { type: 'pen', color: string, size: number, points: [{x,y}, ...] }
const strokes = [];
let currentStroke = null;

// キャンバス初期化（リサイズ対応）
const ctx = canvas.getContext('2d');
function resizeCanvas() {
  // CSSサイズに合わせて実ピクセルを調整
  const rect = fieldEl.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);
  canvas.style.width = rect.width + 'px';
  canvas.style.height = rect.height + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // スケール調整
  renderAll();
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

let drawing = false;
let mode = 'none'; // 'pen' | 'eraser' | 'none'

function enableCanvas(enable) {
  canvas.style.pointerEvents = enable ? 'auto' : 'none';
}

function setMode(next) {
  mode = next;
  enableCanvas(mode === 'pen' || mode === 'eraser');
}
penBtn.addEventListener('click', () => setMode('pen'));
eraserBtn.addEventListener('click', () => setMode('eraser'));
doneBtn.addEventListener('click', () => setMode('none'));
clearBtn.addEventListener('click', () => {
  strokes.length = 0;
  renderAll();
});

// Keyboard shortcuts: 'p' -> pen, 'e' -> eraser
document.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  const key = e.key?.toLowerCase();
  const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
  // Ignore when typing in inputs or textareas
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
  if (key === 'p') setMode('pen');
  if (key === 'e') setMode('eraser');
  if (key === 'c') { strokes.length = 0; renderAll(); }
  if (key === 'escape') setMode('none');
});
function getPos(evt) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (evt.clientX ?? evt.pageX) - rect.left,
    y: (evt.clientY ?? evt.pageY) - rect.top,
  };
}

function renderStroke(s) {
  if (s.points.length === 0) return;
  if (s.type === 'pen') {
    ctx.strokeStyle = s.color;
  ctx.lineWidth = s.size;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
    if (s.points.length === 1) {
      // ドット描画
      ctx.fillStyle = s.color;
  ctx.beginPath();
  ctx.arc(s.points[0].x, s.points[0].y, s.size / 2, 0, Math.PI * 2);
  ctx.fill();
      return;
    }
    ctx.beginPath();
    ctx.moveTo(s.points[0].x, s.points[0].y);
    for (let i = 1; i < s.points.length; i++) {
      ctx.lineTo(s.points[i].x, s.points[i].y);
    }
    ctx.stroke();
  }
}

function renderAll() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const s of strokes) renderStroke(s);
}

// 2点間と点の距離（線分距離）
function distPointToSegment(p, a, b) {
  const vx = b.x - a.x;
  const vy = b.y - a.y;
  const wx = p.x - a.x;
  const wy = p.y - a.y;
  const c1 = vx * wx + vy * wy;
  if (c1 <= 0) return Math.hypot(p.x - a.x, p.y - a.y);
  const c2 = vx * vx + vy * vy;
  if (c2 <= c1) return Math.hypot(p.x - b.x, p.y - b.y);
  const t = c1 / c2;
  const px = a.x + t * vx;
  const py = a.y + t * vy;
  return Math.hypot(p.x - px, p.y - py);
}

function findStrokeAtPoint(p, threshold) {
  for (let i = strokes.length - 1; i >= 0; i--) {
    const s = strokes[i];
    if (s.type !== 'pen') continue;
    if (s.points.length === 1) {
      const d = Math.hypot(p.x - s.points[0].x, p.y - s.points[0].y);
      if (d <= Math.max(threshold, s.size / 2)) return i;
      continue;
    }
    for (let j = 0; j < s.points.length - 1; j++) {
      const d = distPointToSegment(p, s.points[j], s.points[j + 1]);
      if (d <= Math.max(threshold, s.size / 2)) return i;
    }
  }
  return -1;
}

let last = null;

canvas.addEventListener('mousedown', (e) => {
  if (mode === 'none') return;
  const p = getPos(e);
  if (mode === 'pen') {
    drawing = true;
    currentStroke = {
      type: 'pen',
      color: colorPicker.value,
      size: Number(sizeRange.value),
      points: [p],
    };
    strokes.push(currentStroke);
    renderAll();
  } else if (mode === 'eraser') {
    const threshold = Number(sizeRange.value);
    const idx = findStrokeAtPoint(p, threshold);
    if (idx !== -1) {
      strokes.splice(idx, 1);
      renderAll();
    }
    drawing = true; // ドラッグで連続削除も可
  }
  last = p;
});

canvas.addEventListener('mousemove', (e) => {
  if (mode === 'none' || !drawing) return;
  const p = getPos(e);
  if (mode === 'pen' && currentStroke) {
    currentStroke.points.push(p);
    renderAll();
  } else if (mode === 'eraser') {
    const threshold = Number(sizeRange.value);
    const idx = findStrokeAtPoint(p, threshold);
    if (idx !== -1) {
      strokes.splice(idx, 1);
      renderAll();
    }
  }
  last = p;
});

function endDraw() {
  if (!drawing) return;
  drawing = false;
  currentStroke = null;
}

canvas.addEventListener('mouseup', endDraw);
canvas.addEventListener('mouseleave', endDraw);

// タッチ操作にも対応
canvas.addEventListener('touchstart', (e) => {
  if (mode === 'none') return;
  e.preventDefault();
  const t = e.touches[0];
  const p = getPos(t);
  if (mode === 'pen') {
    drawing = true;
    currentStroke = {
      type: 'pen',
      color: colorPicker.value,
      size: Number(sizeRange.value),
      points: [p],
    };
    strokes.push(currentStroke);
    renderAll();
  } else if (mode === 'eraser') {
    const threshold = Number(sizeRange.value);
    const idx = findStrokeAtPoint(p, threshold);
    if (idx !== -1) {
      strokes.splice(idx, 1);
      renderAll();
    }
    drawing = true;
  }
  last = p;
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
  if (mode === 'none' || !drawing) return;
  e.preventDefault();
  const t = e.touches[0];
  const p = getPos(t);
  if (mode === 'pen' && currentStroke) {
    currentStroke.points.push(p);
    renderAll();
  } else if (mode === 'eraser') {
    const threshold = Number(sizeRange.value);
    const idx = findStrokeAtPoint(p, threshold);
    if (idx !== -1) {
      strokes.splice(idx, 1);
      renderAll();
    }
  }
  last = p;
}, { passive: false });

canvas.addEventListener('touchend', endDraw, { passive: false });
canvas.addEventListener('touchcancel', endDraw, { passive: false });
