import {MathJax} from "../mathjax/"

let count = 0,
  mathNumber = [];

function multiMath(state, silent) {
  count = 0;
  let startMathPos = state.pos;
  if (state.src.charCodeAt(startMathPos) !== 0x5c /* \ */) {
    return false;
  }
  const match = state.src
    .slice(++startMathPos)
    .match(/^(?:\\\[|\[|\\\(|\(|begin\{([^}]*)\}|eqref\{([^}]*)\})/); // eslint-disable-line
  if (!match) {
    return false;
  }
  startMathPos += match[0].length;
  let type, endMarker, includeMarkers; // eslint-disable-line
  if (match[0] === "\\[") {
    type = "display_math";
    endMarker = "\\\\]";
  } else if (match[0] === "\[") {
      type = "display_math";
      endMarker = "\\]";
  } else if (match[0] === "\\(") {
    type = "inline_math";
    endMarker = "\\\\)";
  } else if (match[0] === "\(") {
      type = "inline_math";
      endMarker = "\\)";
  } else if (match[0].includes("eqref")) {
    type = "reference_note";
    endMarker = "";
  } else if (match[1]) {
    if (match[1].indexOf('*') > 0) {
      type = "equation_math_not_number";
    } else {
      type = "equation_math";
    }
    endMarker = `\\end{${match[1]}}`;
    includeMarkers = true;
  }
  const endMarkerPos = state.src.indexOf(endMarker, startMathPos);
  if (endMarkerPos === -1) {
    return false;
  }
  const nextPos = endMarkerPos + endMarker.length;
  if (!silent) {
    const token = state.push(type, "", 0);
    if (includeMarkers) {
      token.content = state.src.slice(state.pos, nextPos);
    } else if (type === "reference_note") {
      token.content = match ? match[2] : "";
    } else {
      token.content = state.src.slice(startMathPos, endMarkerPos);
    }
  }

  state.pos = nextPos;
  return true;
}

function simpleMath(state, silent) {
  let startMathPos = state.pos;
  if (state.src.charCodeAt(startMathPos) !== 0x24 /* $ */) {
    return false;
  }

  // Parse tex math according to http://pandoc.org/README.html#math
  let endMarker = "$";
  const afterStartMarker = state.src.charCodeAt(++startMathPos); // eslint-disable-line
  if (afterStartMarker === 0x24 /* $ */) {
    endMarker = "$$";
    if (state.src.charCodeAt(++startMathPos) === 0x24 /* $ */) {
      // eslint-disable-line
      return false;
    }
  } else {
    // Skip if opening $ is succeeded by a space character
    if (
      afterStartMarker === 0x20 /* space */ ||
      afterStartMarker === 0x09 /* \t */ ||
      afterStartMarker === 0x0a /* \n */
    ) {
      // eslint-disable-line
      return false;
    }
  }
  const endMarkerPos = state.src.indexOf(endMarker, startMathPos);
  if (endMarkerPos === -1) {
    return false;
  }
  if (state.src.charCodeAt(endMarkerPos - 1) === 0x5c /* \ */) {
    return false;
  }
  const nextPos = endMarkerPos + endMarker.length;
  if (endMarker.length === 1) {
    // Skip if $ is preceded by a space character
    const beforeEndMarker = state.src.charCodeAt(endMarkerPos - 1);
    if (
      beforeEndMarker === 0x20 /* space */ ||
      beforeEndMarker === 0x09 /* \t */ ||
      beforeEndMarker === 0x0a /* \n */
    ) {
      return false;
    }
    // Skip if closing $ is succeeded by a digit (eg $5 $10 ...)
    const suffix = state.src.charCodeAt(nextPos);
    if (suffix >= 0x30 && suffix < 0x3a) {
      return false;
    }
  }

  if (!silent) {
    const token = state.push(
      endMarker.length === 1 ? "inline_math" : "display_math",
      "",
      0
    );
    token.content = state.src.slice(startMathPos, endMarkerPos);
  }
  state.pos = nextPos;
  return true;
}

function usepackage(state, silent) {
    const str_usepackage = "usepackage";
    const str_geometry = "geometry";

    let beginMathPos = state.pos;
    if (state.src.charCodeAt(beginMathPos) !== 0x5c /* \ */){
        return false;
    }

    let startMathPos = state.src.indexOf(str_usepackage, beginMathPos);


    if (startMathPos < 0) {
        return false;
    } else {
        state.src = state.src.replace(/\s/g, '');
    }
    startMathPos += str_usepackage.length;

    let match = state.src
        .slice(startMathPos)
        .match(/^(?:\[)/); // eslint-disable-line

    if (!match) {
        return false;
    }

    startMathPos += match[0].length;
    let endMarker;
    if (match[0] === "[") { endMarker = "]"; }

    const endContentPos = state.src.indexOf(endMarker, startMathPos);

    if (endContentPos === -1) {
        return false;
    }


    const content = state.src.slice(startMathPos, endContentPos);

    if (!content) {
        return false;
    }

    startMathPos = endContentPos + 1;
    match = state.src
        .slice(startMathPos)
        .match(/^(?:{)/); // eslint-disable-line

    if (!match) {
        return false;
    }

    startMathPos += match[0].length;
    endMarker = "}";
    const endMarkerPos = state.src.indexOf(endMarker, startMathPos);
    const usepackageName = state.src.slice(startMathPos, endMarkerPos);

    let type;

    if (usepackageName === str_geometry) {
        type = 'usepackage_geometry'
    }

    if (!type) {
        return false;
    }

    const nextPos = endMarkerPos + endMarker.length;


    if (!silent) {
        const token = state.push(type, "geometry", 0);
        token.content = content;
        token.hidden = true;
    }

    state.pos = nextPos;
    return true;
}

function extend(options, defaults) {
  return Object.keys(defaults).reduce((result, key) => {
    if (result[key] === undefined) {
      result[key] = defaults[key];
    }
    return result;
  }, options);
}

const mapping = {
  math: "Math",
  inline_math: "InlineMath",
  display_math: "DisplayMath",
  equation_math: "EquationMath",
  equation_math_not_number: "EquationMathNotNumber",
  reference_note: "Reference_note",
  usepackage_geometry: "Usepackage_geometry"
};

const checkReference = data => {
  const match = data.match(/label\{([^}]*)\}/);
  return {
    tagId: match ? match[1] : "",
    math: data.replace(/\\label\{([^}]*)\}/, "")
  };
};

const renderMath = (a, token) => {
  const { tagId, math } = checkReference(token.content);
  let isBlock =  token.type !== 'inline_math';
  let mathEquation = null;
  try {
    mathEquation = MathJax.Typeset(math, isBlock).outerHTML;
  } catch (e) {
    console.log('ERROR MathJax =>', e.message, e);
    mathEquation = math;
    return `<p class="math-error">${mathEquation}</p>`;
  }
  let equationNode;
  if (token.type === "equation_math_not_number") {
      equationNode = ""; // eslint-disable-line
      if (tagId) {
          mathNumber[tagId] = `[${0}]`;
      }
  } else {
      equationNode =
          token.type === "equation_math"
              ? `<span class='equation-number' ${
                  tagId ? `id="${tagId}"` : ""
                  }>(${++count})</span>`
              : ""; // eslint-disable-line
      if (tagId) {
          mathNumber[tagId] = `[${count}]`;
      }
  }


  return token.type === "inline_math"
    ? `<span class="math-inline">${mathEquation}</span>`
    : `<span class="math-block">${mathEquation}${equationNode}</span>`;
};

const setStyle = (str) => {
    let arrStyle = str.replace('=', ':').replace(/\s/g, '').split(",");
    let newArr = [];

    arrStyle.map(item => {
        let newStr = '';
        //margin-bottom
        if(item.indexOf('top')>=0) {
            newStr = item.replace('top', 'padding-top').replace('=', ':');
        }
        if(item.indexOf('bottom')>=0) {
            newStr = item.replace('bottom', 'padding-bottom').replace('=', ':');
        }
        if(item.indexOf('left')>=0) {
            newStr = item.replace('left', 'padding-left').replace('=', ':')
        }
        if(item.indexOf('right')>=0) {
            newStr = item.replace('right', 'padding-right').replace('=', ':')
        }
        if (newStr) {
            newArr.push(newStr);
        }
        return newStr;
    });
    return newArr.join('; ');
};

const renderUsepackage = token => {
    if (token.type === "usepackage_geometry"){
        const preview = document.getElementById('preview');
        if(!preview) {
            return false
        }
        const content = token.content;
        let strStyle = setStyle(content);
        preview.removeAttribute("style");
        preview.setAttribute("style", strStyle);
        return `<span class="hidden">${strStyle}</span>`
    } else {
        return false
    }
};

const renderReference = token => {
    return `<a href="javascript:void(0)" 
             style="cursor: pointer; text-decoration: none;" 
             class="clickable-link"
             value=${token.content}
          >${mathNumber[token.content] || '['+token.content+']'} </a>`;
};

export default options => {
  const defaults = {
    beforeMath: "",
    afterMath: "",
    beforeInlineMath: "\\(",
    afterInlineMath: "\\)",
    beforeDisplayMath: "\\[",
    afterDisplayMath: "\\]"
  };
  options = extend(options || {}, defaults);

  return md => {
    md.inline.ruler.before("escape", "usepackage", usepackage);
    md.inline.ruler.before("escape", "multiMath", multiMath);
    md.inline.ruler.push("simpleMath", simpleMath);

    Object.keys(mapping).forEach(key => {
        md.renderer.rules[key] = (tokens, idx) =>
            tokens[idx].type === "reference_note"
                ? renderReference(tokens[idx])
                : tokens[idx].type === "usepackage_geometry"
                ? renderUsepackage(tokens[idx])
                : renderMath(tokens, tokens[idx]);
    });
  };
};
