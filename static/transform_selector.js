/**
 * Plugin wrapper.
 * @param {Object} config_opts configuration options
 * @constructor
 */
annotorious.plugin.TransformSelector = function(config_opts) {
  if (config_opts)
    this._activate = config_opts.activate;
}

/**
 * Attach a new selector onInitAnnotator.
 */
annotorious.plugin.TransformSelector.prototype.onInitAnnotator = function(annotator) {
  annotator.addSelector(new annotorious.plugin.TransformSelector.Selector());
  if (this._activate)
    annotator.setCurrentSelector('transform');
}

/**
 * A transform selector.
 * @constructor
 */
annotorious.plugin.TransformSelector.Selector = function() { }

annotorious.plugin.TransformSelector.Selector.prototype.init = function(annotator, canvas) {
  /** @private **/
  this._annotator = annotator;

  /** @private **/
  this._canvas = canvas;

  /** @private **/
  this._g2d = canvas.getContext('2d');

  /** @private **/
  this._anchor;

  /** @private **/
  this._points = [];

  /** @private **/
  this._mouse;

  /** @private **/
  this._enabled = false;

  /** @private **/
  this._mouseMoveListener;

  /** @private **/
  this._mouseUpListener;

  /** @private **/
  this._cursor = 'default';

  /** @private **/
  this._closeEnough = 10;

  /** @private **/
  this._pointIndex = -1;

  /** @private **/
  this._dragAnnotation = null;
}

/**
 * Attaches MOUSEUP and MOUSEMOVE listeners to the editing canvas.
 * @private
 */
annotorious.plugin.TransformSelector.Selector.prototype._attachListeners = function() {
  var self = this;

  var refresh = function(last, highlight_last) {
    self._g2d.clearRect(0, 0, self._canvas.width, self._canvas.height);

    var shape = self._annotator.toCanvasCoordinates(self._points);
    // Outer line
    self._g2d.lineWidth = 2.5;
    self._g2d.strokeStyle = '#000000';
    self._g2d.lineJoin = "round";
    self._g2d.lineCap = "round"
    self._g2d.lineJoin = "round"
    self._g2d.beginPath();

    self._g2d.rect(shape.x,
      shape.y,
      shape.width,
      shape.height);
    self._g2d.stroke();
  };

  this._mouseMoveListener = function(event) {
    if (self._enabled) {
      if (event.offsetX == undefined) {
        event.offsetX = event.layerX;
        event.offsetY = event.layerY;
      }

      self._mouse = { x: event.offsetX, y: event.offsetY };

      self._setPoint(self._annotator.toItemCoordinates(self._mouse));

      refresh(self._mouse);
    }
  };

  this._canvas.addEventListener('mousemove', this._mouseMoveListener);

  this._mouseUpListener = function(event) {
    if (event.offsetX == undefined) {
      event.offsetX = event.layerX;
      event.offsetY = event.layerY;
    }

    self.setCursor();

    self._enabled = false;
    refresh(self._anchor);
    self._annotator.fireEvent('onSelectionCompleted',
      { mouseEvent: event, shape: self.getShape(), viewportBounds: self.getViewportBounds() });
  };

  this._canvas.addEventListener('mouseup', this._mouseUpListener);
}

/**
 * Detaches MOUSEUP and MOUSEMOVE listeners from the editing canvas.
 * @private
 */
annotorious.plugin.TransformSelector.Selector.prototype._detachListeners = function() {
  var self = this;
  if (this._mouseMoveListener) {
     this._canvas.removeEventListener("mousemove", self._mouseMoveListener);
  }

  if (this._mouseUpListener) {
     this._canvas.removeEventListener("mouseup", self._mouseUpListener);
  }
}

/**
 * Selector API method: returns the selector name.
 * @returns the selector name
 */
annotorious.plugin.TransformSelector.Selector.prototype.getName = function() {
  return 'transform';
}

/**
 * Selector API method: returns the supported shape type.
 *
 * TODO support for multiple shape types?
 *
 * @return the supported shape type
 */
annotorious.plugin.TransformSelector.Selector.prototype.getSupportedShapeType = function() {
  return 'rect';
}


/**
 * Selector API method: starts the selection at the specified coordinates.
 * @param {number} x the X coordinate
 * @param {number} y the Y coordinate
 */
annotorious.plugin.TransformSelector.Selector.prototype.startSelection = function(x, y, annotation, pointIndex) {
  this._dragAnnotation = annotation;
  this._points = (annotation.shapes && annotation.shapes[0] && annotation.shapes[0].geometry) || {};
  this._pointIndex = pointIndex;
  this._enabled = true;
  this._attachListeners();
  this._anchor = { x: x, y: y };
  this.setCursor('move');

  this._setPoint(this._annotator.toItemCoordinates(this._anchor))
  // goog.style.setStyle(document.body, '-webkit-user-select', 'none');
}

/**
 * Selector API method: stops the selection.
 */
annotorious.plugin.TransformSelector.Selector.prototype.stopSelection = function() {
  console.log('stopSelection plugin')
  this._points = {};
  this._detachListeners();
  this._g2d.clearRect(0, 0, this._canvas.width, this._canvas.height);
  // goog.style.setStyle(document.body, '-webkit-user-select', 'auto');
}

/**
 * Selector API method: returns the currently edited shape.
 * @returns {annotorious.shape.Shape} the shape
 */
annotorious.plugin.TransformSelector.Selector.prototype.getShape = function() {
  return { type: 'rect', geometry: this._points};
}

/**
 * Selector API method: returns the bounds of the selected shape, in viewport (= pixel) coordinates.
 * @returns {object} the shape viewport bounds
 */
annotorious.plugin.TransformSelector.Selector.prototype.getViewportBounds = function() {
  var right = this._anchor.x;
  var left = this._anchor.x;
  var top = this._anchor.y;
  var bottom = this._anchor.y;

  // TODO replace with goog.array.forEach
  for (var i=0; i<this._points.length; i++) {
    var pt = this._points[i];

    if (pt.x > right)
      right = pt.x;

    if (pt.x < left)
      left = pt.x;

    if (pt.y > bottom)
      bottom = pt.y;

    if (pt.y < top)
      top = pt.y;
  };

  return { top: top, right: right, bottom: bottom, left: left };
}

/**
 * TODO not sure if this is really the best way/architecture to handle viewer shape drawing
 */
annotorious.plugin.TransformSelector.Selector.prototype.drawShape = function(g2d, shape, highlight) {
  var color;
  if (highlight) {
    color = '#fff000';
  } else {
    color = shape.style.outline;
  }

  // TODO check if it's really a polyogn

  var points = this._annotator.toCanvasCoordinates(shape.geometry);
  // Inner line
  g2d.lineWidth = shape.style.outline_width;
  g2d.strokeStyle = color;
  g2d.lineJoin = "round";
  g2d.lineCap = "round"
  g2d.lineJoin = "round"
  g2d.beginPath();

  g2d.rect(points.x,
    points.y,
    points.width,
    points.height);
  g2d.stroke();
}

annotorious.plugin.TransformSelector.Selector.prototype.setCursor = function(type) {
  if (type) {
    this._cursor = this._canvas.style.cursor;
    this._canvas.style.cursor = type;
  } else {
    this._canvas.style.cursor = this._cursor;
  }

}

annotorious.plugin.TransformSelector.Selector.prototype._setPoint = function(point) {
  var shape = this._points;

  switch (this._pointIndex) {
    case 0:
      shape.width = shape.width - point.x + shape.x > 0 ? shape.width - point.x + shape.x : 0;
      shape.height = shape.height - point.y + shape.y > 0 ? shape.height - point.y + shape.y : 0;
      shape.x = point.x;
      shape.y = point.y;
      break;
    case 1:
      shape.width = point.x - shape.x > 0 ? point.x - shape.x : shape.x;
      shape.height = shape.height - point.y + shape.y > 0 ? shape.height - point.y + shape.y : 0;
      shape.y = point.y;
      break;
    case 2:
      shape.width = shape.width - point.x + shape.x > 0 ? shape.width - point.x + shape.x : 0;
      shape.height = point.y - shape.y > 0 ? point.y - shape.y : shape.y;
      shape.x = point.x;
      break;
    case 3:
      shape.width = point.x - shape.x > 0 ? point.x - shape.x : shape.x;
      shape.height = point.y - shape.y > 0 ? point.y - shape.y : shape.y;
      break;
    default:
  }

  this._points = shape;
}