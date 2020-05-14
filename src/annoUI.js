import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { MathpixMarkdown, MathpixLoader } from 'mathpix-markdown-it';
import { forEach, cloneDeep, get as _get, sum, maxBy, minBy, map, orderBy, filter, size } from 'lodash';
import keydown from 'react-keydown';
import ReactTooltip from 'react-tooltip';
import consts from './libs/consts';
import Annotorious from './components/work/annotorious';
import TextRenderBox from './components/work/text_render_box';
import { Router, Route, browserHistory } from 'react-router';

// import styles
require('./styles/annoUI.scss');

import UIs from './uis';
const DATASET = window.__DATASET__;
const dataset_to_ui = {
  'mathpix': 'math_anno',
  'limi': 'sheet_anno',
  'triage': 'triage_anno',
  'price': 'price_anno',
  'lines': 'lines_anno',
  'ocr': 'ocr_anno'
};
const UIID = dataset_to_ui[DATASET];
const UIController = UIs[UIID] || UIs['default'];
const DEFAULT_BOX_CHAR_SIZE = 20;
const GLOBAL_RENDERED_TEXT_FONT_SIZE = 37.5;

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
      sendCrApiStatus:  consts.API_NOT_LOADED,
      sendCrApiError: '',
      annoList: [],
      annoResetHash: 1000,
      annoUpdateHash: 1000,
      boxType: '',
      unsaved: false, // IMPORTANT: this should be set to true for every change that needs to be saved!
      alert: null,
      char_size: null,
      char_size_predicted: null,
      isChangedSize: false,
      showMarkers: true,
      boxTypeFilter: null
    };
    this.uiController = new UIController(this);
    this.onTagsChanged = this.onAnnoChange.bind(this, 'TagsChanged');
    this.onOrderChanged = this.onAnnoChange.bind(this, 'OrderChanged');
    this.onCharSizePlus = this.onAnnoChange.bind(this, 'CharSizePlus');
    this.onCharSizeMinus = this.onAnnoChange.bind(this, 'CharSizeMinus');
    this.onAnnoCreated = this.onAnnoChange.bind(this, 'Created');
    this.onAnnoUpdated = this.onAnnoChange.bind(this, 'Updated');
    this.onAnnoRemoved = this.onAnnoChange.bind(this, 'Removed');
    this.onCheckBoxChanged = this.onAnnoChange.bind(this, 'CheckBoxChanged')
    this.setBoxType = this.setBoxType.bind(this);
    this.onClear = this.onClear.bind(this);
    this.onSave = this.onSave.bind(this);
    this.onNext = this.onNext.bind(this);
    this.onBeforeLeave = this.onBeforeLeave.bind(this);
    this.showAlert = this.showAlert.bind(this);
    this.bindShortcutKeys = this.bindShortcutKeys.bind(this);
    this.renderUI = this.renderUI.bind(this);
    this.onTextFieldChange = this.onTextFieldChange.bind(this);
    this.onCrMessageChange = this.onCrMessageChange.bind(this);
    this.onSendCr = this.onSendCr.bind(this);
    this.subCharSize = this.subCharSize.bind(this);
    this.incCharSize = this.incCharSize.bind(this);
    this.cancelPolygon = this.cancelPolygon.bind(this);
    this.finishLine = this.finishLine.bind(this);
    this.onStartSelection = this.onStartSelection.bind(this);
    this.onSelectionCompleted = this.onSelectionCompleted.bind(this);
    this.textRenderTimeoutID = false;
  }

  componentWillMount() {
    this.uiController.loadUI(UIID, (err) => {
      err && typeof err === 'string' && console.log('Error: ', err);
      !err && this.uiController.loadData(DATASET, (err) => {
        err && typeof err === 'string' && console.log('Error: ', err);
        !err && this.setState({ [this.textRenderId]: this.state[this.textEditId] });
      });
    });
  }

  componentDidMount() {
    window.onbeforeunload = this.onBeforeLeave;
    this.bindShortcutKeys();
  }

  updateVisibility = () => {
    const { boxTypeFilter } = this.state;
    const annoList = this.state.annoList.map(item => ({ ...item, visible: boxTypeFilter ? item.boxId === boxTypeFilter : true }));
    this.setState({ annoList });
  };

  onBboxChecked(type) {
    this.setState({boxTypeFilter: this.state.boxTypeFilter === type ? null : type}, () => {
      this.updateVisibility();
    });
  }

  onBeforeLeave(e) {
    if (this.state.unsaved) {
      const message = 'There is unsaved work. Are you sure to leave?';
      e = e || window.event;

      // for IE and Firefox
      if (e) {
        e.returnValue = message;
      }

      // for Safari
      return message;
    }
  }

  bindShortcutKeys() {
    const that = this;

    Mousetrap.bind(['ctrl+m'], function () {
      that.onNext();
      return false;
    });

    Mousetrap.bind(['ctrl+k'], function () {
      that.uiController.markDone(function () {
        that.onSave();
      });
      return false;
    });
  }

  @keydown('ctrl+m', 'ctrl+k', 'ctrl+y', 'ctrl+u', 'ctrl+i')
  onKeyDown(event) {
    event.preventDefault();
    if (event.ctrlKey && event.key === 'y') {
      var char_size = this.state.char_size || this.state.char_size_predicted || 10.;
      if (char_size) {
        var char_size_new = parseFloat(char_size * 0.94)
        this.setState({ char_size: char_size_new });
      }
      console.log("Char size new: " + String(char_size));
    }

    if (event.ctrlKey && event.key === 'u') {
      var char_size = this.state.char_size || this.state.char_size_predicted || 10.;
      if (char_size) {
        var char_size_new = parseFloat(char_size * 1.06)
        this.setState({ char_size: char_size_new });
      }
      console.log("Char size new: " + String(char_size));
    }
    if (event.ctrlKey && event.key === 'i') {
      event.preventDefault();
      this.showBtn.click();
    }
    // TODO: not sure this is even necessary here
    if (document.activeElement.id !== this.textEditId) {
      return;
    }
    const that = this;
    if (event.ctrlKey && event.key === 'm') {
      event.preventDefault();
      that.onNext();
    }
    if (event.ctrlKey && event.key === 'k') {
      event.preventDefault();
      that.uiController.markDone(function () {
        that.onSave();
      });
    }

  }

  averageCharSize(list) {
    const sizes = list.filter(i => i.charSize).map(i => i.charSize);
    if (sizes.length == 0) {
      return null;
    }
    const avg = sum(sizes) / list.length;
    return avg;
  };

  onAnnoChange(eventType, annotation) {
    // console.log('onAnnoChange', eventType, annotation, this.state.annoList, cloneDeep(anno.getAnnotations()))
    const boxes = {};

    this.state.annoList.forEach((i) => {
      if (!boxes[i.boxId]) {
        boxes[i.boxId] = [];
      }
        boxes[i.boxId].push(i);
    });

    let char_size = null;
    annotation.isUpdated = true;
    annotation.text = annotation.text && annotation.text.trim();

    if (!annotation.order) {
      const maxOrder = maxBy(this.state.annoList, item => item.order);
      annotation.order = (maxOrder ? maxOrder.order : 0) + 1;
    }

    if (!annotation.id) {
      const maxID = maxBy(this.state.annoList, item => item.id);
      annotation.id = (maxID ? maxID.id : 0) + 1;
    }

    if (eventType === 'Created' && this.state.boxType) {
      annotation.boxId = this.state.boxType;
      if (annotation.shapes && annotation.shapes[0]) {
        annotation.shapes[0].style = {
          outline: this.schema.bboxes[this.state.boxType].color,
          outline_width: this.schema.bboxes[this.state.boxType].marker_width,
        };
      }
      if (!this.schema.bboxes[this.state.boxType].has_text) {
        annotation.text = '';
      }

      annotation.visible = !this.state.boxTypeFilter
        || (this.state.boxTypeFilter && this.state.boxType === this.state.boxTypeFilter);
      annotation.hasText = this.schema.bboxes[this.state.boxType].has_text;
      annotation.tags = this.schema.bboxes[this.state.boxType].tags;
    }

    let eventTypeFinal = eventType;

    if (boxes[annotation.boxId]) {
      const isCharSizeChanged = boxes[annotation.boxId].findIndex(({charSize}) => charSize !== null);
      if(isCharSizeChanged !== -1)
        char_size = this.averageCharSize(boxes[annotation.boxId]) || DEFAULT_BOX_CHAR_SIZE;
    } else {
      char_size = this.averageCharSize(this.state.annoList) || DEFAULT_BOX_CHAR_SIZE;
    }

    if (eventType === 'CharSizePlus') {
      char_size = (annotation.charSize || annotation.charSizeTmp || DEFAULT_BOX_CHAR_SIZE) * 1.17;
      eventTypeFinal = 'Updated';
    }

    if (eventType === 'CharSizeMinus') {
      char_size = (annotation.charSize || annotation.charSizeTmp || DEFAULT_BOX_CHAR_SIZE) * 0.83;
      eventTypeFinal = 'Updated';
    }

    if (eventType === 'TagsChanged') {
      // TODO tag changed event
    }

    annotation.charSize = char_size;

    let annoList = cloneDeep(anno.getAnnotations());
    // recompute charSize

    const eqnAnnoList = annoList.filter(anno => (anno.boxId == 'equations'));
    const notEqnAnnoList = annoList.filter(anno => (anno.boxId !== 'equations'));
    // TODO: fix this horrible hack to remove duplicates
    if (eqnAnnoList.length > 0) {
      annoList = notEqnAnnoList;
      annoList.push(eqnAnnoList[0]);
    }

    this.setState({
      annoList,
      unsaved: true
    }, () => { this.uiController.onAnnoChange && this.uiController.onAnnoChange(eventTypeFinal, annotation); });
  }

  setBoxType(boxType) {
    if (this.state.boxType !== boxType) {
      this.setState({ boxType: boxType });
      // anno.setProperties({
      //   outline: this.schema.bboxes[boxType].color,
      //   outline_width: this.schema.bboxes[boxType].marker_width,
      // });
      this.setState({
        annoUpdateHash: this.state.annoUpdateHash + 1
      });
    }
  }

  onClear() {
    this.uiController.onClear && this.uiController.onClear();
  }

  onSave() {
    if (this.state.loadUIApiStatus !== consts.API_LOADED_SUCCESS || this.state.loadDataApiStatus !== consts.API_LOADED_SUCCESS) {
      return;
    }
    this.uiController.onSave && this.uiController.onSave();
  }

  onSendCr() {
    if (this.state.loadUIApiStatus !== consts.API_LOADED_SUCCESS || this.state.loadDataApiStatus !== consts.API_LOADED_SUCCESS || !this.state.crMessage) {
      return;
    }
    this.uiController.onSendCr && this.uiController.onSendCr((error, res) => {
      if (!error && res && res.success) {
        this.setState({crMessage: ''});
      }
    });
  }

  onNext() {
    anno.reset();
    const queue = this.uiController.queue || 'main';
    this.uiController.loadData(DATASET, (err) => {
      err && typeof err === 'string' && console.log('Error: ', err);
      if (!err) {
        browserHistory.push('/annotate/' + DATASET + '?queue=' + queue + "&sessionID=" + this.uiController.sessionId);
        this.setState({ [this.textRenderId]: this.state[this.textEditId] });
      }
    }, queue);
  }

  showAlert(type, message, ttl = 5000) {
    this.setState({
      alert: { type, message }
    }, () => {
      if (ttl) {
        setTimeout(() => {
          this.setState({ alert: null });
        }, ttl);
      }
    });
  }

  cancelButtonVisible(status = true) {
    const el = document.getElementById('cancel-polygon-button').style.display = status ? "block" : "none";
  }

  finishLineVisible(status = true) {
    const el = document.getElementById('finish-line-button').style.display = status ? "block" : "none";
  }

  onStartSelection(obj) {
    this.annotator = obj && obj.annotator;
    this.cancelButtonVisible();
    this.finishLineVisible();
  }

  onSelectionCompleted() {
    this.cancelButtonVisible(false);
    this.finishLineVisible(false);
  }

  cancelPolygon() {
    this.cancelButtonVisible(false);
    this.finishLineVisible(false);
    this.forceUpdate();
  }

  finishLine() {
    if (this.annotator && typeof this.annotator._closeShape === 'function') {
      this.annotator._closeShape();
    }
    this.finishLineVisible(false);
    this.forceUpdate();
  }

  subCharSize() {
    forEach(anno.getAnnotations(), (annotation) => {
      annotation.charSize = (annotation.charSize || annotation.charSizeTmp || DEFAULT_BOX_CHAR_SIZE);
      this.onCharSizeMinus(annotation);
    })
  }

  incCharSize() {
    forEach(anno.getAnnotations(), (annotation) => {
      annotation.charSize = (annotation.charSize || annotation.charSizeTmp || DEFAULT_BOX_CHAR_SIZE);
      this.onCharSizePlus(annotation);
    })
  }

  onShowMarkers(event) {
    this.setState({showMarkers: !this.state.showMarkers});
  }
  onDropdownFieldChange(fieldSchema, event) {
    this.setState({
      [fieldSchema.id]: event.currentTarget.value,
      unsaved: true
    }, () => { this.uiController.onDropdownFieldChange && this.uiController.onDropdownFieldChange(fieldSchema, event); });
  }

  onCheckboxFieldChange(fieldSchema, event) {
    this.setState({
      [fieldSchema.id]: event.currentTarget.checked,
      unsaved: true
    }, () => { this.uiController.onCheckboxFieldChange && this.uiController.onCheckboxFieldChange(fieldSchema, event); });
  }

  onMultiChoiceFieldChange(field, option, event) {
    let fieldState = this.state[field.id];
    if (event.currentTarget.checked) {
      fieldState.indexOf(option.value) === -1 && fieldState.push(option.value);
    } else {
      fieldState = fieldState.filter(checkedOption => checkedOption !== option.value);
    }
    this.setState({
      [field.id]: fieldState,
      unsaved: true
    }, () => { this.uiController.onMultiChoiceFieldChange && this.uiController.onMultiChoiceFieldChange(field, option, event); });
    event.currentTarget.blur();
  }

  /*
  * copies current annotation details (link, img, latex) to clipboard.
  return true if successful, false if not.*/
  copyAnnotationToClipboard(mode){
    let image_url = this.state[this.schema.imageId].url;
    let anno_link = window.location.href;
    let text ='';
    if (mode === "slack") {
      text = `(${anno_link})` +"\n" + image_url + "\n" + `\`${this.state[this.textEditId]}\``;
    } else if (mode === "github") {
      text = `(${anno_link})` +"\n" + `![](${image_url})` + "\n" + `\`${this.state[this.textEditId]}\``;
    } else if (mode === "image_url") {
      text=image_url;
    } else {
      console.log("Invalid mode")
      return false
    }
    let copyTextArea = document.createElement('textarea');
    copyTextArea.innerHTML= text;
    document.body.appendChild(copyTextArea);
    copyTextArea.select();
    document.execCommand('copy');
    copyTextArea.remove();
    return true;
  }

  onCopySlackBtnClick = (e) => {
    const copyOk = this.copyAnnotationToClipboard("slack")
    if (copyOk)
      this.showAlert( "copy-clipboard-success", "Copied annotation details to clipboard. Paste to slack to discuss.");
  }

  onCopyGithubBtnClick =(e) =>{
    const copyOk = this.copyAnnotationToClipboard("github")
    if (copyOk)
      this.showAlert( "copy-clipboard-success", "Copied annotation details to clipboard. Paste to github to discuss.");
  }

  onCopyImageUrlClick =(e) =>{
    const copyOk = this.copyAnnotationToClipboard("image_url")
    if (copyOk)
      this.showAlert( "copy-clipboard-success", "Copied image url to clipboard.");
  }
  onTextFieldChange(e) {
    const that = this;
    this.setState({ [that.textEditId]: e.currentTarget.value, unsaved: true }, function () {
      if (that.textRenderTimeoutID) {
        clearTimeout(that.textRenderTimeoutID);
      }
      that.textRenderTimeoutID = setTimeout(function () {
        that.setState({ [that.textRenderId]: that.state[that.textEditId] });
      }, UIController.LATEX_RENDER_WAIT_SECONDS);
    });
  }

  onCrMessageChange(e) {
    this.setState({crMessage: e.target.value});
  }

  getHasTextAnnoList = () => {
    return orderBy(filter(this.state.annoList, item => _get(this.schema, ['bboxes', item.boxId, 'has_text'])), ['order'], ['asc']);
  };

  annoTextChange = (item, index) => (event, data) => {
    const annoList = cloneDeep(this.state.annoList);
    const annoListOrdered = this.getHasTextAnnoList();
    let change_index = 0;

    annoList.map((item, a_index) => {
      if(item.id === annoListOrdered[index].id) {
        change_index = a_index;
      }
    });
    // console.log('annoTextChange', item, index, change_index)
    annoList[change_index].text = event.target.value;
    this.setState({annoList, annoUpdateHash: this.state.annoUpdateHash + 1});
  };

  annoItemUp = (item, index) => (event, data) => {
    const annoList = cloneDeep(this.state.annoList);
    const annoListOrdered = this.getHasTextAnnoList();
    // console.log('annoItemUp start', item, index, annoList.map(i => i.order));
    let original_index = 0;
    let change_index = 0;

    annoList.forEach((item, a_index) => {
      if (item.id === annoListOrdered[index].id) {
        original_index = a_index;
      }

      if (item.id === (annoListOrdered[index - 1] && annoListOrdered[index - 1].id)) {
        change_index = a_index;
      }
    });

    const temp = annoList[original_index].order;
    annoList[original_index].order = annoList[change_index].order;
    annoList[change_index].order = temp;

    // console.log('annoItemUp end', temp, original_index, change_index, annoList.map(i => i.order));
    this.setState({annoList, annoUpdateHash: this.state.annoUpdateHash + 1});
  };

  annoItemDown = (item, index) => (event, data) => {
    const annoList = cloneDeep(this.state.annoList);
    const annoListOrdered = this.getHasTextAnnoList();
    // console.log('annoItemDown start', item, index, annoList.map(i => i.order));
    let original_index = 0;
    let change_index = 0;

    annoList.forEach((item, a_index) => {
      if (item.id === annoListOrdered[index].id) {
        original_index = a_index;
      }

      if (item.id === (annoListOrdered[index + 1] && annoListOrdered[index + 1].id)) {
        change_index = a_index;
      }
    });

    const temp = annoList[original_index].order;
    annoList[original_index].order = annoList[change_index].order;
    annoList[change_index].order = temp;

    // console.log('annoItemDown end', temp, original_index, change_index, annoList.map(i => i.order));
    this.setState({annoList, annoUpdateHash: this.state.annoUpdateHash + 1});
  };

  renderLatexUI(effScale) {
    const { char_size, char_size_predicted } = this.state;
    // includes multiplier constant to get sizes to line up!
    const charSize = char_size || char_size_predicted || 20;
    // const fontSize = 1.5 * effScale * charSize;
    const fontSize = GLOBAL_RENDERED_TEXT_FONT_SIZE;
    // Note: in general, effScale = 25 / char_size
    const fields = [];
    this.schema.fields.forEach((field, fieldNo) => {
      let element = null;
      const char_size_approx = char_size ? char_size.toFixed(2) : char_size;
      const char_size_predicted_approx = char_size_predicted ? char_size_predicted.toFixed(2) : char_size_predicted;
      if (field.type === 'text-render') {
        const text = this.state[this.textRenderId] || "";
        fields.push(
          <div className="all-width-wrapper" key={fieldNo}>
            <TextRenderBox textRenderId={this.textRenderId}
              textRenderField={field}
              text={text}
              secondLabel={`( char_size: ${char_size_approx}, char_size_predicted: ${char_size_predicted_approx} )`}
              fontSize={fontSize} />
          </div>
        );
      }
      if (field.type === 'text-edit') {
        element = <div className="latex-edit-parent col-xs-12 col-sm-10 col-sm-offset-1 col-md-8 col-md-offset-2">
          <label htmlFor={this.textEditId}>{field.label} </label>
          <textarea className="latex-edit" ref={this.textEditId} id={this.textEditId} value={this.state[this.textEditId]}
            disabled={field.disabled} title={field.help}
            onChange={this.onTextFieldChange}
            placeholder="Enter Latex here" />
        </div>;
      }
      element && fields.push(
        <div className='row' key={fieldNo}>
          {element}
        </div>
      );
    });
    return fields;
  }

  renderUI() {
    const fields = [];

    this.schema.fields.forEach((field, fieldNo) => {
      let element = null;

      let tooltip = null;
      if (field.help) {
        tooltip = (
          <span className="react-tooltip">
            <a data-tip={field.help}><i className="glyphicon glyphicon-question-sign" /></a>
            <ReactTooltip type='warning' effect='solid' />
          </span>
        );
      }
      if (field.type === 'text') {
        element = <div>
          <label htmlFor={field.id}>{field.label} {tooltip}</label>
          <input type="text" className="form-control" ref={field.id} id={field.id} value={this.state[field.id]}
            disabled={field.disabled} title={field.help}
            onChange={this.onTextFieldChange.bind(this, field)} />
        </div>;
      }
      if (field.type === 'dropdown') {
        element = <div>
          <label htmlFor={field.id}>{field.label} {tooltip}</label>
          <select className="form-control" ref={field.id} id={field.id} value={this.state[field.id] || this.options[field.id].default || ''}
            disabled={field.disabled} title={field.help}
            onChange={this.onDropdownFieldChange.bind(this, field)}>
            <option value="">-- Please select --</option>
            {
              this.options[field.id].options.map((option, i) =>
                <option value={option.value} key={i}>{option.label}</option>
              )
            }
          </select>
        </div>;
      }
      if (field.type === 'checkbox') {
        element = <div className="checkbox">
          <label htmlFor={field.id} style={field.style}>
            <input type="checkbox" ref={field.id} id={field.id} checked={this.state[field.id]}
              disabled={field.disabled} title={field.help}
              onChange={this.onCheckboxFieldChange.bind(this, field)} />
            {field.label}
            {tooltip}
          </label>
        </div>;
      }
      if (field.type === 'multi-choice') {
        element = <div id={field.id}>
          <h3>{field.label} {tooltip}</h3>
          {
            this.options[field.id].options.map((option, i) =>
              <div className="checkbox" key={i}>
                <label htmlFor={`${field.id}_${option.value}`} style={option.style}>
                  <input type="checkbox" name={field.id} ref={`${field.id}_${option.value}`} id={`${field.id}_${option.value}`}
                    checked={Array.isArray(this.state[field.id]) && this.state[field.id].indexOf(option.value) > -1}
                    disabled={option.disabled}
                    onChange={this.onMultiChoiceFieldChange.bind(this, field, option)} />
                  {option.label}
                  {
                    option.help ?
                      <span className="react-tooltip">
                        <a data-tip={option.help}><i className="glyphicon glyphicon-question-sign" /></a>
                        <ReactTooltip type='warning' effect='solid' />
                      </span>
                      :
                      null
                  }
                </label>
              </div>
            )
          }
        </div>;
      }
      if (field.type === 'link' && _get(this.state, field.id)) {
        element = <a href={_get(this.state, field.id)} id={field.id.replace('.', '_')} target={field.target}
          style={field.style}>
          {field.label}
        </a>;
      }
      if (field.type === 'info' && _get(this.state, field.id)) {
        element = <div id={field.id.replace('.', '_')}
          style={field.style}>
          {field.label}: <strong>{_get(this.state, field.id)}</strong>
        </div>;
      }
      element && fields.push(
        <div className={'dynamic-field col-sm-' + (field.colspan ? field.colspan : '12')}
          style={{ clear: field.clear }} key={fieldNo}>
          {element}
        </div>
      );
    });

    fields.push(
      <div className='dynamic-field col-sm-6' key={1000}>
        <a target="_blank" href="/data">Link to data</a>
      </div>
    );

    fields.push(
      <div className='dynamic-field col-sm-6' key={1001}>
        <button type="button" className='btn btn-success'
          onClick={this.uiController.groupIsValidation}>
          Set group=validation
        </button>
      </div>
    );

    fields.push(
      <div className='dynamic-field col-sm-6' key={1002}>
        <button type="button" className='btn btn-info'
          onClick={this.uiController.groupIsNotValidation}>
          Set group!=validation
        </button>
      </div>
    );
    fields.push(
      <div className="dynamic-field col-sm-6 clipboard-copy-btn-group" key={1003}>
        <button type="button" className='btn btn-info' style={{marginBottom:'1em'}}
          onClick={this.onCopySlackBtnClick}>
            Copy (to clipboard) for Slack
        </button>
        <button type="button" className='btn btn-info' style={{marginBottom:'1em'}}
          onClick={this.onCopyGithubBtnClick}>
            Copy (to clipboard) for Github
        </button>
        <button type="button" className='btn btn-info'
          onClick={this.onCopyImageUrlClick}>
            Copy Image URL (to clipboard)
        </button>
      </div>
    )


    return (
      <div className="row">
        {fields}
      </div>
    );
  }

  // componentDidUpdate(prevProps, prevState) {
  // 	Object.entries(this.props).forEach(([key, val]) =>
  // 		prevProps[key] !== val && console.log(`Prop '${key}' changed`)
  // 	);
  // 	Object.entries(this.state).forEach(([key, val]) =>
  // 		prevState[key] !== val && console.log(`State '${key}' changed`)
  // 	);
  // }

  render() {
    const annoList = this.state.annoList.map(item => {
      const shape = (item.shapes && item.shapes[0]) || {};
      const selectedTags = item.selectedTags;

      if (selectedTags && selectedTags.length > 0 && this.schema.bboxes[item.boxId].tagged_color) {
        shape['style']['outline'] = this.schema.bboxes[item.boxId].tagged_color;
      }

      const shapes = shape ? [shape] : [];

      return {
        ...item,
        hasText: this.schema.bboxes[item.boxId].has_text,
        tags: this.schema.bboxes[item.boxId].tags,
        shapes
      }
    });

    if (this.state.loadUIApiStatus === consts.API_LOADING) {
      // TODO: fix CSS dependence of UIID
      return (
        <div id="page-annotations" className={'math_anno'}>
          <div className="spinner"><img src="/static/img/spinner-lg.gif" /></div>
        </div>
      );
    }

    if (this.state.loadUIApiStatus === consts.API_LOADED_ERROR) {
      return (
        <div id="page-annotations" className={'math_anno'}>
          <div className="error">{this.state.loadUIApiError}</div>
        </div>
      );
    }

    // compute resized image bounds
    var char_size = this.state.char_size || this.state.char_size_predicted;

    var effScale;
    var resizedImageWidth;
    var resizedImageHeight;

    const annoList_hasText = this.getHasTextAnnoList();
    var text_anno = "";
    for (var idx=0; idx<annoList_hasText.length; idx++) {
      text_anno = text_anno + annoList_hasText[idx].text + "\n";
    }

    if (!char_size) {
      const maxHeight = 500;
      const maxWidth = 1500;
      const imageHeight = this.state.image_height;
      const imageWidth = this.state.image_width;
      const xScale = maxWidth / imageWidth;
      const yScale = maxHeight / imageHeight;
      effScale = Math.min(xScale, yScale);
      resizedImageWidth = effScale * imageWidth;
      resizedImageHeight = effScale * imageHeight;
    } else {
      effScale = 25 / char_size;
      resizedImageWidth = effScale * this.state.image_width;
      resizedImageHeight = effScale * this.state.image_height;
      console.log('effScale: ' + String(effScale));
      console.log('resizedImageWidth: ' + String(resizedImageWidth));
      console.log('resizedImageHeight: ' + String(resizedImageHeight));
    }
    // console.log('effScale: ' + String(effScale));
    const deparsed = {};
    this.options.info_properties.options.forEach(option => {
      if (this.state.info_properties) {
        deparsed[option.value] = this.state.info_properties.indexOf(option.value) > -1;
      }
    });
    this.options.image_properties.options.forEach(option => {
      if (this.state.image_properties) {
        deparsed[option.value] = this.state.image_properties.indexOf(option.value) > -1;
      }
    });
    const propList = [];
    for (const prop in deparsed) {
      if (deparsed[prop] === true && prop !== 'is_printed') {
        propList.push(prop);
      }
    }
    if (deparsed.is_printed === false) {
      propList.unshift('handwritten');
    } else {
      propList.unshift('is_printed');
    }
    const propListStr = propList.map((elem) => elem.split("_").join(" ")).join(", ");
    var boxGeometry = _get(this.schema, ['bboxes', this.state.boxType, 'geometry']);

    var bboxSelectors = <div className="bounding-box-type-selectors">
      {
        Object.keys(this.schema.bboxes).map((boxType, index) =>
          <div key={index} className="button-container">
            <div className="row">
              <button type="button" className={'btn' + (boxType === this.state.boxType ? ' active' : '')}
                style={{
                  borderColor: this.schema.bboxes[boxType].color,
                  color: boxType === this.state.boxType ? '#fff' : this.schema.bboxes[boxType].color,
                  backgroundColor: boxType === this.state.boxType ? this.schema.bboxes[boxType].color : 'transparent'
                }}
                onClick={this.setBoxType.bind(this, boxType)} key={boxType}>
                {this.schema.bboxes[boxType].label}
              </button>
            </div>
            <div className="row checkbox">
              <label>
                <input type="checkbox" id="checked_boxid" checked={this.state.boxTypeFilter === boxType}
                      title="Isolate"
                      onChange={this.onBboxChecked.bind(this, boxType)} />
                I
              </label>
            </div>
          </div>
        )
      }
    </div>;

    var globalCharSize = "none";
    if (this.state.char_size) {
      globalCharSize = this.state.char_size.toFixed(5);
    }
    var annoAvgCharSize = "none"
    if (this.state.annoList) {
      var annoAvg = this.averageCharSize(this.state.annoList);
      if (annoAvg) {
        annoAvgCharSize = annoAvg.toFixed(5);
      }
    }

    return (
      <div id="page-annotations" className={'math_anno screen-lock-container'}>
        <div className={'screen-lock' + (this.state.loadDataApiStatus === consts.API_LOADING ? '' : ' hidden')}>
          <img src="/static/img/spinner-md.gif" />
        </div>

        {
          this.state.loadDataApiStatus === consts.API_LOADED_ERROR ?
            <div id="page-annotations" className={'math_anno'}>
              <div className="error">{this.state.loadDataApiError}</div>
            </div>
            :
            null
        }

        {
          DATASET != "mathpix" ? bboxSelectors : null
        }

        {
          DATASET == "mathpix" ?
            <div style={{ textAlign: 'center' }}><h3>{propListStr}</h3></div>
            :
            null
        }

        {
          DATASET == "mathpix" ?
            this.renderLatexUI(effScale)
            :
            null
        }

        {
          this.state.loadDataApiStatus === consts.API_LOADED_SUCCESS ?
            <div className="all-width-wrapper">
              <Annotorious ref="annotorious"
                effScale={effScale}
                imageURL={this.state[this.schema.imageId].url} annoList={annoList}
                imageWidth={resizedImageWidth} imageHeight={resizedImageHeight}
                resetHash={this.state.annoResetHash} updateHash={this.state.annoUpdateHash}
                onAnnoCreated={this.onAnnoCreated}
                geometry={boxGeometry}
                onAnnoUpdated={this.onAnnoUpdated} onAnnoRemoved={this.onAnnoRemoved}
                textAllowed={_get(this.schema, ['bboxes', this.state.boxType, 'has_text'])}
                onCharSizePlus={this.onCharSizePlus}
                onOrderChanged={this.onOrderChanged}
                onTagsChanged={this.onTagsChanged}
                onCharSizeMinus={this.onCharSizeMinus}
                onStartSelection={this.onStartSelection}
                onSelectionCompleted={this.onSelectionCompleted}
                hasCharSize={this.schema.bboxes[this.state.boxType].has_char_size && this.state.showMarkers}
                dataset={DATASET}
                onCheckBoxChanged={this.onCheckBoxChanged}
              />
            </div>
            : null
        }

        {
          DATASET == "mathpix" ? bboxSelectors : null
        }

        {
          DATASET == 'ocr' &&
            <div style={{ fontFamily: 'serif', fontSize: GLOBAL_RENDERED_TEXT_FONT_SIZE + 'px', whiteSpace: "nowrap" }}>
              <MathpixLoader>
                <MathpixMarkdown mathJax={{mtextInheritFont: true}} text={text_anno} isDisableFancy={true} />
              </MathpixLoader>
            </div>
        }

        { DATASET == 'ocr' &&
          <div className="anno-list-edit">
            {map(annoList_hasText, (item, index) => {
              const shape = item.shapes && item.shapes[0];
              const geom = shape && shape.geometry;
              const shapeStyle = {
                position: 'relative',
                overflow: 'hidden',
                margin: 'auto'
              };
              const imgStyle = {
                position: 'absolute',
                width: resizedImageWidth + 'px',
                height: resizedImageHeight + 'px',
              };
              if (shape.type === 'rect') {
                shapeStyle.width = resizedImageWidth * geom.width + 'px';
                shapeStyle.height = resizedImageHeight * geom.height + 'px';
                shapeStyle.clip = `rect(${resizedImageWidth * geom.x}px ${resizedImageHeight * geom.y}px ${resizedImageWidth * geom.width}px ${resizedImageHeight * geom.height}px)`;
                imgStyle.left = -1 * resizedImageWidth * geom.x + 'px';
                imgStyle.top = -1 * resizedImageHeight * geom.y + 'px';
              }
              if (shape.type === 'polygon') {
                const minX = minBy(geom.points, item => item.x);
                const maxX = maxBy(geom.points, item => item.x);
                const minY = minBy(geom.points, item => item.y);
                const maxY = maxBy(geom.points, item => item.y);
                const values = map(geom.points, point => `${point.x * resizedImageWidth}px ${point.y * resizedImageHeight}px`) || [];
                shapeStyle.width = (maxX.x - minX.x) * resizedImageWidth + 'px';
                shapeStyle.height = (maxY.y - minY.y) * resizedImageHeight + 'px';
                imgStyle.clipPath = `polygon(${values.join(', ')})`;
                imgStyle.left = -1 * resizedImageWidth * minX.x + 'px';
                imgStyle.top = -1 * resizedImageHeight * minY.y + 'px';
              }
              return geom && (<div key={index} className="anno-item">
                <div className="anno-arrows">
                  <div>Text line {index + 1}</div>
                  {index > 0 && <div>
                    <button type="button" className="btn btn-info" onClick={this.annoItemUp(item, index)}>
                      <i className="glyphicon glyphicon-arrow-up"></i>
                    </button>
                  </div>}
                  {index + 1 < size(annoList_hasText) && <div>
                    <button type="button" className="btn btn-info" onClick={this.annoItemDown(item, index)}>
                      <i className="glyphicon glyphicon-arrow-down"></i>
                    </button>
                  </div>}
                </div>
                <div className="anno-item-content">
                  <div className="image-wrap">
                    <div style={shapeStyle}>
                      <img
                        src={item.src}
                        style={imgStyle}
                      />
                    </div>
                  </div>
                  <div className="anno-item-label">
                    <span style={{ fontFamily: 'serif', fontSize: GLOBAL_RENDERED_TEXT_FONT_SIZE + 'px', whiteSpace: "nowrap" }}>
                      {item.text && item.text.length > 0 && <MathpixLoader>
                        <MathpixMarkdown mathJax={{mtextInheritFont: true}} text={item.text} isDisableFancy={true} />
                      </MathpixLoader>}
                    </span>
                  </div>
                  <textarea onChange={this.annoTextChange(item, index)} value={item.text}></textarea>
                </div>
              </div>)
          })}
        </div>
        }

        <div className="row">
          <div className="col-xs-6 col-xs-push-3 col-md-3 col-md-push-9 heading text-center">
            <div className="actions row">
              <div className="col-xs-4 col-md-12" id="cancel-polygon-button" style={{ display: 'none' }}>
                <button type="button" className='btn btn-primary' onClick={this.cancelPolygon}>
                  Clear selected annotation
                </button>
              </div>
              <div className="col-xs-4 col-md-12" id="finish-line-button" style={{ display: 'none' }}>
                <button type="button" className='btn btn-success' onClick={this.finishLine}>
                  Finish line
                </button>
              </div>
            </div>
            <button type="button" className='btn btn-danger' onClick={this.subCharSize}>
              Char Size -10%
            </button>&nbsp;
            <button type="button" className='btn btn-success' onClick={this.incCharSize}>
              Char Size +10%
            </button>
            <div className="checkbox">
              <label htmlFor="show-markers" >
                <input type="checkbox" id="show-markers" checked={this.state["showMarkers"]}
                       ref={input => this.showBtn = input}
                       title="Show 2x markers"
                       onChange={this.onShowMarkers.bind(this)} />
                Show 2x markers
              </label>
            </div>

            <div style={{textAlign: "left"}} className="stats">
              <h4>queue: {window.__QUEUE_NAME__ || '(loading...)'}</h4>
              <h4>queue_count: {this.state.queue_count || '(loading...)'}</h4>
              <h4>is_verified: {String(this.state.is_verified || "false")}</h4>
              {
                this.state.verified_by && this.state.is_verified ?
                  <h4>verified_by: {String(this.state.verified_by)}</h4>
                  :
                  null
              }
              {
                this.state.queue
                  ? <h4>queue: {this.state.queue}</h4>
                  : null
              }
              {
                this.state.annoList
                  ? <h4>annoList.length: {this.state.annoList.length}</h4>
                  : null
              }
              <h4>char_size_global: {globalCharSize}</h4>
              <h4>char_size_anno_avg: {annoAvgCharSize}</h4>
            </div>

            <div className="actions row">
              <div className="col-xs-4 col-md-12">
                <button type="button" className="btn btn-danger" onClick={this.onClear}>Clear</button>
                <button type="button" className="btn btn-success" onClick={this.onSave}
                  disabled={this.state.saveDataApiStatus === consts.API_LOADING}>
                  {
                    this.state.saveDataApiStatus === consts.API_LOADING ?
                      <img src="/static/img/spinner-sm.gif" height="20px" />
                      :
                      (this.state.unsaved ? 'Save *' : 'Save')
                  }
                </button>
                <button type="button" className="btn btn-info" onClick={this.onNext}>Next</button>
              </div>
            </div>
            <div className="shortcut-keys-guide row">
              <div className="col-sm-5 col-md-12">
                <b>CTRL+M</b>: Next,
              </div>
              <div className="col-sm-7 col-md-12">
                <b>CTRL+K</b>: Mark done and Save
              </div>
              <div className="col-sm-7 col-md-12">
                <b>CTRL+Y</b>: Zoom in
              </div>
              <div className="col-sm-7 col-md-12">
                <b>CTRL+U</b>: Zoom out
              </div>
              <div className="col-sm-7 col-md-12">
                <b>CTRL+I</b>: Show 2x markers
              </div>
            </div>
            <div className="row">
              <div className="dynamic-field col-sm-7 col-md-12">
                <textarea
                  className="cr-field"
                  value={this.state.crMessage}
                  onChange={this.onCrMessageChange}
                  placeholder="Compliance report"
                />
                <div className="col-sm-7 col-md-12">
                  <button type="button" className='btn btn-success' onClick={this.onSendCr}>
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="col-xs-12 col-md-9 col-md-pull-3">
            {
              this.renderUI()
            }
          </div>
        </div>

        {
          this.state.metadata && this.state.metadata.session_id_src ?
            <div><a target="_blank" href={"/annotate/mathpix?sessionID=" + this.state.metadata.session_id_src}>Source image link</a></div>
            :
            null
        }
        {
          this.state.metadata && Object.keys(this.state.metadata).length > 0 ?
            <pre style={{ textAlign: 'left' }}> {JSON.stringify(this.state.metadata, null, 2)} </pre>
            :
            null
        }
        <br />
        {
          this.state.alert && this.state.alert.type ?
            <div className={'alert alert-' + this.state.alert.type} role="alert">{this.state.alert.message}</div>
            :
            null
        }
      </div>
    );
  }
}

const routes = (
  <Router history={browserHistory}>
    <Route path="/annotate/*" component={AnnotationUI} />
  </Router>
);

ReactDOM.render(
  routes,
  document.getElementById('main')
);
