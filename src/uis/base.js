import { find as _find, get as _get, slice, isEqual, uniqWith } from 'lodash';
import { normalize, schema } from 'normalizr';
import consts from '../libs/consts';
import { callApi } from '../libs/api';

export default class BaseUIController {

  static LATEX_RENDER_WAIT_SECONDS = 500;

  constructor(component) {
    this.component = component;
  }

  loadUI(UIID, callback) {
    const that = this.component;
    that.setState({ loadUIApiStatus: consts.API_LOADING }, () => {
      Promise.resolve(require('./' + UIID + '.json')).then(
        response => {
          that.schema = response.schema;
          that.options = response.options;
          // Find IDs of text edit and render fields
          const textEditorField = _find(that.schema.fields, { type: 'text-edit' });
          if (textEditorField) {
            that.textEditId = textEditorField.id;
          } else {
            return callback && callback('UI schema should include at least one text-edit type field.');
          }
          const textRendererField = _find(that.schema.fields, { type: 'text-render' });
          if (textRendererField) {
            that.textRenderId = textRendererField.id;
          } else {
            return callback && callback('UI schema should include at least one text-render type field.');
          }
          // Normalize image bounding boxes schema
          const imageField = _find(that.schema.fields, { type: 'image' });
          if (imageField && Array.isArray(imageField.fields) && imageField.fields.length) {
            that.schema.imageId = imageField.id;
            const bboxSchema = new schema.Entity('bboxes', {}, { idAttribute: 'id' });
            const bboxesArraySchema = new schema.Array(bboxSchema);
            that.schema.bboxes = _get(normalize(imageField.fields.filter(field => field.type === 'bbox'), bboxesArraySchema), 'entities.bboxes');
            that.setBoxType(Object.keys(that.schema.bboxes)[0]);
          } else {
            return callback && callback('image type field (bounding boxes) is missing in UI schema.');
          }
          that.setState({
            loadUIApiStatus: consts.API_LOADED_SUCCESS
          }, function() {
            if (that.state.loadDataApiStatus === consts.API_LOADED_SUCCESS) {
              that.refs[that.textEditId] && that.refs[that.textEditId].focus();
            }
            callback && callback(null, response);
          });
        },
        error => {
          console.log('Load UI API fail', error);
          that.setState({
            loadUIApiStatus: consts.API_LOADED_ERROR,
            loadUIApiError: 'Failed to load UI'
          }, function() {
            callback && callback(error);
          });
        }
      );
    });
  }

  loadData(dataset, callback, queue) {
    const apiUrl = queue ? '/api/dequeue-json/' + dataset + "/" + queue : this.LOAD_DATA_API_URL + dataset + "/" + this.sessionId + '?_=' + Date.now();
    const apiMethod = queue ? 'POST' : this.LOAD_DATA_API_METHOD;
    const data = { session_id: this.sessionId };
    const that = this.component;
    that.setState({ loadDataApiStatus: consts.API_LOADING }, () => {
      callApi(apiUrl, apiMethod, data).then(
        response => {
          console.log('Load Annotation Data API success', response);
          if (response.redirect_url) {
            window.location.href = response.redirect_url;
          }
          response.anno_list = uniqWith(response.anno_list, (a,b) => isEqual(a,b) || isEqual(a.shapes, b.shapes))
          that.setState(
            Object.assign(
              { loadDataApiStatus: consts.API_LOADED_SUCCESS },
              this.parseData ? this.parseData(response) : response
            ),
            function() {
              if (that.state.loadUIApiStatus === consts.API_LOADED_SUCCESS) {
                that.refs[that.textEditId] && that.refs[that.textEditId].focus();
              }
              callback && callback(null, response);
            }
          );
        },
        error => {
          console.log('Load Annotation Data API fail', error);
          that.setState({
            loadDataApiStatus: consts.API_LOADED_ERROR,
            loadDataApiError: 'Failed to load Annotation Data'
          }, function() {
            callback && callback(error);
          });
        }
      );
    });
  }

  onSave(callback) {
    if (!this.validateBeforeSave()) {
      return;
    }
    const that = this.component;
    that.setState({ saveDataApiStatus: consts.API_LOADING }, () => {
      callApi(this.SAVE_DATA_API_URL, this.SAVE_DATA_API_METHOD, this.deparseState()).then(
        response => {
          console.log('Save Annotation Data API success', response);
          that.setState({
            saveDataApiStatus: consts.API_LOADED_SUCCESS,
            unsaved: false
          }, function() {
            callback && callback(null, response);
          });
          that.showAlert('success', 'Successfully saved.');
        },
        error => {
          console.log('Save Annotation API fail', error);
          that.setState({
            saveDataApiStatus: consts.API_LOADED_ERROR,
            saveDataApiError: 'Failed to save. ' + (error.error || '')
          }, function() {
            callback && callback(error);
          });
          that.showAlert('danger', 'Sorry, Failed to save. Please try again or contact support.');
        }
      );
    });
  }

  onSendCr(callback) {
    const that = this.component;
    const payload = {
      user_id_annotated: that.state.username,
      user_id_verified: that.state.verified_by,
      session_id: this.sessionId,
      msg: that.state.crMessage,
      anno_url: window.location.href,
    };
    callApi(this.SEND_CR_URL, this.SEND_CR_METHOD, payload).then(
      response => {
        console.log('Send Compliance report success', response);
        that.setState({
          sendCrApiStatus: consts.API_LOADED_SUCCESS,
          unsaved: false
        }, function() {
          callback && callback(null, response);
        });
        that.showAlert(response && response.success ? 'success' : 'danger', response && response.success ? 'Successfully saved.' : response && response.error);
      },
      error => {
        console.log('Send Compliance report fail', error);
        that.setState({
          sendCrApiStatus: consts.API_LOADED_ERROR,
          sendCrApiError: 'Failed to send. ' + (error.error || '')
        }, function() {
          callback && callback(error);
        });
        that.showAlert('danger', 'Sorry, Failed to send Compliance report. Please try again or contact support.');
      }
    );
  }
}
