import BaseUIController from './base';

const UIID = 'default';

// import styles for UI
require(`../styles/uis/${UIID}.scss`);

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
  }

  /**
   * Parse the data from database into a format that the UI schema can understand
   * It's a adapter method to ensure compatibility with legacy database
   * @param data response from loadDataAPI
   */
  parseData(data) {
    return data;
  }

  validateBeforeSave() {
    return true;
  }

  /**
   * Deparse the UI state into a format that is stored in the database
   * It's a adapter method to ensure compatibility with legacy database
   * @return request body for saveDataAPI
   */
  deparseState() {
    return this.component.state;
  }


  onClear() {
    const that = this.component;
    that.setState({
      [that.latexEditId]: '',
      [that.latexRenderId]: '',
      annoList: [],
      annoUpdateHash: that.state.annoUpdateHash + 1,
      unsaved: true
    }, () => { this.onAnnoChange(); });
  }

  markDone(callback) {

  }

  onNext() {

  }

}

module.exports = {
  [UIID]: UIController
};
