import * as React from 'react';
import * as CSS from 'csstype'; // at top of file
import {MathpixMarkdownModel as MM} from '../../mathpix-markdown-model';

export interface MathpixMarkdownProps {
    text: string;
    alignMathBlock: CSS.TextAlignProperty;
    display: CSS.DisplayProperty;
    isCheckFormula?: boolean;
    showTimeLog?: boolean;
    isDisableFancy?: boolean;
    disableRules: string[];
}

class MathpixMarkdown extends React.Component<MathpixMarkdownProps> {
    render() {
        const { text, alignMathBlock='center', display='block', isCheckFormula=false, showTimeLog=false,isDisableFancy=false} = this.props;
        const disableRules = isDisableFancy ? MM.disableFancyArrayDef : this.props.disableRules;
        MM.setOptions(disableRules, isCheckFormula, showTimeLog);

        return (
            <div id='preview' style={{justifyContent: alignMathBlock, padding: '10px', overflowY: 'auto', willChange: 'transform' }}>
                <div id='setText' style={{display: display, justifyContent: 'inherit'}}
                     dangerouslySetInnerHTML={{ __html: MM.convertToHTML(text) }}
                />
            </div>
        );
    }
}
export default MathpixMarkdown;
