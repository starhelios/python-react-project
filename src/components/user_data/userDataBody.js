import React, { Component, PropTypes } from 'react';
import UserDataRow from "./userDataRow";

export default class UserDataBody extends Component {

  static propTypes = {
    data: PropTypes.array.isRequired
  };

  shouldComponentUpdate(nextProps) {
    if (nextProps.data !== this.props.data) {
      return true;
    }
    return false;
  };

  render() {
    return (
      <tbody>
      {
        this.props.data.map((item, index) => (
          <UserDataRow key={index} image={item} queueImage={this.props.queueImage} />
        ))
      }
      </tbody>
    );
  };
};


