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
              session_id={item.session_id}
              dataset={item.dataset}
              imagePath={item.image_path}
              properties={item.properties}
              is_printed={item.is_printed}
              is_handwritten={item.is_handwritten}
              is_inverted={item.is_inverted}
              is_verified={item.is_verified}
              is_good={item.is_good}
              verified_by={item.verified_by}
              queue={item.queue}
              viewType={this.props.viewType}
              datetime={item.datetime}
              latex={item.latex || ''}
              text_normalized={item.text_normalized}
              latex_normalized={item.latex_normalized} />
          ))
        }
      </tbody>
    );
  };
};

