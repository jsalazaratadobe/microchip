/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: microchip.com site-wide cleanup for the technology-solution template.
 *
 * The importer fetches the fully JS-rendered live microchip.com DOM (AEM Core
 * Component markup), which surrounds the authorable page content with a large amount
 * of non-content site chrome and dynamically injected junk. This transformer removes
 * it so only the real block content (hero, cards, table, carousel, tabs) survives.
 *
 *   - beforeTransform: remove global chrome (header/nav/breadcrumbs/footer, sign-in /
 *     profile banners, cross-reference & AI search widgets, chat / embedded-messaging /
 *     Salesforce, cookie/consent, scripts/styles) BEFORE parsers run so those parts
 *     can never be picked up by a block selector. Authorable containers (.basicbanner,
 *     .cardgrid, .simpletable, .cardcarousel, .tabs.panelcontainer) are preserved.
 *   - afterTransform: remove any leftover non-authorable elements and the dynamic
 *     parametric text leftovers ("Loading", "View All Parametrics", "Similar Devices",
 *     "No similar devices found", "Search:", "Shasum Number:", "×", "Website Feedback
 *     Form" boilerplate) that live OUTSIDE the parsed block tables, then strip
 *     tracking / inline-event attributes.
 */

const TransformHook = {
  beforeTransform: 'beforeTransform',
  afterTransform: 'afterTransform',
};

// Selectors for non-authorable global chrome / widgets to remove wholesale.
const CHROME_SELECTORS = [
  // Global shell. NOTE: do NOT match [role="banner"] broadly — the authorable hero
  // (.basicbanner) carries role="banner". The site header is a `.header` core
  // component that also carries role="banner"; match it by class instead.
  'header',
  'footer',
  'nav',
  '.header',
  '[role="banner"]:not(.basicbanner)',
  '[class*="breadcrumb" i]',
  '.mchp-header',
  '.mchp-footer',
  '.globalnav',
  '.global-nav',
  '.utility-nav',
  '.skip-link',
  '.skip-to-main',
  // Sign-in / myMicrochip / profile banners
  '.mymicrochip',
  '.my-account',
  '.sign-in',
  '.profile-banner',
  '.user-profile',
  '[class*="mymicrochip" i]',
  '[class*="unsupported-browser" i]',
  // Search widgets (site search, cross-reference, AI-powered search)
  '.site-search',
  '.cross-reference-search',
  '.ai-search',
  '[class*="coveo" i]',
  '[class*="searchbox" i]',
  '.mchp-empty-result',
  // Chat / embedded messaging / Salesforce
  '.embedded-messaging',
  '.embeddedMessagingFrame',
  '[class*="embeddedservice" i]',
  '[class*="salesforce" i]',
  '[class*="live-chat" i]',
  '[class*="livechat" i]',
  '[class*="drift" i]',
  '#chat-icon-div',
  '[id*="chat" i]',
  '[class*="chat" i]',
  '.need-help',
  // Cookie / consent
  '#onetrust-consent-sdk',
  '.onetrust-pc-dark-filter',
  '[id*="onetrust" i]',
  '[class*="onetrust" i]',
  '[id*="cookie" i]',
  '[class*="cookie" i]',
  // Assets that carry no authorable content
  'script',
  'style',
  'template',
  'noscript',
  'iframe',
];

// Exact-match junk (whole trimmed text equals one of these).
const JUNK_TEXT_EXACT_RE = /^(loading|view all parametrics|similar devices|no similar devices found|search:?|shasum number:?|×|x|next|view all family devices|sign in|create account|log ?out|change password|dashboard|settings|registered development tools|cross-reference search|privacy policy|true|live chat|live chat schedule a call|schedule a call|need help\??)$/i;

// Prefix / substring junk (the element's text STARTS WITH or CONTAINS this
// boilerplate; used for banner rows that include a trailing CTA link, the
// parametric disclaimer, the sign-in prompts and the Salesforce config blob).
const JUNK_TEXT_PREFIX_RE = /^(ai-powered search|log in to mymicrochip|maximize your experience|stay in the loop with the latest|complete your profile|we detect you are using an unsupported browser|please visit the full parametric chart|no problem\. chat with our engineering experts|skip to (main content|footer)|previous\s*\d)/i;

const JUNK_TEXT_CONTAINS_RE = /("salesforcesecurepath"|embeddedservicename|salesforceorgid)/i;

function isJunkText(text) {
  return JUNK_TEXT_EXACT_RE.test(text)
    || JUNK_TEXT_PREFIX_RE.test(text)
    || JUNK_TEXT_CONTAINS_RE.test(text);
}

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    WebImporter.DOMUtils.remove(element, CHROME_SELECTORS);
  }

  if (hookName === TransformHook.afterTransform) {
    // Final sweep of any leftover chrome that survived (e.g. re-inserted nodes).
    WebImporter.DOMUtils.remove(element, [
      ...CHROME_SELECTORS,
      'aside',
      'link',
      'source',
      'meta',
    ]);

    // Remove standalone junk-text nodes (paragraphs / headings / list items /
    // anchors) that live OUTSIDE the parsed block tables. Never touch content
    // inside a generated block table (TABLE descendants).
    const candidates = element.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, a, em');
    Array.from(candidates).forEach((el) => {
      if (!el.parentNode) return;
      if (el.closest('table')) return; // preserve everything inside block tables
      const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (text && isJunkText(text)) {
        el.remove();
      }
    });

    // Strip tracking / analytics / inline-event attributes from remaining elements.
    element.querySelectorAll('*').forEach((el) => {
      [...el.attributes].forEach((attr) => {
        const name = attr.name.toLowerCase();
        if (
          name.startsWith('on')
          || name.startsWith('data-track')
          || name.startsWith('data-analytics')
          || name.startsWith('data-gtm')
          || name.startsWith('data-cmp')
          || name.startsWith('data-asset')
          || name === 'data-testid'
          || name === 'itemscope'
          || name === 'itemtype'
          || name === 'itemprop'
        ) {
          el.removeAttribute(attr.name);
        }
      });
    });
  }
}
