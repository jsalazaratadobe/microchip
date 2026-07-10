import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-solutions-card-image';
      else div.className = 'cards-solutions-card-body';
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    // Photos (JPEG) fill the image area; logos/line-art (PNG/SVG) fit within
    // it so wide wordmarks like the Microchip University logo aren't cropped.
    const isPhoto = /\.jpe?g(\?|$)/i.test(img.src);
    // Cards render at ~250–355px wide (1–3 up). Serve a small default with a
    // larger source only for wider viewports so phones don't download a 750px
    // image for a ~340px slot (Lighthouse "improve image delivery").
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [
      { media: '(min-width: 900px)', width: '750' },
      { width: '450' },
    ]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    if (isPhoto) optimizedPic.querySelector('img').classList.add('cards-solutions-photo');
    img.closest('picture').replaceWith(optimizedPic);
  });

  // Every card links "Learn More", but each points to a different page. Give
  // each link an accessible name that includes its card title so assistive
  // tech can tell them apart (WCAG 2.4.4 / "identical links, same purpose").
  ul.querySelectorAll('li').forEach((li) => {
    const title = li.querySelector('.cards-solutions-card-body h3')?.textContent.trim();
    if (!title) return;
    li.querySelectorAll('.cards-solutions-card-body a:any-link').forEach((a) => {
      const label = a.textContent.trim();
      if (label && !a.hasAttribute('aria-label')) {
        a.setAttribute('aria-label', `${label}: ${title}`);
      }
    });
  });

  block.textContent = '';
  block.append(ul);
}
