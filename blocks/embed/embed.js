/*
 * Embed Block
 * Show videos and social posts directly on your page
 * https://www.hlx.live/developer/block-collection/embed
 */

import { loadScript } from '../../scripts/aem.js';

const getEmbedContainerStyle = (fixedHeight) => (fixedHeight
  ? `left: 0; width: 100%; height: ${fixedHeight}px; position: relative;`
  : 'left: 0; width: 100%; height: 0; position: relative; padding-bottom: 56.25%;');

const getDefaultEmbed = (url, fixedHeight) => `<div style="${getEmbedContainerStyle(fixedHeight)}">
    <iframe src="${url.href}" style="border: 0; top: 0; left: 0; width: 100%; height: 100%; position: absolute;" allowfullscreen=""
      scrolling="no" allow="encrypted-media" title="Content from ${url.hostname}" loading="lazy">
    </iframe>
  </div>`;

const embedYoutube = (url, autoplay, fixedHeight) => {
  const usp = new URLSearchParams(url.search);
  const suffix = autoplay ? '&muted=1&autoplay=1' : '';
  let vid = usp.get('v') ? encodeURIComponent(usp.get('v')) : '';
  const embed = url.pathname;
  if (url.origin.includes('youtu.be')) {
    [, vid] = url.pathname.split('/');
  }
  const embedHTML = `<div style="${getEmbedContainerStyle(fixedHeight)}">
      <iframe src="https://www.youtube.com${vid ? `/embed/${vid}?rel=0&v=${vid}${suffix}` : embed}" style="border: 0; top: 0; left: 0; width: 100%; height: 100%; position: absolute;" 
      allow="autoplay; fullscreen; picture-in-picture; encrypted-media; accelerometer; gyroscope; picture-in-picture" allowfullscreen="" scrolling="no" title="Content from Youtube" loading="lazy"></iframe>
    </div>`;
  return embedHTML;
};

const embedVimeo = (url, autoplay, fixedHeight) => {
  const [, video] = url.pathname.split('/');
  const suffix = autoplay ? '?muted=1&autoplay=1' : '';
  const embedHTML = `<div style="${getEmbedContainerStyle(fixedHeight)}">
      <iframe src="https://player.vimeo.com/video/${video}${suffix}" 
      style="border: 0; top: 0; left: 0; width: 100%; height: 100%; position: absolute;" 
      frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen  
      title="Content from Vimeo" loading="lazy"></iframe>
    </div>`;
  return embedHTML;
};

const embedTwitter = (url) => {
  const embedHTML = `<blockquote class="twitter-tweet"><a href="${url.href}"></a></blockquote>`;
  loadScript('https://platform.twitter.com/widgets.js');
  return embedHTML;
};

const getFixedHeight = (block) => {
  const fixedHeightClass = [...block.classList]
    .find((className) => /^(?:fixedheight-|fixed-height-|h-)?\d+(?:px)?$/i.test(className));
  if (!fixedHeightClass) return null;

  const match = fixedHeightClass.match(/(\d+)/);
  const value = match ? Number(match[1]) : NaN;
  return Number.isFinite(value) && value > 0 ? value : null;
};

const loadEmbed = (block, link, autoplay, fixedHeight) => {
  if (block.classList.contains('embed-is-loaded')) {
    return;
  }

  const EMBEDS_CONFIG = [
    {
      match: ['youtube', 'youtu.be'],
      embed: embedYoutube,
    },
    {
      match: ['vimeo'],
      embed: embedVimeo,
    },
    {
      match: ['twitter'],
      embed: embedTwitter,
    },
  ];

  const config = EMBEDS_CONFIG.find((e) => e.match.some((match) => link.includes(match)));
  const url = new URL(link);
  if (config) {
    block.innerHTML = config.embed(url, autoplay, fixedHeight);
    block.classList = `block embed embed-${config.match[0]}`;
  } else {
    block.innerHTML = getDefaultEmbed(url, fixedHeight);
    block.classList = 'block embed';
  }
  block.classList.add('embed-is-loaded');
};

/*
 * Video Column variant: two columns — a headline + body on the left and an
 * embedded video on the right (matches the Microchip data-center "player"
 * block). Authoring contract is a single row with two cells:
 *   | text (heading + paragraphs) | video link |
 */
function decorateVideoColumn(block) {
  const cells = [...block.querySelectorAll(':scope > div > div')];
  const isVideoLink = (a) => /youtube\.com|youtu\.be|vimeo\.com/i.test(a.href);

  // The video column is the cell holding a video URL (the text column may also
  // contain links, e.g. a CTA, so match on the video host, not just any <a>).
  const videoCell = cells.find((c) => [...c.querySelectorAll('a')].some(isVideoLink))
    || cells[cells.length - 1];
  const textCell = cells.find((c) => c !== videoCell) || cells[0];

  const link = [...videoCell.querySelectorAll('a')].find(isVideoLink)?.href
    || videoCell.querySelector('a')?.href;
  if (!link) return;

  const row = block.querySelector(':scope > div');
  textCell.classList.add('embed-video-column-text');
  videoCell.classList.add('embed-video-column-media');
  videoCell.textContent = '';

  // Lift the leading heading out to a full-width row above the two columns so
  // its divider underline spans the full content width, matching other section
  // headings (rather than being confined to the left column).
  const heading = textCell.querySelector(':scope > h1, :scope > h2, :scope > h3');
  if (heading) {
    const head = document.createElement('div');
    head.className = 'embed-video-column-heading';
    head.append(heading);
    block.prepend(head);
  }

  const media = document.createElement('div');
  media.className = 'embed embed-video-column-player';
  videoCell.append(media);

  const observer = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      observer.disconnect();
      loadEmbed(media, link, false, null);
    }
  });
  observer.observe(media);
  return row;
}

export default function decorate(block) {
  if (block.classList.contains('video-column')) {
    decorateVideoColumn(block);
    return;
  }

  const placeholder = block.querySelector('picture');
  const link = block.querySelector('a').href;
  const fixedHeight = getFixedHeight(block);
  block.textContent = '';

  if (placeholder) {
    const wrapper = document.createElement('div');
    wrapper.className = 'embed-placeholder';
    if (fixedHeight) {
      wrapper.style.aspectRatio = 'auto';
      wrapper.style.height = `${fixedHeight}px`;
    }
    wrapper.innerHTML = '<div class="embed-placeholder-play"><button type="button" title="Play"></button></div>';
    wrapper.prepend(placeholder);
    wrapper.addEventListener('click', () => {
      loadEmbed(block, link, true, fixedHeight);
    });
    block.append(wrapper);
  } else {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        observer.disconnect();
        loadEmbed(block, link, false, fixedHeight);
      }
    });
    observer.observe(block);
  }
}
