/* Archives : recherche par mots-clés et filtres par section */
(() => {
  const champ = document.getElementById('recherche'), compte = document.getElementById('archive-compte');
  const sections = [...document.querySelectorAll('section[data-filtrable]')];
  if (!champ || !sections.length) return;
  const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const coches = (d, nom) => [...d.querySelectorAll(`input[name="${nom}"]:checked`)].map((i) => i.value);

  const lit = (dlg) => ({ types: coches(dlg, 'type'), cats: coches(dlg, 'cat'), debut: dlg.querySelector('[name=debut]').value, fin: dlg.querySelector('[name=fin]').value, mode: dlg.querySelector('[name=mode]:checked').value });

  const appliquer = () => {
    const q = norm(champ.value.trim()).split(/\s+/).filter(Boolean); let total = 0;
    sections.forEach((sec) => {
      const dlg = document.getElementById(sec.dataset.filtrable), f = lit(dlg);
      dlg.querySelector('[name=fin]').min = f.debut || '';
      let vus = 0;
      sec.querySelectorAll('[data-anecdote]').forEach((a) => {
        const d = a.dataset; a._t = a._t || norm(a.textContent + ' ' + (d.mots || ''));
        /* Chaque groupe rempli donne un critère ; les groupes vides sont ignorés */
        const criteres = [];
        if (f.types.length) criteres.push(f.types.includes(d.type));
        if (f.cats.length) criteres.push(f.cats.includes(d.categorie));
        if (f.debut || f.fin) criteres.push((!f.fin || d.debut <= f.fin) && (!f.debut || (d.fin || '9999-12-31') >= f.debut));
        const filtre = !criteres.length || (f.mode === 'tous' ? criteres.every(Boolean) : criteres.some(Boolean));
        const ok = filtre && q.every((m) => a._t.includes(m));
        const avant = a.hidden; a.hidden = !ok;
        if (ok) { vus++; if (avant) { a.classList.remove('revient'); void a.offsetWidth; a.classList.add('revient'); } }
      });
      const n = (f.types.length ? 1 : 0) + (f.cats.length ? 1 : 0) + (f.debut || f.fin ? 1 : 0);
      const pastille = sec.querySelector('.filtre-compte'); pastille.hidden = !n; pastille.textContent = n;
      const vide = sec.querySelector('.archive-vide'); vide.hidden = vus > 0 || !!sec.querySelector('[data-attente]');
      vide.textContent = n ? 'Aucune anecdote n\'est disponible pour le moment avec les filtres choisis.' : 'Aucune anecdote ne correspond à cette recherche pour le moment.';
      total += vus;
    });
    compte.textContent = q.length ? (total ? `${total} anecdote${total > 1 ? 's' : ''} correspond${total > 1 ? 'ent' : ''} à votre recherche.` : 'Aucune anecdote ne correspond à votre recherche.') : '';
  };

  champ.addEventListener('input', appliquer);
  sections.forEach((sec) => {
    const dlg = document.getElementById(sec.dataset.filtrable);
    sec.querySelector('.filtre-ouvrir').addEventListener('click', () => dlg.showModal());
    dlg.addEventListener('change', appliquer);
    dlg.querySelectorAll('[data-fermer]').forEach((b) => b.addEventListener('click', () => dlg.close()));
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
    dlg.querySelector('[data-reinit]').addEventListener('click', () => {
      dlg.querySelectorAll('input[type=checkbox]').forEach((i) => { i.checked = false; });
      dlg.querySelector('[name=mode][value=un]').checked = true;
      dlg.querySelectorAll('input[type=date]').forEach((i) => { i.value = ''; });
      appliquer();
    });
  });
  appliquer();
})();
