document.addEventListener('DOMContentLoaded', () => {

    const triggerOverlay = document.getElementById('triggerOverlay');
    const startButton = document.getElementById('startButton');
    const loadingBar = document.getElementById('loadingBar');
    const statusText = document.getElementById('statusText');
    const ambientLight = document.getElementById('ambientLight');
    const stage = document.getElementById('stage');
    const endText = document.getElementById('endText');
    const fallingPetalsEl = document.getElementById('fallingPetals');
    const firefliesEl = document.getElementById('fireflies');

    const PETAL_LAYERS = [
        { count: 3, w: 24, h: 46, curl: 78, delayBase: 0, tz: 2, cls: 'petal-bud' },
        { count: 4, w: 34, h: 58, curl: 65, delayBase: 0.25, tz: 9, cls: 'petal-core' },
        { count: 5, w: 46, h: 72, curl: 48, delayBase: 0.55, tz: 18, cls: 'petal-inner' },
        { count: 6, w: 58, h: 88, curl: 22, delayBase: 0.90, tz: 30, cls: 'petal-mid-inner' },
        { count: 7, w: 72, h: 104, curl: -5, delayBase: 1.30, tz: 44, cls: 'petal-mid' },
        { count: 8, w: 86, h: 118, curl: -25, delayBase: 1.75, tz: 60, cls: 'petal-outer' },
        { count: 9, w: 98, h: 130, curl: -48, delayBase: 2.25, tz: 76, cls: 'petal-blush' },
    ];
    const SEPALS_COUNT = 5;

    // [hue, saturation %, lightness multiplier]
    const PALETTE = [
        [350, 100, 1.0],  // deep red
        [338, 85, 1.9],   // pink
        [8, 95, 1.4],     // coral
        [26, 95, 1.9],    // peach
        [285, 55, 1.8],   // lavender
        [48, 95, 1.5],    // golden yellow
        [40, 30, 2.7],    // cream white
    ];

    // teal leaf colour sets  [light, mid, dark]
    const LEAF_COLOURS = [
        ['#5cf0d6', '#1f9d94', '#093b3e'],
        ['#3fd8c0', '#17877f', '#06302f'],
        ['#7af5c0', '#1f9a74', '#07382e'],
        ['#46c9e0', '#1a7f95', '#08323d'],
    ];

    // x = horizontal spot of the flower head, len = height of the stem tip, size = flower size
    const portrait = innerWidth < 640 || innerHeight > innerWidth * 1.15;
    const LAYOUT = portrait ? {
        worldW: 500, worldH: 740,
        flowers: [
            { x: -150, len: 370, size: 0.44 },
            { x: -75, len: 520, size: 0.46 },
            { x: 0, len: 650, size: 0.52 },
            { x: 75, len: 480, size: 0.46 },
            { x: 150, len: 390, size: 0.42 },
        ]
    } : {
        worldW: 900, worldH: 800,
        flowers: [
            { x: -310, len: 430, size: 0.46 },
            { x: -205, len: 540, size: 0.5 },
            { x: -100, len: 620, size: 0.54 },
            { x: 0, len: 690, size: 0.6 },
            { x: 100, len: 580, size: 0.52 },
            { x: 205, len: 500, size: 0.48 },
            { x: 310, len: 410, size: 0.44 },
        ]
    };

    const SVGNS = 'http://www.w3.org/2000/svg';
    const SVG_W = 1000, SVG_H = 820;
    const rnd = (a, b) => a + Math.random() * (b - a);
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];
    const flowers = [], bushLeaves = [], blades = [];
    let fit = 1;

    const mkLayer = () => { const l = document.createElement('div'); l.className = 'layer'; stage.appendChild(l); return l; };
    const layerGrass = mkLayer();
    const layerBack = mkLayer();
    const svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('class', 'stems');
    svg.setAttribute('viewBox', `0 0 ${SVG_W} ${SVG_H}`);
    stage.appendChild(svg);
    const layerStemLeaves = mkLayer();
    const layerFlowers = mkLayer();
    const layerFront = mkLayer();

    function fitStage() {
        fit = Math.min(1, innerWidth / LAYOUT.worldW, (innerHeight * 0.86) / LAYOUT.worldH);
        stage.style.setProperty('--fit', fit);
    }
    fitStage();
    addEventListener('resize', fitStage);

    function startCardLoader() {
        const duration = 2400;
        const steps = [
            { threshold: 20, text: 'Loading love...' },
            { threshold: 50, text: 'Growing digital petals...' },
            { threshold: 80, text: 'Lighting up the garden...' },
            { threshold: 95, text: 'Catching fireflies...' },
            { threshold: 100, text: 'Ready to bloom!' }
        ];
        let startTimestamp = null;
        function animateLoader(timestamp) {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const percent = Math.floor(progress * 100);
            loadingBar.style.transform = `scaleX(${progress})`;
            const activeStep = steps.find(s => percent <= s.threshold) || steps[steps.length - 1];
            statusText.textContent = activeStep.text;
            if (progress < 1) requestAnimationFrame(animateLoader);
            else startButton.removeAttribute('disabled');
        }
        requestAnimationFrame(animateLoader);
    }

    // ---------- leaves ----------
    // (x, y) = leaf base in stage coords (y measured upward), angle = CSS rotation in degrees
    function makeLeaf(parent, x, y, angle, len, wid, opts = {}) {
        const [c1, c2, c3] = pick(LEAF_COLOURS);
        const leaf = document.createElement('div');
        leaf.className = 'fol' + (Math.random() > 0.5 ? ' flip' : '');
        leaf.style.left = `${x}px`;
        leaf.style.bottom = `${y - wid / 2}px`;
        leaf.style.width = `${len}px`;
        leaf.style.height = `${wid}px`;
        leaf.style.setProperty('--a', `${angle}deg`);
        leaf.style.setProperty('--c1', c1); leaf.style.setProperty('--c2', c2); leaf.style.setProperty('--c3', c3);
        leaf.style.setProperty('--sd', `${rnd(5, 8)}s`); leaf.style.setProperty('--sl', `${-rnd(0, 5)}s`);
        if (opts.o) leaf.style.setProperty('--o', opts.o);
        parent.appendChild(leaf);
        return leaf;
    }

    // bushy base: big fanned leaves like the reference picture
    function buildBush() {
        const count = portrait ? 22 : 30;
        for (let i = 0; i < count; i++) {
            const front = i % 3 === 0;
            const spread = rnd(-78, 78);                       // degrees away from straight up
            const centre = 1 - Math.abs(spread) / 90;
            const len = (front ? 70 : 95) + centre * (portrait ? 95 : 125) + rnd(0, 30);
            const leaf = makeLeaf(front ? layerFront : layerBack, rnd(-26, 26), rnd(-6, 6), -90 + spread, len, len * rnd(0.3, 0.38), { o: front ? 1 : 0.9 });
            bushLeaves.push(leaf);
        }
    }

    // tall grass on both sides
    function buildGrass() {
        const half = innerWidth / 2 / fit;
        const per = portrait ? 8 : 11;
        for (const side of [-1, 1]) {
            for (let i = 0; i < per; i++) {
                const b = document.createElement('div');
                b.className = 'blade';
                const x = side * half * rnd(0.5, 0.97);
                b.style.left = `${x}px`;
                b.style.setProperty('--bw', `${rnd(6, 11)}px`);
                b.style.setProperty('--bh', `${rnd(110, 330) * (portrait ? 0.85 : 1)}px`);
                b.style.setProperty('--lean', `${-side * rnd(2, 16) + rnd(-4, 4)}deg`);
                b.style.setProperty('--sd', `${rnd(4, 7)}s`); b.style.setProperty('--sl', `${-rnd(0, 4)}s`);
                layerGrass.appendChild(b);
                blades.push(b);
            }
        }
    }

    // ---------- curved stem + flower ----------
    const bez = (a, b, c, d, t) => { const m = 1 - t; return m * m * m * a + 3 * m * m * t * b + 3 * m * t * t * c + t * t * t * d; };
    const dbez = (a, b, c, d, t) => { const m = 1 - t; return 3 * m * m * (b - a) + 6 * m * t * (c - b) + 3 * t * t * (d - c); };

    function buildFlower(cfg) {
        const { x0, hx, len, k } = cfg;
        // S-shaped cubic curve, in stage coordinates (y up)
        const P = [
            [x0, 0],
            [x0 + (hx - x0) * 0.12 + k, len * 0.35],
            [hx - k * 0.9, len * 0.72],
            [hx, len],
        ];
        const d = `M${P[0][0] + 500} ${SVG_H} C${P[1][0] + 500} ${SVG_H - P[1][1]} ${P[2][0] + 500} ${SVG_H - P[2][1]} ${P[3][0] + 500} ${SVG_H - P[3][1]}`;
        const paths = ['base', 'hi'].map(c => {
            const p = document.createElementNS(SVGNS, 'path');
            p.setAttribute('d', d);
            p.setAttribute('pathLength', '1');
            p.setAttribute('class', `stem-path ${c}`);
            p.style.setProperty('--stem-dur', `${2.6 / cfg.speed}s`);
            svg.appendChild(p);
            return p;
        });

        // leaves placed along the curve
        const leaves = [];
        [0.16, 0.3, 0.44, 0.58, 0.72].forEach((t, i) => {
            const px = bez(P[0][0], P[1][0], P[2][0], P[3][0], t);
            const py = bez(P[0][1], P[1][1], P[2][1], P[3][1], t);
            const dx = dbez(P[0][0], P[1][0], P[2][0], P[3][0], t);
            const dy = dbez(P[0][1], P[1][1], P[2][1], P[3][1], t);
            const tang = Math.atan2(-dy, dx) * 180 / Math.PI;             // CSS angle (y down)
            const side = i % 2 ? 1 : -1;
            const l = 70 * (1.1 - t * 0.6) * rnd(0.9, 1.15);
            leaves.push({ t, el: makeLeaf(layerStemLeaves, px, py, tang + side * rnd(42, 56), l, l * 0.36) });
        });

        const el = document.createElement('div');
        el.className = 'flower';
        el.innerHTML = `
          <div class="sway">
            <div class="halo"></div>
            <div class="head-holder"><div class="calyx"></div><div class="rose-head"></div></div>
          </div>`;
        const tilt = Math.atan2(k * 0.9, len * 0.28) * 180 / Math.PI;     // follow the curve's end direction
        const set = (n, v) => el.style.setProperty(n, v);
        set('--h', cfg.h); set('--s', `${cfg.s}%`); set('--lb', cfg.lb);
        set('--size', cfg.size); set('--len', `${len}px`); set('--x', `${hx}px`); set('--tilt', `${tilt}deg`);
        set('--sway-dur', `${rnd(5, 8)}s`); set('--sway-delay', `${-rnd(0, 5)}s`);

        const calyx = el.querySelector('.calyx');
        const head = el.querySelector('.rose-head');
        const sp = cfg.speed;

        const step = 360 / SEPALS_COUNT;
        for (let i = 0; i < SEPALS_COUNT; i++) {
            const sepal = document.createElement('div');
            sepal.className = 'sepal';
            sepal.style.setProperty('--sepal-angle', `${i * step + (Math.random() - 0.5) * 5}deg`);
            sepal.style.setProperty('--sepal-curl', `${18 + Math.random() * 8}deg`);
            sepal.style.setProperty('--sepal-delay', `${(0.3 + i * 0.06) / sp}s`);
            calyx.appendChild(sepal);
        }

        const frag = document.createDocumentFragment();
        PETAL_LAYERS.forEach((layer, li) => {
            const angleStep = 360 / layer.count;
            const layerOffset = li * 24 + (Math.random() - 0.5) * 8;
            for (let i = 0; i < layer.count; i++) {
                const petal = document.createElement('div');
                petal.className = `petal ${layer.cls}`;
                petal.style.width = `${layer.w}px`;
                petal.style.height = `${layer.h}px`;
                petal.style.setProperty('--angle', `${layerOffset + i * angleStep + (Math.random() - 0.5) * 5}deg`);
                petal.style.setProperty('--curl', `${layer.curl + (Math.random() - 0.5) * 6}deg`);
                petal.style.setProperty('--scale', 0.94 + Math.random() * 0.12);
                petal.style.setProperty('--delay', `${(layer.delayBase + i * 0.05) / sp}s`);
                petal.style.setProperty('--tz', `${layer.tz}px`);
                petal.style.setProperty('--bloom-dur', `${(2.3 + Math.random() * 0.4) / sp}s`);
                frag.appendChild(petal);
            }
        });
        head.appendChild(frag);
        layerFlowers.appendChild(el);

        return { cfg, paths, leaves, calyx, head, halo: el.querySelector('.halo'), sway: el.querySelector('.sway') };
    }

    function buildGarden() {
        const colours = PALETTE.slice(1).sort(() => Math.random() - 0.5);
        LAYOUT.flowers.forEach((f, i) => {
            const [h, s, lb] = f.x === 0 ? PALETTE[0] : colours[i % colours.length];
            const hx = f.x + rnd(-8, 8);
            flowers.push(buildFlower({
                h, s, lb: lb * rnd(0.95, 1.05),
                hx, x0: hx * 0.1 + rnd(-10, 10),
                len: f.len + rnd(-10, 10),
                size: f.size * rnd(0.94, 1.08),
                k: (i % 2 ? 1 : -1) * rnd(35, 75),          // alternate left / right curves
                speed: rnd(0.85, 1.35),
            }));
        });
    }

    function growFlower(f) {
        const sp = f.cfg.speed;
        const stemMs = 2600 / sp;
        f.paths.forEach(p => p.classList.add('grow'));
        f.leaves.forEach(({ t, el }) => setTimeout(() => { el.classList.add('on'); setTimeout(() => el.classList.add('sw'), 1500); }, stemMs * t * 0.4 + 200));
        setTimeout(() => {
            f.calyx.classList.add('visible');
            f.head.classList.add('blooming');
            f.halo.classList.add('on');
        }, 2300 / sp);
        setTimeout(() => f.sway.classList.add('swaying'), (2300 + 5200) / sp);
    }

    // ---------- fireflies ----------
    function spawnFireflies() {
        const n = portrait ? 14 : 22;
        const cols = ['#fde68a', '#a7f3d0', '#fef3c7', '#99f6e4'];
        for (let i = 0; i < n; i++) {
            const f = document.createElement('div');
            f.className = 'firefly';
            f.style.left = `${rnd(8, 92)}vw`;
            f.style.top = `${rnd(8, 72)}vh`;
            f.style.setProperty('--fs', `${rnd(2, 4.5)}px`);
            f.style.setProperty('--fc', pick(cols));
            f.style.setProperty('--fx', `${rnd(-50, 50)}px`);
            f.style.setProperty('--fy', `${rnd(-70, 30)}px`);
            f.style.setProperty('--fd', `${rnd(6, 12)}s`);
            f.style.setProperty('--fl', `${-rnd(0, 8)}s`);
            firefliesEl.appendChild(f);
        }
    }

    // ---------- falling petals ----------
    function spawnFallingPetal() {
        if (fallingPetalsEl.childElementCount > 8) return;
        const petal = document.createElement('div');
        petal.className = 'falling-petal';
        const w = 10 + Math.random() * 12;
        const dur = 6 + Math.random() * 3.5;
        const dl = Math.random() * 0.6;
        const [h, s, lb] = pick(PALETTE);
        const sign = () => (Math.random() > 0.5 ? 1 : -1);
        const st = (k, v) => petal.style.setProperty(k, v);
        petal.style.left = `${15 + Math.random() * 70}vw`;
        petal.style.top = `${3 + Math.random() * 8}vh`;
        st('--fp-w', `${w}px`);
        st('--fp-h', `${w * (1.25 + Math.random() * 0.15)}px`);
        st('--fp-c1', `hsl(${h} ${s}% ${Math.min(80, 34 * lb)}%)`);
        st('--fp-c2', `hsl(${h} ${s}% ${Math.min(40, 12 * lb)}%)`);
        st('--f-dur', `${dur}s`); st('--f-delay', `${dl}s`);
        st('--s1', `${sign() * (15 + Math.random() * 25)}px`);
        st('--s2', `${sign() * (10 + Math.random() * 20)}px`);
        st('--s3', `${sign() * (20 + Math.random() * 30)}px`);
        st('--s4', `${sign() * (10 + Math.random() * 15)}px`);
        fallingPetalsEl.appendChild(petal);
        setTimeout(() => petal.remove(), (dur + dl) * 1000 + 300);
    }

    function startFallingPetals() {
        for (let i = 0; i < 2; i++) setTimeout(spawnFallingPetal, i * 400);
        setInterval(spawnFallingPetal, 2600);
    }

    // ---------- the show ----------
    function startAnimationSequence() {
        ambientLight.classList.add('visible');

        // 1. the garden grows in: grass + bushy leaves
        blades.forEach((b, i) => setTimeout(() => { b.classList.add('on'); setTimeout(() => b.classList.add('sw'), 1900); }, rnd(0, 900)));
        bushLeaves.forEach((l, i) => setTimeout(() => { l.classList.add('on'); setTimeout(() => l.classList.add('sw'), 1500); }, 150 + i * 35 + rnd(0, 150)));

        // 2. curved stems rise, one after another, and each flower blooms at its own speed
        const order = flowers.map((_, i) => i).sort(() => Math.random() - 0.5);
        const gap = 450, begin = 900;
        order.forEach((idx, n) => setTimeout(() => growFlower(flowers[idx]), begin + n * gap));
        const total = begin + order.length * gap;

        setTimeout(spawnFireflies, begin + 1500);
        setTimeout(startFallingPetals, total + 4500);
        setTimeout(() => endText.classList.add('visible'), total + 6000);
    }

    startButton.addEventListener('click', () => {
        triggerOverlay.classList.add('fade-out');
        setTimeout(startAnimationSequence, 800);
    });

    buildGrass();
    buildBush();
    buildGarden();
    setTimeout(startCardLoader, 400);
});