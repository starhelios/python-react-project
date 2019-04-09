import React, { Component, PropTypes } from 'react';

export default class PropertyFilterCheckbox extends Component {

  constructor(...args) {
    super(...args);

    this.onCheckboxClick = this.onCheckboxClick.bind(this);
  }

  onCheckboxClick() {
    this.props.onChange(this.props.name, (this.props.checked + 2) % 3 -1);
  }

  render() {
    let checkerIcon = '';
    if (this.props.checked === 1) {
      checkerIcon = 'glyphicon glyphicon-ok';
    } else if (this.props.checked === -1) {
      checkerIcon = 'glyphicon glyphicon-remove';
    }

    return (
      <div className="property-filter-checkbox" onClick={this.onCheckboxClick}>
        <i className={checkerIcon}></i>
        <span>{this.props.label}</span>
      </div>
    );
  }
}

PropertyFilterCheckbox.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  checked: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired
};
