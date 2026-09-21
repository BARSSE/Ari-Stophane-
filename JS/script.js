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

  /* ---------- Quiz du souffleur ---------- */
  // Pour ajouter une question : copier un bloc { ... } et le coller dans la liste.
  // t : "glossaire" ou "superstition" | bonne : la bonne réponse | fausses : exactement 3 mauvaises réponses
  const WIKI_GLOSSAIRE = { txt: 'Wikipédia, Glossaire du théâtre', url: 'https://fr.wikipedia.org/wiki/Glossaire_du_th%C3%A9%C3%A2tre' };
  const WIKI_SUPERSTITION = { txt: 'Wikipédia, Superstition théâtrale', url: 'https://fr.wikipedia.org/wiki/Superstition_th%C3%A9%C3%A2trale' };
  const WIKI_COUR = { txt: 'Wikipédia, Côté cour et côté jardin', url: 'https://fr.wikipedia.org/wiki/C%C3%B4t%C3%A9_cour_et_c%C3%B4t%C3%A9_jardin' };
  const LAROUSSE = { txt: 'Larousse, Termes techniques du théâtre', url: 'https://www.larousse.fr/encyclopedie/divers/termes_techniques_du_th%C3%A9%C3%A2tre/181578' };
  const BRITANNICA = { txt: 'Encyclopædia Britannica, Deus ex machina', url: 'https://britannica.com/print/article/159659' };

  const BANQUE_QUIZ = [
    /* ----- Glossaire ----- */
    { t: 'glossaire', q: 'Au théâtre, que désigne le « côté cour » ?',
      bonne: 'Le côté droit de la scène, vu depuis la salle',
      fausses: ['Le côté gauche de la scène, vu depuis la salle', 'Le fond de la scène, le plus loin du public', 'L\'espace situé devant le rideau, près du public'],
      expl: 'Ces mots viennent de la Comédie-Française : à partir de 1770, la troupe s\'installe dans la salle des Machines du palais des Tuileries, qui donnait d\'un côté sur la cour du Louvre (le côté cour) et de l\'autre sur le jardin des Tuileries (le côté jardin). Pour s\'en souvenir, pensez à « J.-C. » : Jardin à gauche, Cour à droite, vus du public.', src: WIKI_COUR },
    { t: 'glossaire', q: 'Que signifie « monter au lointain » ?',
      bonne: 'Aller vers le fond de la scène, loin du public',
      fausses: ['Sortir de scène par la coulisse de gauche', 'Monter dans les cintres pour régler les lumières', 'S\'avancer vers le public, au bord de la scène'],
      expl: 'Le lointain est la partie de la scène la plus éloignée du public. Son contraire est la face, ou avant-scène : on « descend à la face » pour se rapprocher de la salle. Ces verbes viennent des théâtres à l\'italienne, dont le plateau était incliné.', src: LAROUSSE },
    { t: 'glossaire', q: 'Qu\'est-ce qu\'un « aparté » ?',
      bonne: 'Une réplique qu\'un personnage dit pour lui-même ou pour le public, comme si les autres ne l\'entendaient pas',
      fausses: ['Un court intermède joué entre deux actes', 'Un personnage qui ne parle jamais et reste en retrait', 'Une scène jouée derrière le rideau, hors de la vue du public'],
      expl: 'C\'est une convention théâtrale : les autres personnages sont censés ne pas entendre. Dans <em>Le Secret</em>, Floriane parle souvent « à part » pour confier ses soupçons au public.', src: WIKI_GLOSSAIRE },
    { t: 'glossaire', q: 'Qu\'appelle-t-on une « didascalie » ?',
      bonne: 'Une indication de jeu, de décor ou de ton écrite par l\'auteur, qui n\'est pas prononcée',
      fausses: ['Le compliment adressé à l\'auteur à la fin de la pièce', 'Une longue réplique prononcée par un seul personnage', 'La liste des acteurs et de leurs rôles'],
      expl: 'Les didascalies sont les indications scéniques du texte (« elle sort en claquant la porte », « d\'un air soucieux »…). Elles guident la mise en scène mais ne se disent pas. Le mot vient du grec <em>didaskalia</em> : « enseignement ».', src: WIKI_GLOSSAIRE },
    { t: 'glossaire', q: 'Comment appelle-t-on une longue suite de phrases dite par un personnage sans être interrompu ?',
      bonne: 'Une tirade',
      fausses: ['Une stichomythie', 'Un aparté', 'Un canevas'],
      expl: 'La tirade est un long discours d\'un personnage. Elle s\'oppose à la stichomythie, faite de répliques très courtes, et au canevas, le simple scénario d\'une pièce improvisée comme dans la commedia dell\'arte.', src: WIKI_GLOSSAIRE },
    { t: 'glossaire', q: 'Qu\'est-ce qu\'une « stichomythie » ?',
      bonne: 'Un dialogue de répliques très courtes qui s\'enchaînent, souvent vers par vers',
      fausses: ['Un chant entonné par le chœur', 'Une danse qui ouvre la pièce', 'Un monologue prononcé par un dieu'],
      expl: 'Le mot vient du grec <em>stikhos</em> (le vers) et <em>muthos</em> (la parole). On la trouve dans la tragédie grecque, mais aussi chez Corneille ou Racine : elle donne un rythme vif et tendu aux affrontements.', src: WIKI_GLOSSAIRE },
    { t: 'glossaire', q: 'Que désigne le « dénouement » d\'une pièce ?',
      bonne: 'La fin de l\'intrigue, où les nœuds de l\'action se résolvent',
      fausses: ['Le début de la pièce, où l\'on présente les personnages', 'Le moment où l\'action atteint son point le plus tendu', 'Le petit texte lu avant le lever du rideau'],
      expl: 'Le mot vient de « dénouer » : les nœuds de l\'intrigue se défont. Il conclut l\'action, après le nœud et les péripéties. Dans la tragédie, on parle parfois de « catastrophe ».', src: WIKI_GLOSSAIRE },
    { t: 'glossaire', q: 'Que signifie l\'expression « deus ex machina » ?',
      bonne: 'Une intervention inattendue qui résout l\'intrigue, à l\'origine celle d\'un dieu amené par une machine',
      fausses: ['Un acteur qui joue plusieurs rôles dans la même pièce', 'Une machine qui reproduit le bruit du tonnerre', 'Un dieu invoqué au début de la pièce pour la protéger'],
      expl: 'Expression latine : « un dieu venu de la machine ». Dans le théâtre grec, un acteur jouant un dieu était amené sur scène par une grue (la <em>mêchanê</em>) pour dénouer une situation sans issue. Aujourd\'hui, on l\'emploie pour toute solution miraculeuse et peu crédible.', src: BRITANNICA },
    { t: 'glossaire', q: 'Que désigne la « catharsis » dans la tragédie grecque ?',
      bonne: 'La purification des passions du spectateur, qui ressent pitié et crainte',
      fausses: ['Le salut des comédiens à la fin de la représentation', 'Le masque que portent les acteurs tragiques', 'Le chant du chœur avant chaque épisode'],
      expl: 'Le mot grec signifie « purification ». Selon Aristote, la tragédie, en suscitant pitié et crainte, libère le spectateur de ces émotions. C\'est l\'un des codes de la tragédie fixés par Eschyle, Sophocle et Euripide.', src: WIKI_GLOSSAIRE },
    { t: 'glossaire', q: 'Qui est le « coryphée » dans le théâtre grec ?',
      bonne: 'Le chef du chœur',
      fausses: ['Le premier acteur, distinct du chœur', 'Le poète qui écrit la tragédie', 'Le musicien qui joue de la flûte'],
      expl: 'Le chœur, qui chante et commente l\'action, était mené par le coryphée, qui parlait au nom de tous. Le premier acteur distinct du chœur, lui, fut introduit par Thespis.', src: WIKI_GLOSSAIRE },
    { t: 'glossaire', q: 'Que désigne « la claque » au théâtre ?',
      bonne: 'Un groupe de spectateurs payés pour applaudir',
      fausses: ['Le bruit du rideau qui se referme', 'Les trois coups frappés avant le début du spectacle', 'Un accessoire qui imite le bruit d\'une gifle'],
      expl: 'Les « claqueurs » applaudissaient sur commande pour lancer et amplifier les applaudissements, une pratique ancienne surtout répandue au XIX<sup>e</sup> siècle. Aujourd\'hui, l\'expression désigne encore ceux qui applaudissent pour faire du bruit.', src: WIKI_GLOSSAIRE },
    { t: 'glossaire', q: 'Que désigne la « corbeille » dans une salle de théâtre ?',
      bonne: 'Le premier balcon, situé au-dessus de l\'orchestre',
      fausses: ['Le panier où le souffleur range son texte', 'L\'endroit où l\'on jette les accessoires cassés', 'Le trou dans le plancher de la scène'],
      expl: 'La corbeille est le premier étage de la salle, au-dessus de l\'orchestre. C\'était autrefois le lieu où l\'on se faisait admirer : le roi y prenait place au premier rang, de face.', src: WIKI_GLOSSAIRE },
    { t: 'glossaire', q: 'Que désigne familièrement le « poulailler » ?',
      bonne: 'Les places les plus hautes de la salle, sous le plafond',
      fausses: ['La loge où se changent les comédiennes', 'Les premières rangées du parterre', 'Un décor qui représente une ferme'],
      expl: 'Le « poulailler » (ou « paradis ») est la galerie supérieure de la salle : la plus haute, la moins chère et la plus éloignée de la scène. Le glossaire de Wikipédia le recense.', src: WIKI_GLOSSAIRE },
    { t: 'glossaire', q: 'À quoi sert la « régie » ?',
      bonne: 'C\'est le poste technique d\'où l\'on commande la lumière, le son et les effets',
      fausses: ['C\'est la loge des comédiens', 'C\'est l\'endroit où l\'on vend les billets', 'C\'est la partie de la salle réservée à la presse'],
      expl: 'Le régisseur y suit la « conduite » (le déroulé technique du spectacle) et déclenche les signaux appelés « tops » : changements de lumière, sons, effets.', src: WIKI_GLOSSAIRE },
    { t: 'glossaire', q: 'Qu\'appelle-t-on la « générale » ?',
      bonne: 'La dernière répétition, jouée dans les conditions réelles du spectacle',
      fausses: ['La première représentation, réservée à la presse', 'La dernière représentation de la saison', 'La lecture du texte autour d\'une table'],
      expl: 'Costumes, décors, lumières, son : tout est en place comme le soir de la première. Elle a lieu juste avant la première représentation. À ne pas confondre avec l\'« italienne » (lecture rapide du texte) ou l\'avant-première.', src: WIKI_GLOSSAIRE },
    { t: 'glossaire', q: 'Qu\'est-ce qu\'une « italienne » en répétition ?',
      bonne: 'Une lecture très rapide du texte, souvent assis, sans jouer',
      fausses: ['Une répétition où l\'on joue avec l\'accent italien', 'Une répétition sur une scène en pente', 'Une répétition entièrement chantée'],
      expl: 'On récite le texte le plus vite possible, sans mise en scène, pour l\'ancrer en mémoire et travailler l\'enchaînement des répliques. À ne pas confondre avec la « scène à l\'italienne », le théâtre à cadre de scène et salle en fer à cheval.', src: WIKI_GLOSSAIRE },
    { t: 'glossaire', q: 'Que veut dire « faire un filage » ?',
      bonne: 'Jouer la pièce (ou une partie) d\'une traite, sans s\'arrêter, pour vérifier l\'enchaînement',
      fausses: ['Coudre les costumes la veille de la première', 'Tendre les fils qui retiennent les décors', 'Choisir les acteurs pour chaque rôle'],
      expl: 'Comme on « file » le fil d\'une histoire, on enchaîne les scènes sans interruption. Le filage permet de tester le rythme, les entrées et sorties, les changements de décor et de lumière.', src: WIKI_GLOSSAIRE },
    { t: 'glossaire', q: 'À quoi servent « les trois coups » ?',
      bonne: 'À annoncer le début de la représentation, juste avant le lever du rideau',
      fausses: ['À demander le silence au public pendant l\'entracte', 'À signaler la fin de la pièce', 'À ouvrir la billetterie'],
      expl: 'Les trois coups sont frappés avant le lever de rideau pour annoncer que le spectacle commence. Traditionnellement, on les frappait sur le plancher avec un bâton appelé le « brigadier ».', src: WIKI_GLOSSAIRE },
    { t: 'glossaire', q: 'Que signifie « briser le quatrième mur » ?',
      bonne: 'S\'adresser directement au public, comme si la frontière invisible entre scène et salle n\'existait plus',
      fausses: ['Casser un élément du décor pendant la scène finale', 'Quitter la scène en passant par la salle', 'Jouer toute la pièce dos au public'],
      expl: 'Le quatrième mur est le mur imaginaire, côté salle, qui sépare le monde des personnages de celui des spectateurs. Diderot l\'a théorisé au XVIII<sup>e</sup> siècle. Dans <a class="lien-texte" href="#pieces"><em>Les Ombres du commandement</em></a>, l\'amirale Bourgeois le brise dès le prologue : elle s\'adresse au public et lui confie un rôle.', src: WIKI_GLOSSAIRE },
    { t: 'glossaire', q: 'Que trouve-t-on dans les « cintres » ?',
      bonne: 'La partie haute de la cage de scène, où l\'on suspend décors, projecteurs et rideaux',
      fausses: ['Les loges des comédiens', 'Le passage souterrain sous la scène', 'Les sièges du dernier balcon'],
      expl: 'Au-dessus de la scène, un ensemble de fils, de poulies et de contrepoids permet de faire monter et descendre les décors. Le machiniste qui y travaille s\'appelle le « cintrier ».', src: WIKI_GLOSSAIRE },
    { t: 'glossaire', q: 'Qu\'est-ce qu\'un « praticable » ?',
      bonne: 'Une plate-forme sur laquelle les comédiens peuvent monter et jouer',
      fausses: ['Un costume prévu pour les acrobates', 'Une porte cachée dans le décor', 'Un projecteur qui suit un acteur'],
      expl: 'Le praticable est un élément de décor solide qui crée des niveaux (estrade, escalier, balcon…). Il est « praticable » parce qu\'on peut réellement y marcher, contrairement à un décor simplement peint.', src: WIKI_GLOSSAIRE },
    { t: 'glossaire', q: 'Que signifie « relâche » sur une affiche de théâtre ?',
      bonne: 'Ce jour-là, il n\'y a pas de représentation',
      fausses: ['La pièce est jouée gratuitement', 'La pièce est reportée à l\'année suivante', 'Le public peut entrer sans réservation'],
      expl: 'La relâche est le jour de repos du théâtre : on lit « relâche » à la place du titre du spectacle. Le glossaire de Wikipédia la recense parmi les termes courants.', src: WIKI_GLOSSAIRE },
    { t: 'glossaire', q: 'Que signifie « dramatis personæ » ?',
      bonne: 'La liste des personnages d\'une pièce',
      fausses: ['La liste des spectateurs invités', 'Le nom de la troupe qui joue la pièce', 'Le prologue chanté avant le premier acte'],
      expl: 'En latin : « les personnes du drame ». C\'est la liste placée avant le texte, parfois accompagnée du nom des acteurs. Dans <em>Le Secret</em>, c\'est la partie « Personnages », qui présente Floriane, ses amies et ses parents.', src: WIKI_GLOSSAIRE },
    { t: 'glossaire', q: 'Que signifie la locution latine « acta est fabula », prononcée à la fin du <em>Secret</em> ?',
      bonne: '« La pièce est jouée »',
      fausses: ['« Le rideau tombe »', '« L\'histoire commence »', '« Le secret est révélé »'],
      expl: 'On l\'attribue à l\'empereur Auguste, qui l\'aurait dite sur son lit de mort : la comédie de la vie est terminée. Dans <em>Le Secret</em>, Floriane la prononce pour annoncer que « la pièce est jouée », et que tout n\'était que comédie.', src: WIKI_GLOSSAIRE },
    { t: 'glossaire', q: 'Qu\'est-ce qu\'un « cabotin » ?',
      bonne: 'Un acteur qui attire l\'attention sur lui en exagérant son jeu, aux dépens des autres',
      fausses: ['Un acteur qui joue toujours des rôles d\'animaux', 'Un acteur qui connaît tout le texte par cœur', 'Un acteur qui joue sans costume'],
      expl: 'Le cabotin cherche l\'effet et les applaudissements, au détriment de ses partenaires et des intentions du metteur en scène. Son défaut s\'appelle le « cabotinage ».', src: WIKI_GLOSSAIRE },
    { t: 'glossaire', q: 'À quoi servait l\'« ekkyklêma » dans le théâtre grec ?',
      bonne: 'À montrer sur scène, sur une plate-forme roulante, ce qui se passait à l\'intérieur du bâtiment',
      fausses: ['À faire descendre un dieu du ciel', 'À amplifier la voix des acteurs', 'À changer les masques des acteurs'],
      expl: 'Ce chariot roulant sortait de la porte du palais pour montrer au public une scène d\'intérieur, souvent un cadavre après un meurtre qui ne pouvait pas être montré sur scène. Ne pas le confondre avec la <em>mêchanê</em>, la grue du <em>deus ex machina</em>.', src: WIKI_GLOSSAIRE },
    { t: 'glossaire', q: 'Qu\'est-ce qu\'un « dilemme cornélien » ?',
      bonne: 'Un choix déchirant entre le devoir et le sentiment',
      fausses: ['Une dispute entre deux auteurs rivaux', 'Un rôle joué par deux acteurs à la fois', 'Un choix entre écrire une comédie ou une tragédie'],
      expl: 'L\'expression vient de Corneille : dans <em>Le Cid</em>, Rodrigue doit choisir entre venger l\'honneur de son père et l\'amour de Chimène, la fille de l\'homme qu\'il doit affronter.', src: WIKI_GLOSSAIRE },
    { t: 'glossaire', q: 'Que désigne le « marivaudage » ?',
      bonne: 'Un badinage délicat et raffiné autour de l\'amour, dans le style de Marivaux',
      fausses: ['Un duel à l\'épée joué sur scène', 'Une longue tirade sur la politique', 'Un décor de jardin à la française'],
      expl: 'Le mot vient de Marivaux : dans <em>Le Jeu de l\'amour et du hasard</em> ou <em>Les Fausses Confidences</em>, les personnages cachent, retardent et analysent finement leurs sentiments avant de les avouer.', src: WIKI_GLOSSAIRE },
    { t: 'glossaire', q: 'Qu\'appelle-t-on « théâtre dans le théâtre » ?',
      bonne: 'Une pièce jouée à l\'intérieur d\'une autre pièce',
      fausses: ['Un spectacle joué sans spectateurs', 'Une répétition ouverte au public', 'Deux pièces jouées en même temps sur deux scènes'],
      expl: '<em>Hamlet</em> de Shakespeare en donne un exemple célèbre : les comédiens jouent devant le roi pour piéger le meurtrier. <em>L\'Illusion comique</em> de Corneille en est un autre.', src: WIKI_GLOSSAIRE },
    { t: 'glossaire', q: 'Que fait le « souffleur » ?',
      bonne: 'Il souffle discrètement leur texte aux acteurs qui ont un trou de mémoire',
      fausses: ['Il souffle dans un instrument pour lancer la musique', 'Il ouvre et ferme le rideau', 'Il produit les effets de vent et de tempête'],
      expl: 'Caché dans une petite « niche » au bord de la scène, la coquille du souffleur, il suit le texte et le glisse à voix basse en cas de trou. Il est un peu le gardien de la mémoire de la troupe… et le maître de ce quiz !', src: WIKI_GLOSSAIRE },
    { t: 'glossaire', q: 'Quel personnage est une « soubrette » ?',
      bonne: 'Une jeune servante malicieuse dans la comédie',
      fausses: ['Une jeune première tragique', 'Un père autoritaire', 'Le confident du héros'],
      expl: 'La soubrette est un personnage de comédie : vive et drôle, elle aide souvent les amoureux. Exemples : Dorine dans <em>Tartuffe</em>, Lisette dans <em>Le Jeu de l\'amour et du hasard</em>.', src: WIKI_GLOSSAIRE },
    { t: 'glossaire', q: 'Que désigne le « protagoniste » d\'une pièce ?',
      bonne: 'Le personnage principal',
      fausses: ['Le personnage qui s\'oppose au héros', 'Le personnage qui raconte l\'histoire au public', 'Le premier spectateur à entrer dans la salle'],
      expl: 'Du grec <em>prôtos</em> (premier) et <em>agônistês</em> (acteur). Son opposant est l\'antagoniste. Le « deutéragoniste », lui, est le deuxième rôle en importance.', src: WIKI_GLOSSAIRE },
    { t: 'glossaire', q: 'Qu\'est-ce que le « manteau d\'arlequin » ?',
      bonne: 'Le cadre de la scène, fait de rideaux ou de châssis, qui délimite l\'ouverture',
      fausses: ['Le costume du personnage d\'Arlequin', 'Le rideau de fer contre l\'incendie', 'Le châle des comédiennes pendant les saluts'],
      expl: 'Situé à l\'avant de la scène, il cache aux spectateurs le haut et les côtés du plateau, donc les cintres et les coulisses. Il encadre la scène comme un tableau.', src: WIKI_GLOSSAIRE },

    /* ----- Superstitions ----- */
    { t: 'superstition', q: 'En France, que dit-on aux comédiens pour leur souhaiter bonne chance, puisque « bonne chance » porte malheur ?',
      bonne: '« Merde ! »',
      fausses: ['« Toi, toi, toi ! »', '« Dans la gueule du loup ! »', '« Que le rideau se lève ! »'],
      expl: 'On dit « Merde ! ». L\'expression daterait de l\'époque où les spectateurs arrivaient en calèche : plus il y avait de crottin de cheval devant le théâtre, plus il y avait de monde. Souhaiter « beaucoup de merdes » aux artistes, c\'était donc leur souhaiter une salle pleine.', src: WIKI_SUPERSTITION },
    { t: 'superstition', q: 'Au Royaume-Uni, quelle expression remplace « bonne chance » avant de monter sur scène ?',
      bonne: '« Break a leg ! » (« casse-toi la jambe »)',
      fausses: ['« Toï, toï, toï ! »', '« In bocca al lupo ! »', '« Good luck ! », tout simplement'],
      expl: 'En souhaitant le malheur (« casse-toi la jambe »), on conjure le sort et on espère que le contraire se produira. En Allemagne, on dit « Hals und Beinbruch » (bris de cou et de jambe) ou « Toï, toï, toï ».', src: WIKI_SUPERSTITION },
    { t: 'superstition', q: 'En Italie, on souhaite bonne chance à un comédien en lui disant « In bocca al lupo ». Que veut dire cette expression ?',
      bonne: 'Dans la gueule du loup',
      fausses: ['Sur le dos du lion', 'Dans le nid de l\'aigle', 'Au pied de la montagne'],
      expl: 'Le comédien doit répondre « Crepi il lupo ! » : « Que le loup meure ! ». Comme « Merde » en France ou « Break a leg » au Royaume-Uni, on souhaite le danger pour attirer la chance.', src: WIKI_SUPERSTITION },
    { t: 'superstition', q: 'Pourquoi ne faut-il pas siffler sur scène ni en coulisse ?',
      bonne: 'Les régisseurs, d\'anciens marins, se transmettaient les changements de décor par sifflements codés',
      fausses: ['Cela réveille les fantômes des anciens comédiens', 'Cela abîme la voix des acteurs', 'Cela annonce que la pièce va être annulée'],
      expl: 'Un acteur qui sifflait pouvait semer la confusion dans le déroulement technique. Une autre explication vient de l\'éclairage au gaz : une flamme éteinte faisait s\'échapper le gaz avec un sifflement, et le risque d\'explosion. Certains disent aussi que cela attire les sifflets du public.', src: WIKI_SUPERSTITION },
    { t: 'superstition', q: 'Quel mot remplace « corde » sur un plateau de théâtre ?',
      bonne: 'Guinde',
      fausses: ['Gril', 'Sangle', 'Perche'],
      expl: 'Le mot « corde » est interdit, hérité de la marine où il désignait un instrument de supplice. On dit « guinde », parfois « ficelle ». Il est autorisé si la corde porte un nœud de pendu. La seule corde permise dans un théâtre est la « corde à piano », en acier, qui guide un rideau.', src: WIKI_SUPERSTITION },
    { t: 'superstition', q: 'Quelle fleur ne faut-il jamais offrir à une actrice ?',
      bonne: 'L\'œillet',
      fausses: ['La rose', 'La tulipe', 'La marguerite'],
      expl: 'Autrefois, le directeur offrait des roses aux comédiennes dont le contrat était renouvelé, et des œillets, moins chers, à celles qui étaient renvoyées. Les roses, elles, sont très appréciées.', src: WIKI_SUPERSTITION },
    { t: 'superstition', q: 'En France, quelle couleur est réputée porter malheur au théâtre ?',
      bonne: 'Le vert',
      fausses: ['Le rose', 'Le blanc', 'L\'orange'],
      expl: 'L\'origine viendrait de l\'éclairage de scène du XIX<sup>e</sup> siècle, qui ne mettait pas les verts en valeur, ou des colorants à base d\'oxyde de cuivre ou de cyanure, toxiques. Seuls les clowns font exception. On raconte aussi que Molière portait du vert lors de sa dernière représentation.', src: WIKI_SUPERSTITION },
    { t: 'superstition', q: 'En Italie, quelle couleur est réputée porter malheur au théâtre ?',
      bonne: 'Le violet',
      fausses: ['Le rouge', 'Le blanc', 'Le noir'],
      expl: 'Selon les pays, la couleur maudite change : le vert en France, le violet en Italie, le vert et le bleu au Royaume-Uni, le jaune en Espagne (à cause de la cape du torero, jaune à l\'intérieur).', src: WIKI_SUPERSTITION },
    { t: 'superstition', q: 'Comment appelle-t-on <em>Macbeth</em>, de Shakespeare, pour éviter de prononcer son nom dans un théâtre ?',
      bonne: 'La pièce écossaise',
      fausses: ['La pièce anglaise', 'La pièce noire', 'La tragédie danoise'],
      expl: 'Au Royaume-Uni, <em>Macbeth</em> est réputée maudite. Les acteurs disent « la pièce écossaise », et nomment les rôles principaux « M » et « Lady M ». On dit que prononcer le titre attire de graves ennuis.', src: WIKI_SUPERSTITION },
    { t: 'superstition', q: 'Comment désigne-t-on les deux rôles principaux de <em>Macbeth</em> pour ne pas dire leurs noms ?',
      bonne: '« M » et « Lady M »',
      fausses: ['« Le Roi » et « La Reine »', '« Mac » et « Betty »', '« Le Thane » et « La Sorcière »'],
      expl: 'C\'est l\'usage : on ne prononce pas plus les noms des personnages que le titre de la pièce. L\'explication habituelle de la malédiction est que <em>Macbeth</em>, très populaire, était souvent programmée par des théâtres en difficulté, ou que ses coûts de production élevés les mettaient en difficulté financière. Elle comporte aussi beaucoup de scènes de combat, donc davantage de risques d\'accident.', src: WIKI_SUPERSTITION },
    { t: 'superstition', q: 'Quel jour de la semaine ne faut-il pas prononcer sur scène ?',
      bonne: 'Vendredi',
      fausses: ['Lundi', 'Mercredi', 'Dimanche'],
      expl: 'Le mot « vendredi » porte malheur aux comédiens sur scène. Il fait partie des « mots interdits » du théâtre, avec « corde », « bonne chance » ou, autrefois, « marteau ».', src: WIKI_SUPERSTITION },
    { t: 'superstition', q: 'Autrefois, par quel mot remplaçait-on « marteau » dans un théâtre ?',
      bonne: 'Darraque',
      fausses: ['Tapoir', 'Cognette', 'Martelot'],
      expl: 'Cette superstition a presque disparu. Le mot « marteau » était remplacé par « darraque », comme « corde » l\'est par « guinde ».', src: WIKI_SUPERSTITION },
    { t: 'superstition', q: 'Au Royaume-Uni, à quel moment offre-t-on des fleurs aux comédiens ?',
      bonne: 'À la fin de la pièce',
      fausses: ['Juste avant le lever du rideau', 'Pendant l\'entracte', 'Le lendemain de la première'],
      expl: 'Au Royaume-Uni, on ne donne aucune fleur avant la représentation : il faut attendre la fin de la pièce.', src: WIKI_SUPERSTITION },
    { t: 'superstition', q: 'Selon une superstition, pourquoi le vert est-il lié à Molière ?',
      bonne: 'C\'était la couleur de son costume lors de sa dernière représentation',
      fausses: ['Il détestait les costumes verts et les interdisait dans sa troupe', 'Les décors de ses pièces étaient repeints en vert', 'Le personnage de Tartuffe était toujours habillé de vert'],
      expl: 'Molière est mort en 1673, peu après avoir joué <em>Le Malade imaginaire</em>. On raconte que son costume était vert ce soir-là, ce qui a renforcé la réputation maudite de cette couleur.', src: WIKI_SUPERSTITION },
    { t: 'superstition', q: 'Que ne faut-il surtout pas dire lors de la répétition générale, selon la superstition ?',
      bonne: 'La dernière réplique de la pièce',
      fausses: ['Le titre de la pièce', 'Le nom du metteur en scène', 'Le mot « rideau »'],
      expl: 'Selon la superstition, prononcer la dernière réplique lors de la générale porte malheur. On la garde pour la première représentation, devant le public.', src: { txt: 'Phrase Finder, Break a leg', url: 'https://phrases.org.uk/fr/meanings/break-a-leg.html' } }
  ];

  const quizRacine = $('.quiz');
  if (quizRacine) {
    const carte = $('.quiz-carte', quizRacine);
    const souffleur = $('.quiz-souffleur', quizRacine);
    const elCat = $('.quiz-categorie', quizRacine);
    const elScore = $('.quiz-score', quizRacine);
    const elQuestion = $('.quiz-question', quizRacine);
    const elReponses = $('.quiz-reponses', quizRacine);
    const elExpl = $('.quiz-explication', quizRacine);
    const elVerdict = $('.quiz-verdict', quizRacine);
    const elTexte = $('.quiz-texte', quizRacine);
    const elSource = $('.quiz-source', quizRacine);
    const btnSuivant = $('.quiz-suivant', quizRacine);
    const CLE_PAQUET = 'ari-quiz-paquet';
    const CLE_DERNIER = 'ari-quiz-dernier';
    let score = 0, total = 0, courant = null, reponduAvant = false, dejaVu = false, ultime = null;

    const melanger = (t) => { const a = t.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    const lire = (k) => { try { return window.localStorage.getItem(k); } catch (e) { return null; } };
    const ecrire = (k, v) => { try { window.localStorage.setItem(k, v); } catch (e) { /* stockage indisponible : on tire au hasard */ } };

    // Un paquet mélangé : on épuise toutes les questions avant de les reproposer, et jamais deux fois la même d'affilée.
    let paquet = [];
    try { paquet = (JSON.parse(lire(CLE_PAQUET) || '[]') || []).filter((i) => Number.isInteger(i) && i < BANQUE_QUIZ.length); } catch (e) { paquet = []; }
    const dernierStocke = parseInt(lire(CLE_DERNIER), 10);
    if (!Number.isNaN(dernierStocke)) ultime = dernierStocke;

    const piocher = () => {
      if (!paquet.length) {
        paquet = melanger(BANQUE_QUIZ.map((_, i) => i));
        if (ultime !== null && paquet[paquet.length - 1] === ultime && paquet.length > 1) paquet.unshift(paquet.pop());
      }
      const i = paquet.pop();
      ultime = i;
      ecrire(CLE_PAQUET, JSON.stringify(paquet));
      ecrire(CLE_DERNIER, String(i));
      return i;
    };

    const majScore = () => { elScore.textContent = `Séance : ${score} / ${total}`; };

    const afficher = () => {
      courant = BANQUE_QUIZ[piocher()];
      reponduAvant = false;
      elCat.textContent = courant.t === 'glossaire' ? 'Glossaire' : 'Superstition';
      elCat.className = 'quiz-categorie cat-' + courant.t;
      elQuestion.innerHTML = courant.q;
      elReponses.innerHTML = '';
      elExpl.classList.remove('ouverte');
      carte.classList.remove('juste', 'faux');
      souffleur.classList.remove('content', 'desole');
      melanger([courant.bonne, ...courant.fausses]).forEach((texte, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'quiz-rep';
        b.style.setProperty('--i', i);
        b.innerHTML = `<span class="quiz-lettre" aria-hidden="true">${'ABCD'[i]}</span><span class="quiz-rep-texte"></span>`;
        $('.quiz-rep-texte', b).textContent = texte;
        b.addEventListener('click', () => repondre(b, texte));
        elReponses.appendChild(b);
      });
      carte.classList.remove('entre');
      void carte.offsetWidth; // relance l'animation d'apparition
      carte.classList.add('entre');
    };

    const repondre = (bouton, texte) => {
      if (reponduAvant) return;
      reponduAvant = true;
      const ok = texte === courant.bonne;
      total += 1;
      if (ok) score += 1;
      majScore();
      $$('.quiz-rep', elReponses).forEach((b) => {
        const t = $('.quiz-rep-texte', b).textContent;
        b.setAttribute('aria-disabled', 'true');
        if (t === courant.bonne) b.classList.add('juste');
        else if (b === bouton) b.classList.add('faux');
        else b.classList.add('ecarte');
      });
      carte.classList.add(ok ? 'juste' : 'faux');
      souffleur.classList.add(ok ? 'content' : 'desole');
      elVerdict.textContent = ok ? 'Bravo, bonne réponse !' : 'Raté… La bonne réponse était : ' + courant.bonne;
      elVerdict.className = 'quiz-verdict ' + (ok ? 'ok' : 'ko');
      elTexte.innerHTML = courant.expl;
      elSource.innerHTML = `Source : <a class="lien-texte" href="${courant.src.url}" target="_blank" rel="noopener noreferrer">${courant.src.txt}</a>`;
      elExpl.classList.add('ouverte');
      if (ok && typeof applaudir === 'function') {
        const r = bouton.getBoundingClientRect();
        applaudir(r.left + r.width / 2, r.top + r.height / 2);
      }
      setTimeout(() => btnSuivant.focus({ preventScroll: true }), 650);
    };

    btnSuivant.addEventListener('click', () => {
      afficher();
      const haut = carte.getBoundingClientRect().top;
      if (haut < 80) window.scrollBy({ top: haut - 100, behavior: reduit ? 'auto' : 'smooth' });
    });

    // À chaque fois qu'on quitte la partie, une nouvelle question est préparée pour le prochain passage
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([en]) => {
        if (en.isIntersecting) { dejaVu = true; return; }
        if (dejaVu) { dejaVu = false; afficher(); }
      }, { threshold: 0 }).observe(quizRacine);
    }
    majScore();
    afficher();
  }

  $$('[data-applaudir]').forEach((el) => {
    el.addEventListener('click', () => {
      const r = el.getBoundingClientRect();
      applaudir(r.left + r.width / 2, r.top + r.height / 2);
    });
  });
})();
