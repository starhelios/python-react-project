import React, { Component, PropTypes } from 'react';
import { cloneDeep, forEach, differenceWith, isEqual, size, meanBy } from 'lodash';

let guidelinesActive = false;
const WRAP_INCREASE = 85;
const MIN_BOX_WIDTH = 12;
const MIN_BOX_HEIGHT = 12;

export default class Annotorious extends Component {

  constructor(...args) {
    super(...args);
    this.activePopup = null;
    this.onAnnoSelectionCompleted = this.onAnnoSelectionCompleted.bind(this);
    this.onAnnoSelectionStarted = this.onAnnoSelectionStarted.bind(this);
    this.update = this.update.bind(this);
    this.onPopupShown = this.onPopupShown.bind(this);
    this.imageURL = '';
  }

  update() {
    window['active_plugin'] = undefined;
    if (this.props.geometry == "polygon") {
      anno.addPlugin('PolygonSelector', { activate: true });
    } else {
      anno.$_modules$[0].$_plugins$ = [];
      anno.addPlugin('PolygonSelector', { activate: false });
    }
    let nn = 0
    let meanCharSize = 0;
    this.props.annoList.forEach((box) => { if (box.charSize) { meanCharSize += parseFloat(box.charSize); nn++}});
    meanCharSize = nn > 0 && meanCharSize ? meanCharSize / nn : 20
    this.props.annoList.forEach((box) => {
      box.charSizeTmp = 1.17 * (box.charSize) * this.props.effScale;
      box.has_char_size = box.has_char_size && this.props.hasCharSize;
    });
    anno.reset();
    drawAnnotations(cloneDeep(this.props.annoList), this.activePopup);
    hideWidget();
  }

  componentDidUpdate(prevProps, prevState) {
    this.update();
    if (this.props.imageURL != this.imageURL) {
      console.log('Adding handlers.');
      this.imageURL = this.props.imageURL;
      anno.removeHandler('onCharSizePlus');
      anno.removeHandler('onCharSizeMinus');
      anno.removeHandler('onAnnotationCreated');
      anno.removeHandler('onAnnotationUpdated');
      anno.removeHandler('onAnnotationRemoved');
      anno.removeHandler('onSelectionCompleted');
      anno.removeHandler('onPopupShown');
      anno.removeHandler('onOrderChanged');
      anno.removeHandler('onTagsChanged');
      anno.removeHandler('onCheckBoxChanged');
      anno.addHandler('onCharSizePlus', this.props.onCharSizePlus);
      anno.addHandler('onCharSizeMinus', this.props.onCharSizeMinus);
      anno.addHandler('onAnnotationCreated', this.props.onAnnoCreated);
      anno.addHandler('onAnnotationUpdated', this.props.onAnnoUpdated);
      anno.addHandler('onAnnotationRemoved', this.props.onAnnoRemoved);
      anno.addHandler('onCheckBoxChanged', this.props.onCheckBoxChanged)
      anno.addHandler('onSelectionStarted', this.onAnnoSelectionStarted);
      anno.addHandler('onSelectionCompleted', this.onAnnoSelectionCompleted);
      anno.addHandler('onPopupShown', this.onPopupShown);
      anno.addHandler('onOrderChanged', this.props.onOrderChanged);
      anno.addHandler('onTagsChanged', this.props.onTagsChanged);
      anno.setProperties({
        min_box_width: MIN_BOX_WIDTH,
        min_box_height: MIN_BOX_HEIGHT,
      });
    }
  }

  onPopupShown(data) {
    forEach(this.props.annoList, (item, index) => {
      const shape = item.shapes[0];
      const object = data.shapes[0];
      let diff = [{ x: 1 }];
      if (object && shape && shape.type === object.type && object.type === 'polygon') {
        diff = item.shapes[0]['geometry']['points'] && data.shapes[0]['geometry']['points'] && differenceWith(item.shapes[0]['geometry']['points'], data.shapes[0]['geometry']['points'], isEqual)
      } else if (object && shape && shape.type === object.type && object.type === 'rect') {
        diff = item.shapes[0]['geometry'] && data.shapes[0]['geometry'] && differenceWith([item.shapes[0]['geometry']], [data.shapes[0]['geometry']], isEqual)
      }

      if (size(diff) === 0) {
        this.activePopup = index
        return
      }
    })
  }

  onAnnoSelectionStarted(event) {
    this.props.onStartSelection(event)
  }

  onAnnoSelectionCompleted(event) {
    this.props.onSelectionCompleted();
    if (this.props.boxUpdateMode) {
      document.getElementsByClassName('annotorious-editor-button-cancel')[0].click();
      if (this.props.updateBoxCoordinates) {
        this.props.updateBoxCoordinates(event.shape.geometry);
      }
      return;
    }

    if (this.props.textAllowed === false) {
      document.getElementsByClassName('annotorious-editor-button-save')[0].click();
    }
  }

  render() {
    const single = this.props.annoList.length === 1;
    const margin = single ? 50 : 0;
    const wrapperHeight = this.props.imageHeight + margin + WRAP_INCREASE;

    if (this.props.imageURL) {
      return (
        <div className="text-center anno-board">
          <div className="wrapper-annotatable" style={{ height: wrapperHeight }}>
            <img id="mainImage" ref="mainImage" src={this.props.imageURL} className="annotatable"
              // style={{marginRight: margin, marginBottom: margin}}
              width={this.props.imageWidth} height={this.props.imageHeight}
              data-count={this.props.annoList.length}
              data-dataset={this.props.dataset}
              data-charsize={this.props.hasCharSize}
              onLoad={() => console.log('onLoad')} />
          </div>
        </div>
      );
    } else {
      return null;
    }
  }
}

Annotorious.propTypes = {
  effScale: PropTypes.number.isRequired,
  imageWidth: PropTypes.number.isRequired,
  imageHeight: PropTypes.number.isRequired,
  imageURL: PropTypes.string.isRequired,
  geometry: PropTypes.string.isRequired,
  annoList: PropTypes.array.isRequired,
  resetHash: PropTypes.number.isRequired,
  updateHash: PropTypes.number.isRequired,
  onAnnoCreated: PropTypes.func.isRequired,
  onAnnoUpdated: PropTypes.func.isRequired,
  onAnnoRemoved: PropTypes.func.isRequired,
  onAnnoSelectionCompleted: PropTypes.func,
  onStopSelection: PropTypes.func,
  onCheckBoxChanged: PropTypes.func,
  updateBoxCoordinates: PropTypes.func,
  boxUpdateMode: PropTypes.bool,
  textAllowed: PropTypes.bool
};


/**
 * Functions irrespective of React
 */

function drawAnnotations(annoList = [], activeIndex) {
  const annoCount = annoList.length;
  const prevList = anno.getAnnotations();
  annoList.forEach((box, index) => {
    // console.log('drawAnnotations', box);
    const replace = prevList.find(item => item.id === box.id);
    if (box && box.shapes && box.shapes[0]) {
      anno.addAnnotation(Object.assign({}, box, {
        src: 'https://s3.amazonaws.com/mpxdata/eqn_images/' + box.src.split('/').slice(-1)[0]
      }), replace, index === activeIndex);
    }
  });
}

function hideWidget() {
  $('.annotorious-hint').empty();
  $('#page-annotations .annotorious-annotationlayer').css('cursor', 'crosshair');
}
