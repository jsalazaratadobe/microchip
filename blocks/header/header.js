/*
 * Header block – Microchip 4-row header
 * Nav fragment (flat, DA-safe) sections in order:
 *   0 utility bar (p text + signup link)
 *   1 brand (logo img link)
 *   2 sections (nav ul, 8 items; Products/Solutions have #mega dropdowns)
 *   3 search tools (:search: link + cross-reference link)
 *   4 account (myMicrochip logo link + dropdown ul + inbox link)
 *   5 breadcrumb (ul of links + final text)
 * Form controls, account dropdown caret and envelope are built here in JS.
 */

import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import { getBlockContext } from '../../scripts/shared.js';

const DESKTOP = window.matchMedia('(min-width: 900px)');

const SEARCH_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" width="20" height="20"><path fill="currentColor" d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5 4.99L20.49 19l-4.99-5Zm-6 0A4.5 4.5 0 1 1 14 9.5 4.49 4.49 0 0 1 9.5 14Z"/></svg>';
const MAIL_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" width="22" height="22"><path fill="currentColor" d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4-8 5-8-5V6l8 5 8-5Z"/></svg>';
const CARET_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" width="14" height="14"><path fill="currentColor" d="m7 10 5 5 5-5Z"/></svg>';

function getNavPath() {
  const meta = getMetadata('nav');
  return (meta ? new URL(meta, window.location).pathname : null) || '/nav';
}

function collapseAll(nav) {
  nav.querySelectorAll('.nav-drop').forEach((li) => li.setAttribute('aria-expanded', 'false'));
}

function decorateMega(li) {
  const link = li.querySelector(':scope > p > a');
  const sub = li.querySelector(':scope > ul');
  if (!link || !sub) return;

  const isMega = link.hash === '#mega' || sub.querySelector('picture, img');
  if (link.hash === '#mega') link.href = link.href.replace(/#mega$/i, '');

  if (!isMega) return;

  li.classList.add('nav-drop-mega');
  const items = [...sub.children].filter((c) => c.tagName === 'LI');
  const promo = items.find((c) => c.querySelector('picture, img'));
  const rest = items.filter((c) => c !== promo);

  let group = 0;
  let row = 0;
  rest.forEach((c) => {
    const hasDirectLink = c.querySelector(':scope > a') || c.querySelector(':scope > p > a');
    if (hasDirectLink) {
      if (!group) group = 1;
      c.classList.add('nav-mega-item');
      c.style.setProperty('--mega-group', group);
      row += 1;
      c.style.setProperty('--mega-row', row);
    } else {
      group += 1;
      row = 0;
      c.classList.add('nav-mega-heading');
      c.style.setProperty('--mega-group', group);
    }
  });

  const cols = group || 1;
  const totalCols = promo ? cols + 1 : cols;
  if (promo) {
    promo.classList.add('nav-mega-promo');
    promo.style.setProperty('--mega-group', cols + 1);
    sub.append(promo);
  }
  if (group) sub.classList.add('nav-mega-has-groups');

  const inner = document.createElement('div');
  inner.className = 'nav-mega-inner';
  inner.style.setProperty('--mega-columns', String(totalCols));
  while (sub.firstChild) inner.appendChild(sub.firstChild);
  sub.appendChild(inner);

  const sync = () => {
    if (!li.isConnected) return;
    const trigger = li.querySelector(':scope > p');
    const menu = li.querySelector(':scope > ul');
    if (!trigger || !menu) return;
    const navRow = li.closest('.nav-primary-row');
    if (navRow) {
      const rect = navRow.getBoundingClientRect();
      menu.style.setProperty('--mega-top', `${rect.bottom}px`);
    }
    const t = trigger.getBoundingClientRect();
    const m = menu.getBoundingClientRect();
    const x = t.left + t.width / 2 - m.left;
    menu.style.setProperty('--mega-pointer-x', `${Math.round(x)}px`);
  };
  li.megaSync = sync;
  sync();
  window.addEventListener('resize', sync);
}

function setupDropdown(li) {
  const submenu = li.querySelector(':scope > ul');
  const heading = li.querySelector(':scope > p');
  const parentLink = li.querySelector(':scope > p > a');
  let toggleBtn = null;
  let closeTimer = null;

  const syncToggle = () => {
    if (!toggleBtn) return;
    const expanded = li.getAttribute('aria-expanded') === 'true';
    toggleBtn.setAttribute('aria-expanded', String(expanded));
    toggleBtn.setAttribute('aria-label', expanded ? 'Collapse submenu' : 'Expand submenu');
  };

  if (submenu && heading) {
    toggleBtn = heading.querySelector('.nav-submenu-toggle');
    if (!toggleBtn) {
      toggleBtn = document.createElement('button');
      toggleBtn.type = 'button';
      toggleBtn.className = 'nav-submenu-toggle';
      heading.append(toggleBtn);
    }
    syncToggle();
    toggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (DESKTOP.matches) return;
      const wasOpen = li.getAttribute('aria-expanded') === 'true';
      collapseAll(li.closest('nav'));
      li.setAttribute('aria-expanded', wasOpen ? 'false' : 'true');
      syncToggle();
    });
  }

  const open = () => {
    if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
    li.megaSync?.();
    collapseAll(li.closest('nav'));
    li.setAttribute('aria-expanded', 'true');
    syncToggle();
  };
  const close = () => {
    if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
    li.setAttribute('aria-expanded', 'false');
    syncToggle();
  };

  li.addEventListener('mouseenter', () => { if (DESKTOP.matches) open(); });
  li.addEventListener('mouseleave', (e) => {
    if (!DESKTOP.matches || li.contains(e.relatedTarget)) return;
    closeTimer = setTimeout(close, 150);
  });
  li.addEventListener('focusin', () => { if (DESKTOP.matches) open(); });
  li.addEventListener('focusout', (e) => {
    if (DESKTOP.matches && !li.contains(e.relatedTarget)) close();
  });

  li.addEventListener('click', (e) => {
    if (!DESKTOP.matches) {
      const clickedSubmenuLink = submenu?.contains(e.target) && e.target.closest('a');
      const clickedToggle = e.target.closest('.nav-submenu-toggle');
      const clickedParentLink = parentLink && (e.target === parentLink || parentLink.contains(e.target));
      if (clickedToggle) return;
      if (clickedSubmenuLink) {
        collapseAll(li.closest('nav'));
        close();
      } else if (clickedParentLink) {
        collapseAll(li.closest('nav'));
        close();
      } else if (submenu) {
        e.preventDefault();
        const wasOpen = li.getAttribute('aria-expanded') === 'true';
        collapseAll(li.closest('nav'));
        li.setAttribute('aria-expanded', wasOpen ? 'false' : 'true');
        syncToggle();
      }
    } else if (li.querySelector('ul')?.contains(e.target) && e.target.closest('a')) {
      collapseAll(li.closest('nav'));
      close();
    }
  });
}

/* Row 2 center: build the search form from the :search: token + cross-reference link */
function buildSearch(toolsSection) {
  const link = toolsSection.querySelector('a[href*="search"]');
  const crossRef = [...toolsSection.querySelectorAll('a')]
    .find((a) => /cross-reference/i.test(a.getAttribute('href') || ''));
  const path = (link && link.getAttribute('href')) || '/search';

  const wrap = document.createElement('div');
  wrap.className = 'nav-search';

  const form = document.createElement('form');
  form.className = 'nav-search-form';
  form.setAttribute('role', 'search');
  form.action = path;
  form.method = 'get';

  const input = document.createElement('input');
  input.type = 'search';
  input.name = 'q';
  input.placeholder = 'AI-powered Search: find products, documentation or ask a question';
  input.setAttribute('aria-label', 'Search');
  input.className = 'nav-search-input';
  input.autocomplete = 'off';

  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'nav-search-submit';
  submit.setAttribute('aria-label', 'Search');
  submit.innerHTML = SEARCH_ICON;

  form.onsubmit = (e) => {
    if (!input.value.trim()) {
      e.preventDefault();
      window.location.href = path;
    }
  };
  form.append(input, submit);
  wrap.append(form);

  if (crossRef) {
    crossRef.classList.add('nav-cross-ref');
    const p = document.createElement('p');
    p.className = 'nav-cross-ref-wrap';
    p.append(crossRef);
    wrap.append(p);
  }
  return wrap;
}

/* Row 2 right: myMicrochip account control (logo + caret dropdown + envelope) */
function buildAccount(accountSection) {
  const logoLink = accountSection.querySelector(':scope > p > a img')?.closest('a');
  const menu = accountSection.querySelector(':scope > ul');
  const inboxLink = [...accountSection.querySelectorAll('a')]
    .find((a) => /my-inbox/i.test(a.getAttribute('href') || ''));

  const wrap = document.createElement('div');
  wrap.className = 'nav-account';

  const control = document.createElement('div');
  control.className = 'nav-account-control';

  if (logoLink) {
    logoLink.classList.add('nav-account-logo');
    control.append(logoLink);
  }

  const caret = document.createElement('button');
  caret.type = 'button';
  caret.className = 'nav-account-caret';
  caret.setAttribute('aria-haspopup', 'true');
  caret.setAttribute('aria-expanded', 'false');
  caret.setAttribute('aria-label', 'myMicrochip account menu');
  caret.innerHTML = CARET_ICON;
  control.append(caret);

  if (inboxLink) {
    inboxLink.classList.add('nav-account-inbox');
    inboxLink.setAttribute('aria-label', 'myMicrochip inbox');
    inboxLink.textContent = '';
    inboxLink.innerHTML = MAIL_ICON;
    control.append(inboxLink);
  }

  wrap.append(control);

  if (menu) {
    menu.classList.add('nav-account-menu');
    menu.hidden = true;
    wrap.append(menu);

    const closeMenu = () => {
      menu.hidden = true;
      caret.setAttribute('aria-expanded', 'false');
    };
    caret.addEventListener('click', (e) => {
      e.preventDefault();
      const isOpen = caret.getAttribute('aria-expanded') === 'true';
      menu.hidden = isOpen;
      caret.setAttribute('aria-expanded', String(!isOpen));
    });
    document.addEventListener('click', (e) => {
      if (!wrap.contains(e.target)) closeMenu();
    });
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Escape') closeMenu();
    });
    menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeMenu));
  }
  return wrap;
}

/* Row 4: breadcrumb – add " / " separators between the list items */
function buildBreadcrumb(breadcrumbSection) {
  const list = breadcrumbSection.querySelector(':scope > ul');
  if (!list) return breadcrumbSection;
  const nav = document.createElement('nav');
  nav.className = 'nav-breadcrumb';
  nav.setAttribute('aria-label', 'Breadcrumb');
  const items = [...list.children].filter((c) => c.tagName === 'LI');
  items.forEach((li, i) => {
    if (i > 0) {
      const sep = document.createElement('span');
      sep.className = 'nav-breadcrumb-sep';
      sep.setAttribute('aria-hidden', 'true');
      sep.textContent = '/';
      nav.append(sep);
    }
    const inner = li.querySelector('a') || document.createElement('span');
    if (!li.querySelector('a')) inner.textContent = li.textContent.trim();
    if (inner.tagName === 'SPAN') inner.className = 'nav-breadcrumb-current';
    else inner.className = 'nav-breadcrumb-link';
    nav.append(inner);
  });
  return nav;
}

function toggleMobile(nav, open, body) {
  const isOpen = open === undefined ? nav.getAttribute('aria-expanded') !== 'true' : open;
  body.style.overflowY = isOpen && !DESKTOP.matches ? 'hidden' : '';
  nav.setAttribute('aria-expanded', isOpen);
  nav.querySelector('.nav-hamburger button')?.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
}

const NAV_ITEMS = '.nav-sections > ul > li';

export default async function decorate(block) {
  const { body, eventRoot } = getBlockContext(block);

  const fragment = await loadFragment(getNavPath());
  if (!fragment) return;

  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-label', 'Main');
  nav.setAttribute('aria-expanded', 'false');

  /* Fragment sections arrive wrapped in .default-content-wrapper; flatten so
     the semantic content (ul/p/img) becomes the direct child of each part. */
  fragment.querySelectorAll(':scope > div').forEach((part) => {
    part.querySelectorAll(':scope > .default-content-wrapper').forEach((w) => {
      while (w.firstChild) part.insertBefore(w.firstChild, w);
      w.remove();
    });
  });

  const parts = [...fragment.children];
  const [utility, brand, sectionsSrc, toolsSrc, accountSrc, breadcrumbSrc] = parts;

  /* Row 1 – utility strip */
  const utilityRow = document.createElement('div');
  utilityRow.className = 'nav-utility-row';
  if (utility) {
    while (utility.firstChild) utilityRow.append(utility.firstChild);
  }

  /* Row 2 – main bar: logo | search | account */
  const mainRow = document.createElement('div');
  mainRow.className = 'nav-main-row';

  const brandEl = document.createElement('div');
  brandEl.className = 'nav-brand';
  if (brand) while (brand.firstChild) brandEl.append(brand.firstChild);

  const searchEl = toolsSrc ? buildSearch(toolsSrc) : document.createElement('div');
  const accountEl = accountSrc ? buildAccount(accountSrc) : document.createElement('div');
  mainRow.append(brandEl, searchEl, accountEl);

  /* Row 3 – primary nav */
  const primaryRow = document.createElement('div');
  primaryRow.className = 'nav-primary-row';
  const sections = document.createElement('div');
  sections.className = 'nav-sections';
  if (sectionsSrc) while (sectionsSrc.firstChild) sections.append(sectionsSrc.firstChild);
  primaryRow.append(sections);

  /* Row 4 – breadcrumb */
  const breadcrumbRow = document.createElement('div');
  breadcrumbRow.className = 'nav-breadcrumb-row';
  if (breadcrumbSrc) breadcrumbRow.append(buildBreadcrumb(breadcrumbSrc));

  nav.append(utilityRow, mainRow, primaryRow, breadcrumbRow);

  /* AEM auto-decorates lone links in <p> as .button; strip that in the nav */
  nav.querySelectorAll('a.button').forEach((a) => a.classList.remove('button'));
  nav.querySelectorAll('.button-container').forEach((p) => p.classList.remove('button-container'));

  /* hamburger toggles the primary nav on mobile */
  const hamburger = document.createElement('div');
  hamburger.className = 'nav-hamburger';
  hamburger.innerHTML = '<button type="button" aria-controls="nav" aria-label="Open navigation"><span class="nav-hamburger-icon"></span></button>';
  hamburger.onclick = () => toggleMobile(nav, undefined, body);
  mainRow.prepend(hamburger);

  /* decorate dropdowns / megamenus */
  sections.querySelectorAll(NAV_ITEMS).forEach((li) => {
    if (li.querySelector('ul')) {
      li.classList.add('nav-drop');
      li.setAttribute('aria-expanded', 'false');
      li.setAttribute('aria-haspopup', 'true');
      decorateMega(li);
      setupDropdown(li);
    }
  });

  eventRoot.addEventListener('click', (e) => {
    if (!DESKTOP.matches && nav.getAttribute('aria-expanded') === 'true' && !nav.contains(e.target)) {
      toggleMobile(nav, false, body);
    }
  });
  eventRoot.addEventListener('keydown', (e) => {
    if (e.code !== 'Escape') return;
    if (!DESKTOP.matches && nav.getAttribute('aria-expanded') === 'true') {
      toggleMobile(nav, false, body);
    } else if (DESKTOP.matches && nav.querySelector('.nav-drop[aria-expanded="true"]')) {
      collapseAll(nav);
    }
  });

  const wrapper = document.createElement('div');
  wrapper.className = 'nav-wrapper';
  wrapper.append(nav);
  block.append(wrapper);

  toggleMobile(nav, false, body);
  collapseAll(nav);
  DESKTOP.addEventListener('change', () => toggleMobile(nav, false, body));

  nav.querySelectorAll('.nav-drop-mega').forEach((li) => li.megaSync?.());

  // Reserve space equal to the fixed header height so content is not covered.
  const syncHeight = () => {
    const h = wrapper.getBoundingClientRect().height;
    if (h) document.documentElement.style.setProperty('--nav-total-height', `${Math.round(h)}px`);
  };
  syncHeight();
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(syncHeight).observe(wrapper);
  }
  window.addEventListener('resize', syncHeight);
}
