const canvas = document.getElementById('traceCanvas');
const ctx = canvas.getContext('2d');
const stayToggle = document.getElementById('stayToggle');
const clearButton = document.getElementById('clearCanvas');
const inkColorInput = document.getElementById('inkColor');
const penSize = document.getElementById('penSize');
const guideWidthInput = document.getElementById('guideWidth');
const penSizeValue = document.getElementById('penSizeValue');
const guideWidthValue = document.getElementById('guideWidthValue');
const storyButtons = document.getElementById('storyButtons');
const patternLabel = document.getElementById('patternLabel');
const patternStory = document.getElementById('patternStory');
const modeLabel = document.getElementById('modeLabel');
const difficultyBadge = document.getElementById('difficultyBadge');
const stayBadge = document.getElementById('stayBadge');

const DESIGN_WIDTH = 900;
const DESIGN_HEIGHT = 600;
let dpr = window.devicePixelRatio || 1;
let guidePath = null;
let guideStroke = 26;
let guideGlow = 4;
let currentPattern = null;
let currentSteps = null;
let insideLines = false;
let isDrawing = false;
let strokes = [];
let activeStroke = null;
let warningTimeout;
let guideWarning = false;

const PATTERNS = {
  stories: [
    {
      id: 'jellyfish-home',
      label: 'Guide the jellyfish home',
      difficulty: 'Simple',
      story: 'The jellyfish wants to reach the glowing reef. Drift along the silky current without bumping into rocks.',
      color: '#8acbff',
      steps: {
        start: [120, 420],
        segments: [
          { type: 'quad', cp: [220, 240], to: [360, 340] },
          { type: 'quad', cp: [520, 520], to: [680, 320] },
          { type: 'quad', cp: [760, 180], to: [820, 240] },
        ],
      },
      decorations: {
        startIcon: '🐙',
        endIcon: '✨',
      },
    },
    {
      id: 'squirrel-forest',
      label: 'Help the squirrel escape',
      difficulty: 'Harder',
      story: 'Wind through the forest trails and pop out near the big oak. Tight corners await!',
      color: '#f5a873',
      steps: {
        start: [140, 480],
        segments: [
          { type: 'line', to: [140, 260] },
          { type: 'line', to: [320, 260] },
          { type: 'quad', cp: [460, 260], to: [460, 420] },
          { type: 'line', to: [620, 420] },
          { type: 'quad', cp: [760, 420], to: [760, 260] },
          { type: 'line', to: [840, 260] },
          { type: 'line', to: [840, 160] },
        ],
      },
      decorations: {
        startIcon: '🐿️',
        endIcon: '🌳',
      },
    },
    {
      id: 'turtle-pond',
      label: 'Guide the turtle',
      difficulty: 'Simple',
      story: 'Help the slow turtle swim across the pond and reach the sunny rock.',
      color: '#80caff',
      steps: {
        start: [120, 360],
        segments: [
          { type: 'quad', cp: [240, 260], to: [360, 360] },
          { type: 'quad', cp: [480, 460], to: [600, 360] },
          { type: 'quad', cp: [720, 260], to: [840, 360] },
        ],
      },
      decorations: {
        startIcon: '🐢',
        endIcon: '☀️',
      },
    },
    {
      id: 'fox-hollow',
      label: 'Fox through the hollow',
      difficulty: 'Harder',
      story: 'Trace the fox sprinting through twists and arches to reach the cozy den.',
      color: '#ffa17a',
      steps: {
        start: [90, 480],
        segments: [
          { type: 'line', to: [200, 340] },
          { type: 'line', to: [160, 220] },
          { type: 'line', to: [320, 200] },
          { type: 'line', to: [340, 360] },
          { type: 'line', to: [500, 340] },
          { type: 'line', to: [540, 190] },
          { type: 'line', to: [700, 240] },
          { type: 'line', to: [720, 420] },
          { type: 'line', to: [860, 300] },
        ],
      },
      decorations: {
        startIcon: '🦊',
        endIcon: '🏠',
      },
    },
    {
      id: 'otter-river',
      label: 'Otter river dash',
      difficulty: 'Simple',
      story: 'Slip along the river bends to get the otter back to its snug log.',
      color: '#7ad7c4',
      steps: {
        start: [120, 400],
        segments: [
          { type: 'quad', cp: [240, 320], to: [360, 420] },
          { type: 'quad', cp: [480, 520], to: [600, 360] },
          { type: 'quad', cp: [720, 260], to: [840, 320] },
        ],
      },
      decorations: {
        startIcon: '🦦',
        endIcon: '🪵',
        color: '#0f766e',
      },
    },
    {
      id: 'hedgehog-haven',
      label: 'Hedgehog haven',
      difficulty: 'Harder',
      story: 'Carefully weave through brambles so the hedgehog can curl up in its nest.',
      color: '#d4a373',
      steps: {
        start: [140, 460],
        segments: [
          { type: 'line', to: [240, 260] },
          { type: 'quad', cp: [360, 160], to: [460, 260] },
          { type: 'line', to: [560, 340] },
          { type: 'quad', cp: [660, 460], to: [740, 320] },
          { type: 'line', to: [820, 220] },
        ],
      },
      decorations: {
        startIcon: '🦔',
        endIcon: '🍂',
        color: '#92400e',
      },
    },
  ],
};

function jitterPoint(point, amount) {
  const [x, y] = point;
  const offset = () => (Math.random() * 2 - 1) * amount;
  return [
    Math.min(Math.max(x + offset(), 60), DESIGN_WIDTH - 60),
    Math.min(Math.max(y + offset(), 60), DESIGN_HEIGHT - 60),
  ];
}

function generateVariantSteps(steps) {
  const startJitter = 30 + Math.random() * 30;
  const pointJitter = 42 + Math.random() * 34;
  const curveJitter = 46 + Math.random() * 34;
  const jitteredStart = jitterPoint(steps.start, startJitter);
  const segments = [];
  let prevPoint = jitteredStart;

  steps.segments.forEach((seg, idx) => {
    if (seg.type === 'line') {
      const target = jitterPoint(seg.to, pointJitter + idx * 4);
      const wiggleChance = 0.72;
      if (Math.random() < wiggleChance) {
        const mid = [(prevPoint[0] + target[0]) / 2, (prevPoint[1] + target[1]) / 2];
        const bend = jitterPoint(mid, pointJitter * 0.6 + 24 * Math.random());
        segments.push({ type: 'line', to: bend });
        segments.push({ type: 'line', to: target });
        prevPoint = target;
        return;
      }
      segments.push({ ...seg, to: target });
      prevPoint = target;
      return;
    }
    if (seg.type === 'quad') {
      const cp = jitterPoint(seg.cp, curveJitter + idx * 3);
      const to = jitterPoint(seg.to, pointJitter + Math.random() * 16);
      if (Math.random() < 0.35) {
        const mid = [(cp[0] + to[0]) / 2, (cp[1] + to[1]) / 2];
        const midBump = jitterPoint(mid, curveJitter * 0.8);
        segments.push({ type: 'quad', cp, to: midBump });
        segments.push({
          type: 'quad',
          cp: jitterPoint(midBump, 12 + Math.random() * curveJitter * 0.4),
          to,
        });
      } else {
        segments.push({ ...seg, cp, to });
      }
      prevPoint = to;
    }
  });

  return { start: jitteredStart, segments };
}

function createButton(pattern, group) {
  const button = document.createElement('button');
  button.textContent = pattern.label;
  const detail = document.createElement('small');
  detail.textContent = pattern.difficulty;
  button.appendChild(detail);
  button.dataset.id = pattern.id;
  button.dataset.group = group;
  button.addEventListener('click', () => setPattern(pattern, group));
  return button;
}

function buildButtons() {
  PATTERNS.stories.forEach((p, idx) => {
    const button = createButton(p, 'stories');
    if (idx === 0) button.dataset.active = 'true';
    storyButtons.appendChild(button);
  });
}

function scalePoint(point) {
  const scaleX = canvas.width / DESIGN_WIDTH;
  const scaleY = canvas.height / DESIGN_HEIGHT;
  return [point[0] * scaleX, point[1] * scaleY];
}

function pathFromSteps(steps) {
  const path = new Path2D();
  const [startX, startY] = scalePoint(steps.start);
  path.moveTo(startX, startY);
  for (const segment of steps.segments) {
    if (segment.type === 'line') {
      const [x, y] = scalePoint(segment.to);
      path.lineTo(x, y);
    } else if (segment.type === 'quad') {
      const [cpx, cpy] = scalePoint(segment.cp);
      const [x, y] = scalePoint(segment.to);
      path.quadraticCurveTo(cpx, cpy, x, y);
    }
  }
  return path;
}

function getMarkerPoints() {
  const steps = currentSteps || currentPattern?.steps;
  if (!steps) return null;
  const start = scalePoint(steps.start);
  const segments = steps.segments || [];
  const lastSeg = segments.length ? segments[segments.length - 1] : null;
  const end = lastSeg?.to ? scalePoint(lastSeg.to) : start;
  return { start, end };
}

function lastItem(list) {
  return list[list.length - 1];
}

function setPattern(pattern, group) {
  currentPattern = { ...pattern, group };
  currentSteps = generateVariantSteps(pattern.steps);
  guidePath = pathFromSteps(currentSteps);
  strokes = [];
  activeStroke = null;
  updateLabels();
  highlightActiveButtons(pattern.id, group);
  redraw();
}

function highlightActiveButtons(id, group) {
  const buttons = [...document.querySelectorAll('.button-grid button')];
  buttons.forEach((btn) => {
    if (btn.dataset.group === group) {
      btn.dataset.active = btn.dataset.id === id;
    }
  });
}

function resizeCanvas() {
  dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  if (currentPattern) {
    guidePath = pathFromSteps(currentSteps || currentPattern.steps);
  }
  redraw();
}

function clearCanvas() {
  strokes = [];
  activeStroke = null;
  setGuideWarning(false);
  redraw();
}

function setBadge(text, badgeEl) {
  badgeEl.textContent = text;
}

function updateLabels() {
  if (!currentPattern) return;
  patternLabel.textContent = currentPattern.label;
  patternStory.textContent = currentPattern.story;
  modeLabel.textContent = 'Story adventure';
  setBadge(currentPattern.difficulty, difficultyBadge);
  stayBadge.textContent = insideLines ? 'Inside-lines on' : 'Inside-lines off';
}

function drawMarkers() {
  if (!guidePath || !currentPattern) return;
  const markers = getMarkerPoints();
  if (!markers) return;
  const glowColor = guideWarning ? 'rgba(238,82,82,0.28)' : 'rgba(19,79,242,0.16)';
  const guideColor = guideWarning ? '#ff5a63' : currentPattern.color || '#8fb3ff';
  ctx.save();
  ctx.lineWidth = (guideStroke + guideGlow) * dpr;
  ctx.lineCap = 'round';
  ctx.strokeStyle = glowColor;
  ctx.stroke(guidePath);
  ctx.restore();

  ctx.save();
  ctx.lineWidth = guideStroke * dpr;
  ctx.lineCap = 'round';
  ctx.setLineDash([18, 12]);
  ctx.strokeStyle = guideColor;
  ctx.stroke(guidePath);
  ctx.restore();

  const start = markers.start;
  const end = markers.end;
  drawMarker(start, currentPattern.decorations?.startIcon || '🏁', currentPattern.decorations?.color || '#0f1e4a');
  drawMarker(end, currentPattern.decorations?.endIcon || '🎯', '#8b5cf6');
}

function drawMarker(point, icon, color) {
  const [x, y] = point;
  const haloRadius = (guideStroke + 18) * dpr;
  const ringRadius = (guideStroke + 6) * dpr;
  ctx.save();
  const gradient = ctx.createRadialGradient(x, y, ringRadius / 4, x, y, haloRadius);
  gradient.addColorStop(0, `${color}33`);
  gradient.addColorStop(1, `${color}00`);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, haloRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = color;
  ctx.lineWidth = 3 * dpr;
  ctx.beginPath();
  ctx.arc(x, y, ringRadius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(x, y, (guideStroke + 2) * dpr, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = `${28 * dpr}px 'Baloo 2', 'Inter', system-ui`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.18)';
  ctx.shadowBlur = 10 * dpr;
  ctx.fillStyle = color;
  ctx.fillText(icon, x, y);
  ctx.restore();
}

function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.fillStyle = '#f9fbff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  if (guidePath) {
    drawMarkers();
  }

  for (const stroke of strokes) {
    drawStroke(stroke);
  }
}

function drawStroke(stroke) {
  if (!stroke.points.length) return;
  ctx.save();
  ctx.strokeStyle = stroke.color;
  ctx.lineWidth = stroke.width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
  for (let i = 1; i < stroke.points.length; i++) {
    ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
  }
  ctx.stroke();
  ctx.restore();
}

function pointerPosition(evt) {
  const rect = canvas.getBoundingClientRect();
  const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
  const clientY = evt.touches ? evt.touches[0].clientY : evt.clientY;
  return {
    x: (clientX - rect.left) * dpr,
    y: (clientY - rect.top) * dpr,
  };
}

function pointerDown(evt) {
  evt.preventDefault();
  isDrawing = true;
  activeStroke = {
    color: inkColorInput.value,
    width: Number(penSize.value),
    points: [],
    stayedInGuide: true,
  };
  strokes.push(activeStroke);
  const pos = pointerPosition(evt);
  pushPoint(pos);
}

function pointerMove(evt) {
  if (!isDrawing || !activeStroke) return;
  evt.preventDefault();
  const pos = pointerPosition(evt);
  const inStroke = isPointInGuide(pos);
  setGuideWarning(!inStroke);
  if (!inStroke) {
    activeStroke.stayedInGuide = false;
    if (insideLines) {
      flashStatus('Stay in the glow!');
      return;
    }
  }
  pushPoint(pos);
}

function pointerUp(evt) {
  evt?.preventDefault();
  isDrawing = false;
  activeStroke = null;
  setGuideWarning(false);
  evaluateCompletion();
}

function pushPoint(pos) {
  activeStroke.points.push(pos);
  redraw();
}

function flashStatus(message) {
  const status = document.querySelector('.status-bar') || document.createElement('div');
  status.className = 'status-bar';
  status.textContent = message;
  document.body.appendChild(status);
  clearTimeout(warningTimeout);
  warningTimeout = setTimeout(() => status.remove(), 900);
}

function attachCanvasEvents() {
  const events = ['pointerdown', 'touchstart'];
  const moveEvents = ['pointermove', 'touchmove'];
  const endEvents = ['pointerup', 'pointerleave', 'touchend'];

  events.forEach((evtName) => canvas.addEventListener(evtName, pointerDown, { passive: false }));
  moveEvents.forEach((evtName) => canvas.addEventListener(evtName, pointerMove, { passive: false }));
  endEvents.forEach((evtName) => canvas.addEventListener(evtName, pointerUp, { passive: false }));
}

function setGlow(val) {
  guideGlow = Number(val);
}

function setGuideWidth(val) {
  guideStroke = Number(val);
  guideWidthValue.textContent = `${val}px`;
  redraw();
}

function setGuideWarning(state) {
  if (guideWarning === state) return;
  guideWarning = state;
  redraw();
}

function isPointInGuide(pos) {
  if (!guidePath) return true;
  const markers = getMarkerPoints();
  const markerAllowance = (guideStroke + 20) * dpr;
  if (markers) {
    const inStart = distance(pos, markers.start) <= markerAllowance;
    const inEnd = distance(pos, markers.end) <= markerAllowance;
    if (inStart || inEnd) return true;
  }
  ctx.save();
  ctx.lineWidth = (guideStroke + 8) * dpr;
  const inStroke = ctx.isPointInStroke(guidePath, pos.x, pos.y);
  ctx.restore();
  return inStroke;
}

function distance(a, b) {
  const dx = a.x - b[0];
  const dy = a.y - b[1];
  return Math.hypot(dx, dy);
}

function evaluateCompletion() {
  if (!strokes.length || !guidePath || !currentSteps) return;
  const markers = getMarkerPoints();
  if (!markers) return;
  const start = markers.start;
  const end = markers.end;
  const radius = 30 * dpr;
  const allPoints = strokes.reduce((pts, s) => pts.concat(s.points), []);
  if (!allPoints.length) return;
  const pathLength = allPoints.reduce((len, p, idx, arr) => {
    if (idx === 0) return 0;
    const prev = arr[idx - 1];
    return len + Math.hypot(p.x - prev.x, p.y - prev.y);
  }, 0);
  const startedNear = distance(allPoints[0], start) <= radius * 1.2;
  const endedNear = distance(allPoints[allPoints.length - 1], end) <= radius * 1.2;
  const touchedStart = allPoints.some((p) => distance(p, start) <= radius);
  const touchedEnd = allPoints.some((p) => distance(p, end) <= radius);
  const stayedInside = strokes.every((s) => s.stayedInGuide !== false && s.points.every((p) => isPointInGuide(p)));
  const gapAllowance = guideStroke * dpr * 1.4;
  const continuous = strokes.every((s, idx) => {
    if (idx === 0) return true;
    const prevStroke = strokes[idx - 1];
    const lastPoint = lastItem(prevStroke.points);
    const firstPoint = s.points[0];
    return distance(lastPoint, [firstPoint.x, firstPoint.y]) <= gapAllowance;
  });
  const longEnough = pathLength > 260 * dpr;
  if (startedNear && endedNear && touchedStart && touchedEnd && stayedInside && longEnough && continuous) {
    flashStatus('Great tracing! 🎉');
    launchConfetti();
  }
}

function launchConfetti() {
  const container = document.createElement('div');
  container.className = 'confetti';
  const pieces = 90;
  for (let i = 0; i < pieces; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti__piece';
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.animationDelay = `${Math.random() * 0.35}s`;
    piece.style.transform = `translateY(0) rotate(${Math.random() * 90}deg)`;
    container.appendChild(piece);
  }
  document.body.appendChild(container);
  setTimeout(() => container.remove(), 5200);
}

function init() {
  buildButtons();
  setPattern(PATTERNS.stories[0], 'stories');
  resizeCanvas();
  attachCanvasEvents();
  window.addEventListener('resize', resizeCanvas);

  stayToggle.addEventListener('click', () => {
    insideLines = !insideLines;
    stayToggle.textContent = `Stay inside the lines: ${insideLines ? 'On' : 'Off'}`;
    stayToggle.setAttribute('aria-pressed', insideLines);
    stayBadge.textContent = insideLines ? 'Inside-lines on' : 'Inside-lines off';
  });

  clearButton.addEventListener('click', clearCanvas);
  inkColorInput.addEventListener('input', () => redraw());
  penSize.addEventListener('input', (e) => {
    penSizeValue.textContent = `${e.target.value}px`;
  });
  const handleGuideWidth = (e) => setGuideWidth(e.target.value);
  guideWidthInput.addEventListener('input', handleGuideWidth);
  guideWidthInput.addEventListener('change', handleGuideWidth);

  penSizeValue.textContent = `${penSize.value}px`;
  setGlow(guideGlow);
  setGuideWidth(guideWidthInput.value);
}

init();
