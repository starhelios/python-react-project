import React, { Component, PropTypes } from 'react';

export default class PropertyFilterCheckbox extends Component {

  constructor(...args) {
    super(...args);

    this.onCheckboxClick = this.onCheckboxClick.bind(this);
    this.onInputClick = this.onInputClick.bind(this);
    this.onInputChange = this.onInputChange.bind(this);
  }

  onCheckboxClick() {
    this.props.onChange(this.props.name, (this.props.checked + 2) % 3 -1);
  }
  onInputClick(event) {
    event.preventDefault();
    event.stopPropagation();
  }
  onInputChange(event) {
    this.props.onAppCountChange(this.props.name, event.target.value);
  }

  render() {
    const { counter, appCount } = this.props;
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
        {counter
          ? [
            <input key="1" type="number" value={appCount} name="counter" step="1" min="0" className="form-control" onClick={this.onInputClick} onChange={this.onInputChange} />,
            <div key="2" className="show-label">min</div>
          ]
          : null
        }
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
