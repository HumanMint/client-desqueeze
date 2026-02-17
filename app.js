const fileInput = document.getElementById('fileInput');
const dropzone = document.getElementById('dropzone');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const ratioRange = document.getElementById('ratioRange');
const ratioValue = document.getElementById('ratioValue');
const presetButtons = Array.from(document.querySelectorAll('.preset'));
const downloadBtn = document.getElementById('downloadBtn');
const formatSelect = document.getElementById('formatSelect');
const meta = document.getElementById('meta');

let sourceImage = null;
let currentRatio = Number(ratioRange.value);

function setRatio(value) {
  currentRatio = Number(value);
  ratioRange.value = currentRatio.toFixed(2);
  ratioValue.textContent = currentRatio.toFixed(2);

  presetButtons.forEach((btn) => {
    const on = Number(btn.dataset.ratio).toFixed(2) === currentRatio.toFixed(2);
    btn.classList.toggle('active', on);
  });

  render();
}

function updateMeta() {
  if (!sourceImage) {
    meta.hidden = true;
    return;
  }

  const outW = Math.round(sourceImage.naturalWidth * currentRatio);
  const outH = sourceImage.naturalHeight;
  meta.textContent = `Input: ${sourceImage.naturalWidth}×${sourceImage.naturalHeight} → Output: ${outW}×${outH}`;
  meta.hidden = false;
}

function render() {
  if (!sourceImage) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    updateMeta();
    return;
  }

  const outW = Math.round(sourceImage.naturalWidth * currentRatio);
  const outH = sourceImage.naturalHeight;

  canvas.width = outW;
  canvas.height = outH;
  ctx.clearRect(0, 0, outW, outH);
  ctx.drawImage(sourceImage, 0, 0, outW, outH);

  downloadBtn.disabled = false;
  updateMeta();
}

function loadFile(file) {
  if (!file || !file.type.startsWith('image/')) return;

  const img = new Image();
  img.onload = () => {
    sourceImage = img;
    render();
  };
  img.src = URL.createObjectURL(file);
}

fileInput.addEventListener('change', (e) => {
  loadFile(e.target.files[0]);
});

ratioRange.addEventListener('input', (e) => {
  setRatio(e.target.value);
});

presetButtons.forEach((btn) => {
  btn.addEventListener('click', () => setRatio(btn.dataset.ratio));
});

downloadBtn.addEventListener('click', () => {
  if (!sourceImage) return;

  const mime = formatSelect.value;
  const ext = mime.split('/')[1] === 'jpeg' ? 'jpg' : mime.split('/')[1];
  const a = document.createElement('a');
  a.href = canvas.toDataURL(mime, 0.95);
  a.download = `desqueezed-${currentRatio.toFixed(2)}x.${ext}`;
  a.click();
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

dropzone.addEventListener('drop', (e) => {
  const file = e.dataTransfer.files[0];
  loadFile(file);
});

dropzone.addEventListener('click', () => fileInput.click());
dropzone.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    fileInput.click();
  }
});

setRatio(currentRatio);
