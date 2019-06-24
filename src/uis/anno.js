import { union as _union, without as _without } from 'lodash';
import { getURLParameterByName } from '../libs/utils';
import BaseUIController from './base';
import axios from 'axios';

// import styles for UI
require(`../styles/uis/math_anno.scss`);

// UI controller class
class UIController extends BaseUIController {
  static LATEX_RENDER_WAIT_SECONDS = BaseUIController.LATEX_RENDER_WAIT_SECONDS;
  static S3BUCKET_PREFIX = 'https://s3.amazonaws.com/mpxdata/';
  constructor(component, ...args) {
    super(component, ...args);
    this.LOAD_UI_API_URL = '';    // TBD
    this.LOAD_UI_API_METHOD = ''; // TBD
    this.SAVE_UI_API_URL = '';    // TBD
    this.SAVE_UI_API_METHOD = ''; // TBD
    this.LOAD_DATA_API_URL = '/api/get-json/';
    this.LOAD_DATA_API_METHOD = 'get';
    this.SAVE_DATA_API_URL = '/api/save-json';
    this.SAVE_DATA_API_METHOD = 'post';
    this.sessionId = getURLParameterByName('sessionID');
    this.queue = getURLParameterByName('queue');
    this.groupIsValidation = this.groupIsValidation.bind(this);
    this.groupIsNotValidation = this.groupIsNotValidation.bind(this);
  }
  /**
   * Parse the data from database into a format that the UI schema can understand
   * It's a adapter method to ensure compatibility with legacy database
   * @param data response from loadDataAPI
   */
  parseData(data) {
    // In the future, this function will just do `return data;`
    const that = this.component;
    const parsed = {};
    this.sessionId = data.session_id;
    parsed.image_width = data.image_width;
    parsed.is_verified = data.is_verified;
    parsed.verified_by = data.verified_by;
    parsed.image_height = data.image_height;
    parsed.char_size = data.char_size || data.char_size_predicted || 20.;
    parsed.is_good = data.is_good;
    parsed.image_properties = that.options.image_properties.options.filter(option => data[option.value]).map(option => option.value);
    parsed.info_properties = that.options.info_properties.options.filter(option => data[option.value]).map(option => option.value);
    parsed.image = { url: UIController.S3BUCKET_PREFIX + data.image_path, path: data.image_path };
    parsed.username = data.username;
    parsed.group_id = data.group_id;
    parsed.text_confidence = data.text_confidence;
    parsed.queue_count = data.queue_count || window.__QUEUE_COUNT__;
    // this is a hack; used because text format is agnostic to center alignment
    let latex_nospace = data.latex || "";
    const text = data.text || "";
    const isMathMode = text.startsWith("\\(");
    parsed.text = text;
    latex_nospace = latex_nospace.replace(/ /g, "");
    if (!parsed.is_good) {
      if (latex_nospace.indexOf("begin{array}{c}") != -1 || latex_nospace.indexOf("begin{array}{r}") != -1 || isMathMode) {
        parsed.text = "\\[ " + data.latex + " \\]";
      }
    }
    parsed.annoList = data.anno_list || [];
    parsed.metadata = data.metadata || [];
    return parsed;
  }

  groupIsNotValidation() {
    const that = this.component;
    const groupNew = "not_validation";
    const data = {"session_id": this.sessionId, "group_id": groupNew};
    axios.patch('/api/group/', data)
      .then((response) => {
        var responseData = response.data;
        if (responseData['success'] === true) {
          console.log("Request success!")
          that.setState({ 'group_id': groupNew });
        } else {
          console.log('Failed request!');
        }
      });
  }

  groupIsValidation() {
    const that = this.component;
    console.log('here');
    const groupNew = "validation";
    const data = {"session_id": this.sessionId, "group_id": groupNew};
    console.log(data);
    axios.patch('/api/group/', data)
      .then((response) => {
        var responseData = response.data;
        if (responseData['success'] === true) {
          console.log("Request success!")
          that.setState({ 'group_id': groupNew });
        } else {
          console.log('Failed request!');
        }
      });
  }

  validateBeforeSave() {
    const that = this.component;
    // validate contains_geometry
    const imgProps = that.state.image_properties;
    let text_raw = that.state[that.textEditId];
    text_raw = text_raw.replace("\\[", "");
    text_raw = text_raw.replace("\\]", "");
    text_raw = text_raw.trim();
    console.log(text_raw);
    if (that.state.annoList.length == 0 && text_raw.length > 0) {
      that.showAlert('danger', 'Please create equation box(es) or delete all text.');
      return false;
    }
    if (!that.state.char_size) {
      that.showAlert('danger', 'Please set char_size (modify if necessary).');
      return false;
    }
    return true;
  }

  /**
   * Deparse the UI state into a format that is stored in the database
   * It's a adapter method to ensure compatibility with legacy database
   * @return request body for saveDataAPI
   */
  deparseState() {
    const that = this.component;

    const deparsed = {
      'session_id': this.sessionId,
      'queue': this.queue,
      'username': window.__USERNAME__,
      'dataset': window.__DATASET__,
      'image_path': that.state.image.path,
      'text': that.state[that.textEditId],
      'anno_list': that.state.annoList,
      'metadata': that.state.metadata,
      'group_id': that.state.group_id,
      'is_good': that.state.is_good,
      'image_width': that.state.image_width,
      'image_height': that.state.image_height,
      'char_size': that.state.char_size,
      'is_verified': that.state.is_verified
    };

    that.options.image_properties.options.forEach(option => {
      deparsed[option.value] = that.state.image_properties.indexOf(option.value) > -1;
    });
    that.options.info_properties.options.forEach(option => {
      deparsed[option.value] = that.state.info_properties.indexOf(option.value) > -1;
    });

    return deparsed;
  }


  onClear() {
    const that = this.component;
    that.setState({
      [that.textEditId]: '',
      [that.textRenderId]: '',
      annoList: [],
      annoUpdateHash: that.state.annoUpdateHash + 1,
      unsaved: true,
      char_size: null
    }, () => { this.onAnnoChange(); });
  }

  markDone(callback) {
    this.component.setState({ is_good: true }, callback);
  }

  onMultiChoiceFieldChange(field, option, event) {
  }

  onAnnoChange(eventType, annotation) {
    const that = this.component;
    let imgProps = that.state.image_properties;
  }

}

module.exports = {
  'sheet_anno': UIController,
  'math_anno': UIController,
  'triage_anno': UIController
};
