const frameCount = 480;
const framePath = (index) =>
  `assets/frames/frame_${String(index).padStart(5, "0")}.jpg`;

const canvas = document.querySelector("#heroCanvas");
const context = canvas.getContext("2d");
const images = new Array(frameCount);
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const mobileViewport = window.matchMedia("(max-width: 820px)").matches;
const preloadRadius = mobileViewport ? 8 : 16;
const idleBatchSize = mobileViewport ? 2 : 5;
const queuedFrames = new Set();
const preloadQueue = [];

let currentFrame = 0;
let targetFrame = 0;
let animationFrame = null;
let idlePreloadFrame = null;
let documentVisible = true;

function loadFrame(index) {
  if (images[index]) {
    return images[index];
  }

  const image = new Image();
  image.decoding = "async";
  image.src = framePath(index);
  images[index] = image;
  return image;
}

function enqueueFrame(index) {
  if (
    index < 0 ||
    index >= frameCount ||
    images[index] ||
    queuedFrames.has(index)
  ) {
    return;
  }

  queuedFrames.add(index);
  preloadQueue.push(index);
}

function preloadAround(index) {
  for (let offset = 0; offset <= preloadRadius; offset += 1) {
    enqueueFrame(index - offset);
    enqueueFrame(index + offset);
  }

  scheduleIdlePreload();
}

function scheduleIdlePreload() {
  if (idlePreloadFrame || !preloadQueue.length || !documentVisible) {
    return;
  }

  const run = (deadline) => {
    idlePreloadFrame = null;
    let loaded = 0;

    while (
      preloadQueue.length &&
      (loaded < idleBatchSize || (deadline && deadline.timeRemaining() > 8))
    ) {
      const index = preloadQueue.shift();
      queuedFrames.delete(index);
      loadFrame(index);
      loaded += 1;
    }

    if (preloadQueue.length) {
      scheduleIdlePreload();
    }
  };

  if (window.requestIdleCallback) {
    idlePreloadFrame = window.requestIdleCallback(run, { timeout: 600 });
  } else {
    idlePreloadFrame = window.setTimeout(run, 48);
  }
}

function preloadFrames() {
  loadFrame(0);
  loadFrame(frameCount - 1);
  preloadAround(0);

  const keyframeStep = mobileViewport ? 18 : 10;
  for (let i = keyframeStep; i < frameCount - 1; i += keyframeStep) {
    enqueueFrame(i);
  }

  if (!mobileViewport) {
    for (let i = 1; i < frameCount - 1; i += 1) {
      enqueueFrame(i);
    }
  }

  scheduleIdlePreload();
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
  if (!documentVisible) {
    return;
  }

  const scrollableDistance =
    document.documentElement.scrollHeight - window.innerHeight;
  const progress = Math.min(
    Math.max(window.scrollY / Math.max(scrollableDistance, 1), 0),
    1,
  );

  targetFrame = Math.round(progress * (frameCount - 1));
  preloadAround(targetFrame);

  if (!animationFrame) {
    animationFrame = window.requestAnimationFrame(render);
  }
}

function render() {
  animationFrame = null;

  if (currentFrame !== targetFrame && documentVisible) {
    const frameDifference = targetFrame - currentFrame;
    const maxStep = reduceMotion
      ? Math.abs(frameDifference)
      : Math.max(1, Math.ceil(Math.abs(frameDifference) / (mobileViewport ? 18 : 26)));

    currentFrame +=
      Math.sign(frameDifference) * Math.min(Math.abs(frameDifference), maxStep);
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

function prepareRevealAnimations() {
  const revealGroups = document.querySelectorAll(
    "h1, h2, h3, p, .hero-actions, .hero-panel, .trust-strip, .section-heading, .two-column > *, .savings-copy, .quote-layout > div, .system-card, .testimonial-card, .trust-card, .faq-card, .section-cta, .savings-cta, .metric-list > div, .lead-form",
  );

  revealGroups.forEach((element) => {
    element.classList.add("reveal");
  });

  document
    .querySelectorAll(".system-grid, .testimonial-grid, .trust-grid, .faq-list, .metric-list")
    .forEach((group) => {
      [...group.children].forEach((child, index) => {
        child.style.setProperty("--reveal-delay", `${index * 120}ms`);
      });
    });
}

function createRevealObserver() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.18,
      rootMargin: "0px 0px -8% 0px",
    },
  );

  document.querySelectorAll(".reveal").forEach((element) => {
    observer.observe(element);
  });
}

function animateValue(element) {
  if (element.dataset.counted === "true") {
    return;
  }

  element.dataset.counted = "true";
  const target = Number(element.dataset.countTarget);
  const prefix = element.dataset.countPrefix || "";
  const suffix = element.dataset.countSuffix || "";
  const decimals = Number(element.dataset.countDecimals || 0);
  const duration = 900;
  const start = performance.now();
  const formatter = new Intl.NumberFormat("en-AU");

  const tick = (time) => {
    const progress = Math.min((time - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = target * eased;

    element.textContent = `${prefix}${formatter.format(Number(value.toFixed(decimals)))}${suffix}`;

    if (progress < 1) {
      window.requestAnimationFrame(tick);
    }
  };

  window.requestAnimationFrame(tick);
}

function createCounterObserver() {
  const counters = document.querySelectorAll("[data-count-target]");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        animateValue(entry.target);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.55 },
  );

  counters.forEach((counter) => observer.observe(counter));
}

function handleLeadSubmit(event) {
  event.preventDefault();
  const button = event.currentTarget.querySelector("button");
  button.textContent = "Thanks, we will be in touch";
  button.disabled = true;
}

window.addEventListener("resize", sizeCanvas);
window.addEventListener("scroll", updateTargetFrame, { passive: true });
document.addEventListener("visibilitychange", () => {
  documentVisible = !document.hidden;

  if (documentVisible) {
    updateTargetFrame();
    scheduleIdlePreload();
  }
});
document.querySelector(".lead-form").addEventListener("submit", handleLeadSubmit);

preloadFrames();
prepareRevealAnimations();
createRevealObserver();
createCounterObserver();
sizeCanvas();
updateTargetFrame();
