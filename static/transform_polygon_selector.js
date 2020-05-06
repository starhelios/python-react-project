/**
 * Plugin wrapper.
 * @param {Object} config_opts configuration options
 * @constructor
 */
annotorious.plugin.TransformPolygonSelector = function(config_opts) {
  if (config_opts)
    this._activate = config_opts.activate;
}

/**
 * Attach a new selector onInitAnnotator.
 */
annotorious.plugin.TransformPolygonSelector.prototype.onInitAnnotator = function(annotator) {
  annotator.addSelector(new annotorious.plugin.TransformPolygonSelector.Selector());
  if (this._activate)
    annotator.setCurrentSelector('transform');
}

/**
 * A transform selector.
 * @constructor
 */
annotorious.plugin.TransformPolygonSelector.Selector = function() { }

annotorious.plugin.TransformPolygonSelector.Selector.prototype.init = function(annotator, canvas) {
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
annotorious.plugin.TransformPolygonSelector.Selector.prototype._attachListeners = function() {
  var self = this;

  var refresh = function(last, highlight_last) {
    self._g2d.clearRect(0, 0, self._canvas.width, self._canvas.height);


    // Outer line
    self._g2d.lineWidth = 2.5;
    self._g2d.strokeStyle = '#000000';
    self._g2d.beginPath();
    // self._g2d.moveTo(self._anchor.x, self._anchor.y);
    var item = self._annotator.toCanvasCoordinates(self._points[0]);
    self._g2d.moveTo(item.x, item.y);

    // TODO replace with goog.array.forEach
    for (var i=1; i<self._points.length; i++) {
      var item = self._annotator.toCanvasCoordinates(self._points[i]);
      self._g2d.lineTo(item.x, item.y);
      // self._g2d.lineTo(self._points[i].x, self._points[i].y);
    };

    // self._g2d.lineTo(last.x, last.y);
    self._g2d.closePath();
    self._g2d.stroke();

  };

  this._mouseMoveListener = function(event) {
    if (self._enabled) {
      if (event.offsetX == undefined) {
        event.offsetX = event.layerX;
        event.offsetY = event.layerY;
      }

      self._mouse = { x: event.offsetX, y: event.offsetY };

      self._points[self._pointIndex] = self._annotator.toItemCoordinates(self._mouse);

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
annotorious.plugin.TransformPolygonSelector.Selector.prototype._detachListeners = function() {
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
annotorious.plugin.TransformPolygonSelector.Selector.prototype.getName = function() {
  return 'transform';
}

/**
 * Selector API method: returns the supported shape type.
 *
 * TODO support for multiple shape types?
 *
 * @return the supported shape type
 */
annotorious.plugin.TransformPolygonSelector.Selector.prototype.getSupportedShapeType = function() {
  return 'polygon';
}


/**
 * Selector API method: starts the selection at the specified coordinates.
 * @param {number} x the X coordinate
 * @param {number} y the Y coordinate
 */
annotorious.plugin.TransformPolygonSelector.Selector.prototype.startSelection = function(x, y, annotation, pointIndex) {
  this._dragAnnotation = annotation;
  this._points = (annotation.shapes && annotation.shapes[0] && annotation.shapes[0].geometry
    && annotation.shapes[0].geometry.points) || [];
  this._pointIndex = pointIndex;
  this._enabled = true;
  this._attachListeners();
  this._anchor = { x: x, y: y };
  this.setCursor('move');
  // this._annotator.fireEvent('onSelectionStarted', { offsetX: x, offsetY: y, annotator: this });

  this._points[this._pointIndex] = this._annotator.toItemCoordinates(this._anchor)

  console.log('startSelection transform polygon', x, y, pointIndex, this._points[pointIndex], this._points, annotation);
  // goog.style.setStyle(document.body, '-webkit-user-select', 'none');
}

/**
 * Selector API method: stops the selection.
 */
annotorious.plugin.TransformPolygonSelector.Selector.prototype.stopSelection = function() {
  console.log('stopSelection plugin')
  this._points = [];
  this._detachListeners();
  this._g2d.clearRect(0, 0, this._canvas.width, this._canvas.height);
  // goog.style.setStyle(document.body, '-webkit-user-select', 'auto');
}

/**
 * Selector API method: returns the currently edited shape.
 * @returns {annotorious.shape.Shape} the shape
 */
annotorious.plugin.TransformPolygonSelector.Selector.prototype.getShape = function() {
  var points = [];
  // points.push(this._annotator.toItemCoordinates(this._anchor));

  var self = this;
  // goog.array.forEach(this._points, function(pt) {
  for (var i=0; i<this._points.length; i++) {
    points.push(self._annotator.toItemCoordinates(this._points[i]));
  }

  return { type: 'polygon', geometry: { points: this._points } };
}

/**
 * Selector API method: returns the bounds of the selected shape, in viewport (= pixel) coordinates.
 * @returns {object} the shape viewport bounds
 */
annotorious.plugin.TransformPolygonSelector.Selector.prototype.getViewportBounds = function() {
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
annotorious.plugin.TransformPolygonSelector.Selector.prototype.drawShape = function(g2d, shape, highlight) {
  // console.log('drawShape', shape)
  var color;
  if (highlight) {
    color = '#fff000';
  } else {
    color = shape.style.outline;
  }

  // TODO check if it's really a polyogn

  // Inner line
  g2d.lineWidth = shape.style.outline_width;
  g2d.strokeStyle = color;

  var points = shape.geometry.points;
  // console.log('drawShape', points)
  g2d.beginPath();
  g2d.moveTo(points[0].x, points[0].y);
  for (var i=1; i<points.length; i++) {
    g2d.lineTo(points[i].x, points[i].y);
  }
  // g2d.lineTo(points[0].x, points[0].y);
  g2d.closePath();
  g2d.stroke();
}

annotorious.plugin.TransformPolygonSelector.Selector.prototype.setCursor = function(type) {
  if (type) {
    this._cursor = this._canvas.style.cursor;
    this._canvas.style.cursor = type;
  } else {
    this._canvas.style.cursor = this._cursor;
  }

}