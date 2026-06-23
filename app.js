const frameCount = 480;
const framePath = (index) =>
  `assets/frames/frame_${String(index).padStart(5, "0")}.jpg`;

const canvas = document.querySelector("#heroCanvas");
const context = canvas.getContext("2d");
const hero = document.querySelector("#hero");
const images = new Array(frameCount);

let currentFrame = 0;
let targetFrame = 0;
let animationFrame = null;

function loadFrame(index) {
  if (images[index]) {
    return images[index];
  }

  const image = new Image();
  image.src = framePath(index);
  images[index] = image;
  return image;
}

function preloadFrames() {
  loadFrame(0);
  loadFrame(frameCount - 1);

  const queue = [];
  for (let i = 1; i < frameCount - 1; i += 1) {
    queue.push(i);
  }

  const warmup = () => {
    const batch = queue.splice(0, 8);
    batch.forEach(loadFrame);

    if (queue.length) {
      window.requestIdleCallback
        ? window.requestIdleCallback(warmup, { timeout: 400 })
        : window.setTimeout(warmup, 24);
    }
  };

  warmup();
}

function sizeCanvas() {
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.floor(canvas.clientWidth * pixelRatio);
  const height = Math.floor(canvas.clientHeight * pixelRatio);

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  drawFrame(currentFrame);
}

function drawFrame(index) {
  const image = loadFrame(index);

  if (!image.complete) {
    image.onload = () => drawFrame(index);
    return;
  }

  const canvasRatio = canvas.width / canvas.height;
  const imageRatio = image.width / image.height;
  let drawWidth = canvas.width;
  let drawHeight = canvas.height;
  let offsetX = 0;
  let offsetY = 0;

  if (imageRatio > canvasRatio) {
    drawHeight = canvas.height;
    drawWidth = drawHeight * imageRatio;
    offsetX = (canvas.width - drawWidth) / 2;
  } else {
    drawWidth = canvas.width;
    drawHeight = drawWidth / imageRatio;
    offsetY = (canvas.height - drawHeight) / 2;
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
}

function updateTargetFrame() {
  const rect = hero.getBoundingClientRect();
  const scrollableDistance = rect.height - window.innerHeight;
  const progress = Math.min(Math.max(-rect.top / scrollableDistance, 0), 1);

  targetFrame = Math.round(progress * (frameCount - 1));

  if (!animationFrame) {
    animationFrame = window.requestAnimationFrame(render);
  }
}

function render() {
  animationFrame = null;

  if (currentFrame !== targetFrame) {
    currentFrame += Math.sign(targetFrame - currentFrame);
    drawFrame(currentFrame);

    const nextFrame = currentFrame + Math.sign(targetFrame - currentFrame);
    if (nextFrame >= 0 && nextFrame < frameCount) {
      loadFrame(nextFrame);
    }

    if (currentFrame !== targetFrame) {
      animationFrame = window.requestAnimationFrame(render);
    }
  }
}

function handleLeadSubmit(event) {
  event.preventDefault();
  const button = event.currentTarget.querySelector("button");
  button.textContent = "Thanks, we will be in touch";
  button.disabled = true;
}

window.addEventListener("resize", sizeCanvas);
window.addEventListener("scroll", updateTargetFrame, { passive: true });
document.querySelector(".lead-form").addEventListener("submit", handleLeadSubmit);

preloadFrames();
sizeCanvas();
updateTargetFrame();
