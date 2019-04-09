import React, {Component, PropTypes} from 'react';
import keydown from 'react-keydown';
const LATEX_RENDER_HEIGHT_DEFAULT = 80;

export default class LatexRenderBox extends Component {

  constructor(...args) {
    super(...args);

    this.setHeight = this.setHeight.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    // setTimeout here is just a trick to perform redering & height update in the next tick i.e. after props have been updated.
    // We do not use componentDidUpdate because it's called too many times, even by parent component re-rendering with the same props.
    // By comparing current props and next props here, we can have MathJax process latex only when necessary.
    // ref: http://geekabyte.blogspot.com/2014/01/javascript-effect-of-setting-settimeout.html
    if (this.props.latex !== nextProps.latex) {
      setTimeout(() => { MathJax.Hub.Queue(["Typeset", MathJax.Hub, this.props.latexRenderId], this.setHeight); });
    }
    if (this.props.fontSize !== nextProps.fontSize) {
      setTimeout(this.setHeight);
    }
  }

  setHeight() {
    const mathJaxHeight = $(this.refs.latexRenderArea).find('.MathJax_Display').outerHeight();
    const newHeight = mathJaxHeight + 2 * this.props.fontSize;
    const heightToSet = Math.max(newHeight, LATEX_RENDER_HEIGHT_DEFAULT);
    $(this.refs.latexRenderArea).outerHeight(heightToSet + 'px');
  }

  render() {
    const { latexRenderId, latexRenderField, latex, secondLabel, fontSize } = this.props;

    return (
      <div className="latex-render-parent col-xs-12 col-sm-10 col-sm-offset-1 col-md-8 col-md-offset-2">
        <div>
          <label htmlFor={latexRenderId}>{latexRenderField.label}</label>
          {
            secondLabel ?
              <label className="pull-right">{secondLabel}</label>
              : null
          }
        </div>
        <div className="latex-render" id={latexRenderId} ref="latexRenderArea" title={latexRenderField.help}
             style={{ fontSize: fontSize + 'px' }}>
          {'$$' + latex + '$$'}
        </div>
      </div>
    );
  }
}

LatexRenderBox.propTypes = {
  latexRenderId: PropTypes.string.isRequired,
  latexRenderField: PropTypes.object.isRequired,
  latex: PropTypes.string,
  fontSize: PropTypes.number
};
