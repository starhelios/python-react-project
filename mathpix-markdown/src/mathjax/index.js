import {MathJax as MJ} from 'mathjax3/mathjax3/mathjax.js';
import {TeX} from 'mathjax3/mathjax3/input/tex.js';
import {SVG} from 'mathjax3/mathjax3/output/svg.js';
import {HTMLMathItem} from 'mathjax3/mathjax3/handlers/html/HTMLMathItem.js';
import {RegisterHTMLHandler} from 'mathjax3/mathjax3/handlers/html.js';
import {chooseAdaptor} from 'mathjax3/mathjax3/adaptors/chooseAdaptor.js';

import 'mathjax3/mathjax3/input/tex/base/BaseConfiguration.js';
import 'mathjax3/mathjax3/input/tex/ams/AmsConfiguration.js';
import 'mathjax3/mathjax3/input/tex/noundefined/NoUndefinedConfiguration.js';
import 'mathjax3/mathjax3/input/tex/boldsymbol/BoldsymbolConfiguration.js';
import 'mathjax3/mathjax3/input/tex/newcommand/NewcommandConfiguration.js';
import 'mathjax3/mathjax3/input/tex/unicode/UnicodeConfiguration.js';
import "mathjax3/mathjax3/input/tex/color/ColorConfiguration.js";
import "mathjax3/mathjax3/input/tex/mhchem/MhchemConfiguration.js";
import MathJaxConfig from './mathJaxConfig';

require("./my-BaseMappings.js");

import {BaseConfiguration} from 'mathjax3/mathjax3/input/tex/base/BaseConfiguration.js';
BaseConfiguration.handler.macro.push('wasysym-mathchar0mo');
//wasysym-macros
BaseConfiguration.handler.macro.push('wasysym-macros');

const adaptor = chooseAdaptor();
RegisterHTMLHandler(adaptor);

const texConfig = Object.assign({}, MathJaxConfig.TeX || {});
const svgConfig = Object.assign({}, MathJaxConfig.HTML || {});

const tex = new TeX(texConfig);
const svg = new SVG(svgConfig);

let doc = MJ.document(document, {
  InputJax:tex,
  OutputJax: svg
});

export const MathJax = {
  //
  //  Return the stylesheet DOM node
  //
  Stylesheet: function () {
    return svg.styleSheet(doc);
  },

  //
  //  Typeset a MathML expression and return the SVG tree for it
  //
  Typeset: function(string, display, em = 16, ex = 8, cwidth = 80*16) {
    let math = new HTMLMathItem(string, tex, display);
    //configuration.handler.macro
    math.setMetrics(em, ex, cwidth, 100000, 1);
    math.compile(doc);
    math.typeset(doc);
    return math.typesetRoot;
  },

  //
  //  Reset tags and labels
  //
  Reset: function (n) {
    if (n) {n--} else {n = 0}
    tex.parseOptions.tags.reset(n);
  }
};
