/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: microchip.com section breaks + section metadata.
 *
 * Runs in afterTransform only. Reads the matched template's sections from
 * payload.template.sections and, for each section (processed in reverse order):
 *   - inserts an <hr> section break before the section element, except the
 *     first section (EDS uses <hr> between sections);
 *   - inserts a "Section Metadata" block after the section when the section has
 *     a non-empty `style`.
 *
 * The technology-solution template has 7 sections; every section has
 * `style: null`, so this transformer produces 6 <hr> breaks and 0 Section
 * Metadata blocks for that template. The Section Metadata branch is retained
 * for reuse across other microchip templates/pages that may define styles.
 *
 * Section boundaries: each top-level content block under <main> is a section.
 * The template's per-section selectors (`.section.hero`,
 * `main > div.section:nth-of-type(N)`) describe the idealized cleaned DOM but
 * are too fragile to resolve against the live source DOM (real site chrome,
 * different nesting, shifting :nth-of-type indices). To place breaks reliably
 * we walk main's direct-child section containers in order and insert an <hr>
 * between consecutive sections. The template's `sections[]` still drives how
 * many boundaries and Section Metadata blocks to expect, and per-section
 * `style` values (all null for technology-solution) drive metadata creation.
 */

const TransformHook = {
  beforeTransform: 'beforeTransform',
  afterTransform: 'afterTransform',
};

/**
 * Collect the ordered top-level section container elements under main.
 * Prefers explicit `div.section` children (matches cleaned.html); if the live
 * DOM doesn't use that convention, falls back to main's direct element
 * children so section breaks are still emitted between content groups.
 */
function getSectionElements(element) {
  const scoped = element.querySelectorAll(':scope > div.section');
  if (scoped.length) return [...scoped];
  const nestedSections = element.querySelectorAll('div.section');
  if (nestedSections.length) return [...nestedSections];
  return [...element.children];
}

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.afterTransform) {
    const template = payload && payload.template;
    const sections = template && Array.isArray(template.sections) ? template.sections : [];
    if (sections.length < 2) return;

    const doc = element.ownerDocument;
    const sectionEls = getSectionElements(element);
    if (sectionEls.length < 2) return;

    // Map template sections (with style metadata) onto the resolved section
    // elements positionally. If counts differ we still break on the actual
    // elements; metadata is only created where a corresponding template section
    // carries a style.
    for (let i = sectionEls.length - 1; i >= 0; i -= 1) {
      const sectionEl = sectionEls[i];
      const templateSection = sections[i];

      // Section Metadata block after the section (only when a style is set).
      if (templateSection && templateSection.style) {
        const metaBlock = WebImporter.Blocks.createBlock(doc, {
          name: 'Section Metadata',
          cells: { style: templateSection.style },
        });
        if (sectionEl.nextSibling) {
          sectionEl.parentNode.insertBefore(metaBlock, sectionEl.nextSibling);
        } else {
          sectionEl.parentNode.appendChild(metaBlock);
        }
      }

      // Section break (<hr>) before every section except the first.
      if (i > 0) {
        const hr = doc.createElement('hr');
        sectionEl.parentNode.insertBefore(hr, sectionEl);
      }
    }
  }
}
