(() => {
  const canvas = document.querySelector("#scratch-layer");
  const prompt = document.querySelector("#prompt");
  const status = document.querySelector("#status");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  let drawing = false;
  let revealed = false;
  let lastPoint = null;
  let strokes = 0;
  let promptTimer;

  function sizeCanvas() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    if (!revealed) paintScratchSurface(width, height);
  }

  function paintScratchSurface(width, height) {
    ctx.globalCompositeOperation = "source-over";
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#ffca57");
    gradient.addColorStop(.35, "#ff8b61");
    gradient.addColorStop(.7, "#ff5f78");
    gradient.addColorStop(1, "#b24ed6");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Subtle flecks make the coating feel tactile without external assets.
    const flecks = Math.min(900, Math.floor((width * height) / 900));
    for (let i = 0; i < flecks; i += 1) {
      const light = Math.random() > .5;
      ctx.fillStyle = light ? "rgba(255,255,255,.12)" : "rgba(53,25,76,.08)";
      const radius = Math.random() * 1.7 + .3;
      ctx.beginPath();
      ctx.arc(Math.random() * width, Math.random() * height, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function pointFromEvent(event) {
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function scratch(from, to) {
    const shortestSide = Math.min(window.innerWidth, window.innerHeight);
    const brushSize = Math.max(42, Math.min(74, shortestSide * .14));

    ctx.globalCompositeOperation = "destination-out";
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  }

  function startDrawing(event) {
    if (revealed) return;
    drawing = true;
    lastPoint = pointFromEvent(event);
    canvas.setPointerCapture(event.pointerId);
    prompt.classList.add("is-hidden");
    window.clearTimeout(promptTimer);
    scratch(lastPoint, lastPoint);
  }

  function moveDrawing(event) {
    if (!drawing || revealed) return;
    const nextPoint = pointFromEvent(event);
    scratch(lastPoint, nextPoint);
    lastPoint = nextPoint;
    strokes += 1;
  }

  function stopDrawing() {
    if (!drawing) return;
    drawing = false;
    lastPoint = null;
    if (strokes > 3) checkRevealProgress();
  }

  function checkRevealProgress() {
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let transparent = 0;
    let sampled = 0;

    // Sampling every 48th pixel keeps this quick even on high-density screens.
    for (let i = 3; i < pixels.length; i += 48 * 4) {
      sampled += 1;
      if (pixels[i] < 80) transparent += 1;
    }

    if (transparent / sampled > .42) revealPrize();
  }

  function revealPrize() {
    if (revealed) return;
    revealed = true;
    drawing = false;
    prompt.classList.add("is-hidden");
    canvas.classList.add("is-revealed");
    status.textContent = "Your birthday surprise has been revealed!";
  }

  canvas.addEventListener("pointerdown", startDrawing);
  canvas.addEventListener("pointermove", moveDrawing);
  canvas.addEventListener("pointerup", stopDrawing);
  canvas.addEventListener("pointercancel", stopDrawing);
  canvas.addEventListener("lostpointercapture", stopDrawing);
  canvas.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      revealPrize();
    }
  });

  window.addEventListener("resize", sizeCanvas);
  sizeCanvas();

  promptTimer = window.setTimeout(() => prompt.classList.add("is-hidden"), 4800);
})();
