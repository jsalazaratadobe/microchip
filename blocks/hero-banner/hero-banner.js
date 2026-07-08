/**
 * Hero Banner variant.
 * Full-bleed banner with a background image and a headline (no CTA).
 * The vanilla hero requires no JS decoration; styling is handled in CSS.
 * @param {Element} block The hero-banner block element
 */
export default function decorate(block) {
  // No decoration required; the background image and heading are styled via CSS.
  // Kept as a no-op so the block has a valid default export.
  if (!block.querySelector('picture')) {
    block.classList.add('hero-banner-no-image');
  }
}
