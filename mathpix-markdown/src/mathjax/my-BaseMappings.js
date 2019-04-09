"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var sm = require("mathjax3/mathjax3/input/tex/SymbolMap.js");
var ParseMethods_js_1 = require("mathjax3/mathjax3/input/tex/ParseMethods.js");
var BaseMethods_js_1 = require("mathjax3/mathjax3/input/tex/base/BaseMethods.js");

new sm.CharacterMap('wasysym-mathchar0mo', ParseMethods_js_1.default.mathchar0mo, {
  varangle: '\u2222',
  Perp: '\u2AEB',
});

new sm.CommandMap('wasysym-macros', {
  Vmathcal: ['Macro', '{\\cal #1}', 1],
  Varangle: ['Macro', '{\\unicode{x003C}\\!\\!\\!\\small\\unicode{x0029}}'],
  longdiv: ['Macro', '{\\overline{\\smash{)}#1}}', 1],
  oint: ['Macro', '{\\mathop{\\vcenter{\\mathchoice{\\huge\\unicode{x222E}\\,}{\\unicode{x222E}}{\\unicode{x222E}}{\\unicode{x222E}}}\\,}\\nolimits}'],
  oiint: ['Macro', '{\\mathop{\\vcenter{\\mathchoice{\\huge\\unicode{x222F}\\,}{\\unicode{x222F}}{\\unicode{x222F}}{\\unicode{x222F}}}\\,}\\nolimits}'],
  oiiint: ['Macro', '{\\mathop{\\vcenter{\\mathchoice{\\huge\\unicode{x2230}\\,}{\\unicode{x2230}}{\\unicode{x2230}}{\\unicode{x2230}}}\\,}\\nolimits}'],
  ointclockwise: ['Macro', '{\\mathop{\\vcenter{\\mathchoice{\\huge\\unicode{x2232}\\,}{\\unicode{x2232}}{\\unicode{x2232}}{\\unicode{x2232}}}\\,}\\nolimits}'],
  ointctrclockwise: ['Macro', '{\\mathop{\\vcenter{\\mathchoice{\\huge\\unicode{x2233}\\,}{\\unicode{x2233}}{\\unicode{x2233}}{\\unicode{x2233}}}\\,}\\nolimits}'],
}, BaseMethods_js_1.default);

//# sourceMappingURL=BaseMappings.js.map