/* eslint-disable */
/* global WebImporter */
/**
 * Parser for carousel-solutions. Base block: carousel.
 * Source: https://www.microchip.com/en-us/solutions/technologies/motor-control-and-drive
 *
 * Live DOM (AEM Core Component ".cardcarousel"): the carousel renders each slide as
 * a ".mchp-card". For infinite-loop behavior the CMS duplicates the slides, so the
 * container holds ~20 ".mchp-card" for only 8 unique slides. Dedupe by slide title
 * to the 8 unique slides (first occurrence wins):
 *   Motor Control Algorithms and Application Notes, Motor Control Library,
 *   Motor Control Simulation, AVR MCU Motor Control Library, Hardware Development
 *   Tools, SmartFusion 2 FPGA Dual-Axis Motor Control Solution,
 *   motorBench Development Suite, MPLAB Harmony QuickSpin.
 * Each slide: image (".cmp-image", resolved <img src>; lazy "data-cmp-src" with a
 * "{.width}" placeholder is a fallback only), title (h2/h3), description paragraph(s),
 * and one or more "Learn More" CTA links.
 *
 * Container block. Model (blocks/carousel-solutions/_carousel-solutions.json) ->
 * item "carousel-solutions-item":
 *   - media_image    (reference) -> cell 1, field:media_image
 *   - media_imageAlt (text, Alt) -> collapsed onto <img alt="">, no hint
 *   - content_text   (richtext)  -> cell 2, field:content_text (title + description + CTA(s))
 */
function resolveImage(scope, document) {
  const img = scope.querySelector('img');
  const src = img ? (img.getAttribute('src') || '') : '';
  if (img && src && !src.startsWith('data:')) {
    const clone = document.createElement('img');
    clone.setAttribute('src', src);
    clone.setAttribute('alt', img.getAttribute('alt') || '');
    return clone;
  }
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
  // --- INPUT EXTRACTION (live AEM Core Component carousel) ---
  const slideEls = Array.from(element.querySelectorAll(':scope .mchp-card'));

  // Empty-block guard.
  if (slideEls.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  const seenTitles = new Set();

  slideEls.forEach((slide) => {
    const titleHost = slide.querySelector('.mchp-card-title h1, .mchp-card-title h2, .mchp-card-title h3, .mchp-card-title h4, .mchp-card-title h5, .mchp-card-title h6')
      || slide.querySelector('h1, h2, h3, h4, h5, h6');
    const titleText = titleHost ? titleHost.textContent.trim().replace(/\s+/g, ' ') : '';

    // Dedupe loop-clones by title (first occurrence wins). Skip untitled clones.
    if (!titleText || seenTitles.has(titleText)) return;
    seenTitles.add(titleText);

    // Cell 1: image (field:media_image).
    const image = resolveImage(slide, document);
    const imageCell = document.createDocumentFragment();
    if (image) {
      imageCell.appendChild(document.createComment(' field:media_image '));
      imageCell.appendChild(image);
    }

    // Cell 2: rich text (field:content_text) — title, description(s), CTA(s).
    const paragraphs = Array.from(slide.querySelectorAll('.mchp-card-text p, .mchp-card-subtitle p, p'))
      .filter((p) => p.textContent.trim());
    const links = Array.from(slide.querySelectorAll('a')).filter((a) => a.textContent.trim());

    const textCell = document.createDocumentFragment();
    const textParts = [];
    const h = document.createElement('h3');
    h.textContent = titleText;
    textParts.push(h);
    // Deduplicate paragraph text (clones can appear) while preserving inline markup.
    const seenParas = new Set();
    paragraphs.forEach((p) => {
      const key = p.textContent.trim();
      if (seenParas.has(key)) return;
      seenParas.add(key);
      textParts.push(p.cloneNode(true));
    });
    const seenLinks = new Set();
    links.forEach((a) => {
      const key = `${a.textContent.trim()}|${a.getAttribute('href') || ''}`;
      if (seenLinks.has(key)) return;
      seenLinks.add(key);
      const p = document.createElement('p');
      const link = document.createElement('a');
      link.setAttribute('href', a.getAttribute('href') || '');
      link.textContent = a.textContent.trim();
      p.appendChild(link);
      textParts.push(p);
    });
    textCell.appendChild(document.createComment(' field:content_text '));
    textParts.forEach((el) => textCell.appendChild(el));

    cells.push([imageCell, textCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-solutions', cells });
  element.replaceWith(block);
}
