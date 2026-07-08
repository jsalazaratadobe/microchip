/* eslint-disable */
/* global WebImporter */
/**
 * Parser for table-compare. Base block: table.
 * Source: https://www.microchip.com/en-us/solutions/technologies/motor-control-and-drive
 *
 * Live DOM: the comparison table is `.simpletable table` (the DataTables plugin adds
 * `class="dataTable no-footer"` and an id at runtime, but the markup is a clean
 * static <table> with one <thead> row + <tbody> rows). The first data column uses a
 * rowspan header cell ("MCUs, DSCs and FPGAs"). 7 columns x 7 rows.
 *
 * Special "table" block convention (blocks/table-compare/_table-compare.json +
 * library-description.txt):
 *   - Row 1: block name (handled by createBlock).
 *   - Row 2: a single marker cell "table-N-columns" where N = column count.
 *   - Each data row: first cell is the marker "table-col-N", followed by the
 *     original row's data cells (one per column).
 * Rowspans in the source are expanded so every data row has exactly N data cells.
 */
export default function parse(element, { document }) {
  // element is the <table> (selector ".simpletable table").
  const table = element.matches('table') ? element : element.querySelector('table');
  if (!table) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Only structural rows (DataTables can inject measurement/sizing rows with no cells).
  const sourceRows = Array.from(table.querySelectorAll('tr')).filter((tr) => tr.children.length > 0);
  if (sourceRows.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // --- Expand the source table into a rectangular grid, honoring rowspan/colspan. ---
  const grid = []; // grid[r][c] = cell element (or null)
  sourceRows.forEach((tr, r) => {
    if (!grid[r]) grid[r] = [];
    let c = 0;
    Array.from(tr.children).forEach((cell) => {
      while (grid[r][c] !== undefined) c += 1;
      const rowspan = parseInt(cell.getAttribute('rowspan') || '1', 10);
      const colspan = parseInt(cell.getAttribute('colspan') || '1', 10);
      for (let i = 0; i < rowspan; i += 1) {
        for (let j = 0; j < colspan; j += 1) {
          if (!grid[r + i]) grid[r + i] = [];
          grid[r + i][c + j] = (i === 0 && j === 0) ? cell : null;
        }
      }
      c += colspan;
    });
  });

  const columnCount = grid.reduce((max, row) => Math.max(max, row.length), 0);
  if (columnCount === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  // Row 2: column-count marker cell.
  cells.push([`table-${columnCount}-columns`]);

  // Data rows: prepend the "table-col-N" marker, then one cell per column.
  grid.forEach((row) => {
    const rowCells = [`table-col-${columnCount}`];
    for (let c = 0; c < columnCount; c += 1) {
      const cell = row[c];
      if (cell) {
        // Preserve rich content (links, <sup>, <br>) but drop DataTables sort spans.
        cell.querySelectorAll('.dataTables_sizing, .sorting_asc, .sorting_desc').forEach((n) => n.remove());
        const frag = document.createDocumentFragment();
        Array.from(cell.childNodes).forEach((n) => frag.appendChild(n.cloneNode(true)));
        rowCells.push(frag);
      } else {
        rowCells.push('');
      }
    }
    cells.push(rowCells);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'table-compare', cells });
  element.replaceWith(block);
}
