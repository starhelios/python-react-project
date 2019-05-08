import React, { Component, PropTypes } from 'react';
import DataRow from './dataRow';

export default class DataBody extends Component {

  static propTypes = {
    data: PropTypes.array.isRequired
  };

  shouldComponentUpdate(nextProps) {
    if (nextProps.data !== this.props.data || nextProps.viewType !== this.props.viewType) {
      return true;
    }
    return false;
  };

  render() {
    return (
      <tbody>
        {
          this.props.data.map((item, index) => (
            <DataRow key={index}
              annotator={item.username}
              annoList={item.anno_list}
              text={item.text || ""}
              dataset={item.dataset}
              imagePath={item.image_path}
              properties={item.properties}
              char_size={item.char_size}
              is_verified={item.is_verified}
              viewType={this.props.viewType}
              datetime={item.datetime} />
          ))
        }
      </tbody>
    );
  };
};

