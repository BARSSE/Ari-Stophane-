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

  /* ---------- Nom de plume : mesure l'écart de largeur entre « s » et « S » ---------- */
  const lettreS = $('.lettre-s');
  const mesurerS = () => {
    if (!lettreS) return;
    const bas = $('.s-bas', lettreS).getBoundingClientRect().width;
    const haut = $('.s-haut', lettreS).getBoundingClientRect().width;
    lettreS.style.setProperty('--dw', Math.max(0, haut - bas).toFixed(1) + 'px');
  };
  mesurerS();
  window.addEventListener('resize', mesurerS);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(mesurerS);

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

  /* ---------- Décor de scène : ampoules de la rampe et poussière dans la lumière ---------- */
  const rampe = $('.rampe');
  const poussiere = $('.poussiere');
  const bâtirDécor = () => {
    if (rampe) {
      const n = Math.max(8, Math.round(window.innerWidth / (window.innerWidth < 600 ? 34 : 46)));
      rampe.innerHTML = '';
      for (let i = 0; i < n; i++) {
        const b = document.createElement('span');
        b.style.setProperty('--i', i);
        rampe.appendChild(b);
      }
    }
  };
  bâtirDécor();
  let largeurDécor = window.innerWidth;
  window.addEventListener('resize', () => { if (Math.abs(window.innerWidth - largeurDécor) > 60) { largeurDécor = window.innerWidth; bâtirDécor(); } });
  if (poussiere && !reduit) {
    for (let i = 0; i < 26; i++) {
      const m = document.createElement('span');
      const t = 2 + Math.random() * 3;
      m.style.cssText = `left:${(15 + Math.random() * 70).toFixed(1)}%;top:${(24 + Math.random() * 46).toFixed(1)}%;width:${t.toFixed(1)}px;height:${t.toFixed(1)}px;` +
        `animation-duration:${(9 + Math.random() * 8).toFixed(1)}s;animation-delay:${(-Math.random() * 12).toFixed(1)}s;--dx:${(Math.random() * 40 - 20).toFixed(0)}px`;
      poussiere.appendChild(m);
    }
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

  /* ---------- Dramaturges : portraits chargés depuis Wikipédia ---------- */
  const cachePortraits = new Map();
  const chargerPortrait = (titre) => {
    if (!cachePortraits.has(titre)) {
      const p = fetch('https://fr.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(titre.replace(/ /g, '_')))
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => (j && j.thumbnail ? j.thumbnail.source : null))
        .catch(() => null);
      cachePortraits.set(titre, p);
    }
    return cachePortraits.get(titre);
  };
  const remplirPortrait = (img, titre) => {
    chargerPortrait(titre).then((src) => {
      if (!src) return;
      img.onload = () => { img.hidden = false; requestAnimationFrame(() => img.classList.add('charge')); };
      img.src = src;
    });
  };
  const remplirPortraits = (zone) => {
    $$('img[data-wiki]', zone).forEach((img) => remplirPortrait(img, img.dataset.wiki));
  };
  const galerie = $('.galerie');
  if (galerie) {
    const charger = () => {
      $$('.portrait', galerie).forEach((b) => remplirPortrait($('img', b), b.dataset.wiki));
    };
    if ('IntersectionObserver' in window) {
      const o = new IntersectionObserver(([en]) => { if (en.isIntersecting) { charger(); o.disconnect(); } }, { rootMargin: '600px' });
      o.observe(galerie);
    } else {
      charger();
    }
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
      remplirPortraits(corps);
      document.documentElement.classList.add('lecture');
      lecteur.showModal();
    });
    $('.lecteur-fermer', lecteur).addEventListener('click', () => lecteur.close());
    lecteur.addEventListener('click', (e) => {
      if (e.target === lecteur || e.target.closest('a[data-ferme]')) lecteur.close();
    });
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

  /* ---------- L'histoire d'Ari Stophane : la pellicule ---------- */
  const pellicule = $('.pellicule');
  if (pellicule) {
    const cine = $('.projecteur-cine');
    const cadres = $$('.cadre', pellicule);
    const compteur = $('.pel-compteur');
    const zonePoints = $('.pel-points');
    const n = cadres.length;
    let idx = 0;
    let interagi = false;
    let visiblePel = false;
    let survol = false;
    let attentePel = false;
    let glisse = null;

    const points = cadres.map((c, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'pel-point';
      b.setAttribute('aria-label', `Étape ${i + 1} : ${c.dataset.titre}`);
      b.addEventListener('click', () => { interagi = true; aller(i); });
      zonePoints.appendChild(b);
      return b;
    });

    const cibleGauche = (i) => cadres[i].offsetLeft - (pellicule.clientWidth - cadres[i].offsetWidth) / 2;
    const aller = (i, instant) => {
      const k = Math.max(0, Math.min(n - 1, i));
      pellicule.scrollTo({ left: cibleGauche(k), behavior: (reduit || instant) ? 'auto' : 'smooth' });
    };

    const majPel = () => {
      attentePel = false;
      const centre = pellicule.scrollLeft + pellicule.clientWidth / 2;
      let meilleur = 0, ecart = Infinity;
      cadres.forEach((c, i) => {
        const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - centre);
        if (d < ecart) { ecart = d; meilleur = i; }
      });
      const change = meilleur !== idx || !cadres[meilleur].classList.contains('actif');
      if (!change) return;
      const avant = idx;
      idx = meilleur;
      cadres.forEach((c, i) => c.classList.toggle('actif', i === idx));
      points.forEach((p, i) => p.classList.toggle('actif', i === idx));
      compteur.textContent = `${idx + 1} / ${n}`;
      if (avant !== idx && !reduit) {
        cine.classList.remove('flash');
        void cine.offsetWidth;
        cine.classList.add('flash'); // petit éclat de projecteur à chaque image
      }
    };
    pellicule.addEventListener('scroll', () => { if (!attentePel) { attentePel = true; requestAnimationFrame(majPel); } }, { passive: true });
    window.addEventListener('resize', () => aller(idx, true));

    $('.pel-prec').addEventListener('click', () => { interagi = true; aller(idx - 1); });
    $('.pel-suiv').addEventListener('click', () => { interagi = true; aller(idx + 1); });
    pellicule.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); interagi = true; aller(idx + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); interagi = true; aller(idx - 1); }
    });
    pellicule.addEventListener('touchstart', () => { interagi = true; }, { passive: true });

    // Glisser à la souris
    pellicule.addEventListener('mousedown', (e) => {
      if (e.button !== 0 || e.target.closest('a')) return;
      glisse = { x: e.clientX, gauche: pellicule.scrollLeft };
      interagi = true;
      pellicule.classList.add('glisse');
    });
    window.addEventListener('mousemove', (e) => { if (glisse) pellicule.scrollLeft = glisse.gauche - (e.clientX - glisse.x); });
    window.addEventListener('mouseup', () => {
      if (!glisse) return;
      glisse = null;
      pellicule.classList.remove('glisse');
      aller(idx);
    });
    pellicule.addEventListener('mouseenter', () => { survol = true; });
    pellicule.addEventListener('mouseleave', () => { survol = false; });

    // La pellicule avance toute seule tant que personne n'y touche
    if (!reduit) {
      setInterval(() => {
        if (!visiblePel || interagi || survol) return;
        aller(idx + 1 >= n ? 0 : idx + 1);
      }, 5200);
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([en]) => {
        visiblePel = en.isIntersecting;
        if (!visiblePel) { interagi = false; aller(0, true); }
      }, { threshold: 0.35 }).observe(cine);
    }
    majPel();
  }

  /* ---------- Histoire de l'art dramatique : le fil de la frise suit le défilement ---------- */
  const friseArt = $('.frise-histoire');
  if (friseArt) {
    const epoques = $$('.epoque', friseArt);
    let attente = false;
    const majFrise = () => {
      attente = false;
      if (reduit) {
        friseArt.style.setProperty('--p', 1);
        epoques.forEach((e) => e.classList.add('passe'));
        return;
      }
      const r = friseArt.getBoundingClientRect();
      const repere = window.innerHeight * 0.55;
      const p = Math.min(1, Math.max(0, (repere - r.top) / r.height));
      friseArt.style.setProperty('--p', p.toFixed(4));
      epoques.forEach((e) => {
        const top = e.getBoundingClientRect().top;
        e.classList.toggle('passe', top + 60 < repere);
      });
    };
    const demander = () => { if (!attente) { attente = true; requestAnimationFrame(majFrise); } };
    window.addEventListener('scroll', demander, { passive: true });
    window.addEventListener('resize', demander);
    majFrise();
  }

  /* ---------- Signification du logo : le projecteur explore le logo ---------- */
  const grilleLogo = $('.logo-grille');
  if (grilleLogo) {
    const vue = $('.logo-vue', grilleLogo);
    const elements = $$('.element', grilleLogo);
    const reperes = $$('[data-cible]', vue);
    const petitEcran = window.matchMedia('(max-width: 1000px)');
    let actifId = null;
    let derniereAction = 0;
    let visibleLogo = false;
    let indexAuto = -1;

    const activer = (cible) => {
      actifId = cible;
      vue.classList.toggle('a-un-actif', !!cible);
      reperes.forEach((n) => n.classList.toggle('actif', n.dataset.cible === cible));
      elements.forEach((e) => e.classList.toggle('actif', e.dataset.cible === cible));
    };

    elements.forEach((e) => {
      e.addEventListener('pointerenter', (ev) => {
        if (ev.pointerType !== 'mouse') return;
        derniereAction = performance.now();
        activer(e.dataset.cible);
      });
      e.addEventListener('pointerleave', (ev) => {
        if (ev.pointerType !== 'mouse') return;
        derniereAction = performance.now();
        activer(null);
      });
      e.addEventListener('click', () => {
        derniereAction = performance.now();
        activer(e.dataset.cible);
      });
    });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([en]) => {
        visibleLogo = en.isIntersecting;
        if (!visibleLogo) activer(null);
      }, { threshold: 0.25 }).observe(grilleLogo);

      // Petit écran : le logo reste collé en haut et s'éclaire au fil de la lecture
      let obsLecture = null;
      const monterLecture = () => {
        if (obsLecture) obsLecture.disconnect();
        if (!petitEcran.matches) return;
        const colonne = $('.logo-colonne', grilleLogo);
        const haut = 64 + colonne.offsetHeight;
        const bas = Math.max(0, window.innerHeight - haut - 150);
        obsLecture = new IntersectionObserver((entrees) => {
          entrees.forEach((en) => { if (en.isIntersecting) activer(en.target.dataset.cible); });
        }, { rootMargin: `-${haut}px 0px -${bas}px 0px` });
        elements.forEach((e) => obsLecture.observe(e));
      };
      monterLecture();
      window.addEventListener('resize', monterLecture);
    }

    // Grand écran : sans action de la souris, le projecteur passe tout seul d'un élément à l'autre
    if (!reduit) {
      setInterval(() => {
        if (!visibleLogo || petitEcran.matches) return;
        if (performance.now() - derniereAction < 4500) return;
        indexAuto = (indexAuto + 1) % elements.length;
        activer(elements[indexAuto].dataset.cible);
      }, 2600);
    }
  }

  $$('[data-applaudir]').forEach((el) => {
    el.addEventListener('click', () => {
      const r = el.getBoundingClientRect();
      applaudir(r.left + r.width / 2, r.top + r.height / 2);
    });
  });
})();
