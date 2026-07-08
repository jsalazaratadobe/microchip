/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroBannerParser from './parsers/hero-banner.js';
import cardsSolutionsParser from './parsers/cards-solutions.js';
import cardsResourceParser from './parsers/cards-resource.js';
import tableCompareParser from './parsers/table-compare.js';
import carouselSolutionsParser from './parsers/carousel-solutions.js';
import tabsParametricParser from './parsers/tabs-parametric.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/microchip-cleanup.js';
import sectionsTransformer from './transformers/microchip-sections.js';

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'technology-solution',
  description: 'Technology/solution landing page with hero banner, intro text, card grids, product tables, card carousel, and tabbed parametric charts',
  urls: [
    'https://www.microchip.com/en-us/solutions/technologies/motor-control-and-drive',
  ],
  blocks: [
    { name: 'hero-banner', instances: ['.basicbanner'] },
    { name: 'cards-solutions', instances: ['.cardgrid:has(.mchp-card-item.card-sixty)'] },
    { name: 'cards-resource', instances: ['.cardgrid:has(.mchp-card-item.card-one-hundred)'] },
    { name: 'table-compare', instances: ['.simpletable table'] },
    { name: 'carousel-solutions', instances: ['.cardcarousel'] },
    { name: 'tabs-parametric', instances: ['.tabs.panelcontainer'] },
  ],
  sections: [
    { id: 'sec-hero', name: 'Hero Banner', selector: '.basicbanner', style: null, blocks: ['hero-banner'], defaultContent: [] },
    { id: 'sec-solutions', name: 'Our Solutions for Motor Control', selector: '.cardgrid:has(.mchp-card-item.card-sixty)', style: null, blocks: ['cards-solutions'], defaultContent: [] },
    { id: 'sec-resources', name: 'Additional Resources for Motor Control and Drive', selector: '.cardgrid:has(.mchp-card-item.card-one-hundred)', style: null, blocks: ['cards-resource'], defaultContent: [] },
    { id: 'sec-recommended-products', name: 'Recommended Motor Control Products', selector: '.simpletable', style: null, blocks: ['table-compare'], defaultContent: [] },
    { id: 'sec-hw-sw-solutions', name: 'Motor Control Hardware and Software Solutions', selector: '.cardcarousel', style: null, blocks: ['carousel-solutions'], defaultContent: [] },
    { id: 'sec-products', name: 'Products (Parametric)', selector: '.tabs.panelcontainer', style: null, blocks: ['tabs-parametric'], defaultContent: [] },
  ],
};

// PARSER REGISTRY
const parsers = {
  'hero-banner': heroBannerParser,
  'cards-solutions': cardsSolutionsParser,
  'cards-resource': cardsResourceParser,
  'table-compare': tableCompareParser,
  'carousel-solutions': carouselSolutionsParser,
  'tabs-parametric': tabsParametricParser,
};

// TRANSFORMER REGISTRY - cleanup runs first, sections after (only if 2+ sections)
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration
 */
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
          section: blockDef.section || null,
        });
      });
    });
  });
  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const {
      document, url, html, params,
    } = payload;

    const main = document.body;

    // 1. beforeTransform (initial cleanup)
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return; // Already replaced by earlier parser
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

    // 4. afterTransform (final cleanup + section breaks/metadata)
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Generate sanitized path
    const path = WebImporter.FileUtils.sanitizePath(
      new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, ''),
    );

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
