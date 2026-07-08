export default function decorate(block) {
  const row = block.firstElementChild;
  if (!row) return;

  const cells = [...row.children];
  // Identify cells by content: image cell, text cell (has heading/multiple paragraphs),
  // and the CTA cell (contains a link). Fall back to positional order.
  const iconCell = cells.find((c) => c.querySelector('picture, img'));
  const ctaCell = cells.find((c) => c !== iconCell && c.querySelector('a'));
  const textCell = cells.find((c) => c !== iconCell && c !== ctaCell);

  if (iconCell) iconCell.className = 'support-banner-icon';
  if (textCell) textCell.className = 'support-banner-text';
  if (ctaCell) ctaCell.className = 'support-banner-cta';
}
