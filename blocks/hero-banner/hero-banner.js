import { createOptimizedPicture } from '../../scripts/aem.js';

/* Standard Microchip banner background. Baked in so this is a drop-in,
   first-class banner: an author adds the block at the top of a page and types
   their heading — the fixed dark background and white text come for free. */
const DEFAULT_BANNER_BG = 'https://www.microchip.com/content/dam/mchp/images/backgrounds/Default-Banner-Background.png';

/**
 * Hero Banner.
 * Full-bleed dark banner with a fixed standard background and white text,
 * intended as the first block on a page. Authors only supply the heading/text;
 * the background is applied automatically (an authored image, if present,
 * overrides the default).
 * @param {Element} block The hero-banner block element
 */
export default function decorate(block) {
  const authoredImg = block.querySelector('picture > img');
  const src = authoredImg ? authoredImg.src : DEFAULT_BANNER_BG;
  const alt = authoredImg ? authoredImg.alt : '';

  // The banner image is above the fold and is the LCP candidate. Serve a
  // responsive, correctly-sized picture and load it eagerly with high fetch
  // priority so it paints as early as possible. CSS still controls the
  // rendered size (object-fit: cover), so there is no visual change.
  const optimizedPic = createOptimizedPicture(src, alt, true, [
    { media: '(min-width: 900px)', width: '2000' },
    { width: '1200' },
  ]);
  optimizedPic.querySelector('img').setAttribute('fetchpriority', 'high');

  if (authoredImg) {
    authoredImg.closest('picture').replaceWith(optimizedPic);
  } else {
    // No authored image: inject the standard background as the first cell so
    // the block always has the same dark banner regardless of authoring.
    const bgCell = document.createElement('div');
    const p = document.createElement('p');
    p.append(optimizedPic);
    bgCell.append(p);
    block.prepend(bgCell);
  }
}
