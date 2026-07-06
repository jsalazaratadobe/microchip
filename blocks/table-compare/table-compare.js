/*
 * Table Compare Block
 * Builds a comparison table (products x categories) from authored rows.
 *
 * The authored content uses marker rows/cells so authors can express the
 * intended shape of the table in a document:
 *   - A leading config row whose only cell reads `table-{n}-columns`.
 *   - Every subsequent row begins with a `table-col-{n}` marker cell.
 * These markers are consumed here and never rendered. After the config row,
 * the first real row becomes the header (unless the `no-header` variant is set).
 * https://www.hlx.live/developer/block-collection/table
 */

import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';

const CONFIG_MARKER = /^table-\d+-columns$/i;
const ROW_MARKER = /^table-col-\d+$/i;

/**
 * @param {Element} block
 */
export default async function decorate(block) {
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');
  const header = !block.classList.contains('no-header');

  // Rows minus the leading config marker row (e.g. "table-7-columns").
  const rows = [...block.children].filter((row) => {
    const only = row.children.length === 1 ? row.children[0] : null;
    return !(only && CONFIG_MARKER.test(only.textContent.trim()));
  });

  rows.forEach((row, i) => {
    const tr = document.createElement('tr');
    moveInstrumentation(row, tr);

    // Drop a leading per-row marker cell (e.g. "table-col-7").
    let cells = [...row.children];
    if (cells[0] && ROW_MARKER.test(cells[0].textContent.trim())) {
      cells = cells.slice(1);
    }

    cells.forEach((cell) => {
      const isHeaderRow = i === 0 && header;
      const el = document.createElement(isHeaderRow ? 'th' : 'td');
      if (isHeaderRow) el.setAttribute('scope', 'col');
      el.innerHTML = cell.innerHTML;
      tr.append(el);
    });

    if (i === 0 && header) thead.append(tr);
    else tbody.append(tr);
  });

  table.append(thead, tbody);
  block.replaceChildren(table);
}
