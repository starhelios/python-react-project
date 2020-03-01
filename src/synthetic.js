import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { cloneDeep, get as _get } from 'lodash';
import keydown from 'react-keydown';
import consts from './libs/consts';
import Annotorious from './components/work/annotorious';
import AnnotationLogView from './components/work/annotation_log_view';
import charSizeMap from 'char_size.json';
import { Router, Route, browserHistory } from 'react-router';
import { MathpixMarkdown, MathpixLoader } from 'mathpix-markdown-it';
import axios from 'axios';

const LATEX_RENDER_HEIGHT_DEFAULT = 80;

require('./styles/annoUI.scss');
require('./styles/uis/synthetic.scss');

export default class TextRenderBox extends Component {
  constructor(...args) {
    super(...args);
  }

  render() {
    const { text } = this.props;
    return (
      <div style={{ fontSize: this.props.fontSize + "px" }} >
        <MathpixLoader >
            <MathpixMarkdown text={text} isDisableFancy={true}/>
         </MathpixLoader>
      </div>
    );
  }
}

TextRenderBox.propTypes = {
  text: PropTypes.string,
  fontSize: PropTypes.number
};


class AnnotationUI extends Component {

  constructor(...args) {
    super(...args);

    this.state = {
      loadUIApiStatus: consts.API_LOADING,
      loadUIApiError: '',
      loadDataApiStatus: consts.API_LOADING,
      loadDataApiError: '',
      saveDataApiStatus: consts.API_NOT_LOADED,
      saveDataApiError: '',
      alert: null,
      text: ""
    };
    this.onLatexFieldChange = this.onLatexFieldChange.bind(this);
    this.latexRenderTimeoutID = false;
    this.latexEditId = "latexEdit";
  }

  componentDidMount() {
  }

  @keydown('ctrl+m', 'ctrl+k', 'ctrl+i', 'ctrl+o')
  onKeyDown(event) {
    if (event.ctrlKey && event.key === 'k') {
      console.log("Making request...");
      const text = this.state.text.replace(/\n/g, "");
      const data = {"text": text};
      axios.post('/api/text-to-s3', data)
        .then((response) => {
          var responseData = response.data;
          if (responseData['success'] === true) {
            console.log("Request success!");
            window.open("annotate/mathpix?sessionID=" + responseData["session_id"]);
          } else {
            console.log('Failed request!');
          }
        });
      console.log('preventDefault');
      event.preventDefault();
    }
  }

  onLatexFieldChange(e) {
    console.log(e.target.value);
    this.setState({text: e.target.value});
  }

  render() {
    return (
      <div id="page-annotations" className={'screen-lock-container'}>
        <br />
        <div className="row">CTRL+K to open in new tab</div>
        <br />
        <div className="row">
          <div id="latexEdit">
            <textarea className="latex-edit"
                      ref={this.latexEditId}
                      id={this.latexEditId}
                      value={this.state.text}
                      disabled={false} title="Latex area"
                      onChange={this.onLatexFieldChange}
                      placeholder="Enter Latex here" />
          </div>
        </div>
        <TextRenderBox
          fontSize={30}
          text={this.state.text || ''}
        />
      </div>
    );
  }
}

const routes = (
  <Router history={browserHistory}>
    <Route path="/synthetic" component={AnnotationUI} />
  </Router>
);

ReactDOM.render(
  routes,
  document.getElementById('main')
);


