import { unified } from 'unified';
import remarkGfm from 'remark-gfm';
import remarkHeadingId from 'remark-heading-id';
import rehypeExternalLinks from 'rehype-external-links';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import remarkParse from 'remark-parse';
import remarkRetext from 'remark-retext';
import { Parser as English } from 'retext-english';
import retextStringify from 'retext-stringify';
import remarkToc from 'remark-toc';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import remarkFootnotes from 'remark-footnotes';
import rehypeRewrite from 'rehype-rewrite';

const externalLinksConfig = {
  target: (/** @type {any} */ el) => {
    if (!el.properties.href) return '_self';
    if (el.properties.href.startsWith('/') && !el.properties.href.startsWith('//')) return '_self';
    return '_blank';
  },
  rel: ['noreferrer', 'noopener', 'nofollow']
};

export const remarkPlugins = [
  remarkFootnotes,
  remarkGfm,
  [remarkToc, { tight: true, ordered: true }],
  remarkHeadingId
];

export const rehypePlugins = [
  rehypeSlug,
  [rehypeAutolinkHeadings, { behavior: 'append' }],
  [rehypeExternalLinks, externalLinksConfig]
];

/**
 * Renders Markdown, fixing links to be relative to
 * the site base and making external links open in a new tab
 * @param {string} data
 * @param {'html' | 'plain'} format
 * @param {null | ((link: string) => string)} linkRewriteFn  Function to transform all links to new links.
 */
export function markdown(data, format = 'html', linkRewriteFn = null) {
  if (format === 'plain') {
    return unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkHeadingId)
      .use(remarkRetext, English)
      .use(retextStringify)
      .processSync(data);
  }

  return (
    unified()
      .use(remarkParse)
      .use(remarkPlugins)
      .use(remarkRehype)
      .use(rehypePlugins)

      // This is necessary if we're parsing markdown with absolute-path links
      //  but we're located in a subdirectory (e.g. /class/cs45/)
      .use(rehypeRewrite, {
        rewrite: (node) => {
          if (
            node.type === 'element' &&
            node.tagName === 'a' &&
            node.properties &&
            node.properties.href &&
            linkRewriteFn
          ) {
            node.properties.href = linkRewriteFn(node.properties.href);
          }
        }
      })
      .use(rehypeStringify)
      .processSync(data)
  );
}
