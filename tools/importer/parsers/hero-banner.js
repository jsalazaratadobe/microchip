/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-banner. Base block: hero.
 * Source: https://www.microchip.com/en-us/solutions/technologies/motor-control-and-drive
 *
 * Live DOM (AEM Core Component "basicbanner"):
 *   .basicbanner > .mchp-basicbanner[style="--background: url(...)"] > ...
 *     > .basicbanner_container > .left > h1.mchp-basicbanner-title
 *   The banner image is a CSS background (`--background` custom property), so there
 *   is usually no <img> element; fall back to that URL when no <img> is present.
 *
 * Model (blocks/hero-banner/_hero-banner.json):
 *   - image     (reference)  -> row 1 cell, field:image
 *   - imageAlt  (text, Alt)  -> collapsed onto <img alt="">, no hint
 *   - text      (richtext)   -> row 2 cell, field:text
 */
export default function parse(element, { document }) {
  // --- INPUT EXTRACTION ---
  // Heading (title). Live DOM uses <h1>; keep fallbacks.
  const heading = element.querySelector('h1, h2, h3');

  // Background image: prefer a real <img>, else derive from the --background CSS var.
  let bgImage = element.querySelector('img');
  if (!bgImage) {
    const bgHost = element.querySelector('[style*="--background"], [style*="background"]');
    const style = bgHost ? (bgHost.getAttribute('style') || '') : '';
    const match = style.match(/url\((['"]?)([^'")]+)\1\)/i);
    if (match && match[2]) {
      let src = match[2].trim();
      // Make protocol-relative / root-relative URLs absolute so image rules resolve.
      if (src.startsWith('//')) src = `https:${src}`;
      else if (src.startsWith('/')) src = `https://www.microchip.com${src}`;
      bgImage = document.createElement('img');
      bgImage.setAttribute('src', src);
      bgImage.setAttribute('alt', heading ? heading.textContent.trim() : '');
    }
  }

  // Empty-block guard.
  if (!heading && !bgImage) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  // Row 1: background image cell (field:image). Emitted even when empty.
  const imageCell = document.createDocumentFragment();
  if (bgImage) {
    imageCell.appendChild(document.createComment(' field:image '));
    imageCell.appendChild(bgImage);
  }
  cells.push([imageCell]);

  // Row 2: text cell (field:text) with the title as richtext.
  const textCell = document.createDocumentFragment();
  if (heading) {
    textCell.appendChild(document.createComment(' field:text '));
    // Normalize to a plain <h1> so no core-component classes/ids leak through.
    const h = document.createElement('h1');
    h.textContent = heading.textContent.trim();
    textCell.appendChild(h);
  }
  cells.push([textCell]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-banner', cells });
  element.replaceWith(block);
}
