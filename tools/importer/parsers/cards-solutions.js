/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-solutions. Base block: cards.
 * Source: https://www.microchip.com/en-us/solutions/technologies/motor-control-and-drive
 *
 * Live DOM (AEM Core Component ".cardgrid"): the matched element is a card grid
 * containing ".mchp-card" items. Each ".mchp-card" holds:
 *   - an image inside ".cmp-image" (real <img src> resolved by the CMS; the lazy
 *     "data-cmp-src" attribute carries a "{.width}" template placeholder so <img src>
 *     is preferred and data-cmp-src is only a fallback, with {.width} stripped).
 *   - a title (h3/h4) inside ".mchp-card-title"
 *   - one or more "Learn More" links.
 * A hidden ".mchp-empty-result" video-search widget also lives in the grid; it is
 * NOT a ".mchp-card" so it is ignored.
 *
 * Container block. Model (blocks/cards-solutions/_cards-solutions.json) -> item "card":
 *   - image (reference) -> cell 1, field:image
 *   - text  (richtext)  -> cell 2, field:text (title heading + CTA)
 */
function resolveImage(scope, document) {
  // Prefer a real <img> with a non-lazy src.
  const img = scope.querySelector('img');
  const src = img ? (img.getAttribute('src') || '') : '';
  if (img && src && !src.startsWith('data:')) {
    const clone = document.createElement('img');
    clone.setAttribute('src', src);
    clone.setAttribute('alt', img.getAttribute('alt') || '');
    return clone;
  }
  // Fallback: lazy data-cmp-src (strip the {.width} rendition placeholder).
  const lazy = scope.querySelector('[data-cmp-src]');
  if (lazy) {
    const cmp = (lazy.getAttribute('data-cmp-src') || '').replace(/\{\.width\}/g, '');
    if (cmp) {
      const el = document.createElement('img');
      el.setAttribute('src', cmp);
      el.setAttribute('alt', (img && img.getAttribute('alt')) || '');
      return el;
    }
  }
  return img || null;
}

export default function parse(element, { document }) {
  // --- INPUT EXTRACTION (live AEM Core Component card grid) ---
  const cardEls = Array.from(element.querySelectorAll(':scope .mchp-card'));

  // Empty-block guard.
  if (cardEls.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  cardEls.forEach((card) => {
    // Cell 1: image (field:image).
    const image = resolveImage(card, document);
    const imageCell = document.createDocumentFragment();
    if (image) {
      imageCell.appendChild(document.createComment(' field:image '));
      imageCell.appendChild(image);
    }

    // Cell 2: rich text (field:text) — title heading + CTA link(s).
    const titleHost = card.querySelector('.mchp-card-title h1, .mchp-card-title h2, .mchp-card-title h3, .mchp-card-title h4, .mchp-card-title h5, .mchp-card-title h6')
      || card.querySelector('h1, h2, h3, h4, h5, h6');
    const links = Array.from(card.querySelectorAll('a')).filter((a) => a.textContent.trim());

    const textCell = document.createDocumentFragment();
    const textParts = [];
    if (titleHost) {
      const h = document.createElement('h3');
      h.textContent = titleHost.textContent.trim();
      textParts.push(h);
    }
    links.forEach((a) => {
      const p = document.createElement('p');
      const link = document.createElement('a');
      link.setAttribute('href', a.getAttribute('href') || '');
      link.textContent = a.textContent.trim();
      p.appendChild(link);
      textParts.push(p);
    });
    if (textParts.length > 0) {
      textCell.appendChild(document.createComment(' field:text '));
      textParts.forEach((el) => textCell.appendChild(el));
    }

    cells.push([imageCell, textCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-solutions', cells });
  element.replaceWith(block);
}
