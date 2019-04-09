import React, { Component, PropTypes } from 'react';

export default class Nl2br extends Component {

  render() {
    const { tag, lineTag, content, ...props } = this.props;
    const converted = [];
    let key = 0;
    content.split('\n').forEach((line) => {
      key ++;
      converted.push(React.createElement(lineTag, { key: 'line'+key }, line));
      converted.push(<br key={'br'+key} />);
    });
    return React.createElement(tag, props, converted);
  }

}

Nl2br.propTypes = {
  tag: PropTypes.string,
  content: PropTypes.string.isRequired
}

Nl2br.defaultProps = {
  tag: 'div',
  lineTag: 'span'
}
