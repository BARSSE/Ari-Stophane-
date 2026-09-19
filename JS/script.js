/* =====================================================
   Ari Stophane : animations et interactions
   ===================================================== */
(() => {
  'use strict';

  const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ---------- Année du pied de page ---------- */
  const annee = $('#annee');
  if (annee) annee.textContent = new Date().getFullYear();

  /* ---------- Menu mobile ---------- */
  const nav = $('.nav');
  const boutonMenu = $('.menu-bouton');
  if (nav && boutonMenu) {
    const basculer = (ouvert) => {
      nav.classList.toggle('ouvert', ouvert);
      boutonMenu.setAttribute('aria-expanded', String(ouvert));
    };
    boutonMenu.addEventListener('click', () => basculer(!nav.classList.contains('ouvert')));
    $$('#menu a').forEach((a) => a.addEventListener('click', () => basculer(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') basculer(false); });
  }

  /* ---------- Lien de navigation actif ---------- */
  const liensNav = $$('#menu a');
  const sections = liensNav.map((a) => $(a.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window && sections.length) {
    const obs = new IntersectionObserver((entrees) => {
      entrees.forEach((en) => {
        if (!en.isIntersecting) return;
        liensNav.forEach((a) => a.classList.toggle('actif', a.getAttribute('href') === '#' + en.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => obs.observe(s));
  }

  /* ---------- Machine à écrire (slogan) ---------- */
  const machine = $('[data-machine]');
  let jetonMachine = 0;
  const lancerMachine = () => {
    if (!machine) return;
    const texte = machine.dataset.machine;
    if (reduit) { machine.textContent = texte; return; }
    const moi = ++jetonMachine; // annule une frappe précédente encore en cours
    machine.textContent = '';
    let i = 0;
    const taper = () => {
      if (moi !== jetonMachine) return;
      machine.textContent = texte.slice(0, ++i);
      if (i < texte.length) setTimeout(taper, 55 + Math.random() * 60);
    };
    setTimeout(taper, 3300);
  };
  lancerMachine();

  /* ---------- Rideau : s'ouvre au chargement, au clic, et à chaque retour en haut ---------- */
  const scene = $('.scene');
  const rejouer = $('.rejouer');
  const rejouerScene = () => {
    scene.classList.remove('joue');
    void scene.offsetWidth; // relance les animations CSS
    scene.classList.add('joue');
    lancerMachine();
  };
  if (scene && rejouer) rejouer.addEventListener('click', rejouerScene);
  if (scene && !reduit && 'IntersectionObserver' in window) {
    let etaitSortie = false;
    new IntersectionObserver(([en]) => {
      if (!en.isIntersecting) etaitSortie = true;
      else if (etaitSortie && en.intersectionRatio >= 0.6) { etaitSortie = false; rejouerScene(); }
    }, { threshold: [0, 0.6] }).observe(scene);
  }

  /* ---------- Projecteur qui suit la souris + parallaxe des masques ---------- */
  if (scene && !reduit) {
    const masques = $$('.masque-ext', scene);
    let largeur = scene.clientWidth;
    let hauteur = scene.clientHeight;
    let cx = largeur / 2, cy = hauteur * 0.42;
    let cibleX = cx, cibleY = cy;
    let dernierMouvement = 0;
    let visible = true;

    window.addEventListener('resize', () => { largeur = scene.clientWidth; hauteur = scene.clientHeight; });
    scene.addEventListener('pointermove', (e) => {
      const r = scene.getBoundingClientRect();
      cibleX = e.clientX - r.left;
      cibleY = e.clientY - r.top;
      dernierMouvement = performance.now();
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(scene);
    }

    const boucle = (t) => {
      if (visible) {
        // Sans mouvement de souris (ou sur mobile) : le projecteur se balade tout seul
        if (t - dernierMouvement > 2500) {
          cibleX = largeur * (0.5 + 0.24 * Math.sin(t / 1900));
          cibleY = hauteur * (0.42 + 0.10 * Math.cos(t / 1500));
        }
        cx += (cibleX - cx) * 0.07;
        cy += (cibleY - cy) * 0.07;
        scene.style.setProperty('--mx', cx.toFixed(1) + 'px');
        scene.style.setProperty('--my', cy.toFixed(1) + 'px');
        const px = cx / largeur - 0.5;
        const py = cy / hauteur - 0.5;
        masques.forEach((m) => {
          const p = parseFloat(m.dataset.profondeur) || 0;
          m.style.transform = `translate(${(px * p).toFixed(1)}px, ${(py * p).toFixed(1)}px)`;
        });
      }
      requestAnimationFrame(boucle);
    };
    requestAnimationFrame(boucle);
  }

  /* ---------- Apparitions au défilement (rejouées à chaque fois) ---------- */
  const aRevele = $$('[data-rev]');
  if ('IntersectionObserver' in window && !reduit) {
    aRevele.forEach((el) => el.classList.add('avant'));
    const obsRev = new IntersectionObserver((entrees) => {
      entrees.forEach((en) => {
        const el = en.target;
        if (en.isIntersecting && en.intersectionRatio >= 0.18) {
          if (el.classList.contains('apparait')) return;
          const freres = $$('[data-rev="' + el.dataset.rev + '"]', el.parentElement);
          const rang = Math.max(0, freres.indexOf(el));
          el.style.animationDelay = (rang % 3) * 0.14 + 's';
          el.classList.remove('avant');
          el.classList.add('apparait');
        } else if (!en.isIntersecting) {
          // Sorti de l'écran : remise à zéro pour rejouer l'animation au prochain passage
          el.classList.remove('apparait');
          el.classList.add('avant');
        }
      });
    }, { threshold: [0, 0.18] });
    aRevele.forEach((el) => obsRev.observe(el));
  }

  /* ---------- Titres écrits à la plume (rejoués à chaque apparition) ---------- */
  const titres = $$('.titre-acte');
  const PAS = 70; // ms entre deux lettres (doit correspondre au CSS : 70ms)
  const minuteries = new WeakMap();

  const preparerTitre = (h) => {
    const texte = h.textContent.trim();
    h.setAttribute('aria-label', texte);
    h.textContent = '';
    let n = 0;
    const mots = texte.split(/\s+/);
    mots.forEach((mot, k) => {
      const m = document.createElement('span');
      m.className = 'mot';
      m.setAttribute('aria-hidden', 'true');
      Array.from(mot).forEach((c) => {
        const l = document.createElement('span');
        l.className = 'lettre';
        l.dataset.i = n;
        l.style.setProperty('--i', n++);
        l.textContent = c;
        m.appendChild(l);
      });
      h.appendChild(m);
      if (k < mots.length - 1) { n++; h.appendChild(document.createTextNode(' ')); }
    });
    const plume = document.createElement('span');
    plume.className = 'plume-titre';
    plume.setAttribute('aria-hidden', 'true');
    plume.innerHTML = '<svg viewBox="0 0 40 40"><path d="M2 38 L8 24 L30 2 Q34 -1 38 3 Q41 7 38 10 L16 32Z" fill="#f47fa9" stroke="#2b1236" stroke-width="2.5" stroke-linejoin="round"/><path d="M2 38 L8 24 L16 32Z" fill="#ffcf5a" stroke="#2b1236" stroke-width="2.5" stroke-linejoin="round"/></svg>';
    h.appendChild(plume);
    h.classList.add('titre-cache');
  };

  const effacerTitre = (h) => {
    (minuteries.get(h) || []).forEach(clearTimeout);
    minuteries.delete(h);
    h.classList.remove('ecrit');
    h.classList.add('titre-cache');
    const plume = $('.plume-titre', h);
    if (plume) plume.classList.remove('active');
  };

  const ecrireTitre = (h) => {
    effacerTitre(h);
    h.classList.remove('titre-cache');
    void h.offsetWidth;
    h.classList.add('ecrit');
    const lettres = $$('.lettre', h);
    const plume = $('.plume-titre', h);
    const ids = [];
    const placer = (l, droite) => {
      plume.style.left = (l.offsetLeft + (droite ? l.offsetWidth : 0)) + 'px';
      plume.style.top = (l.offsetTop + l.offsetHeight * 0.9) + 'px';
    };
    placer(lettres[0], false);
    plume.classList.add('active');
    lettres.forEach((l) => {
      ids.push(setTimeout(() => placer(l, true), Number(l.dataset.i) * PAS + 120));
    });
    const fin = Number(lettres[lettres.length - 1].dataset.i) * PAS + 700;
    ids.push(setTimeout(() => plume.classList.remove('active'), fin));
    minuteries.set(h, ids);
  };

  if (!reduit && 'IntersectionObserver' in window) {
    titres.forEach(preparerTitre);
    const obsTitres = new IntersectionObserver((entrees) => {
      entrees.forEach((en) => {
        const h = en.target;
        if (en.isIntersecting && en.intersectionRatio >= 0.6) {
          if (!h.classList.contains('ecrit')) ecrireTitre(h);
        } else if (!en.isIntersecting) {
          effacerTitre(h);
        }
      });
    }, { threshold: [0, 0.6] });
    titres.forEach((h) => obsTitres.observe(h));
  }

  /* ---------- Inclinaison 3D des billets ---------- */
  if (!reduit) {
    $$('.billet-cadre').forEach((cadre) => {
      cadre.addEventListener('pointermove', (e) => {
        if (e.pointerType !== 'mouse') return;
        const r = cadre.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        cadre.style.setProperty('--ry', (x * 9).toFixed(2) + 'deg');
        cadre.style.setProperty('--rx', (-y * 9).toFixed(2) + 'deg');
      });
      cadre.addEventListener('pointerleave', () => {
        cadre.style.setProperty('--ry', '0deg');
        cadre.style.setProperty('--rx', '0deg');
      });
    });
  }

  /* ---------- Lecteur d'extraits (fenêtre modale) ---------- */
  const lecteur = $('#lecteur');
  if (lecteur && typeof lecteur.showModal === 'function') {
    const titre = $('.lecteur-titre', lecteur);
    const meta = $('.lecteur-meta', lecteur);
    const corps = $('.lecteur-corps', lecteur);

    document.addEventListener('click', (e) => {
      const bouton = e.target.closest('[data-lire]');
      if (!bouton) return;
      const source = document.getElementById(bouton.dataset.lire);
      if (!source) return;
      titre.textContent = source.dataset.titre || '';
      meta.textContent = source.dataset.meta || '';
      corps.innerHTML = source.innerHTML;
      corps.scrollTop = 0;
      document.documentElement.classList.add('lecture');
      lecteur.showModal();
    });
    $('.lecteur-fermer', lecteur).addEventListener('click', () => lecteur.close());
    lecteur.addEventListener('click', (e) => { if (e.target === lecteur) lecteur.close(); });
    lecteur.addEventListener('close', () => document.documentElement.classList.remove('lecture'));
  }

  /* ---------- Applaudissements : pluie d'étoiles ---------- */
  const conteneur = $('.applaudissements');
  const couleurs = ['#ffcf5a', '#f47fa9', '#8fe3ff', '#ffffff', '#ff5f87'];
  const etoileSvg = (c) =>
    `<svg viewBox="0 0 100 100"><path d="M50 4 L62 36 L96 38 L69 59 L79 93 L50 73 L21 93 L31 59 L4 38 L38 36Z" fill="${c}"/></svg>`;
  const petaleSvg = (c) =>
    `<svg viewBox="0 0 100 100"><path d="M50 4 C90 30 90 80 50 96 C10 80 10 30 50 4Z" fill="${c}"/></svg>`;

  const applaudir = (x, y) => {
    if (!conteneur || reduit) return;
    for (let i = 0; i < 34; i++) {
      const p = document.createElement('span');
      const taille = 12 + Math.random() * 20;
      const couleur = couleurs[i % couleurs.length];
      p.className = 'confetti';
      p.style.cssText = `left:${x}px;top:${y}px;width:${taille}px;height:${taille}px`;
      p.innerHTML = i % 3 === 0 ? petaleSvg(couleur) : etoileSvg(couleur);
      conteneur.appendChild(p);

      const angle = Math.random() * Math.PI * 2;
      const force = 90 + Math.random() * 260;
      const dx = Math.cos(angle) * force;
      const dy = Math.sin(angle) * force - 120;
      const rot = (Math.random() - 0.5) * 720;
      const anim = p.animate([
        { transform: 'translate(-50%, -50%) scale(.2) rotate(0deg)', opacity: 1 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1) rotate(${rot / 2}deg)`, opacity: 1, offset: 0.45 },
        { transform: `translate(calc(-50% + ${dx * 1.15}px), calc(-50% + ${dy + 380}px)) scale(.8) rotate(${rot}deg)`, opacity: 0 }
      ], { duration: 1500 + Math.random() * 900, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'forwards' });
      anim.onfinish = () => p.remove();
    }
  };

  $$('[data-applaudir]').forEach((el) => {
    el.addEventListener('click', () => {
      const r = el.getBoundingClientRect();
      applaudir(r.left + r.width / 2, r.top + r.height / 2);
    });
  });
})();
