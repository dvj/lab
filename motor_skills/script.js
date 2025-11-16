const canvas = document.getElementById('traceCanvas');
const ctx = canvas.getContext('2d');
const stayToggle = document.getElementById('stayToggle');
const clearButton = document.getElementById('clearCanvas');
const inkColorInput = document.getElementById('inkColor');
const penSize = document.getElementById('penSize');
const glowSize = document.getElementById('glowSize');
const guideWidthInput = document.getElementById('guideWidth');
const penSizeValue = document.getElementById('penSizeValue');
const glowValue = document.getElementById('glowValue');
const guideWidthValue = document.getElementById('guideWidthValue');
const practiceButtons = document.getElementById('practiceButtons');
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
let guideStroke = 24;
let guideGlow = 30;
let currentPattern = null;
let currentSteps = null;
let insideLines = false;
let isDrawing = false;
let strokes = [];
let activeStroke = null;
let warningTimeout;

const PATTERNS = {
  practice: [
    {
      id: 'gentle-wave',
      label: 'Gentle wave',
      difficulty: 'Simple',
      story: 'Follow the soft curves to warm up your wrist.',
      color: '#8fb3ff',
      steps: {
        start: [80, 320],
        segments: [
          { type: 'quad', cp: [240, 180], to: [420, 320] },
          { type: 'quad', cp: [600, 440], to: [780, 320] },
        ],
      },
    },
    {
      id: 'gentle-ladders',
      label: 'Gentle ladders',
      difficulty: 'Simple',
      story: 'Climb up and down easy slopes with calm hand movements.',
      color: '#ffcf70',
      steps: {
        start: [110, 420],
        segments: [
          { type: 'line', to: [230, 240] },
          { type: 'line', to: [380, 420] },
          { type: 'line', to: [540, 240] },
          { type: 'line', to: [710, 420] },
        ],
      },
    },
    {
      id: 'loop-garden',
      label: 'Loop garden',
      difficulty: 'Harder',
      story: 'Trace around neat garden beds that curve and swoop.',
      color: '#75d0b9',
      steps: {
        start: [140, 300],
        segments: [
          { type: 'quad', cp: [240, 120], to: [420, 260] },
          { type: 'quad', cp: [600, 420], to: [760, 260] },
          { type: 'quad', cp: [620, 120], to: [440, 180] },
          { type: 'quad', cp: [260, 320], to: [140, 300] },
        ],
      },
    },
    {
      id: 'square-steps',
      label: 'Square steps',
      difficulty: 'Harder',
      story: 'Follow boxy corners and stay steady around sharp edges.',
      color: '#f99887',
      steps: {
        start: [120, 460],
        segments: [
          { type: 'line', to: [120, 200] },
          { type: 'line', to: [360, 200] },
          { type: 'line', to: [360, 360] },
          { type: 'line', to: [620, 360] },
          { type: 'line', to: [620, 160] },
          { type: 'line', to: [780, 160] },
          { type: 'line', to: [780, 480] },
        ],
      },
    },
  ],
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
        startLabel: '🐙 Jellyfish',
        endLabel: '✨ Reef',
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
        startLabel: '🐿️ Squirrel',
        endLabel: '🌳 Big oak',
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
        startLabel: '🐢 Turtle',
        endLabel: '☀️ Rock',
      },
    },
    {
      id: 'fox-hollow',
      label: 'Fox through the hollow',
      difficulty: 'Harder',
      story: 'Trace the fox sprinting through twists and arches to reach the cozy den.',
      color: '#ffa17a',
      steps: {
        start: [100, 440],
        segments: [
          { type: 'line', to: [220, 260] },
          { type: 'quad', cp: [320, 160], to: [460, 260] },
          { type: 'line', to: [560, 420] },
          { type: 'quad', cp: [660, 560], to: [760, 380] },
          { type: 'quad', cp: [820, 240], to: [860, 200] },
        ],
      },
      decorations: {
        startLabel: '🦊 Fox',
        endLabel: '🏠 Den',
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
  const jitteredStart = jitterPoint(steps.start, 24);
  const segments = steps.segments.map((seg) => {
    if (seg.type === 'line') {
      return { ...seg, to: jitterPoint(seg.to, 36) };
    }
    if (seg.type === 'quad') {
      return {
        ...seg,
        cp: jitterPoint(seg.cp, 36),
        to: jitterPoint(seg.to, 36),
      };
    }
    return seg;
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
  PATTERNS.practice.forEach((p, idx) => {
    const button = createButton(p, 'practice');
    if (idx === 0) button.dataset.active = 'true';
    practiceButtons.appendChild(button);
  });

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
  redraw();
}

function setBadge(text, badgeEl) {
  badgeEl.textContent = text;
}

function updateLabels() {
  if (!currentPattern) return;
  patternLabel.textContent = currentPattern.label;
  patternStory.textContent = currentPattern.story;
  modeLabel.textContent = currentPattern.group === 'stories' ? 'Story game' : 'Practice path';
  setBadge(currentPattern.difficulty, difficultyBadge);
  stayBadge.textContent = insideLines ? 'Inside-lines on' : 'Inside-lines off';
}

function drawMarkers() {
  if (!guidePath || !currentPattern) return;
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, 'rgba(19,79,242,0.12)');
  gradient.addColorStop(1, 'rgba(255,150,109,0.18)');
  ctx.save();
  ctx.lineWidth = (guideStroke + guideGlow) * dpr;
  ctx.lineCap = 'round';
  ctx.strokeStyle = gradient;
  ctx.stroke(guidePath);
  ctx.restore();

  ctx.save();
  ctx.lineWidth = guideStroke * dpr;
  ctx.lineCap = 'round';
  ctx.setLineDash([18, 12]);
  ctx.strokeStyle = currentPattern.color || '#8fb3ff';
  ctx.stroke(guidePath);
  ctx.restore();

  const start = scalePoint(currentSteps?.start || currentPattern.steps.start);
  const lastSeg = (currentSteps || currentPattern.steps).segments.at(-1);
  const end = lastSeg?.to ? scalePoint(lastSeg.to) : start;
  drawLabel(start, currentPattern.decorations?.startLabel || 'Start');
  drawLabel(end, currentPattern.decorations?.endLabel || 'Finish');
}

function drawLabel(point, text) {
  const [x, y] = point;
  ctx.save();
  const bubbleWidth = 120 * dpr;
  const bubbleHeight = 42 * dpr;
  const radius = 16 * dpr;
  ctx.translate(x, y);
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.strokeStyle = 'rgba(15,23,42,0.15)';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(-bubbleWidth / 2 + radius, -bubbleHeight / 2);
  ctx.lineTo(bubbleWidth / 2 - radius, -bubbleHeight / 2);
  ctx.quadraticCurveTo(bubbleWidth / 2, -bubbleHeight / 2, bubbleWidth / 2, -bubbleHeight / 2 + radius);
  ctx.lineTo(bubbleWidth / 2, bubbleHeight / 2 - radius);
  ctx.quadraticCurveTo(bubbleWidth / 2, bubbleHeight / 2, bubbleWidth / 2 - radius, bubbleHeight / 2);
  ctx.lineTo(-bubbleWidth / 2 + radius, bubbleHeight / 2);
  ctx.quadraticCurveTo(-bubbleWidth / 2, bubbleHeight / 2, -bubbleWidth / 2, bubbleHeight / 2 - radius);
  ctx.lineTo(-bubbleWidth / 2, -bubbleHeight / 2 + radius);
  ctx.quadraticCurveTo(-bubbleWidth / 2, -bubbleHeight / 2, -bubbleWidth / 2 + radius, -bubbleHeight / 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#0f172a';
  ctx.font = `${17 * dpr}px 'Baloo 2', 'Inter', system-ui`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, 0);
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
  const finishedStroke = activeStroke;
  isDrawing = false;
  activeStroke = null;
  evaluateCompletion(finishedStroke);
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
  glowValue.textContent = `${val}px`;
  redraw();
}

function setGuideWidth(val) {
  guideStroke = Number(val);
  guideWidthValue.textContent = `${val}px`;
  redraw();
}

function isPointInGuide(pos) {
  if (!guidePath) return true;
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

function evaluateCompletion(stroke) {
  if (!stroke || !stroke.points.length || !guidePath || !currentSteps) return;
  const start = scalePoint(currentSteps.start);
  const lastSeg = currentSteps.segments.at(-1);
  const end = lastSeg?.to ? scalePoint(lastSeg.to) : start;
  const radius = 30 * dpr;
  const pathLength = stroke.points.reduce((len, p, idx, arr) => {
    if (idx === 0) return 0;
    const prev = arr[idx - 1];
    return len + Math.hypot(p.x - prev.x, p.y - prev.y);
  }, 0);
  const startedNear = distance(stroke.points[0], start) <= radius * 1.2;
  const endedNear = distance(stroke.points.at(-1), end) <= radius * 1.2;
  const touchedStart = stroke.points.some((p) => distance(p, start) <= radius);
  const touchedEnd = stroke.points.some((p) => distance(p, end) <= radius);
  const stayedInside = stroke.stayedInGuide !== false && stroke.points.every((p) => isPointInGuide(p));
  const longEnough = pathLength > 240 * dpr;
  if (startedNear && endedNear && touchedStart && touchedEnd && stayedInside && longEnough) {
    flashStatus('Great tracing! 🎉');
    launchConfetti();
  }
}

function launchConfetti() {
  const container = document.createElement('div');
  container.className = 'confetti';
  const pieces = 40;
  for (let i = 0; i < pieces; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti__piece';
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.animationDelay = `${Math.random() * 0.25}s`;
    piece.style.transform = `translateY(0) rotate(${Math.random() * 90}deg)`;
    container.appendChild(piece);
  }
  document.body.appendChild(container);
  setTimeout(() => container.remove(), 1300);
}

function init() {
  buildButtons();
  setPattern(PATTERNS.practice[0], 'practice');
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
  guideWidthInput.addEventListener('input', (e) => setGuideWidth(e.target.value));
  glowSize.addEventListener('input', (e) => setGlow(e.target.value));

  penSizeValue.textContent = `${penSize.value}px`;
  glowValue.textContent = `${glowSize.value}px`;
  guideWidthValue.textContent = `${guideWidthInput.value}px`;
}

init();
