'use strict';


const API_PROJECTS = 'https://webcraft-api.vercel.app/data/projects.json';
const API_COURSES  = 'https://webcraft-api.vercel.app/data/courses.json';



/**
 * Retourne un élément du DOM ou null (pas d'erreur si absent)
 * @param {string} selector
 * @returns {Element|null}
 */
const qs = (selector) => document.querySelector(selector);

/**
 * Retourne plusieurs éléments du DOM
 * @param {string} selector
 * @returns {NodeList}
 */
const qsa = (selector) => document.querySelectorAll(selector);

/**
 * Affiche ou masque un élément (toggle classe d-none)
 * @param {Element|null} el
 * @param {boolean} visible
 */
const setVisible = (el, visible) => {
  if (!el) return;
  el.classList.toggle('d-none', !visible);
};

/**
 * Génère les étoiles HTML pour une note donnée
 * @param {number} rating
 * @returns {string}
 */
const renderStars = (rating) => {
  const full  = Math.floor(rating);
  const half  = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;

  let html = '';
  for (let i = 0; i < full;  i++) html += '<i class="bi bi-star-fill" aria-hidden="true"></i>';
  if (half)                        html += '<i class="bi bi-star-half" aria-hidden="true"></i>';
  for (let i = 0; i < empty; i++) html += '<i class="bi bi-star" aria-hidden="true"></i>';
  return html;
};

/**
 * Génère les badges de technologies
 * @param {string[]} techs
 * @returns {string}
 */
const renderTechBadges = (techs) =>
  techs.map(t => `<span class="tech-badge">${t}</span>`).join('');

/**
 * Retourne la classe CSS du niveau
 * @param {string} level
 * @returns {string}
 */
const levelClass = (level) => {
  const map = {
    'Débutant':      'level-debutant',
    'Intermédiaire': 'level-intermediaire',
    'Avancé':        'level-avance',
  };
  return map[level] || 'level-debutant';
};

/**
 * Popule un <select> avec des <option>
 * @param {HTMLSelectElement|null} el
 * @param {string[]} values
 */
const populateSelect = (el, values) => {
  if (!el) return;
  values.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v;
    opt.textContent = v;
    el.appendChild(opt);
  });
};

const initNavbarScroll = () => {
  const nav = qs('#mainNav');
  if (!nav) return;

  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // appel initial
};



/** @type {Object[]} Données brutes depuis l'API */
let allProjects = [];

/**
 * Récupère les projets depuis l'API et affiche la grille
 */
const loadProjects = async () => {
  const loader  = qs('#projects-loader');
  const error   = qs('#projects-error');
  const grid    = qs('#projects-grid');
  const empty   = qs('#projects-empty');

  if (!grid) return; // on n'est pas sur index.html

  setVisible(loader, true);
  setVisible(error, false);
  setVisible(empty, false);

  try {
    const response = await fetch(API_PROJECTS);
    if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);

    const data = await response.json();
    allProjects = data.projects;

    // Peupler les filtres
    populateSelect(qs('#project-category'), data.categories);
    populateSelect(qs('#project-tech'),     data.technologies);

    setVisible(loader, false);
    renderProjects(allProjects);
    attachProjectFilters();

  } catch (err) {
    console.error('[Projets] Erreur :', err);
    setVisible(loader, false);
    setVisible(error, true);
    const msgEl = qs('#projects-error-msg');
    if (msgEl) msgEl.textContent = `Détail : ${err.message}`;
  }
};

/**
 * Affiche la grille de cartes de projets
 * @param {Object[]} projects
 */
const renderProjects = (projects) => {
  const grid  = qs('#projects-grid');
  const empty = qs('#projects-empty');
  const count = qs('#project-count');

  if (!grid) return;

  if (projects.length === 0) {
    grid.innerHTML = '';
    setVisible(empty, true);
    if (count) count.innerHTML = 'Aucun résultat';
    return;
  }

  setVisible(empty, false);
  if (count) count.innerHTML = `<strong>${projects.length}</strong> projet${projects.length > 1 ? 's' : ''} trouvé${projects.length > 1 ? 's' : ''}`;

  grid.innerHTML = projects.map(p => `
    <div class="col-lg-4 col-md-6">
      <article class="project-card" aria-labelledby="project-title-${p.id}">
        <div class="project-card-img-wrapper">
          <img
            src="${p.image}"
            alt="Aperçu du projet ${p.title}"
            class="project-card-img"
            loading="lazy"
            onerror="this.src='https://placehold.co/800x400/1a56db/ffffff?text=WebCraft'"
          />
          <span class="project-card-badge">${p.category}</span>
          <span class="project-card-year">${p.year}</span>
        </div>
        <div class="project-card-body">
          <p class="project-card-client">
            <i class="bi bi-building" aria-hidden="true"></i>${p.client}
          </p>
          <h3 class="project-card-title" id="project-title-${p.id}">${p.title}</h3>
          <p class="project-card-desc">${p.description}</p>
          <div class="tech-badges" aria-label="Technologies utilisées">
            ${renderTechBadges(p.technologies)}
          </div>
          <p class="project-card-duration">
            <i class="bi bi-clock" aria-hidden="true"></i>Durée : ${p.duration}
          </p>
          <button
            class="project-card-btn"
            data-project-id="${p.id}"
            aria-label="Voir les détails du projet ${p.title}"
          >
            <i class="bi bi-eye" aria-hidden="true"></i>Voir détails
          </button>
        </div>
      </article>
    </div>
  `).join('');

  // Attacher les événements sur les boutons "Voir détails"
  qsa('[data-project-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.projectId, 10);
      openProjectModal(id);
    });
  });
};

/**
 * Attache les filtres de projets (recherche + catégorie + technologie)
 */
const attachProjectFilters = () => {
  const searchInput = qs('#project-search');
  const categorySelect = qs('#project-category');
  const techSelect = qs('#project-tech');
  const resetBtn = qs('#project-reset');

  const applyFilters = () => {
    const search = (searchInput?.value ?? '').toLowerCase().trim();
    const category = categorySelect?.value ?? '';
    const tech = techSelect?.value ?? '';

    const filtered = allProjects.filter(p => {
      const matchSearch = !search ||
        p.title.toLowerCase().includes(search) ||
        p.client.toLowerCase().includes(search) ||
        p.technologies.some(t => t.toLowerCase().includes(search));

      const matchCategory = !category || p.category === category;
      const matchTech = !tech || p.technologies.includes(tech);

      return matchSearch && matchCategory && matchTech;
    });

    renderProjects(filtered);
  };

  searchInput?.addEventListener('input', applyFilters);
  categorySelect?.addEventListener('change', applyFilters);
  techSelect?.addEventListener('change', applyFilters);

  resetBtn?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    if (categorySelect) categorySelect.value = '';
    if (techSelect) techSelect.value = '';
    applyFilters();
  });
};

/**
 * Ouvre la modal de détails d'un projet
 * @param {number} id
 */
const openProjectModal = (id) => {
  const project = allProjects.find(p => p.id === id);
  if (!project) return;

  const modalBody = qs('#projectModalBody');
  const modalLabel = qs('#projectModalLabel');
  const modalUrl = qs('#projectModalUrl');

  if (!modalBody) return;

  // Titre et lien
  if (modalLabel) modalLabel.textContent = project.title;
  if (modalUrl) modalUrl.href = project.url || '#';

  // Contenu du body
  modalBody.innerHTML = `
    <img
      src="${project.image}"
      alt="Image du projet ${project.title}"
      class="modal-project-img"
      onerror="this.src='https://placehold.co/800x400/1a56db/ffffff?text=WebCraft'"
    />
    <div class="modal-body-content">
      <div class="modal-project-meta">
        <div class="modal-meta-item">
          <i class="bi bi-building" aria-hidden="true"></i>
          <span><strong>Client :</strong> ${project.client}</span>
        </div>
        <div class="modal-meta-item">
          <i class="bi bi-tag" aria-hidden="true"></i>
          <span><strong>Catégorie :</strong> ${project.category}</span>
        </div>
        <div class="modal-meta-item">
          <i class="bi bi-calendar3" aria-hidden="true"></i>
          <span><strong>Année :</strong> ${project.year}</span>
        </div>
        <div class="modal-meta-item">
          <i class="bi bi-clock" aria-hidden="true"></i>
          <span><strong>Durée :</strong> ${project.duration}</span>
        </div>
      </div>
      <p class="modal-description">${project.description}</p>
      <div class="tech-badges mb-3" aria-label="Technologies utilisées">
        ${renderTechBadges(project.technologies)}
      </div>
      ${project.features && project.features.length > 0 ? `
        <p class="modal-features-title">Fonctionnalités principales</p>
        <ul class="modal-features-list" aria-label="Liste des fonctionnalités">
          ${project.features.map(f => `<li>${f}</li>`).join('')}
        </ul>
      ` : ''}
    </div>
  `;

  const modal = new bootstrap.Modal(qs('#projectModal'));
  modal.show();
};


/** @type {Object[]} Données brutes depuis l'API */
let allCourses = [];


const loadCourses = async () => {
  const loader = qs('#courses-loader');
  const error  = qs('#courses-error');
  const grid   = qs('#courses-grid');
  const empty  = qs('#courses-empty');

  if (!grid) return; // on n'est pas sur index.html

  setVisible(loader, true);
  setVisible(error, false);
  setVisible(empty, false);

  try {
    const response = await fetch(API_COURSES);
    if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);

    const data = await response.json();
    allCourses = data.courses;

    // Peupler les filtres
    populateSelect(qs('#course-category'), data.categories);
    populateSelect(qs('#course-level'),    data.levels);
    populateSelect(qs('#course-tech'),     data.technologies);

    setVisible(loader, false);
    renderCourses(allCourses);
    attachCourseFilters();

  } catch (err) {
    console.error('[Formations] Erreur :', err);
    setVisible(loader, false);
    setVisible(error, true);
    const msgEl = qs('#courses-error-msg');
    if (msgEl) msgEl.textContent = `Détail : ${err.message}`;
  }
};

/**
 * Affiche la grille de cartes de formations
 * @param {Object[]} courses
 */
const renderCourses = (courses) => {
  const grid  = qs('#courses-grid');
  const empty = qs('#courses-empty');
  const count = qs('#course-count');

  if (!grid) return;

  if (courses.length === 0) {
    grid.innerHTML = '';
    setVisible(empty, true);
    if (count) count.innerHTML = 'Aucun résultat';
    return;
  }

  setVisible(empty, false);
  if (count) count.innerHTML = `<strong>${courses.length}</strong> formation${courses.length > 1 ? 's' : ''} trouvée${courses.length > 1 ? 's' : ''}`;

  grid.innerHTML = courses.map(c => `
    <div class="col-lg-4 col-md-6">
      <article class="course-card" aria-labelledby="course-title-${c.id}">
        <div class="course-card-img-wrapper">
          <img
            src="${c.image}"
            alt="Aperçu de la formation ${c.title}"
            class="course-card-img"
            loading="lazy"
            onerror="this.src='https://placehold.co/800x400/06b6d4/ffffff?text=Formation'"
          />
          <span class="level-badge ${levelClass(c.level)}">${c.level}</span>
          <span class="availability-badge ${c.available ? 'available-yes' : 'available-no'}">
            ${c.available ? 'Disponible' : 'Complet'}
          </span>
        </div>
        <div class="course-card-body">
          <p class="course-card-category">${c.category}</p>
          <h3 class="course-card-title" id="course-title-${c.id}">${c.title}</h3>
          <div class="course-rating">
            <span class="stars" aria-label="Note : ${c.rating} sur 5">
              ${renderStars(c.rating)}
            </span>
            <span class="rating-value">${c.rating}</span>
            <span class="rating-students">(${c.students} étudiant${c.students > 1 ? 's' : ''})</span>
          </div>
          <div class="course-card-meta">
            <span><i class="bi bi-clock" aria-hidden="true"></i>${c.duration}</span>
            <span><i class="bi bi-person" aria-hidden="true"></i>${c.instructor}</span>
          </div>
          <div class="tech-badges mb-2" aria-label="Technologies enseignées">
            ${renderTechBadges(c.technologies)}
          </div>
          <p class="course-price">
            <span class="currency">€</span>${c.price}
          </p>
          <div class="course-card-actions">
            <button
              class="custom-btn custom-btn-outline-sm"
              data-course-id="${c.id}"
              aria-label="Voir les détails de la formation ${c.title}"
            >
              <i class="bi bi-eye me-1" aria-hidden="true"></i>Détails
            </button>
            <a
              href="inscription.html?formation=${encodeURIComponent(c.title)}"
              class="custom-btn custom-btn-success"
              aria-label="S'inscrire à la formation ${c.title}"
            >
              <i class="bi bi-person-plus me-1" aria-hidden="true"></i>S'inscrire
            </a>
          </div>
        </div>
      </article>
    </div>
  `).join('');

  // Attacher les événements "Voir détails"
  qsa('[data-course-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.courseId, 10);
      openCourseModal(id);
    });
  });
};


const attachCourseFilters = () => {
  const searchInput    = qs('#course-search');
  const categorySelect = qs('#course-category');
  const levelSelect    = qs('#course-level');
  const techSelect     = qs('#course-tech');
  const resetBtn       = qs('#course-reset');

  const applyFilters = () => {
    const search   = (searchInput?.value ?? '').toLowerCase().trim();
    const category = categorySelect?.value ?? '';
    const level    = levelSelect?.value ?? '';
    const tech     = techSelect?.value ?? '';

    const filtered = allCourses.filter(c => {
      const matchSearch = !search ||
        c.title.toLowerCase().includes(search) ||
        c.instructor.toLowerCase().includes(search) ||
        c.technologies.some(t => t.toLowerCase().includes(search));

      const matchCategory = !category || c.category === category;
      const matchLevel    = !level    || c.level    === level;
      const matchTech     = !tech     || c.technologies.includes(tech);

      return matchSearch && matchCategory && matchLevel && matchTech;
    });

    renderCourses(filtered);
  };

  searchInput?.addEventListener('input', applyFilters);
  categorySelect?.addEventListener('change', applyFilters);
  levelSelect?.addEventListener('change', applyFilters);
  techSelect?.addEventListener('change', applyFilters);

  resetBtn?.addEventListener('click', () => {
    if (searchInput)    searchInput.value    = '';
    if (categorySelect) categorySelect.value = '';
    if (levelSelect)    levelSelect.value    = '';
    if (techSelect)     techSelect.value     = '';
    applyFilters();
  });
};

/**
 * Ouvre la modal de détails d'une formation
 * @param {number} id
 */
const openCourseModal = (id) => {
  const course = allCourses.find(c => c.id === id);
  if (!course) return;

  const modalBody  = qs('#courseModalBody');
  const modalLabel = qs('#courseModalLabel');
  const modalEnroll = qs('#courseModalEnroll');

  if (!modalBody) return;

  if (modalLabel) modalLabel.textContent = course.title;
  if (modalEnroll) modalEnroll.href = `inscription.html?formation=${encodeURIComponent(course.title)}`;

  modalBody.innerHTML = `
    <img
      src="${course.image}"
      alt="Image de la formation ${course.title}"
      class="modal-course-img"
      onerror="this.src='https://placehold.co/800x400/06b6d4/ffffff?text=Formation'"
    />
    <div class="modal-body-content">
      <div class="modal-course-meta">
        <div class="modal-meta-item">
          <i class="bi bi-tag" aria-hidden="true"></i>
          <span><strong>Catégorie :</strong> ${course.category}</span>
        </div>
        <div class="modal-meta-item">
          <i class="bi bi-bar-chart" aria-hidden="true"></i>
          <span><strong>Niveau :</strong> ${course.level}</span>
        </div>
        <div class="modal-meta-item">
          <i class="bi bi-clock" aria-hidden="true"></i>
          <span><strong>Durée :</strong> ${course.duration}</span>
        </div>
        <div class="modal-meta-item">
          <i class="bi bi-people" aria-hidden="true"></i>
          <span><strong>Étudiants :</strong> ${course.students}</span>
        </div>
      </div>

      <div class="course-rating mb-2">
        <span class="stars" aria-label="Note : ${course.rating} sur 5">${renderStars(course.rating)}</span>
        <span class="rating-value ms-1">${course.rating}/5</span>
      </div>

      <p class="modal-description">${course.description}</p>

      <div class="tech-badges mb-3" aria-label="Technologies enseignées">
        ${renderTechBadges(course.technologies)}
      </div>

      ${course.modules && course.modules.length > 0 ? `
        <p class="modal-modules-title">Modules du programme</p>
        <ul class="modal-modules-list" aria-label="Liste des modules">
          ${course.modules.map(m => `<li>${m}</li>`).join('')}
        </ul>
      ` : ''}

      <div class="modal-instructor">
        <div class="instructor-avatar">
          <i class="bi bi-person" aria-hidden="true"></i>
        </div>
        <div class="instructor-info">
          <div class="instructor-name">${course.instructor}</div>
          <div class="instructor-label">Formateur expert</div>
        </div>
      </div>

      <div class="modal-price-section">
        <div>
          <div class="modal-price-label">Prix de la formation</div>
          <div class="modal-price-label">
            <span class="level-badge ${levelClass(course.level)} me-2">${course.level}</span>
            ${course.available
              ? '<span class="text-success fw-bold"><i class="bi bi-check-circle me-1"></i>Disponible</span>'
              : '<span class="text-secondary fw-bold"><i class="bi bi-x-circle me-1"></i>Complet</span>'}
          </div>
        </div>
        <div class="modal-price-value">${course.price} €</div>
      </div>
    </div>
  `;

  const modal = new bootstrap.Modal(qs('#courseModal'));
  modal.show();
};

const initRetryButtons = () => {
  qs('#projects-retry')?.addEventListener('click', loadProjects);
  qs('#courses-retry')?.addEventListener('click', loadCourses);
};


const loadCoursesForForm = async () => {
  const select = qs('#formation');
  const loaderEl = qs('#formation-loader');

  if (!select) return; // on n'est pas sur inscription.html

  setVisible(loaderEl, true);

  try {
    const response = await fetch(API_COURSES);
    if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);

    const data = await response.json();

    data.courses.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.title;
      opt.textContent = `${c.title} — ${c.price} €`;
      if (!c.available) {
        opt.textContent += ' (Complet)';
        opt.disabled = true;
      }
      select.appendChild(opt);
    });

    setVisible(loaderEl, false);

    // Pré-sélectionner si paramètre URL ?formation=...
    preselectCourseFromURL(select);

  } catch (err) {
    console.error('[Formulaire] Erreur chargement formations :', err);
    setVisible(loaderEl, false);
    const opt = document.createElement('option');
    opt.textContent = 'Impossible de charger les formations';
    opt.disabled = true;
    select.appendChild(opt);
  }
};

/**
 * Pré-sélectionne la formation d'après le paramètre GET ?formation=
 * @param {HTMLSelectElement} select
 */
const preselectCourseFromURL = (select) => {
  const params = new URLSearchParams(window.location.search);
  const formationParam = params.get('formation');
  if (!formationParam) return;

  const options = Array.from(select.options);
  const match = options.find(opt => opt.value === formationParam);
  if (match && !match.disabled) {
    select.value = match.value;
    validateField(select); // déclencher la validation visuelle
  }
};


/** Regex email */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Regex téléphone international */
const PHONE_REGEX = /^\+?[1-9]\d{1,14}$/;

/**
 * Affiche ou efface le message d'erreur d'un champ
 * @param {HTMLElement} field
 * @param {string} message - vide = succès
 */
const setFieldError = (field, message) => {
  if (!field) return;

  const errorEl = qs(`#${field.id}-error`);

  if (message) {
    field.classList.add('is-invalid');
    field.classList.remove('is-valid');
    if (errorEl) errorEl.textContent = message;
  } else {
    field.classList.remove('is-invalid');
    field.classList.add('is-valid');
    if (errorEl) errorEl.textContent = '';
  }
};

/**
 * Valide un champ individuel et retourne true si valide
 * @param {HTMLElement} field
 * @returns {boolean}
 */
const validateField = (field) => {
  if (!field) return true;

  const value = field.value.trim();
  const id    = field.id;

  // Champs requis mais vides
  if (field.required && !value) {
    setFieldError(field, 'Ce champ est obligatoire.');
    return false;
  }

  // Valider selon l'id du champ
  switch (id) {
    case 'prenom':
    case 'nom':
      if (value.length < 2) {
        setFieldError(field, 'Minimum 2 caractères requis.');
        return false;
      }
      break;

    case 'email':
      if (!EMAIL_REGEX.test(value)) {
        setFieldError(field, 'Adresse email invalide (ex : prenom@domaine.fr).');
        return false;
      }
      break;

    case 'telephone':
      // Supprimer espaces et tirets pour validation
      const cleanPhone = value.replace(/[\s\-().]/g, '');
      if (!PHONE_REGEX.test(cleanPhone)) {
        setFieldError(field, 'Format international requis (ex : +33612345678).');
        return false;
      }
      break;

    case 'formation':
      if (!value) {
        setFieldError(field, 'Veuillez sélectionner une formation.');
        return false;
      }
      break;

    case 'niveau':
      if (!value) {
        setFieldError(field, 'Veuillez sélectionner votre niveau.');
        return false;
      }
      break;

    case 'motivation':
      if (value.length < 50) {
        setFieldError(field, `Minimum 50 caractères (actuellement ${value.length}).`);
        return false;
      }
      break;

    case 'rgpd':
      if (!field.checked) {
        setFieldError(field, 'Vous devez accepter la politique de confidentialité.');
        return false;
      }
      break;
  }

  // Champ valide
  setFieldError(field, '');
  return true;
};

const initFormValidation = () => {
  const form = qs('#inscription-form');
  if (!form) return;

  // Champs à valider
  const fields = ['prenom', 'nom', 'email', 'telephone', 'formation', 'niveau', 'motivation', 'rgpd'];

  // Validation en temps réel sur chaque champ
  fields.forEach(id => {
    const field = qs(`#${id}`);
    if (!field) return;

    const eventType = (field.type === 'checkbox' || field.tagName === 'SELECT') ? 'change' : 'input';
    field.addEventListener(eventType, () => validateField(field));

    // Aussi sur blur (quand on quitte le champ)
    field.addEventListener('blur', () => validateField(field));
  });

  // Compteur de caractères pour la motivation
  const motivationField = qs('#motivation');
  const motivationChars = qs('#motivation-chars');
  const charCounter = qs('#motivation-count');

  motivationField?.addEventListener('input', () => {
    const len = motivationField.value.trim().length;
    if (motivationChars) motivationChars.textContent = len;
    if (charCounter) {
      charCounter.classList.toggle('reached', len >= 50);
    }
  });

  // Soumission du formulaire
  form.addEventListener('submit', handleFormSubmit);
};

/**
 * Gère la soumission du formulaire
 * @param {SubmitEvent} e
 */
const handleFormSubmit = (e) => {
  e.preventDefault();

  const fields = ['prenom', 'nom', 'email', 'telephone', 'formation', 'niveau', 'motivation', 'rgpd'];
  let isValid = true;

  // Valider tous les champs
  fields.forEach(id => {
    const field = qs(`#${id}`);
    if (!validateField(field)) isValid = false;
  });

  if (!isValid) {
    // Scroller vers la première erreur
    const firstError = qs('.is-invalid');
    if (firstError) {
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstError.focus();
    }
    return;
  }

  // Simuler envoi (pas de serveur réel)
  simulateFormSubmit();
};


const simulateFormSubmit = () => {
  const submitBtn  = qs('#submit-btn');
  const submitText = qs('#submit-text');
  const submitLoader = qs('#submit-loader');

  // Afficher le loader sur le bouton
  if (submitBtn)    submitBtn.disabled = true;
  if (submitText)   submitText.textContent = 'Envoi en cours…';
  if (submitLoader) submitLoader.classList.remove('d-none');

  // Récupérer les valeurs pour le message de succès
  const prenom   = qs('#prenom')?.value.trim() ?? '';
  const nom      = qs('#nom')?.value.trim() ?? '';
  const email    = qs('#email')?.value.trim() ?? '';

  // Simuler délai réseau (1,5s)
  setTimeout(() => {
    // Réinitialiser l'état du bouton
    if (submitBtn)    submitBtn.disabled = false;
    if (submitText)   submitText.textContent = 'Envoyer ma demande d\'inscription';
    if (submitLoader) submitLoader.classList.add('d-none');

    // Afficher message de succès
    const successMsg   = qs('#success-message');
    const formContainer = qs('#form-container');
    const successName  = qs('#success-name');
    const successEmail = qs('#success-email');

    if (successName)  successName.textContent  = `${prenom} ${nom}`;
    if (successEmail) successEmail.textContent = email;

    setVisible(formContainer, false);
    setVisible(successMsg, true);
    successMsg?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Réinitialiser le formulaire en arrière-plan
    qs('#inscription-form')?.reset();
    qsa('.is-valid, .is-invalid').forEach(el => {
      el.classList.remove('is-valid', 'is-invalid');
    });
    const charsEl = qs('#motivation-chars');
    if (charsEl) charsEl.textContent = '0';
    qs('#motivation-count')?.classList.remove('reached');

  }, 1500);
};


const initNewInscriptionBtn = () => {
  qs('#success-new')?.addEventListener('click', () => {
    setVisible(qs('#success-message'), false);
    setVisible(qs('#form-container'), true);
    qs('#form-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
};


document.addEventListener('DOMContentLoaded', () => {
  // Commun aux deux pages
  initNavbarScroll();

  if (qs('#projects-grid')) {
    // Les deux API sont indépendantes : si l'une échoue, l'autre fonctionne quand même
    loadProjects();
    loadCourses();
    initRetryButtons();
  }

  if (qs('#inscription-form')) {
    loadCoursesForForm();
    initFormValidation();
    initNewInscriptionBtn();
  }
});

