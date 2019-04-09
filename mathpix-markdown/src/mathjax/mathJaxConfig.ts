//TODO: use AMS numbering once the package will be available
const MathJaxConfig = {
    TeX: {
        packages: ['base', 'ams', 'boldsymbol', 'newcommand', 'unicode', 'color', 'mhchem'], // extensions to use
        TagSide: "right", // side for \tag macros
        TagIndent: "0.8em", // amount to indent tags
        MultLineWidth: "85%", // width of multline environment
        useLabelIds: true, // use label name rather for ids
        tags: "none", // or 'ams' or 'all'
        inlineMath: [
            // start/end delimiter pairs for in-line math
            ["$", "$"],
            ["\\(", "\\)"]
        ],
        displayMath: [
            // start/end delimiter pairs for display math
            ["$$", "$$"],
            ["\\[", "\\]"]
        ],
        processEscapes: true, // use \$ to produce a litteral dollar sign
        processEnvironments: true, // process \begin{xxx}...\end{xxx} outside math mode
        processRefs: true, // process \ref{...} outside of math mode,
    },
    MathML: {
        parseAs: "html", // or 'xml'
        forceReparse: false // Force the MathML to be reparsed?
        //   (e.g., for XML parsing in an HTML document)
    },
    HTML: {
        scale: 1, // Global scaling factor for all expressions
        mathmlSpacing: false, // true for MathML spacing rules, false for TeX rules
        exFactor: 0.5 // default size of ex in em units when ex size can't be determined
    },
    SVG: {
        scale: 1, // Global scaling factor for all expressions
        mathmlSpacing: false, // true for MathML spacing rules, false for TeX rules
        exFactor: 0.5 // default size of ex in em units when ex size can't be determined
    }
};

export default MathJaxConfig;
