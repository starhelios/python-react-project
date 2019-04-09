// Which HTML element is the target of the event
function mouseTarget(e) {
  var targ;
  if (!e) var e = window.event;
  if (e.target) targ = e.target;
  else if (e.srcElement) targ = e.srcElement;
  if (targ.nodeType == 3) // defeat Safari bug
    targ = targ.parentNode;
  return targ;
}
 
// Mouse position relative to the document
function mousePositionDocument(e) {
  var posx = 0;
  var posy = 0;
  if (!e) {
    var e = window.event;
  }
  if (typeof e.pageX !== undefined && typeof e.pageY !== undefined) {
    posx = e.pageX;
    posy = e.pageY;
  }
  else if (typeof e.clientX !== undefined && e.clientY !== undefined) {
    posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
    posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
  }
  return {
    x : posx,
    y : posy
  };
}

// Find out where an element is on the page
function findPos(obj) {
  return {
    left : $(obj).offset().left,
    top : $(obj).offset().top
  };
}
 
// Mouse position relative to the element
function mousePositionElement(e, element) {
  var mousePosDoc = mousePositionDocument(e);
  var target = element ? element : mouseTarget(e);
  var targetPos = findPos(target);
  var posx = mousePosDoc.x - targetPos.left;
  var posy = mousePosDoc.y - targetPos.top;
  return {
    x : posx,
    y : posy
  };
}
