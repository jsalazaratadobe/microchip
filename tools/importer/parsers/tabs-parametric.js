/* eslint-disable */
/* global WebImporter */
/**
 * Parser for tabs-parametric. Base block: tabs.
 * Source: https://www.microchip.com/en-us/solutions/technologies/motor-control-and-drive
 * Instances: ".tabs.panelcontainer" (Products tabs + Documentation tabs)
 *
 * Live DOM (AEM Core Component tabs): tab labels are ".cmp-tabs__tab"; panels are
 * ".cmp-tabs__tabpanel". The panel bodies are populated at runtime by a
 * parametric-search backend, so they are polluted with dynamic junk: "Loading",
 * "View All Parametrics", "Similar Devices" (repeated), "No similar devices found",
 * "Search:", "Shasum Number:", "×", pagination, and "Website Feedback Form"
 * boilerplate. This parser extracts ONLY:
 *   - the tab label, and
 *   - the first meaningful STATIC data table in the panel (the ".dc-page-paramatable"
 *     for Products or the ".DocumentTable--table" for Documentation), rebuilt as a
 *     clean table. The always-empty ".dc-page-similar-devices-table" is ignored.
 * If a panel has no populated static table (Products only pre-renders the first
 * tab's data), the tab is emitted with an empty content cell.
 *
 * Container block. Model (blocks/tabs-parametric/_tabs-parametric.json) -> item
 * "tabs-parametric-item":
 *   - title            (text)     -> cell 1 (tab label), field:title
 *   - content_heading  (text)     -> cell 2, field:content_heading (grouped "content")
 *   - content_image    (reference)-> cell 2, field:content_image (grouped "content")
 *   - content_richtext (richtext) -> cell 2, field:content_richtext (grouped "content")
 */

// Phrases that identify dynamic parametric junk (never emitted as content).
const JUNK_RE = /(loading|view all parametrics|similar devices|no similar devices found|shasum number|website feedback form|^search:?$|^×$|^x$)/i;

/**
 * Build a clean <table> element from a source data table, dropping DataTables
 * artifacts, empty header cells and junk rows. Returns null if nothing meaningful.
 */
function buildCleanTable(sourceTable, document) {
  if (!sourceTable) return null;
  const rows = Array.from(sourceTable.querySelectorAll('tr')).filter((tr) => tr.children.length > 0);
  if (rows.length < 2) return null; // header only / empty => nothing meaningful

  const outTable = document.createElement('table');
  let emitted = 0;

  rows.forEach((tr) => {
    const cellText = tr.textContent.replace(/\s+/g, ' ').trim();
    if (!cellText || JUNK_RE.test(cellText)) return;

    const outRow = document.createElement('tr');
    Array.from(tr.children).forEach((cell) => {
      const out = document.createElement(cell.tagName === 'TH' ? 'th' : 'td');
      // Prefer a link if the cell holds one (e.g. "Download"); else plain text.
      const link = cell.querySelector('a[href]');
      if (link && link.getAttribute('href')) {
        const a = document.createElement('a');
        a.setAttribute('href', link.getAttribute('href'));
        a.textContent = link.textContent.trim() || 'Download';
        out.appendChild(a);
      } else {
        out.textContent = cell.textContent.replace(/\s+/g, ' ').trim();
      }
      outRow.appendChild(out);
    });
    // Drop rows that ended up completely empty.
    if (outRow.textContent.trim()) {
      outTable.appendChild(outRow);
      emitted += 1;
    }
  });

  return emitted >= 2 ? outTable : null; // need header + >=1 data row
}

/**
 * Find the first meaningful static data table in a panel, ignoring the always-empty
 * "Similar Devices" table.
 */
function findPanelTable(panel) {
  const tables = Array.from(panel.querySelectorAll('table'))
    .filter((t) => !t.classList.contains('dc-page-similar-devices-table'));
  return tables.find((t) => t.querySelectorAll('tr').length >= 2) || null;
}

export default function parse(element, { document }) {
  // --- INPUT EXTRACTION (live AEM Core Component tabs) ---
  const labels = Array.from(element.querySelectorAll('.cmp-tabs__tab'));
  const panels = Array.from(element.querySelectorAll('.cmp-tabs__tabpanel'));

  // Empty-block guard.
  if (labels.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  labels.forEach((label, i) => {
    // Cell 1: tab label (field:title).
    const labelCell = document.createDocumentFragment();
    labelCell.appendChild(document.createComment(' field:title '));
    const labelP = document.createElement('p');
    labelP.textContent = label.textContent.replace(/\s+/g, ' ').trim();
    labelCell.appendChild(labelP);

    // Cell 2: tab content (field:content_richtext) — a clean static table if present.
    const contentCell = document.createDocumentFragment();
    const panel = panels[i];
    const cleanTable = panel ? buildCleanTable(findPanelTable(panel), document) : null;
    contentCell.appendChild(document.createComment(' field:content_richtext '));
    if (cleanTable) {
      contentCell.appendChild(cleanTable);
    } else {
      // Placeholder so the row keeps its 2 cells (data loads dynamically on the live site).
      contentCell.appendChild(document.createElement('p'));
    }

    cells.push([labelCell, contentCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs-parametric', cells });
  element.replaceWith(block);
}
