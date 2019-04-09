import * as React from "react";
import {MathpixMarkdownModel as MM} from '../../mathpix-markdown-model'

class MathpixLoader extends React.Component {
    /** the state of the component */
    state = {
        isReadyToTypeSet: false
    };

    componentDidMount() {
        const isLoad = MM.loadMathJax();
        this.setState({isReadyToTypeSet: isLoad});
    }
    render() {
        if (this.state.isReadyToTypeSet) {
            return <div id="content">{this.props.children}</div>
        }
        return <div>Loading</div>;
    }
}

export default MathpixLoader;