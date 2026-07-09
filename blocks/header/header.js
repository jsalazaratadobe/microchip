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

/* Toggle a mega category open/closed on mobile (chevron drill-down). On
   desktop the flyout is shown via CSS :hover, so this only runs on mobile. */
function setupMegaCat(cat, flyout) {
  const heading = cat.querySelector(':scope > p');
  if (!heading) return;
  let toggle = heading.querySelector('.nav-submenu-toggle');
  if (!toggle) {
    toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'nav-submenu-toggle';
    heading.append(toggle);
  }
  const sync = () => {
    const open = cat.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Collapse submenu' : 'Expand submenu');
  };
  sync();
  toggle.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (DESKTOP.matches) return;
    const open = cat.getAttribute('aria-expanded') === 'true';
    // collapse sibling categories, then toggle this one
    flyout.closest('.nav-mega-list').querySelectorAll(':scope > .nav-mega-cat').forEach((c) => {
      if (c !== cat) c.setAttribute('aria-expanded', 'false');
    });
    cat.setAttribute('aria-expanded', open ? 'false' : 'true');
    sync();
  });
}

/*
 * Microchip mega menu: a left sidebar of category rows; hovering a row reveals
 * a flyout panel on the right with that category's subcategory groups + links.
 * Nav structure per top item:
 *   li > p>a(#mega)  +  ul.categories
 *     li(category) > p>a  [+ ul.subcategories]
 *       li(subcategory) > p>a  [+ ul of leaf links]
 */
function decorateMega(li) {
  const link = li.querySelector(':scope > p > a');
  const sub = li.querySelector(':scope > ul');
  if (!link || !sub) return;

  const isMega = link.hash === '#mega';
  if (isMega) link.href = link.href.replace(/#mega$/i, '');
  if (!isMega) return;

  li.classList.add('nav-drop-mega');
  sub.classList.add('nav-mega-list');

  [...sub.children].filter((c) => c.tagName === 'LI').forEach((cat) => {
    cat.classList.add('nav-mega-cat');
    const flyout = cat.querySelector(':scope > ul');
    if (!flyout) return;
    cat.classList.add('has-flyout');
    cat.setAttribute('aria-expanded', 'false');
    flyout.classList.add('nav-mega-flyout');

    // Each subcategory becomes a group: heading + optional link list.
    [...flyout.children].filter((c) => c.tagName === 'LI').forEach((group) => {
      group.classList.add('nav-mega-group');
      const gHead = group.querySelector(':scope > p');
      if (gHead) gHead.classList.add('nav-mega-group-title');
      const gLinks = group.querySelector(':scope > ul');
      if (gLinks) gLinks.classList.add('nav-mega-group-links');
    });

    // Flyout header: "Browse {Category}" (linked) + "view all" + close X.
    const catLink = cat.querySelector(':scope > p > a');
    if (catLink && !flyout.querySelector(':scope > .nav-mega-flyout-head')) {
      const head = document.createElement('div');
      head.className = 'nav-mega-flyout-head';
      const title = document.createElement('a');
      title.className = 'nav-mega-flyout-title';
      title.href = catLink.getAttribute('href');
      title.textContent = `Browse ${catLink.textContent.trim()}`;
      const viewAll = document.createElement('a');
      viewAll.className = 'nav-mega-flyout-viewall';
      viewAll.href = catLink.getAttribute('href');
      viewAll.textContent = 'view all';
      const close = document.createElement('button');
      close.type = 'button';
      close.className = 'nav-mega-flyout-close';
      close.setAttribute('aria-label', 'Close submenu');
      close.textContent = '×';
      close.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        cat.setAttribute('aria-expanded', 'false');
      });
      head.append(title, viewAll, close);
      flyout.prepend(head);
    }

    setupMegaCat(cat, flyout);
  });

  // Anchor the panel just below the nav row, and align its left edge with the
  // nav content column (under the logo / PRODUCTS label) rather than the
  // viewport edge.
  const sync = () => {
    if (!li.isConnected) return;
    const navRow = li.closest('.nav-primary-row');
    const sectionsEl = li.closest('.nav-sections');
    if (navRow && sub) {
      const rect = navRow.getBoundingClientRect();
      sub.style.setProperty('--mega-top', `${Math.round(rect.bottom)}px`);
    }
    if (sectionsEl && sub) {
      const left = Math.round(sectionsEl.getBoundingClientRect().left);
      sub.style.setProperty('--mega-left', `${left}px`);
    }
  };
  li.megaSync = sync;
  sync();
  // rAF-throttle so multiple mega triggers don't each force a synchronous
  // reflow on every resize tick.
  let rafId = 0;
  window.addEventListener('resize', () => {
    if (rafId) return;
    rafId = requestAnimationFrame(() => { rafId = 0; sync(); });
  });
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

  // The mobile slide-in panel and its dimmed backdrop are anchored just below
  // the search row, so the utility + logo + search stay visible above them.
  if (isOpen && !DESKTOP.matches) {
    const mainRow = nav.querySelector('.nav-main-row');
    const top = mainRow ? Math.round(mainRow.getBoundingClientRect().bottom) : 0;
    nav.style.setProperty('--nav-panel-top', `${top}px`);
  }
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
    if (DESKTOP.matches || nav.getAttribute('aria-expanded') !== 'true') return;
    // Close when tapping outside the nav, or on the dimmed area beside the
    // slide-in panel (the primary row itself, not its list/backdrop children).
    const onBackdrop = e.target === primaryRow;
    if (!nav.contains(e.target) || onBackdrop) {
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
  // The ResizeObserver already fires syncHeight whenever the header's size
  // changes (including on viewport resize), so a separate throttled resize
  // listener would just duplicate that work and force extra reflows.
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(syncHeight).observe(wrapper);
  } else {
    let rafId = 0;
    window.addEventListener('resize', () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => { rafId = 0; syncHeight(); });
    });
  }
}
