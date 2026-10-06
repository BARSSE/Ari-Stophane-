/* Ari Stophane : les jeux de jeux.html (le quiz du souffleur reste dans script.js) */
(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const mel = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const tire = (a) => a[Math.floor(Math.random() * a.length)];
  const IDEE = 'https://framaforms.org/idee-pour-une-piece-ou-une-histoire-1790708071';
  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  const carte = (rac, cat) => { rac.textContent = ''; const c = el('div', 'quiz-carte jeu-carte'); const e = el('div', 'quiz-entete'); e.append(el('span', 'quiz-categorie', cat)); const sc = el('span', 'quiz-score', 'Score : 0 / 0'); e.append(sc); c.append(e); rac.append(c); return { c, sc }; };
  const verdict = (c, ok, txt) => { const v = el('p', 'quiz-verdict ' + (ok ? 'ok' : 'ko'), txt); v.setAttribute('role', 'status'); c.append(v); return v; };
  const bouton = (txt, f, cls = '') => { const b = el('button', 'bouton ' + cls, txt); b.type = 'button'; b.addEventListener('click', f); return b; };

  /* ---------- Jeux à choix (qui, genre, unités, détective, personnage) ---------- */
  const QCM = {
    qui: { cat: 'Auteur', fixe: false, d: [
      { q: '« Il faut manger pour vivre et non pas vivre pour manger. »', a: 'Molière', o: ['Racine', 'Marivaux', 'Corneille'], e: 'Une réplique de L\'Avare.' },
      { q: '« Couvrez ce sein que je ne saurais voir. »', a: 'Molière', o: ['Beaumarchais', 'Musset', 'Corneille'], e: 'Tartuffe, bien sûr. Molière a vraiment le chic pour les scènes gênantes.' },
      { q: '« Rodrigue, as-tu du cœur ? »', a: 'Corneille', o: ['Racine', 'Molière', 'Musset'], e: 'Une réplique du Cid.' },
      { q: '« Pour qui sont ces serpents qui sifflent sur vos têtes ? »', a: 'Racine', o: ['Corneille', 'Shakespeare', 'Molière'], e: 'Tirée d\'Andromaque. Ça siffle, ça sent la tragédie.' },
      { q: '« Je me presse de rire de tout, de peur d\'être obligé d\'en pleurer. »', a: 'Beaumarchais', o: ['Molière', 'Marivaux', 'Goethe'], e: 'Figaro dans Le Barbier de Séville.' },
      { q: '« Être ou ne pas être, telle est la question. »', a: 'Shakespeare', o: ['Goethe', 'Sénèque', 'Racine'], e: 'Hamlet, évidemment. Le crâne n\'était pas fourni avec la question.' },
      { q: '« Bonsoir ! La pièce que vous allez voir ce soir ne se déroulera pas comme les autres. »', a: 'Ari Stophane', o: ['Molière', 'Ionesco', 'Marivaux'], e: 'C\'est l\'amirale Bourgeois qui parle, dans Les Ombres du commandement : elle brise le quatrième mur !' }] },
    genre: { cat: 'Genre', fixe: ['Comédie', 'Tragédie', 'Drame'], d: [
      { q: 'Un avare se fait voler sa cassette et poursuit tout le monde en hurlant.', a: 'Comédie', e: 'Les travers des hommes, le rire, la fin heureuse : c\'est une comédie (L\'Avare).' },
      { q: 'Un prince apprend que son père a été assassiné et hésite, hésite, hésite… jusqu\'au bain de sang.', a: 'Tragédie', e: 'Destin fatal, morts en cascade : Hamlet est une tragédie.' },
      { q: 'Un laquais amoureux de la reine se fait passer pour un grand seigneur. Rires, puis larmes.', a: 'Drame', e: 'Mélange du comique et du tragique : c\'est le drame romantique (Ruy Blas de Hugo).' },
      { q: 'Un malade qui n\'est pas malade se déguise en médecin et tout le monde s\'embrouille.', a: 'Comédie', e: 'Le Malade imaginaire : on se moque, on ne pleure pas.' },
      { q: 'Une reine, rongée par une passion interdite, finit par s\'empoisonner.', a: 'Tragédie', e: 'Phèdre de Racine : la passion fatale, grande spécialité de la tragédie.' }] },
    unites: { cat: 'Unité', fixe: ['Temps', 'Lieu', 'Action'], d: [
      { q: 'L\'histoire dure trois semaines : acte I lundi, acte II dans dix jours, acte III en fin de mois.', a: 'Temps', e: 'La règle classique veut que l\'action tienne en une journée (24 heures).' },
      { q: 'L\'acte I se passe à Paris, l\'acte II à Rome et l\'acte III sur un bateau.', a: 'Lieu', e: 'La règle classique veut un seul lieu : le voyageur n\'a pas sa place sur scène.' },
      { q: 'Une enquête sur un vol, mais au milieu, un mariage sans rapport, puis un concours de cuisine.', a: 'Action', e: 'Une seule intrigue principale, pas de feuilleton dans la pièce !' }] },
    detective: { cat: 'Enquête', d: [
      { q: 'Le carnet de la Société secrète des chiens a disparu du parc de Villeroy. Qui l\'a pris ?', cl: ['Des empreintes de grandes chaussures de sport dans la boue.', 'Le voleur a su aller droit à la cachette sans chercher.', 'Un livre de la bibliothèque est tombé : c\'est celui de l\'amie qui adore se documenter.'], a: 'Jean', o: ['Clarisse', 'Valentine', 'Sophie'], e: 'Athlétique et robuste, Jean a laissé les empreintes. Clarisse, trop évidente, avait un alibi : elle était à la bibliothèque. Le livre était un leurre !' },
      { q: 'Quelqu\'un a bougé la dalle en pierre pendant la nuit. Qui est le coupable ?', cl: ['Les feuilles autour de la dalle ont été balayées proprement.', 'La personne ne s\'est pas fait remarquer : aucun bruit.', 'Elle connaît le souterrain depuis longtemps.'], a: 'Jacques Dupont', o: ['Jean', 'Valentine', 'Clarisse'], e: 'Le vieux gardien du souterrain, bien sûr : il vérifiait que tout était en ordre !' }] },
    perso: { cat: 'Personnage', d: [
      { q: 'Médecin de bord.', a: 'Seconde Maîtresse Florence Blanchard', o: ['Amirale Judith Bourgeois', 'Première Maîtresse Violette Hémery', 'Major Pauline Blanchard'], e: 'Dans Les Ombres du commandement. Elle est aussi la sœur cadette de la Major Pauline Blanchard.' },
      { q: 'Vieux gardien du souterrain, il révèle aux amis le secret de Villeroy.', a: 'Jacques Dupont', o: ['Jean', 'Florent Durand', 'Charles Dubois'], e: 'Dans La Société secrète des chiens et les Mystères de Villeroy.' },
      { q: 'Inspectrice générale de la Marine et enquêtrice.', a: 'Amirale Judith Bourgeois', o: ['Amirale Martine De la Croix', 'Seconde Maîtresse Florence Blanchard', 'Première Maîtresse Violette Hémery'], e: 'C\'est elle qui brise le quatrième mur au début des Ombres du commandement.' },
      { q: 'Mari de Florence et père de Floriane.', a: 'Florent Durand', o: ['Charles Dubois', 'Jacques Dupont', 'Jean'], e: 'Dans Le Secret. Charles Dubois, lui, est l\'ex-mari de Florence.' },
      { q: 'Archiviste et analyste de données.', a: 'Première Maîtresse Violette Hémery', o: ['Maître François Courtial', 'Vice-amiral Léon Vaillancourt', 'Amirale Martine De la Croix'], e: 'Dans Les Ombres du commandement.' },
      { q: 'Souple et toujours prête à bondir, elle découvre la dalle en pierre.', a: 'Valentine', o: ['Sophie', 'Clarisse', 'Françoise'], e: 'Elle bute sur la dalle en pierre dans La Société secrète des chiens.' }] }
  };
  const qcm = (rac, id) => {
    const J = QCM[id]; let paquet = [], n = 0, ok = 0;
    const suivant = () => {
      if (!paquet.length) paquet = mel(J.d);
      const d = paquet.pop(); const { c, sc } = carte(rac, J.cat);
      sc.textContent = `Score : ${ok} / ${n}`;
      c.append(el('h3', 'quiz-question', d.q));
      if (d.cl) { const u = el('ul', 'jeu-indices'); d.cl.forEach((t, i) => u.append(el('li', '', 'Indice ' + (i + 1) + ' : ' + t))); c.append(u); }
      const opts = J.fixe || mel([d.a, ...d.o]); const g = el('div', 'quiz-reponses'); g.setAttribute('role', 'group');
      opts.forEach((t, i) => {
        const b = el('button', 'quiz-rep'); b.type = 'button';
        const l = el('span', 'quiz-lettre', J.fixe && id === 'genre' ? '' : 'ABCD'[i]); l.setAttribute('aria-hidden', 'true');
        if (id === 'genre' && i < 2) { l.innerHTML = '<svg viewBox="0 0 100 120" style="width:22px;height:26px;color:#fff"><use href="#m-' + (i ? 'tragedie' : 'comedie') + '"/></svg>'; l.style.background = 'transparent'; }
        b.append(l, el('span', '', t));
        b.addEventListener('click', () => {
          if (g.dataset.fini) return; g.dataset.fini = 1; n++;
          const bon = t === d.a; if (bon) ok++;
          c.classList.add(bon ? 'juste' : 'faux'); b.classList.add(bon ? 'juste' : 'faux');
          [...g.children].forEach((x) => { x.setAttribute('aria-disabled', 'true'); if (x.lastChild.textContent === d.a) x.classList.add('juste'); });
          sc.textContent = `Score : ${ok} / ${n}`;
          verdict(c, bon, bon ? 'Bravo !' : 'Raté, c\'était : ' + d.a); c.append(el('p', 'quiz-texte', d.e));
          const s = bouton('Suivant', suivant); c.append(s); s.focus();
        });
        g.append(b);
      });
      c.append(g);
    };
    suivant();
  };

  /* ---------- Remets la scène en ordre ---------- */
  const SCENES = [
    { t: 'Le Secret, acte I, scène 1', l: ['FLORIANE. Je crois que nous avons passé une agréable après-midi mes amies. Qu\'en pensez-vous ?', 'SOPHIE. C\'était super, Floriane ! La prochaine fois, c\'est moi qui vous inviterai.', 'MARIE-ÉLOÏSE. Très bonne idée, Sophie. J\'ai hâte de venir.', 'PAULINE. Surtout que nous allons super bien nous amuser ! Dommage que cette après-midi soit passée si vite.'] },
    { t: 'Les Mystères de Villeroy', l: ['Absorbée par la conversation, Valentine avance sans prêter attention au sol.', 'Soudain, son pied heurte un obstacle.', 'Pensant d\'abord à une racine, elle regarde par terre mais n\'en voit aucune.', 'Elle retire les feuilles accumulées et découvre une grande dalle en pierre.'] }];
  const ordre = (rac) => {
    let k = -1;
    const manche = () => {
      k = (k + 1) % SCENES.length; const S = SCENES[k]; const { c } = carte(rac, S.t); let suite = 0;
      c.append(el('p', 'quiz-texte', 'Touche les lignes dans l\'ordre de la scène.'));
      const ul = el('div', 'jeu-ordre');
      mel(S.l.map((t, i) => ({ t, i }))).forEach((x) => {
        const b = el('button', 'quiz-rep jeu-ligne', x.t); b.type = 'button';
        b.addEventListener('click', () => {
          if (b.classList.contains('juste')) return;
          if (x.i === suite) { b.classList.add('juste'); b.prepend(el('strong', '', (++suite) + '. ')); if (suite === S.l.length) { verdict(c, true, 'Scène remise en ordre, le rideau peut se lever !'); const s = bouton('Autre scène', manche); c.append(s); s.focus(); } }
          else { b.classList.add('faux'); setTimeout(() => b.classList.remove('faux'), 600); }
        });
        ul.append(b);
      });
      c.append(ul);
    };
    manche();
  };

  /* ---------- Le mot mystère ---------- */
  const MOTS = [['RIDEAU', 'Grande toile qui s\'ouvre et se ferme sur la scène.'], ['DIDASCALIE', 'Indication de l\'auteur écrite dans le texte, mais jamais prononcée.'], ['CABOTIN', 'Comédien qui en fait trop, ou pire, qui cherche juste à se faire remarquer.'], ['COULISSES', 'L\'envers du décor, là où l\'on se cache avant d\'entrer.'], ['TIRADE', 'Longue réplique qui laisse peu de place aux autres.'], ['SOUFFLEUR', 'Il glisse le texte à voix basse, caché dans sa coquille.'], ['MONOLOGUE', 'Un personnage parle seul, souvent à voix haute.'], ['ENTRACTE', 'Pause entre deux actes : les spectateurs vont chercher des glaces.']];
  const mot = (rac) => {
    const manche = () => {
      const [m, ind] = tire(MOTS); const { c } = carte(rac, 'Mot mystère'); let err = 0; const trouvees = new Set(), jouees = new Set(); const MAX = 11;
      c.append(el('p', 'quiz-texte', 'Indice : ' + ind));
      const aff = el('p', 'jeu-mot'); aff.setAttribute('aria-live', 'polite'); const vies = el('p', 'quiz-score'); c.append(aff, vies);
      const clavier = el('div', 'jeu-clavier'); c.append(clavier);
      const maj = () => { aff.textContent = [...m].map((l) => trouvees.has(l) ? l : '_').join(' '); vies.textContent = 'Erreurs : ' + err + ' / ' + MAX; };
      const fin = (gagne) => { [...clavier.children].forEach((b) => b.disabled = true); verdict(c, gagne, gagne ? 'Bravo, tu as trouvé : ' + m + ' !' : 'Perdu ! Le mot était : ' + m); const s = bouton('Nouveau mot', manche); c.append(s); s.focus(); };
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach((l) => {
        const b = el('button', 'jeu-touche', l); b.type = 'button';
        b.addEventListener('click', () => {
          b.disabled = true; if (m.includes(l)) { trouvees.add(l); b.classList.add('juste'); } else { err++; b.classList.add('faux'); }
          maj(); if ([...m].every((x) => trouvees.has(x))) fin(true); else if (err >= MAX) fin(false);
        });
        clavier.append(b);
      });
      maj();
    };
    manche();
  };

  /* ---------- Le metteur en scène ---------- */
  const SC = [
    { q: 'Un roi apprend une très mauvaise nouvelle.', ch: [['Éclairage', ['Lumière froide et basse', 'Plein feu joyeux', 'Rose bonbon'], 0], ['Décor', ['Salle du trône vide et immense', 'Plage de vacances', 'Cuisine en désordre'], 0], ['Accessoire', ['Une lettre froissée', 'Un ballon de baudruche', 'Un parapluie à fleurs'], 0]] },
    { q: 'Deux amies fêtent la fin d\'une agréable après-midi.', ch: [['Éclairage', ['Lumière chaude du soir', 'Obscurité totale', 'Stroboscope de discothèque'], 0], ['Décor', ['Un salon douillet', 'Un champ de bataille', 'Un cachot'], 0], ['Accessoire', ['Une théière et des gâteaux', 'Une épée', 'Une tête de mort'], 0]] }];
  const metteur = (rac) => {
    let k = -1;
    const manche = () => {
      k = (k + 1) % SC.length; const S = SC[k]; const { c } = carte(rac, 'Mise en scène'); c.append(el('h3', 'quiz-question', S.q));
      const sel = S.ch.map(([nom, o]) => { const lab = el('label', 'jeu-choix', nom + ' : '); const s = el('select'); s.append(el('option', '', 'Choisir…')); mel(o.map((t, i) => ({ t, i }))).forEach((x) => { const op = el('option', '', x.t); op.value = x.i; s.append(op); }); lab.append(s); c.append(lab); return s; });
      c.append(bouton('Lever le rideau', () => {
        if (sel.some((s) => s.selectedIndex === 0)) return; const sc = sel.filter((s, i) => +s.value === S.ch[i][2]).length;
        verdict(c, sc === 3, 'Note : ' + sc + ' / 3. ' + (sc === 3 ? 'Un vrai metteur en scène !' : 'Le public est perplexe…')); c.append(bouton('Autre scène', manche, 'bouton-contour-encre'));
      }));
    };
    manche();
  };

  /* ---------- Écris la suite ---------- */
  const HIST = { t: 'Le soir tombe sur Villeroy. Valentine soulève la dalle de pierre et découvre un escalier qui s\'enfonce dans le noir…', c: [
    { l: 'Descendre tout de suite', t: 'Les marches sont glissantes. Au fond, une lanterne s\'allume toute seule…', c: [{ l: 'Suivre la lumière', t: 'FIN : la lanterne guide jusqu\'à Jacques Dupont, le vieux gardien, qui sourit : « Enfin des enquêteurs ! »' }, { l: 'Éteindre la lanterne', t: 'FIN : dans le noir complet, une voix murmure : « Tu aurais dû la suivre… » La suite est à écrire !' }] },
    { l: 'Prévenir la Société secrète', t: 'Jean, Sophie et Clarisse arrivent en courant, Clarisse avec un livre sur les souterrains.', c: [{ l: 'Tous descendre ensemble', t: 'FIN : l\'équipe soudée découvre le secret de Villeroy… et un coffre qui porte leur nom.' }, { l: 'Faire d\'abord des recherches', t: 'FIN : Clarisse trouve la carte du souterrain, mais le lendemain la dalle est refermée. Qui est venu la nuit ?' }] }] };
  const suite = (rac) => {
    const va = (n) => {
      const { c } = carte(rac, 'Histoire'); c.append(el('p', 'quiz-texte jeu-recit', n.t));
      if (n.c) { const g = el('div', 'quiz-reponses'); n.c.forEach((x) => { const b = el('button', 'quiz-rep'); b.type = 'button'; b.append(el('span', '', x.l)); b.addEventListener('click', () => va(x)); g.append(b); }); c.append(g); }
      else { const a = el('a', 'bouton', 'Envoyer ma suite'); a.href = IDEE; a.target = '_blank'; a.rel = 'noopener noreferrer'; c.append(a, ' ', bouton('Rejouer', () => va(HIST), 'bouton-contour-encre')); }
    };
    va(HIST);
  };

  /* ---------- Le générateur d'histoires ---------- */
  const GEN = [['Un souffleur distrait', 'Une amirale pressée', 'Un chien détective', 'Un comédien cabotin', 'Une archiviste curieuse'], ['dans un souterrain', 'sur un navire de la Marine', 'derrière le rideau', 'dans le parc de Villeroy', 'dans un ascenseur en panne'], ['et une lettre froissée', 'et une dalle de pierre', 'et un masque fendu', 'et une lanterne qui s\'allume seule', 'et un carnet disparu']];
  const generateur = (rac) => {
    const { c } = carte(rac, 'Idée à développer'); const roues = el('div', 'jeu-roues'); const r = GEN.map(() => { const e = el('div', 'jeu-roue', '?'); roues.append(e); return e; });
    const res = el('div'); c.append(roues, res);
    const tourne = bouton('Faire tourner les roues', () => {
      res.textContent = ''; tourne.disabled = true; let t = 0;
      const iv = setInterval(() => { r.forEach((e, i) => { if (t < 8 + i * 4) e.textContent = tire(GEN[i]); }); if (++t > 20) { clearInterval(iv); tourne.disabled = false; const a = el('a', 'bouton bouton-encre', 'Envoyer cette idée'); a.href = IDEE; a.target = '_blank'; a.rel = 'noopener noreferrer'; res.append(a); } }, 110);
    }); c.append(tourne);
  };

  const JEUX = { ordre, mot, metteur, suite, generateur };
  document.querySelectorAll('.jeu[data-jeu]').forEach((rac) => { const id = rac.dataset.jeu; if (QCM[id]) qcm(rac, id); else if (JEUX[id]) JEUX[id](rac); });
})();
