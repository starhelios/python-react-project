import React, { Component, PropTypes } from 'react';
import { cloneDeep } from 'lodash';

let guidelinesActive = false;
const WRAP_INCREASE = 85;

export default class Annotorious extends Component {

  constructor(...args) {
    super(...args);
    this.onAnnoSelectionCompleted = this.onAnnoSelectionCompleted.bind(this);
    this.update = this.update.bind(this);
    this.imageURL = '';
  }

  update() {
    if (this.props.geometry == "polygon") {
      anno.addPlugin('PolygonSelector', { activate: true });
    } else {
      anno.$_modules$[0].$_plugins$ = [];
      anno.addPlugin('PolygonSelector', { activate: false });
    }
    anno.reset();
    drawAnnotations(cloneDeep(this.props.annoList));
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
      anno.addHandler('onCharSizePlus', this.props.onCharSizePlus);
      anno.addHandler('onCharSizeMinus', this.props.onCharSizeMinus);
      anno.addHandler('onAnnotationCreated', this.props.onAnnoCreated);
      anno.addHandler('onAnnotationUpdated', this.props.onAnnoUpdated);
      anno.addHandler('onAnnotationRemoved', this.props.onAnnoRemoved);
      anno.addHandler('onSelectionCompleted', this.onAnnoSelectionCompleted);
    }
  }

  onAnnoSelectionCompleted(event) {
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
    const wrapperHeight = this.props.imageHeight + WRAP_INCREASE;

    if (this.props.imageURL) {
      return (
        <div className="text-center anno-board">
          <div className="wrapper-annotatable" style={{height: wrapperHeight}}>
            <img id="mainImage" ref="mainImage" src={this.props.imageURL} className="annotatable"
              width={this.props.imageWidth} height={this.props.imageHeight}
              onLoad={this.update} />
          </div>
        </div>
      );
    } else {
      return null;
    }
  }
}

Annotorious.propTypes = {
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
  updateBoxCoordinates: PropTypes.func,
  boxUpdateMode: PropTypes.bool,
  textAllowed: PropTypes.bool
};


/**
 * Functions irrespective of React
 */

function drawAnnotations(annoList = []) {
  console.log('drawAnnotations');
  annoList.forEach(box => {
    anno.addAnnotation(Object.assign({}, box, {
      src: 'https://s3.amazonaws.com/mpxdata/eqn_images/' + box.src.split('/').slice(-1)[0]
    }));
  });
}

function hideWidget() {
  $('.annotorious-hint').empty();
  $('#page-annotations .annotorious-annotationlayer').css('cursor', 'crosshair');
}
