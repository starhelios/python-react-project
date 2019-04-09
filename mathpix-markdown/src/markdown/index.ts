import { ConfiguredMathJaxPlugin } from "./mdPluginConfigured";
import { withLineNumbers } from "./rules";
import {MathpixMarkdownModel as MM} from '../mathpix-markdown-model'


/** md renderer */
let md = require("markdown-it")({
  html: true,
  xhtmlOut: false,
  breaks: true,
  langPrefix: "language-",
  linkify: true,
  typographer: true,
  quotes: "“”‘’"
})
  .use(ConfiguredMathJaxPlugin({}))
  .use(require("markdown-it-footnote"))
  .use(require("markdown-it-sub"))
  .use(require("markdown-it-sup"))
  .use(require("markdown-it-deflist"))
  .use(require("markdown-it-mark"))
  .use(require("markdown-it-emoji"))
  .use(require("markdown-it-ins"));

/** String transformtion pipeline */
// @ts-ignore
export const markdownToHtmlPipeline = (content: string, lineNumbering=false) => {
// inject rules override
  if(lineNumbering){
      md = withLineNumbers(md);
  }
  if (MM.disableRules && MM.disableRules.length > 0) {
      md.disable(MM.disableRules);
  }

  return md.render(content);
};

/**
 * convert a markdown text to html
 */
export function markdownToHTML(markdown: string, lineNumbering=false): string {
  const html = markdownToHtmlPipeline(markdown, lineNumbering);
  return html;
}
