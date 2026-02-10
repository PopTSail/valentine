const photos = [
  'IMG_2036.JPG',
  'IMG_2038.JPG',
  'IMG_2152.JPG',
  'IMG_2170.JPG',
  'IMG_3578.JPG',
  'IMG_3582.JPG',
  'IMG_9133.JPG',
  'IMG_9135.JPG',
  'photo_1_2026-02-10_14-14-30.jpg',
  'photo_2_2026-02-10_14-14-30.jpg',
  'photo_3_2026-02-10_14-14-30.jpg',
  'photo_4_2026-02-10_14-14-30.jpg',
  'photo_5_2026-02-10_14-14-30.jpg',
  'photo_6_2026-02-10_14-14-30.jpg',
  'photo_7_2026-02-10_14-14-30.jpg',
  'photo_8_2026-02-10_14-14-30.jpg',
  'photo_9_2026-02-10_14-14-30.jpg',
  'photo_10_2026-02-10_14-14-30.jpg',
  'photo_11_2026-02-10_14-14-30.jpg',
  'photo_12_2026-02-10_14-14-30.jpg',
  'photo_13_2026-02-10_14-14-30.jpg',
  'photo_14_2026-02-10_14-14-30.jpg',
  'photo_15_2026-02-10_14-14-30.jpg',
  'photo_16_2026-02-10_14-14-30.jpg',
  'photo_17_2026-02-10_14-14-30.jpg',
  'photo_18_2026-02-10_14-14-30.jpg',
  'photo_19_2026-02-10_14-14-30.jpg',
  'безымянный (29 из 148)_resized.jpg',
  'безымянный (48 из 148)_resized.jpg',
  'безымянный (49 из 148)_resized.jpg',
];

function isLikelySupportedImage(filename) {
  const lower = filename.toLowerCase();
  return (
    lower.endsWith('.jpg') ||
    lower.endsWith('.jpeg') ||
    lower.endsWith('.png') ||
    lower.endsWith('.webp') ||
    lower.endsWith('.gif')
  );
}

function buildGallery() {
  const root = document.getElementById('gallery');
  root.innerHTML = '';

  const list = photos.filter(isLikelySupportedImage);

  for (const name of list) {
    const card = document.createElement('article');
    card.className = 'photoCard';

    const img = document.createElement('img');
    img.className = 'photo';
    img.loading = 'lazy';
    img.alt = '';
    img.src = encodeURI(`photo/${name}`);

    img.addEventListener(
      'error',
      () => {
        // Если файл не открывается (часто HEIC), просто убираем карточку.
        card.remove();
      },
      { once: true },
    );

    const shade = document.createElement('div');
    shade.className = 'photoShade';

    card.appendChild(img);
    card.appendChild(shade);
    root.appendChild(card);
  }
}

function setupScrollReveal() {
  const cards = Array.from(document.querySelectorAll('.photoCard'));
  const scrollRoot = document.getElementById('scrollRoot');

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const el = entry.target;
        if (entry.isIntersecting) {
          el.classList.add('isVisible');
          el.classList.remove('isHidden');
        } else {
          // Когда уходит с экрана — скрываем обратно
          if (el.classList.contains('isVisible')) {
            el.classList.add('isHidden');
            el.classList.remove('isVisible');
          }
        }
      }
    },
    {
      threshold: 0.18,
      rootMargin: '-10% 0px -10% 0px',
      root: scrollRoot || null,
    },
  );

  for (const card of cards) observer.observe(card);
}

function setupMusic() {
  const toggle = document.getElementById('musicToggle');
  const audio = document.getElementById('bgm');
  if (!toggle || !audio) return;

  let started = false;

  function setLabel() {
    if (audio.error) {
      toggle.textContent = 'Добавь music/music.mp3';
      return;
    }
    toggle.textContent = audio.paused ? 'Включить музыку' : 'Выключить музыку';
  }

  audio.addEventListener('error', setLabel);
  audio.addEventListener('play', setLabel);
  audio.addEventListener('pause', setLabel);
  setLabel();

  async function tryStart() {
    try {
      await audio.play();
      started = true;
      setLabel();
    } catch {
      // Браузеры часто блокируют автозапуск со звуком.
      // Оставляем кнопку — пользователь сможет включить вручную.
      setLabel();
    }
  }

  toggle.addEventListener('click', async () => {
    try {
      if (audio.paused) {
        await audio.play();
        started = true;
      } else {
        audio.pause();
      }
    } catch {
      toggle.textContent = 'Нажми ещё раз (или добавь файл)';
    }
  });

  document.addEventListener(
    'pointerdown',
    async () => {
      if (!started || !audio.paused) return;
      try {
        await audio.play();
      } catch {
        // игнор
      }
    },
    { once: true },
  );

  // Пытаемся запустить музыку сразу при открытии.
  // Если браузер заблокирует — включится по кнопке или по первому клику по странице.
  tryStart();
}

function rectsOverlap(a, b) {
  return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
}

function setupNoButton() {
  const noBtn = document.getElementById('noBtn');
  const yesBtn = document.getElementById('yesBtn');
  const hint = document.getElementById('noHint');
  const wrap = document.getElementById('buttonsWrap');

  let jumpCount = 0;
  let locked = false;
  let jumpsDisabled = false;
  let primed = false;

  let originalOffset = { left: 0, top: 0 };

  const original = {
    position: noBtn.style.position,
    left: noBtn.style.left,
    top: noBtn.style.top,
    zIndex: noBtn.style.zIndex,
    transition: noBtn.style.transition,
    transform: noBtn.style.transform,
    willChange: noBtn.style.willChange,
  };

  function restoreNoButton() {
    noBtn.style.position = original.position;
    noBtn.style.left = original.left;
    noBtn.style.top = original.top;
    noBtn.style.zIndex = original.zIndex;
    noBtn.style.transition = original.transition;
    noBtn.style.transform = original.transform;
    noBtn.style.willChange = original.willChange;
  }

  function jump() {
    if (locked || jumpsDisabled) return;

    jumpCount += 1;

    const wrapRect = wrap.getBoundingClientRect();
    const yesRect = yesBtn.getBoundingClientRect();
    const noRect = noBtn.getBoundingClientRect();

    const padding = 14;
    const w = Math.ceil(noRect.width);
    const h = Math.ceil(noRect.height);

    if (!primed) {
      // Запоминаем исходную позицию внутри обёртки.
      originalOffset = {
        left: Math.round(noRect.left - wrapRect.left),
        top: Math.round(noRect.top - wrapRect.top),
      };
      primed = true;
    }

    // Важно: не вынимаем кнопку из потока (иначе "Да" съезжает в центр).
    // Прыгаем через transform в пределах рамки.
    noBtn.style.position = original.position;
    noBtn.style.zIndex = '60';
    noBtn.style.transition = 'transform .20s ease';
    noBtn.style.willChange = 'transform';

    // Ищем свободную позицию (не пересекать кнопку Да).
    let chosen = null;
    for (let i = 0; i < 40; i++) {
      const left = Math.floor(
        padding + Math.random() * Math.max(1, wrapRect.width - w - padding * 2),
      );
      const top = Math.floor(
        padding + Math.random() * Math.max(1, wrapRect.height - h - padding * 2),
      );

      const candidate = {
        left: wrapRect.left + left,
        top: wrapRect.top + top,
        right: wrapRect.left + left + w,
        bottom: wrapRect.top + top + h,
      };

      const expandedYes = {
        left: yesRect.left - 22,
        top: yesRect.top - 18,
        right: yesRect.right + 22,
        bottom: yesRect.bottom + 18,
      };

      if (!rectsOverlap(candidate, expandedYes)) {
        chosen = { left, top };
        break;
      }
    }

    if (!chosen) {
      chosen = { left: padding, top: padding };
    }

    const dx = Math.round(chosen.left - originalOffset.left);
    const dy = Math.round(chosen.top - originalOffset.top);
    noBtn.style.transform = `translate(${dx}px, ${dy}px)`;

    if (jumpCount >= 5) {
      // После 5 прыжков — вернуть на исходное место и больше не прыгать.
      locked = true;
      setTimeout(() => {
        jumpsDisabled = true;
        noBtn.style.transform = 'translate(0px, 0px)';
        restoreNoButton();
        locked = false;
      }, 260);
    }
  }

  noBtn.addEventListener('mouseenter', () => {
    if (jumpCount < 5) jump();
  });

  noBtn.addEventListener('click', (e) => {
    e.preventDefault();
    hint.textContent = 'Ага, щас, давай кликай Да';
  });
}

function setupYesButton() {
  const yesBtn = document.getElementById('yesBtn');
  const noBtn = document.getElementById('noBtn');
  const hint = document.getElementById('noHint');
  const final = document.getElementById('finalMsg');

  const canvas = document.getElementById('fx');
  const ctx = canvas.getContext('2d', { alpha: true });

  let raf = null;
  let particles = [];
  let running = false;

  function resize() {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  window.addEventListener('resize', resize);
  resize();

  function spawnBurst(x, y) {
    const count = 220;
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const speed = 4.0 + Math.random() * 7.8;
      const isHeart = Math.random() < 0.55;

      particles.push({
        x,
        y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed - (2.0 + Math.random() * 3.2),
        life: 95 + Math.floor(Math.random() * 65),
        age: 0,
        size: 5 + Math.random() * 11,
        hue: 315 + Math.random() * 55,
        heart: isHeart,
        spin: (Math.random() - 0.5) * 0.33,
        rot: Math.random() * Math.PI * 2,
      });
    }
  }

  function drawHeart(x, y, size, rot, color, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();

    const s = size;
    // Простая сердечко-форма через кривые
    ctx.moveTo(0, s * 0.35);
    ctx.bezierCurveTo(s * 0.6, -s * 0.2, s * 1.1, s * 0.5, 0, s * 1.2);
    ctx.bezierCurveTo(-s * 1.1, s * 0.5, -s * 0.6, -s * 0.2, 0, s * 0.35);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles = particles.filter((p) => p.age < p.life);

    for (const p of particles) {
      p.age += 1;
      p.vy += 0.06; // гравитация
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.989;
      p.vy *= 0.989;
      p.rot += p.spin;

      const t = p.age / p.life;
      const alpha = Math.max(0, 1 - t);

      const color = `hsla(${p.hue}, 98%, 64%, 1)`;

      if (p.heart) {
        drawHeart(p.x, p.y, p.size, p.rot, color, alpha);
      } else {
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1, p.size * 0.45), 0, Math.PI * 2);
        ctx.fill();

        // маленькая "искра"-линия
        ctx.globalAlpha = alpha * 0.95;
        ctx.strokeStyle = `hsla(${p.hue}, 98%, 70%, 1)`;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 1.45, p.y - p.vy * 1.45);
        ctx.stroke();
      }
    }

    if (running) {
      raf = requestAnimationFrame(tick);
    }
  }

  function playFx(originEl) {
    const r = originEl.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Большой основной салют + дополнительные вспышки по экрану.
    spawnBurst(x, y);
    spawnBurst(x + 170, y - 55);
    spawnBurst(x - 170, y - 55);
    spawnBurst(vw * 0.18, vh * 0.3);
    spawnBurst(vw * 0.82, vh * 0.3);
    spawnBurst(vw * 0.5, vh * 0.18);

    running = true;
    if (!raf) tick();

    // Небольшая "досыпка" частиц, чтобы выглядело масштабнее.
    const sprinkleStart = performance.now();
    const sprinkle = () => {
      if (!running) return;
      const t = performance.now() - sprinkleStart;
      if (t > 900) return;
      spawnBurst(vw * (0.18 + Math.random() * 0.64), vh * (0.1 + Math.random() * 0.42));
      requestAnimationFrame(sprinkle);
    };
    requestAnimationFrame(sprinkle);

    setTimeout(() => {
      running = false;
      if (raf) {
        cancelAnimationFrame(raf);
        raf = null;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles = [];
    }, 3200);
  }

  yesBtn.addEventListener('click', () => {
    hint.textContent = '';
    final.textContent = 'Ура! Я тебя очень сильно люблю!!!';

    // На всякий: остановить "Нет" в fixed-позиции.
    noBtn.style.position = '';
    noBtn.style.left = '';
    noBtn.style.top = '';
    noBtn.style.zIndex = '';
    noBtn.style.transition = '';

    playFx(yesBtn);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  buildGallery();
  setupScrollReveal();
  setupNoButton();
  setupYesButton();
  setupMusic();
});
