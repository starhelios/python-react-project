import {checkFormula} from './check-formula';
import {markdownToHTML} from "../markdown";
import {MathpixStyle} from "../mathjax/styles";
import {MathJax} from '../mathjax';
import * as CSS from 'csstype'; // at top of file

interface optionsMathpixMarkdown {
    alignMathBlock: CSS.TextAlignProperty;
    display: CSS.DisplayProperty;
    isCheckFormula?: boolean;
    showTimeLog?: boolean;
    isDisableFancy?: boolean;
    disableRules: string[];
}

class MathpixMarkdown_Model {
    public disableFancyArrayDef = ['replacements', 'list', 'usepackage'];
    public disableRules: string[];
    public isCheckFormula?: boolean;
    public showTimeLog?: boolean;

    setOptions(disableRules: string[], isCheckFormula?: boolean, showTimeLog?: boolean){
        this.disableRules = disableRules;
        this.isCheckFormula = isCheckFormula;
        this.showTimeLog = showTimeLog;
    }
    checkFormula = checkFormula;
    markdownToHTML = markdownToHTML;

    loadMathJax = ():boolean => {
        try {
            const el = document.getElementById('SVG-styles');
            if (!el) {
                document.head.appendChild(MathJax.Stylesheet());
            }

            const elStyle = document.getElementById('Mathpix-styles');
            if (!elStyle) {
                const style = document.createElement("style");
                style.setAttribute("id", "Mathpix-styles");
                style.innerHTML = MathpixStyle;
                document.head.appendChild(style)
            }
            return true;
        } catch (e) {
            console.log('Error load MathJax =>', e.message);
            return false;
        }
    };

    convertToHTML = (str:string) => {
        const startTime = new Date().getTime();
        const  mathString =  this.isCheckFormula ? this.checkFormula(str, this.showTimeLog): str;

        const html = this.markdownToHTML(mathString);
        const endTime = new Date().getTime();
        if(this.showTimeLog){
            console.log(`===> setText: ${endTime - startTime}ms`);
        }
        return html;
    };

    render = ( text: string, options: optionsMathpixMarkdown ):string => {
        const { alignMathBlock='center', display='block', isCheckFormula=false, showTimeLog=false,isDisableFancy=false} = options;
        const disableRules = isDisableFancy ? this.disableFancyArrayDef : options.disableRules;
        this.setOptions(disableRules, isCheckFormula, showTimeLog);
        return (
            `<div id='preview' style='justify-content:${alignMathBlock};padding:10px;overflow-y:auto;will-change:transform'>
                <div id='setText' style='display: ${display}; justify-content: inherit' >
                    ${this.convertToHTML(text)}
                </div>
            </div>`
        );
    };
}



export const MathpixMarkdownModel = new MathpixMarkdown_Model();
