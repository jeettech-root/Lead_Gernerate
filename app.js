const heroFrame = "assets/frames/frame_00000.jpg";

const canvas = document.querySelector("#heroCanvas");
const context = canvas.getContext("2d");
const heroImage = new Image();
heroImage.src = heroFrame;

function sizeCanvas() {
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.floor(canvas.clientWidth * pixelRatio);
  const height = Math.floor(canvas.clientHeight * pixelRatio);

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  drawHeroFrame();
}

function drawHeroFrame() {
  if (!heroImage.complete) {
    heroImage.onload = drawHeroFrame;
    return;
  }

  const canvasRatio = canvas.width / canvas.height;
  const imageRatio = heroImage.width / heroImage.height;
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
  context.drawImage(heroImage, offsetX, offsetY, drawWidth, drawHeight);
}

function prepareRevealAnimations() {
  const revealGroups = document.querySelectorAll(
    "h1, h2, h3, p, .hero-actions, .hero-panel, .system-card, .testimonial-card, .metric-list > div, .lead-form",
  );

  revealGroups.forEach((element) => {
    element.classList.add("reveal");
  });

  document
    .querySelectorAll(".system-grid, .testimonial-grid, .metric-list")
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
document.querySelector(".lead-form").addEventListener("submit", handleLeadSubmit);

prepareRevealAnimations();
createRevealObserver();
createCounterObserver();
sizeCanvas();
