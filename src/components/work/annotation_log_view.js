import React, { Component, PropTypes } from 'react';
import { callApi } from '../../libs/api';
import consts from '../../libs/consts';

const LOAD_LOG_API_URL = '/api/annolog/';
const LOAD_LOG_API_METHOD = 'get';

export default class AnnotationLogView extends Component {

  constructor(...args) {
    super(...args);

    this.state= {
      loadLogStatus: consts.API_NOT_LOADED,
      loadLogError: '',
      log: ''
    };

    this.loadLog = this.loadLog.bind(this);
  }

  componentWillMount() {
    this.loadLog();
  }

  loadLog() {
    this.setState({ loadLogStatus: consts.API_LOADING }, () => {
      callApi(LOAD_LOG_API_URL + this.props.sessionId, LOAD_LOG_API_METHOD).then(
        response => {
          console.log('Load Annotation Log API success', response);
          if (response.data && !response.data.startsWith('<?xml version')) {
            this.setState({
              loadLogStatus: consts.API_LOADED_SUCCESS,
              log: response.data
            });
          } else {
            this.setState({
              loadLogStatus: consts.API_LOADED_SUCCESS,
              log: 'No log'
            });
          }
        },
        error => {
          console.log('Load Annotation Log API fail', error);
          this.setState({
            loadLogStatus: consts.API_LOADED_ERROR,
            loadLogError: 'Failed to load annotation log.'
          });
        }
      );
    });
  }

  render() {

    const { loadLogStatus } = this.state;

    if (loadLogStatus === consts.API_LOADED_ERROR) {
      return (
        <div className="anno-log">
          <div className="error">{this.state.loadLogError}</div>
        </div>
      );
    }

    // if (loadLogStatus === consts.API_LOADING) {
    //   return (
    //     <div className="anno-log">
    //       <div className="spinner"><img src="/static/img/spinner-md.gif" /></div>
    //     </div>
    //   );
    // }

    if (loadLogStatus === consts.API_LOADED_SUCCESS) {
      return (
        <div className="anno-log">
          <h3>Annotation Log</h3>
          <textarea className="annotation-log" value={this.state.log} readOnly={true} />
        </div>
      );
    }

    return null;
  }

}

AnnotationLogView.propTypes = {
  sessionId: PropTypes.string.isRequired
}
