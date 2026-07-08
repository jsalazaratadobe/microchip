/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-technology-solution.js
  var import_technology_solution_exports = {};
  __export(import_technology_solution_exports, {
    default: () => import_technology_solution_default
  });

  // tools/importer/parsers/hero-banner.js
  function parse(element, { document }) {
    const heading = element.querySelector("h1, h2, h3");
    let bgImage = element.querySelector("img");
    if (!bgImage) {
      const bgHost = element.querySelector('[style*="--background"], [style*="background"]');
      const style = bgHost ? bgHost.getAttribute("style") || "" : "";
      const match = style.match(/url\((['"]?)([^'")]+)\1\)/i);
      if (match && match[2]) {
        let src = match[2].trim();
        if (src.startsWith("//")) src = `https:${src}`;
        else if (src.startsWith("/")) src = `https://www.microchip.com${src}`;
        bgImage = document.createElement("img");
        bgImage.setAttribute("src", src);
        bgImage.setAttribute("alt", heading ? heading.textContent.trim() : "");
      }
    }
    if (!heading && !bgImage) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    const imageCell = document.createDocumentFragment();
    if (bgImage) {
      imageCell.appendChild(document.createComment(" field:image "));
      imageCell.appendChild(bgImage);
    }
    cells.push([imageCell]);
    const textCell = document.createDocumentFragment();
    if (heading) {
      textCell.appendChild(document.createComment(" field:text "));
      const h = document.createElement("h1");
      h.textContent = heading.textContent.trim();
      textCell.appendChild(h);
    }
    cells.push([textCell]);
    const block = WebImporter.Blocks.createBlock(document, { name: "hero-banner", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-solutions.js
  function resolveImage(scope, document) {
    const img = scope.querySelector("img");
    const src = img ? img.getAttribute("src") || "" : "";
    if (img && src && !src.startsWith("data:")) {
      const clone = document.createElement("img");
      clone.setAttribute("src", src);
      clone.setAttribute("alt", img.getAttribute("alt") || "");
      return clone;
    }
    const lazy = scope.querySelector("[data-cmp-src]");
    if (lazy) {
      const cmp = (lazy.getAttribute("data-cmp-src") || "").replace(/\{\.width\}/g, "");
      if (cmp) {
        const el = document.createElement("img");
        el.setAttribute("src", cmp);
        el.setAttribute("alt", img && img.getAttribute("alt") || "");
        return el;
      }
    }
    return img || null;
  }
  function parse2(element, { document }) {
    const cardEls = Array.from(element.querySelectorAll(":scope .mchp-card"));
    if (cardEls.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    cardEls.forEach((card) => {
      const image = resolveImage(card, document);
      const imageCell = document.createDocumentFragment();
      if (image) {
        imageCell.appendChild(document.createComment(" field:image "));
        imageCell.appendChild(image);
      }
      const titleHost = card.querySelector(".mchp-card-title h1, .mchp-card-title h2, .mchp-card-title h3, .mchp-card-title h4, .mchp-card-title h5, .mchp-card-title h6") || card.querySelector("h1, h2, h3, h4, h5, h6");
      const links = Array.from(card.querySelectorAll("a")).filter((a) => a.textContent.trim());
      const textCell = document.createDocumentFragment();
      const textParts = [];
      if (titleHost) {
        const h = document.createElement("h3");
        h.textContent = titleHost.textContent.trim();
        textParts.push(h);
      }
      links.forEach((a) => {
        const p = document.createElement("p");
        const link = document.createElement("a");
        link.setAttribute("href", a.getAttribute("href") || "");
        link.textContent = a.textContent.trim();
        p.appendChild(link);
        textParts.push(p);
      });
      if (textParts.length > 0) {
        textCell.appendChild(document.createComment(" field:text "));
        textParts.forEach((el) => textCell.appendChild(el));
      }
      cells.push([imageCell, textCell]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-solutions", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-resource.js
  function resolveImage2(scope, document) {
    const img = scope.querySelector("img");
    const src = img ? img.getAttribute("src") || "" : "";
    if (img && src && !src.startsWith("data:")) {
      const clone = document.createElement("img");
      clone.setAttribute("src", src);
      clone.setAttribute("alt", img.getAttribute("alt") || "");
      return clone;
    }
    const lazy = scope.querySelector("[data-cmp-src]");
    if (lazy) {
      const cmp = (lazy.getAttribute("data-cmp-src") || "").replace(/\{\.width\}/g, "");
      if (cmp) {
        const el = document.createElement("img");
        el.setAttribute("src", cmp);
        el.setAttribute("alt", img && img.getAttribute("alt") || "");
        return el;
      }
    }
    return img || null;
  }
  function parse3(element, { document }) {
    const cardEls = Array.from(element.querySelectorAll(":scope .mchp-card"));
    if (cardEls.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    cardEls.forEach((card) => {
      const image = resolveImage2(card, document);
      const imageCell = document.createDocumentFragment();
      if (image) {
        imageCell.appendChild(document.createComment(" field:image "));
        imageCell.appendChild(image);
      }
      const titleHost = card.querySelector(".mchp-card-title h1, .mchp-card-title h2, .mchp-card-title h3, .mchp-card-title h4, .mchp-card-title h5, .mchp-card-title h6") || card.querySelector("h1, h2, h3, h4, h5, h6");
      const links = Array.from(card.querySelectorAll("a")).filter((a) => a.textContent.trim());
      const textCell = document.createDocumentFragment();
      const textParts = [];
      if (titleHost) {
        const h = document.createElement("h3");
        h.textContent = titleHost.textContent.trim();
        textParts.push(h);
      }
      links.forEach((a) => {
        const p = document.createElement("p");
        const link = document.createElement("a");
        link.setAttribute("href", a.getAttribute("href") || "");
        link.textContent = a.textContent.trim();
        p.appendChild(link);
        textParts.push(p);
      });
      if (textParts.length > 0) {
        textCell.appendChild(document.createComment(" field:text "));
        textParts.forEach((el) => textCell.appendChild(el));
      }
      cells.push([imageCell, textCell]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-resource", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/table-compare.js
  function parse4(element, { document }) {
    const table = element.matches("table") ? element : element.querySelector("table");
    if (!table) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const sourceRows = Array.from(table.querySelectorAll("tr")).filter((tr) => tr.children.length > 0);
    if (sourceRows.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const grid = [];
    sourceRows.forEach((tr, r) => {
      if (!grid[r]) grid[r] = [];
      let c = 0;
      Array.from(tr.children).forEach((cell) => {
        while (grid[r][c] !== void 0) c += 1;
        const rowspan = parseInt(cell.getAttribute("rowspan") || "1", 10);
        const colspan = parseInt(cell.getAttribute("colspan") || "1", 10);
        for (let i = 0; i < rowspan; i += 1) {
          for (let j = 0; j < colspan; j += 1) {
            if (!grid[r + i]) grid[r + i] = [];
            grid[r + i][c + j] = i === 0 && j === 0 ? cell : null;
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
    cells.push([`table-${columnCount}-columns`]);
    grid.forEach((row) => {
      const rowCells = [`table-col-${columnCount}`];
      for (let c = 0; c < columnCount; c += 1) {
        const cell = row[c];
        if (cell) {
          cell.querySelectorAll(".dataTables_sizing, .sorting_asc, .sorting_desc").forEach((n) => n.remove());
          const frag = document.createDocumentFragment();
          Array.from(cell.childNodes).forEach((n) => frag.appendChild(n.cloneNode(true)));
          rowCells.push(frag);
        } else {
          rowCells.push("");
        }
      }
      cells.push(rowCells);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "table-compare", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/carousel-solutions.js
  function resolveImage3(scope, document) {
    const img = scope.querySelector("img");
    const src = img ? img.getAttribute("src") || "" : "";
    if (img && src && !src.startsWith("data:")) {
      const clone = document.createElement("img");
      clone.setAttribute("src", src);
      clone.setAttribute("alt", img.getAttribute("alt") || "");
      return clone;
    }
    const lazy = scope.querySelector("[data-cmp-src]");
    if (lazy) {
      const cmp = (lazy.getAttribute("data-cmp-src") || "").replace(/\{\.width\}/g, "");
      if (cmp) {
        const el = document.createElement("img");
        el.setAttribute("src", cmp);
        el.setAttribute("alt", img && img.getAttribute("alt") || "");
        return el;
      }
    }
    return img || null;
  }
  function parse5(element, { document }) {
    const slideEls = Array.from(element.querySelectorAll(":scope .mchp-card"));
    if (slideEls.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    const seenTitles = /* @__PURE__ */ new Set();
    slideEls.forEach((slide) => {
      const titleHost = slide.querySelector(".mchp-card-title h1, .mchp-card-title h2, .mchp-card-title h3, .mchp-card-title h4, .mchp-card-title h5, .mchp-card-title h6") || slide.querySelector("h1, h2, h3, h4, h5, h6");
      const titleText = titleHost ? titleHost.textContent.trim().replace(/\s+/g, " ") : "";
      if (!titleText || seenTitles.has(titleText)) return;
      seenTitles.add(titleText);
      const image = resolveImage3(slide, document);
      const imageCell = document.createDocumentFragment();
      if (image) {
        imageCell.appendChild(document.createComment(" field:media_image "));
        imageCell.appendChild(image);
      }
      const paragraphs = Array.from(slide.querySelectorAll(".mchp-card-text p, .mchp-card-subtitle p, p")).filter((p) => p.textContent.trim());
      const links = Array.from(slide.querySelectorAll("a")).filter((a) => a.textContent.trim());
      const textCell = document.createDocumentFragment();
      const textParts = [];
      const h = document.createElement("h3");
      h.textContent = titleText;
      textParts.push(h);
      const seenParas = /* @__PURE__ */ new Set();
      paragraphs.forEach((p) => {
        const key = p.textContent.trim();
        if (seenParas.has(key)) return;
        seenParas.add(key);
        textParts.push(p.cloneNode(true));
      });
      const seenLinks = /* @__PURE__ */ new Set();
      links.forEach((a) => {
        const key = `${a.textContent.trim()}|${a.getAttribute("href") || ""}`;
        if (seenLinks.has(key)) return;
        seenLinks.add(key);
        const p = document.createElement("p");
        const link = document.createElement("a");
        link.setAttribute("href", a.getAttribute("href") || "");
        link.textContent = a.textContent.trim();
        p.appendChild(link);
        textParts.push(p);
      });
      textCell.appendChild(document.createComment(" field:content_text "));
      textParts.forEach((el) => textCell.appendChild(el));
      cells.push([imageCell, textCell]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "carousel-solutions", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/tabs-parametric.js
  var JUNK_RE = /(loading|view all parametrics|similar devices|no similar devices found|shasum number|website feedback form|^search:?$|^×$|^x$)/i;
  function buildCleanTable(sourceTable, document) {
    if (!sourceTable) return null;
    const rows = Array.from(sourceTable.querySelectorAll("tr")).filter((tr) => tr.children.length > 0);
    if (rows.length < 2) return null;
    const outTable = document.createElement("table");
    let emitted = 0;
    rows.forEach((tr) => {
      const cellText = tr.textContent.replace(/\s+/g, " ").trim();
      if (!cellText || JUNK_RE.test(cellText)) return;
      const outRow = document.createElement("tr");
      Array.from(tr.children).forEach((cell) => {
        const out = document.createElement(cell.tagName === "TH" ? "th" : "td");
        const link = cell.querySelector("a[href]");
        if (link && link.getAttribute("href")) {
          const a = document.createElement("a");
          a.setAttribute("href", link.getAttribute("href"));
          a.textContent = link.textContent.trim() || "Download";
          out.appendChild(a);
        } else {
          out.textContent = cell.textContent.replace(/\s+/g, " ").trim();
        }
        outRow.appendChild(out);
      });
      if (outRow.textContent.trim()) {
        outTable.appendChild(outRow);
        emitted += 1;
      }
    });
    return emitted >= 2 ? outTable : null;
  }
  function findPanelTable(panel) {
    const tables = Array.from(panel.querySelectorAll("table")).filter((t) => !t.classList.contains("dc-page-similar-devices-table"));
    return tables.find((t) => t.querySelectorAll("tr").length >= 2) || null;
  }
  function parse6(element, { document }) {
    const labels = Array.from(element.querySelectorAll(".cmp-tabs__tab"));
    const panels = Array.from(element.querySelectorAll(".cmp-tabs__tabpanel"));
    if (labels.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    labels.forEach((label, i) => {
      const labelCell = document.createDocumentFragment();
      labelCell.appendChild(document.createComment(" field:title "));
      const labelP = document.createElement("p");
      labelP.textContent = label.textContent.replace(/\s+/g, " ").trim();
      labelCell.appendChild(labelP);
      const contentCell = document.createDocumentFragment();
      const panel = panels[i];
      const cleanTable = panel ? buildCleanTable(findPanelTable(panel), document) : null;
      contentCell.appendChild(document.createComment(" field:content_richtext "));
      if (cleanTable) {
        contentCell.appendChild(cleanTable);
      } else {
        contentCell.appendChild(document.createElement("p"));
      }
      cells.push([labelCell, contentCell]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "tabs-parametric", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/microchip-cleanup.js
  var TransformHook = {
    beforeTransform: "beforeTransform",
    afterTransform: "afterTransform"
  };
  var CHROME_SELECTORS = [
    // Global shell. NOTE: do NOT match [role="banner"] broadly — the authorable hero
    // (.basicbanner) carries role="banner". The site header is a `.header` core
    // component that also carries role="banner"; match it by class instead.
    "header",
    "footer",
    "nav",
    ".header",
    '[role="banner"]:not(.basicbanner)',
    '[class*="breadcrumb" i]',
    ".mchp-header",
    ".mchp-footer",
    ".globalnav",
    ".global-nav",
    ".utility-nav",
    ".skip-link",
    ".skip-to-main",
    // Sign-in / myMicrochip / profile banners
    ".mymicrochip",
    ".my-account",
    ".sign-in",
    ".profile-banner",
    ".user-profile",
    '[class*="mymicrochip" i]',
    '[class*="unsupported-browser" i]',
    // Search widgets (site search, cross-reference, AI-powered search)
    ".site-search",
    ".cross-reference-search",
    ".ai-search",
    '[class*="coveo" i]',
    '[class*="searchbox" i]',
    ".mchp-empty-result",
    // Chat / embedded messaging / Salesforce
    ".embedded-messaging",
    ".embeddedMessagingFrame",
    '[class*="embeddedservice" i]',
    '[class*="salesforce" i]',
    '[class*="live-chat" i]',
    '[class*="livechat" i]',
    '[class*="drift" i]',
    "#chat-icon-div",
    '[id*="chat" i]',
    '[class*="chat" i]',
    ".need-help",
    // Cookie / consent
    "#onetrust-consent-sdk",
    ".onetrust-pc-dark-filter",
    '[id*="onetrust" i]',
    '[class*="onetrust" i]',
    '[id*="cookie" i]',
    '[class*="cookie" i]',
    // Assets that carry no authorable content
    "script",
    "style",
    "template",
    "noscript",
    "iframe"
  ];
  var JUNK_TEXT_EXACT_RE = /^(loading|view all parametrics|similar devices|no similar devices found|search:?|shasum number:?|×|x|next|view all family devices|sign in|create account|log ?out|change password|dashboard|settings|registered development tools|cross-reference search|privacy policy|true|live chat|live chat schedule a call|schedule a call|need help\??)$/i;
  var JUNK_TEXT_PREFIX_RE = /^(ai-powered search|log in to mymicrochip|maximize your experience|stay in the loop with the latest|complete your profile|we detect you are using an unsupported browser|please visit the full parametric chart|no problem\. chat with our engineering experts|skip to (main content|footer)|previous\s*\d)/i;
  var JUNK_TEXT_CONTAINS_RE = /("salesforcesecurepath"|embeddedservicename|salesforceorgid)/i;
  function isJunkText(text) {
    return JUNK_TEXT_EXACT_RE.test(text) || JUNK_TEXT_PREFIX_RE.test(text) || JUNK_TEXT_CONTAINS_RE.test(text);
  }
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, CHROME_SELECTORS);
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        ...CHROME_SELECTORS,
        "aside",
        "link",
        "source",
        "meta"
      ]);
      const candidates = element.querySelectorAll("p, h1, h2, h3, h4, h5, h6, li, a, em");
      Array.from(candidates).forEach((el) => {
        if (!el.parentNode) return;
        if (el.closest("table")) return;
        const text = (el.textContent || "").replace(/\s+/g, " ").trim();
        if (text && isJunkText(text)) {
          el.remove();
        }
      });
      element.querySelectorAll("*").forEach((el) => {
        [...el.attributes].forEach((attr) => {
          const name = attr.name.toLowerCase();
          if (name.startsWith("on") || name.startsWith("data-track") || name.startsWith("data-analytics") || name.startsWith("data-gtm") || name.startsWith("data-cmp") || name.startsWith("data-asset") || name === "data-testid" || name === "itemscope" || name === "itemtype" || name === "itemprop") {
            el.removeAttribute(attr.name);
          }
        });
      });
    }
  }

  // tools/importer/transformers/microchip-sections.js
  var TransformHook2 = {
    beforeTransform: "beforeTransform",
    afterTransform: "afterTransform"
  };
  function getSectionElements(element) {
    const scoped = element.querySelectorAll(":scope > div.section");
    if (scoped.length) return [...scoped];
    const nestedSections = element.querySelectorAll("div.section");
    if (nestedSections.length) return [...nestedSections];
    return [...element.children];
  }
  function transform2(hookName, element, payload) {
    if (hookName === TransformHook2.afterTransform) {
      const template = payload && payload.template;
      const sections = template && Array.isArray(template.sections) ? template.sections : [];
      if (sections.length < 2) return;
      const doc = element.ownerDocument;
      const sectionEls = getSectionElements(element);
      if (sectionEls.length < 2) return;
      for (let i = sectionEls.length - 1; i >= 0; i -= 1) {
        const sectionEl = sectionEls[i];
        const templateSection = sections[i];
        if (templateSection && templateSection.style) {
          const metaBlock = WebImporter.Blocks.createBlock(doc, {
            name: "Section Metadata",
            cells: { style: templateSection.style }
          });
          if (sectionEl.nextSibling) {
            sectionEl.parentNode.insertBefore(metaBlock, sectionEl.nextSibling);
          } else {
            sectionEl.parentNode.appendChild(metaBlock);
          }
        }
        if (i > 0) {
          const hr = doc.createElement("hr");
          sectionEl.parentNode.insertBefore(hr, sectionEl);
        }
      }
    }
  }

  // tools/importer/import-technology-solution.js
  var PAGE_TEMPLATE = {
    name: "technology-solution",
    description: "Technology/solution landing page with hero banner, intro text, card grids, product tables, card carousel, and tabbed parametric charts",
    urls: [
      "https://www.microchip.com/en-us/solutions/technologies/motor-control-and-drive"
    ],
    blocks: [
      { name: "hero-banner", instances: [".basicbanner"] },
      { name: "cards-solutions", instances: [".cardgrid:has(.mchp-card-item.card-sixty)"] },
      { name: "cards-resource", instances: [".cardgrid:has(.mchp-card-item.card-one-hundred)"] },
      { name: "table-compare", instances: [".simpletable table"] },
      { name: "carousel-solutions", instances: [".cardcarousel"] },
      { name: "tabs-parametric", instances: [".tabs.panelcontainer"] }
    ],
    sections: [
      { id: "sec-hero", name: "Hero Banner", selector: ".basicbanner", style: null, blocks: ["hero-banner"], defaultContent: [] },
      { id: "sec-solutions", name: "Our Solutions for Motor Control", selector: ".cardgrid:has(.mchp-card-item.card-sixty)", style: null, blocks: ["cards-solutions"], defaultContent: [] },
      { id: "sec-resources", name: "Additional Resources for Motor Control and Drive", selector: ".cardgrid:has(.mchp-card-item.card-one-hundred)", style: null, blocks: ["cards-resource"], defaultContent: [] },
      { id: "sec-recommended-products", name: "Recommended Motor Control Products", selector: ".simpletable", style: null, blocks: ["table-compare"], defaultContent: [] },
      { id: "sec-hw-sw-solutions", name: "Motor Control Hardware and Software Solutions", selector: ".cardcarousel", style: null, blocks: ["carousel-solutions"], defaultContent: [] },
      { id: "sec-products", name: "Products (Parametric)", selector: ".tabs.panelcontainer", style: null, blocks: ["tabs-parametric"], defaultContent: [] }
    ]
  };
  var parsers = {
    "hero-banner": parse,
    "cards-solutions": parse2,
    "cards-resource": parse3,
    "table-compare": parse4,
    "carousel-solutions": parse5,
    "tabs-parametric": parse6
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document, template) {
    const pageBlocks = [];
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        const elements = document.querySelectorAll(selector);
        if (elements.length === 0) {
          console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
        }
        elements.forEach((element) => {
          pageBlocks.push({
            name: blockDef.name,
            selector,
            element,
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_technology_solution_default = {
    transform: (payload) => {
      const {
        document,
        url,
        html,
        params
      } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name}`);
        }
      });
      executeTransformers("afterTransform", main, payload);
      const hr = document.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const path = WebImporter.FileUtils.sanitizePath(
        new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html$/, "")
      );
      return [{
        element: main,
        path,
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_technology_solution_exports);
})();
