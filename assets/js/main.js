const header = document.querySelector('[data-header]');
const menuButton = document.querySelector('[data-menu-toggle]');
const nav = document.querySelector('[data-nav]');

if (header && menuButton && nav) {
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!open));
    header.classList.toggle('menu-open', !open);
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      menuButton.setAttribute('aria-expanded', 'false');
      header.classList.remove('menu-open');
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && header.classList.contains('menu-open')) {
      menuButton.setAttribute('aria-expanded', 'false');
      header.classList.remove('menu-open');
      menuButton.focus();
    }
  });
}

const publicationSearch = document.querySelector('[data-publication-search]');
const publicationButtons = document.querySelectorAll('[data-year-filter]');
const publications = document.querySelectorAll('[data-publication]');
const publicationGroups = document.querySelectorAll('[data-publication-group]');
const emptyState = document.querySelector('[data-publication-empty]');
let activeYear = 'all';

function filterPublications() {
  if (!publications.length) return;
  const query = publicationSearch ? publicationSearch.value.trim().toLowerCase() : '';
  let visibleCount = 0;

  publications.forEach((publication) => {
    const matchesYear = activeYear === 'all' || publication.dataset.year === activeYear;
    const matchesSearch = !query || publication.textContent.toLowerCase().includes(query);
    const visible = matchesYear && matchesSearch;
    publication.hidden = !visible;
    if (visible) visibleCount += 1;
  });

  publicationGroups.forEach((group) => {
    const hasVisibleItems = [...group.querySelectorAll('[data-publication]')].some((item) => !item.hidden);
    group.hidden = !hasVisibleItems;
  });

  if (emptyState) emptyState.hidden = visibleCount !== 0;
}

if (publicationSearch) publicationSearch.addEventListener('input', filterPublications);

publicationButtons.forEach((button) => {
  button.addEventListener('click', () => {
    activeYear = button.dataset.yearFilter;
    publicationButtons.forEach((item) => item.classList.toggle('is-active', item === button));
    filterPublications();
  });
});

document.querySelectorAll('[data-publication-abstract-toggle]').forEach((button) => {
  button.addEventListener('click', () => {
    const abstract = document.getElementById(button.getAttribute('aria-controls'));
    if (!abstract) return;
    const willOpen = button.getAttribute('aria-expanded') !== 'true';
    button.setAttribute('aria-expanded', String(willOpen));
    abstract.hidden = !willOpen;
  });
});

const parallaxHero = document.querySelector('[data-parallax-hero]');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

if (parallaxHero && !prefersReducedMotion.matches) {
  let parallaxFramePending = false;

  const updateHeroParallax = () => {
    // Use the page scroll position so the effect starts immediately, including
    // while the navigation bar is still moving out of view.
    const distancePastTop = Math.max(0, window.scrollY);
    // Keep the landscape visually farther away than the foreground artwork.
    // The stronger offset counteracts most of the page's normal scroll speed,
    // while the droplet continues to move almost naturally with the content.
    const backgroundOffset = Math.min(distancePastTop * 0.58, 360);
    const figureOffset = Math.min(distancePastTop * 0.06, 48);

    parallaxHero.style.setProperty('--hero-bg-offset', `${backgroundOffset}px`);
    parallaxHero.style.setProperty('--hero-figure-offset', `${figureOffset}px`);
    parallaxFramePending = false;
  };

  const requestHeroParallaxUpdate = () => {
    if (parallaxFramePending) return;
    parallaxFramePending = true;
    window.requestAnimationFrame(updateHeroParallax);
  };

  updateHeroParallax();
  window.addEventListener('scroll', requestHeroParallaxUpdate, { passive: true });
}

const projectGrid = document.querySelector('[data-project-grid]');
const projectViewButtons = document.querySelectorAll('[data-project-view-button]');
const researchBackLink = document.querySelector('[data-research-back]');
const projectViews = new Set(['standard', 'grid', 'list']);
const projectViewStorageKey = 'lins-project-view';
const researchReturnStorageKey = 'lins-research-return';
const researchRestoreStorageKey = 'lins-research-restore';

function readStorage(storage, key) {
  try {
    return storage.getItem(key);
  } catch (error) {
    return null;
  }
}

function writeStorage(storage, key, value) {
  try {
    storage.setItem(key, value);
  } catch (error) {
    // The controls still work when browser privacy settings disable storage.
  }
}

function removeStorage(storage, key) {
  try {
    storage.removeItem(key);
  } catch (error) {
    // Nothing to remove when storage is unavailable.
  }
}

function updateProjectView(view, updateUrl = false) {
  if (!projectGrid || !projectViews.has(view)) return;

  projectGrid.dataset.projectView = view;
  projectViewButtons.forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.projectViewButton === view));
  });
  writeStorage(window.localStorage, projectViewStorageKey, view);

  if (updateUrl) {
    const url = new URL(window.location.href);
    if (view === 'standard') {
      url.searchParams.delete('view');
    } else {
      url.searchParams.set('view', view);
    }
    window.history.replaceState(window.history.state, '', url);
  }
}

if (projectGrid) {
  const requestedView = new URL(window.location.href).searchParams.get('view');
  const savedView = readStorage(window.localStorage, projectViewStorageKey);
  updateProjectView(projectViews.has(requestedView) ? requestedView : savedView || 'standard');

  projectViewButtons.forEach((button) => {
    button.addEventListener('click', () => {
      updateProjectView(button.dataset.projectViewButton, true);
    });
  });

  projectGrid.addEventListener('click', (event) => {
    const projectLink = event.target.closest('a');
    if (!projectLink) return;
    writeStorage(window.sessionStorage, researchReturnStorageKey, JSON.stringify({
      path: window.location.pathname,
      projectPath: new URL(projectLink.href).pathname,
      scrollY: window.scrollY,
      view: projectGrid.dataset.projectView,
    }));
  });

  const shouldRestore = readStorage(window.sessionStorage, researchRestoreStorageKey) === 'true';
  const savedReturnState = readStorage(window.sessionStorage, researchReturnStorageKey);

  if (shouldRestore && savedReturnState) {
    removeStorage(window.sessionStorage, researchRestoreStorageKey);

    try {
      const returnState = JSON.parse(savedReturnState);
      if (returnState.path === window.location.pathname) {
        updateProjectView(returnState.view, true);
        const restorePosition = () => window.scrollTo({ top: returnState.scrollY, behavior: 'auto' });
        window.requestAnimationFrame(() => window.requestAnimationFrame(restorePosition));
        window.addEventListener('load', restorePosition, { once: true });
        removeStorage(window.sessionStorage, researchReturnStorageKey);
      }
    } catch (error) {
      removeStorage(window.sessionStorage, researchReturnStorageKey);
    }
  }
}

if (researchBackLink) {
  researchBackLink.addEventListener('click', (event) => {
    const savedReturnState = readStorage(window.sessionStorage, researchReturnStorageKey);
    if (!savedReturnState) return;

    try {
      const returnState = JSON.parse(savedReturnState);
      if (returnState.projectPath !== window.location.pathname) return;
      const target = new URL(researchBackLink.href);
      if (projectViews.has(returnState.view) && returnState.view !== 'standard') {
        target.searchParams.set('view', returnState.view);
      }

      event.preventDefault();
      writeStorage(window.sessionStorage, researchRestoreStorageKey, 'true');
      window.location.assign(target.href);
    } catch (error) {
      removeStorage(window.sessionStorage, researchReturnStorageKey);
    }
  });
}

const personLinkGroups = document.querySelectorAll('[data-person-links]');

function closePersonLinkMenus(exceptGroup = null) {
  personLinkGroups.forEach((group) => {
    if (group === exceptGroup) return;
    const toggle = group.querySelector('[data-person-links-toggle]');
    const menu = group.querySelector('[data-person-links-menu]');
    if (!toggle || !menu) return;
    toggle.setAttribute('aria-expanded', 'false');
    menu.hidden = true;
  });
}

function arrangePersonLinks(group) {
  const primary = group.querySelector('[data-person-links-primary]');
  const overflow = group.querySelector('[data-person-links-overflow]');
  const toggle = group.querySelector('[data-person-links-toggle]');
  const menu = group.querySelector('[data-person-links-menu]');
  if (!primary || !overflow || !toggle || !menu) return;

  [...menu.children].forEach((link) => primary.append(link));
  toggle.setAttribute('aria-expanded', 'false');
  menu.hidden = true;
  overflow.hidden = true;

  if (primary.scrollWidth <= primary.clientWidth + 1) return;

  overflow.hidden = false;
  while (primary.scrollWidth > primary.clientWidth + 1 && primary.lastElementChild) {
    menu.prepend(primary.lastElementChild);
  }
}

if (personLinkGroups.length) {
  personLinkGroups.forEach((group) => {
    arrangePersonLinks(group);
    const toggle = group.querySelector('[data-person-links-toggle]');
    const menu = group.querySelector('[data-person-links-menu]');

    toggle.addEventListener('click', () => {
      const willOpen = toggle.getAttribute('aria-expanded') !== 'true';
      closePersonLinkMenus(group);
      toggle.setAttribute('aria-expanded', String(willOpen));
      menu.hidden = !willOpen;
    });
  });

  let personLinkResizeFrame;
  window.addEventListener('resize', () => {
    window.cancelAnimationFrame(personLinkResizeFrame);
    personLinkResizeFrame = window.requestAnimationFrame(() => {
      personLinkGroups.forEach(arrangePersonLinks);
    });
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('[data-person-links]')) closePersonLinkMenus();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closePersonLinkMenus();
  });

  window.addEventListener('load', () => {
    personLinkGroups.forEach(arrangePersonLinks);
  }, { once: true });
}

const memberBioCards = document.querySelectorAll('.team-grid .person-card');

function configureMemberBio(card) {
  const bio = card.querySelector('.person-bio');
  const toggle = card.querySelector('.person-bio-toggle');
  const label = toggle ? toggle.querySelector('[data-person-bio-label]') : null;
  if (!bio || !toggle || !label) return;

  const grid = card.closest('[data-team-grid]');
  if (grid && grid.dataset.teamView === 'compact') {
    bio.classList.remove('is-collapsed');
    toggle.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    label.textContent = 'More';
    return;
  }

  if (toggle.getAttribute('aria-expanded') === 'true') {
    toggle.hidden = false;
    return;
  }

  bio.classList.add('is-collapsed');
  const overflows = bio.scrollHeight > bio.clientHeight + 1;
  toggle.hidden = !overflows;
  if (!overflows) bio.classList.remove('is-collapsed');
}

function refreshMemberBios(scope = document) {
  scope.querySelectorAll('.team-grid .person-card').forEach(configureMemberBio);
}

memberBioCards.forEach((card) => {
  const bio = card.querySelector('.person-bio');
  const toggle = card.querySelector('.person-bio-toggle');
  const label = toggle ? toggle.querySelector('[data-person-bio-label]') : null;
  if (!bio || !toggle || !label) return;

  toggle.addEventListener('click', () => {
    const willExpand = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(willExpand));
    bio.classList.toggle('is-collapsed', !willExpand);
    label.textContent = willExpand ? 'Less' : 'More';
  });
});

const teamViewGroups = document.querySelectorAll('[data-team-view-group]');
const teamViews = new Set(['gallery', 'compact']);

function updateTeamView(group, view) {
  const grid = group.querySelector('[data-team-grid]');
  if (!grid || !teamViews.has(view)) return;

  grid.dataset.teamView = view;
  group.querySelectorAll('[data-team-view-button]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.teamViewButton === view));
  });

  const groupName = group.dataset.teamViewGroup;
  writeStorage(window.localStorage, `lins-team-view-${groupName}`, view);

  window.requestAnimationFrame(() => refreshMemberBios(group));

  if (view === 'gallery') {
    window.requestAnimationFrame(() => {
      group.querySelectorAll('[data-person-links]').forEach(arrangePersonLinks);
    });
  } else {
    closePersonLinkMenus();
  }
}

teamViewGroups.forEach((group) => {
  const groupName = group.dataset.teamViewGroup;
  const defaultView = group.dataset.defaultTeamView;
  const savedView = readStorage(window.localStorage, `lins-team-view-${groupName}`);
  updateTeamView(group, teamViews.has(savedView) ? savedView : defaultView);

  group.querySelectorAll('[data-team-view-button]').forEach((button) => {
    button.addEventListener('click', () => {
      updateTeamView(group, button.dataset.teamViewButton);
    });
  });
});

if (memberBioCards.length) {
  refreshMemberBios();
  let memberBioResizeFrame;
  window.addEventListener('resize', () => {
    window.cancelAnimationFrame(memberBioResizeFrame);
    memberBioResizeFrame = window.requestAnimationFrame(() => refreshMemberBios());
  });
}

const applicationForm = document.querySelector('[data-application-form]');
const applicationReview = document.querySelector('[data-application-review]');

if (applicationForm && applicationReview) {
  const typeInput = applicationForm.querySelector('[data-application-type]');
  const confirmButton = applicationReview.querySelector('[data-application-confirm]');
  const recipient = applicationForm.dataset.applicationRecipient;
  let emailSubject = '';
  let emailBody = '';

  const reviewFields = {
    subject: applicationReview.querySelector('[data-review-subject]'),
    name: applicationReview.querySelector('[data-review-name]'),
    email: applicationReview.querySelector('[data-review-email]'),
    type: applicationReview.querySelector('[data-review-type]'),
    start: applicationReview.querySelector('[data-review-start]'),
    content: applicationReview.querySelector('[data-review-content]'),
    attachments: applicationReview.querySelector('[data-review-attachments]'),
  };

  function value(selector) {
    return applicationForm.querySelector(selector).value.trim();
  }

  function populateApplicationReview() {
    const name = value('[data-application-name]');
    const email = value('[data-application-email]');
    const type = value('[data-application-type]');
    const selectedType = typeInput.options[typeInput.selectedIndex].text;
    const year = value('[data-application-year]');
    const periodInput = applicationForm.querySelector('[data-application-period]');
    const period = periodInput.value;
    const content = value('[data-application-content]');
    const attachments = type === 'PhD' ? 'CV and transcripts' : 'CV';

    emailSubject = `# ${year} ${period} | ${selectedType} | ${name}`;
    emailBody = [
      'Dear Dr. Lin,',
      '',
      `Please remember to attach your ${attachments} before sending. (delete this line after attaching the files)`,
      '',
      content,
      '',
    ].join('\n');
    confirmButton.href = `mailto:${recipient}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

    reviewFields.subject.textContent = emailSubject;
    reviewFields.name.textContent = name;
    reviewFields.email.textContent = email;
    reviewFields.type.textContent = selectedType;
    reviewFields.start.textContent = `${period} ${year}`;
    reviewFields.content.textContent = content;
    reviewFields.attachments.textContent = attachments;
  }

  applicationForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!applicationForm.checkValidity()) {
      applicationForm.reportValidity();
      return;
    }

    populateApplicationReview();
    applicationReview.showModal();
  });

  applicationReview.querySelectorAll('[data-application-review-close]').forEach((button) => {
    button.addEventListener('click', () => applicationReview.close());
  });

  confirmButton.addEventListener('click', () => {
    applicationReview.close();
  });
}
