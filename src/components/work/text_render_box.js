import React, { Component, PropTypes } from 'react';
import keydown from 'react-keydown';
import { MathpixMarkdown, MathpixLoader } from 'mathpix-markdown-it';
const TEXT_RENDER_HEIGHT_DEFAULT = 80;

export default class TextRenderBox extends Component {

  constructor(...args) {
    super(...args);
    this.setHeight = this.setHeight.bind(this);
    this.state = {
      defaultWidth: null,
    };
  }

  componentDidMount() {
    this.setHeight();
    this.setDefaultWidth();
    window.addEventListener('resize', this.setDefaultWidth);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.setDefaultWidth);
  }

  componentWillReceiveProps(nextProps) {
    // setTimeout here is just a trick to perform redering & height update in the next tick i.e. after props have been updated.
    // We do not use componentDidUpdate because it's called too many times, even by parent component re-rendering with the same props.
    // By comparing current props and next props here, we can have MathJax process latex only when necessary.
    // ref: http://geekabyte.blogspot.com/2014/01/javascript-effect-of-setting-settimeout.html
    this.setHeight();
  }

  setHeight() {
    const mathJaxHeight = $(this.refs.textRenderArea).find('.MathJax_Display').outerHeight();
    const newHeight = mathJaxHeight + 2 * this.props.fontSize;
    const heightToSet = Math.max(newHeight, TEXT_RENDER_HEIGHT_DEFAULT);
    $(this.refs.textRenderArea).outerHeight(heightToSet + 'px');
  }

  setDefaultWidth = () => {
    const isMathBlock = !!$('.latex-render-parent p').has('.math-block').length;
    if (isMathBlock) {
      return;
    }
    this.setState({
      defaultWidth: $('.latex-edit-parent').width() ? $('.latex-edit-parent').width() : null,
    });
  };

  render() {
    const { textRenderField, text, secondLabel, fontSize } = this.props;
    return (
      <div className="latex-render-parent" style={{ minWidth: this.state.defaultWidth }}>
        <span className="latex-render" ref="textRenderArea" title={textRenderField.help}
          style={{ fontSize: fontSize + 'px', whiteSpace: "nowrap" }}>
          <MathpixLoader>
            <MathpixMarkdown mathJax={{mtextInheritFont: true}} text={text} isDisableFancy={true} />
          </MathpixLoader>
        </span>
      </div>
    );
  }
}

TextRenderBox.propTypes = {
  textRenderField: PropTypes.object.isRequired,
  text: PropTypes.string,
  fontSize: PropTypes.number
};

