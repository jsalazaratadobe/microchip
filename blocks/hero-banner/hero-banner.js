import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Hero Banner variant.
 * Full-bleed banner with a background image and a headline (no CTA).
 * Styling is handled in CSS; JS only optimizes the background image, which is
 * the above-the-fold LCP element.
 * @param {Element} block The hero-banner block element
 */
export default function decorate(block) {
  const img = block.querySelector('picture > img');
  if (!img) {
    block.classList.add('hero-banner-no-image');
    return;
  }

  // The banner image is above the fold and is the LCP candidate. Serve a
  // responsive, correctly-sized picture and load it eagerly with high fetch
  // priority so it paints as early as possible. CSS still controls the
  // rendered size (object-fit: cover), so there is no visual change.
  const optimizedPic = createOptimizedPicture(img.src, img.alt, true, [
    { media: '(min-width: 900px)', width: '2000' },
    { width: '1200' },
  ]);
  const optimizedImg = optimizedPic.querySelector('img');
  optimizedImg.setAttribute('fetchpriority', 'high');
  img.closest('picture').replaceWith(optimizedPic);
}
