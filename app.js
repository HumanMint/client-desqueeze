const fileInput = document.getElementById('fileInput');
const chooseBtn = document.getElementById('chooseBtn');
const welcomeChooseBtn = document.getElementById('welcomeChooseBtn');
const dropzone = document.getElementById('dropzone');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const ratioRange = document.getElementById('ratioRange');
const ratioValue = document.getElementById('ratioValue');
const presetButtons = Array.from(document.querySelectorAll('.preset'));
const motionPresetButtons = Array.from(document.querySelectorAll('.motion-preset'));
const motionPresetValue = document.getElementById('motionPresetValue');
const stiffnessRange = document.getElementById('stiffnessRange');
const dampingRange = document.getElementById('dampingRange');
const downloadBtn = document.getElementById('downloadBtn');
const formatSelect = document.getElementById('formatSelect');
const meta = document.getElementById('meta');
const stage = document.getElementById('stage');
const controlsPanel = document.getElementById('controlsPanel');

const canAnimate = typeof window.anime !== 'undefined';

let sourceImage = null;
let currentRatio = Number(ratioRange.value);
let displayRatio = currentRatio;
let ratioVelocity = 0;
let ratioRaf = null;
let controlsRevealed = false;

const MOTION_PRESETS = {
  subtle: { label: 'Subtle', stiffness: 0.1, damping: 0.86, dropY: -28, rotate: -1.2, duration: 650 },
  medium: { label: 'Medium', stiffness: 0.15, damping: 0.78, dropY: -52, rotate: -3, duration: 860 },
  expressive: { label: 'Expressive', stiffness: 0.22, damping: 0.7, dropY: -78, rotate: -5, duration: 1060 },
};

let motionMode = 'medium';
let springStiffness = MOTION_PRESETS[motionMode].stiffness;
let springDamping = MOTION_PRESETS[motionMode].damping;

function animateElement(target, opts = {}) {
  if (!canAnimate) return;
  window.anime.animate(target, {
    duration: 420,
    ease: 'out(4)',
    ...opts,
  });
}

function drawAtRatio(ratio) {
  if (!sourceImage) return;

  const outW = Math.max(1, Math.round(sourceImage.naturalWidth * ratio));
  const outH = sourceImage.naturalHeight;

  canvas.width = outW;
  canvas.height = outH;
  ctx.clearRect(0, 0, outW, outH);
  ctx.drawImage(sourceImage, 0, 0, outW, outH);
}

function updateMeta() {
  if (!sourceImage) {
    meta.hidden = true;
    return;
  }

  const outW = Math.round(sourceImage.naturalWidth * displayRatio);
  const outH = sourceImage.naturalHeight;
  meta.textContent = `Input ${sourceImage.naturalWidth}×${sourceImage.naturalHeight} → Output ${outW}×${outH}`;
  meta.hidden = false;
}

function syncUIRatio() {
  ratioRange.value = currentRatio.toFixed(2);
  ratioValue.textContent = displayRatio.toFixed(2);

  presetButtons.forEach((btn) => {
    const isOn = Number(btn.dataset.ratio).toFixed(2) === currentRatio.toFixed(2);
    btn.classList.toggle('active', isOn);
  });
}

function syncMotionUI() {
  const preset = MOTION_PRESETS[motionMode];
  motionPresetValue.textContent = preset.label;

  motionPresetButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.motion === motionMode);
  });

  stiffnessRange.value = String(springStiffness);
  dampingRange.value = String(springDamping);
}

function setMotionMode(mode) {
  if (!MOTION_PRESETS[mode]) return;
  motionMode = mode;
  springStiffness = MOTION_PRESETS[mode].stiffness;
  springDamping = MOTION_PRESETS[mode].damping;
  syncMotionUI();
}

function springRenderToTarget() {
  if (!sourceImage) return;

  const tick = () => {
    const delta = currentRatio - displayRatio;
    ratioVelocity += delta * springStiffness;
    ratioVelocity *= springDamping;
    displayRatio += ratioVelocity;

    if (Math.abs(delta) < 0.0006 && Math.abs(ratioVelocity) < 0.0006) {
      displayRatio = currentRatio;
      ratioVelocity = 0;
      ratioRaf = null;
      drawAtRatio(displayRatio);
      syncUIRatio();
      updateMeta();
      return;
    }

    drawAtRatio(displayRatio);
    syncUIRatio();
    updateMeta();
    ratioRaf = requestAnimationFrame(tick);
  };

  if (ratioRaf) cancelAnimationFrame(ratioRaf);
  ratioRaf = requestAnimationFrame(tick);
}

function setRatio(value) {
  currentRatio = Number(value);
  syncUIRatio();

  if (!sourceImage) return;
  springRenderToTarget();
}

function revealControls() {
  if (controlsRevealed) return;
  controlsRevealed = true;

  controlsPanel.classList.remove('is-hidden');

  animateElement('.controls', {
    opacity: [0, 1],
    translateX: [-10, 0],
    duration: 500,
  });

  animateElement('.controls > *', {
    opacity: [0, 1],
    translateY: [12, 0],
    delay: canAnimate && window.anime.stagger ? window.anime.stagger(60) : 0,
    duration: 420,
  });
}

function animateDropIn() {
  const preset = MOTION_PRESETS[motionMode];

  animateElement('.canvas-wrap', {
    opacity: [0.7, 1],
    scale: [0.96, 1],
    duration: Math.round(preset.duration * 0.55),
  });

  animateElement(canvas, {
    translateY: [preset.dropY, 0],
    rotate: [preset.rotate, 0],
    scale: [0.88, 1.01, 1],
    duration: preset.duration,
    ease: 'out(5)',
  });
}

function onImageReady() {
  stage.classList.remove('is-empty');
  revealControls();
  displayRatio = currentRatio;
  drawAtRatio(displayRatio);
  updateMeta();
  downloadBtn.disabled = false;
  animateDropIn();
}

function loadFile(file) {
  if (!file || !file.type.startsWith('image/')) return;

  const img = new Image();
  img.onload = () => {
    sourceImage = img;
    onImageReady();
  };
  img.src = URL.createObjectURL(file);
}

function openPicker() {
  fileInput.click();
}

chooseBtn.addEventListener('click', openPicker);
welcomeChooseBtn.addEventListener('click', openPicker);

fileInput.addEventListener('change', (e) => loadFile(e.target.files[0]));
ratioRange.addEventListener('input', (e) => setRatio(e.target.value));

presetButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    setRatio(btn.dataset.ratio);
    animateElement(btn, { scale: [1, 1.04, 1], duration: 260, ease: 'inOut(3)' });
  });
});

motionPresetButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    setMotionMode(btn.dataset.motion);
    animateElement(btn, { scale: [1, 1.04, 1], duration: 260, ease: 'inOut(3)' });
  });
});

stiffnessRange.addEventListener('input', (e) => {
  springStiffness = Number(e.target.value);
  motionPresetValue.textContent = 'Custom';
  motionPresetButtons.forEach((btn) => btn.classList.remove('active'));
});

dampingRange.addEventListener('input', (e) => {
  springDamping = Number(e.target.value);
  motionPresetValue.textContent = 'Custom';
  motionPresetButtons.forEach((btn) => btn.classList.remove('active'));
});

downloadBtn.addEventListener('click', () => {
  if (!sourceImage) return;

  const mime = formatSelect.value;
  const ext = mime.split('/')[1] === 'jpeg' ? 'jpg' : mime.split('/')[1];
  const a = document.createElement('a');
  a.href = canvas.toDataURL(mime, 0.95);
  a.download = `desqueezed-${currentRatio.toFixed(2)}x.${ext}`;
  a.click();

  animateElement(downloadBtn, { scale: [1, 1.03, 1], duration: 240, ease: 'inOut(3)' });
});

['dragenter', 'dragover'].forEach((eventName) => {
  dropzone.addEventListener(eventName, (e) => {
    e.preventDefault();
    dropzone.classList.add('drag');
  });
});

['dragleave', 'drop'].forEach((eventName) => {
  dropzone.addEventListener(eventName, (e) => {
    e.preventDefault();
    dropzone.classList.remove('drag');
  });
});

dropzone.addEventListener('drop', (e) => loadFile(e.dataTransfer.files[0]));
dropzone.addEventListener('click', openPicker);
dropzone.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    openPicker();
  }
});

animateElement('.topbar', { opacity: [0, 1], translateY: [-8, 0], duration: 420 });
animateElement('.dropzone', { opacity: [0, 1], scale: [0.98, 1], delay: 80, duration: 500 });
syncUIRatio();
syncMotionUI();
