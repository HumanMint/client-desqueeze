const video = document.getElementById('video');
const overlay = document.getElementById('overlay');
const ctx = overlay.getContext('2d');

const startBtn = document.getElementById('startBtn');
const flipBtn = document.getElementById('flipBtn');
const fsBtn = document.getElementById('fsBtn');
const ratioSelect = document.getElementById('ratioSelect');
const overlaySelect = document.getElementById('overlaySelect');
const opacityRange = document.getElementById('opacityRange');
const statusEl = document.getElementById('status');

let stream;
let facingMode = 'environment';

const ratioMap = {
  '16:9': 16 / 9,
  '2:1': 2 / 1,
  '4:3': 4 / 3,
  '2.39:1': 2.39,
  '1:1': 1,
  '9:16': 9 / 16,
};

function setStatus(msg) {
  statusEl.textContent = msg;
}

function resizeCanvas() {
  overlay.width = overlay.clientWidth * window.devicePixelRatio;
  overlay.height = overlay.clientHeight * window.devicePixelRatio;
  drawOverlay();
}

function getFrameRect(containerW, containerH, targetRatio) {
  const containerRatio = containerW / containerH;
  let w, h;
  if (containerRatio > targetRatio) {
    h = containerH;
    w = h * targetRatio;
  } else {
    w = containerW;
    h = w / targetRatio;
  }
  const x = (containerW - w) / 2;
  const y = (containerH - h) / 2;
  return { x, y, w, h };
}

function drawOverlay() {
  const dpr = window.devicePixelRatio;
  const w = overlay.width;
  const h = overlay.height;
  ctx.clearRect(0, 0, w, h);

  const target = ratioMap[ratioSelect.value] || 16 / 9;
  const rect = getFrameRect(w, h, target);

  const matteOpacity = Number(opacityRange.value);

  if (overlaySelect.value === 'matte') {
    ctx.fillStyle = `rgba(0,0,0,${matteOpacity})`;
    ctx.fillRect(0, 0, w, rect.y);
    ctx.fillRect(0, rect.y + rect.h, w, h - (rect.y + rect.h));
    ctx.fillRect(0, rect.y, rect.x, rect.h);
    ctx.fillRect(rect.x + rect.w, rect.y, w - (rect.x + rect.w), rect.h);
  }

  ctx.strokeStyle = 'rgba(255,255,255,0.92)';
  ctx.lineWidth = 2 * dpr;
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);

  // center guides
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.lineWidth = 1 * dpr;
  ctx.beginPath();
  ctx.moveTo(rect.x + rect.w / 2, rect.y);
  ctx.lineTo(rect.x + rect.w / 2, rect.y + rect.h);
  ctx.moveTo(rect.x, rect.y + rect.h / 2);
  ctx.lineTo(rect.x + rect.w, rect.y + rect.h / 2);
  ctx.stroke();

  // rule-of-thirds
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath();
  ctx.moveTo(rect.x + rect.w / 3, rect.y);
  ctx.lineTo(rect.x + rect.w / 3, rect.y + rect.h);
  ctx.moveTo(rect.x + (2 * rect.w) / 3, rect.y);
  ctx.lineTo(rect.x + (2 * rect.w) / 3, rect.y + rect.h);
  ctx.moveTo(rect.x, rect.y + rect.h / 3);
  ctx.lineTo(rect.x + rect.w, rect.y + rect.h / 3);
  ctx.moveTo(rect.x, rect.y + (2 * rect.h) / 3);
  ctx.lineTo(rect.x + rect.w, rect.y + (2 * rect.h) / 3);
  ctx.stroke();
}

async function stopStream() {
  if (!stream) return;
  stream.getTracks().forEach((t) => t.stop());
  stream = null;
}

async function startCamera() {
  try {
    await stopStream();
    stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode,
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
    });
    video.srcObject = stream;
    await video.play();
    setStatus(`Live • ${ratioSelect.value} • ${facingMode === 'environment' ? 'Rear' : 'Front'} cam`);
    startBtn.textContent = 'Restart Camera';
    resizeCanvas();
  } catch (err) {
    setStatus('Camera access failed. Check browser permissions/HTTPS.');
    console.error(err);
  }
}

startBtn.addEventListener('click', startCamera);
flipBtn.addEventListener('click', async () => {
  facingMode = facingMode === 'environment' ? 'user' : 'environment';
  await startCamera();
});

fsBtn.addEventListener('click', async () => {
  const el = document.documentElement;
  if (!document.fullscreenElement) {
    await el.requestFullscreen?.();
  } else {
    await document.exitFullscreen?.();
  }
  resizeCanvas();
});

[ratioSelect, overlaySelect, opacityRange].forEach((el) => {
  el.addEventListener('input', () => {
    drawOverlay();
    if (stream) setStatus(`Live • ${ratioSelect.value} • ${facingMode === 'environment' ? 'Rear' : 'Front'} cam`);
  });
});

window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 150));
video.addEventListener('loadedmetadata', resizeCanvas);

resizeCanvas();
