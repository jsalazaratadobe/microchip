/*
 * Table Compare Block
 * Product comparison matrix. Content rows carry leading config markers
 * (e.g. "table-7-columns", "table-col-7") that are stripped during decoration.
 * First data row becomes the navy header; remaining rows are striped.
 */

const CONFIG_MARKER = /^table-(\d+-columns|col-\d+)$/i;

function isConfigCell(cell) {
  return CONFIG_MARKER.test(cell.textContent.trim());
}

export default function decorate(block) {
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');
  table.append(thead, tbody);

  // Drop leading config-only rows (a row whose single cell is a config marker).
  const rows = [...block.children].filter((row) => {
    const cells = [...row.children];
    return !(cells.length === 1 && isConfigCell(cells[0]));
  });

  let headerPlaced = false;
  rows.forEach((row) => {
    let cells = [...row.children];
    // Strip a leading per-row config marker (e.g. "table-col-7").
    if (cells.length && isConfigCell(cells[0])) cells = cells.slice(1);

    const tr = document.createElement('tr');
    const isHeader = !headerPlaced;
    cells.forEach((col) => {
      const cell = document.createElement(isHeader ? 'th' : 'td');
      if (isHeader) cell.setAttribute('scope', 'col');
      cell.innerHTML = col.innerHTML;
      tr.append(cell);
    });
    (isHeader ? thead : tbody).append(tr);
    headerPlaced = true;
  });

  // Merge the first column vertically: an empty first cell is a continuation
  // of the same product above, so grow that cell's rowspan and drop the empty.
  const bodyRows = [...tbody.rows];
  let spanAnchor = null;
  bodyRows.forEach((tr) => {
    const first = tr.cells[0];
    if (first && first.textContent.trim() === '' && spanAnchor) {
      spanAnchor.rowSpan += 1;
      first.remove();
    } else {
      spanAnchor = first || null;
    }
  });

  block.textContent = '';
  block.append(table);
}
