'use strict';

(function() {

  var socket = io();
  var canvas = document.getElementsByClassName('whiteboard')[0];
  var colors = document.getElementsByClassName('color');
  var context = canvas.getContext('2d');


  fitToContainer(canvas);

  function fitToContainer(canvas){
    // Make it visually fill the positioned parent
    canvas.style.width ='100%';
    canvas.style.height='100%';
    // ...then set the internal size to match
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }


  var clearButton = document.getElementById("clearButton");

  clearButton.addEventListener('click',onButtonClick,false);

  var current = {
    color: 'black'
  };
  var drawing = false;

  var drawings = [];

  canvas.addEventListener('mousedown', onMouseDown, false);
  canvas.addEventListener('mouseup', onMouseUp, false);
  canvas.addEventListener('mouseout', onMouseUp, false);
  canvas.addEventListener('mousemove', throttle(onMouseMove, 10), false);

  for (var i = 0; i < colors.length; i++){
    colors[i].addEventListener('click', onColorUpdate, false);
  }

  socket.on('init', onInit);
  socket.on('paint', onDrawingEvent);
  socket.on('clearall',onClear);
  socket.on('newdata',onRefresh());

  window.addEventListener('resize', onResize, false);
  onResize();


  function drawLine(x0, y0, x1, y1, color, emit){
    context.beginPath();
    context.moveTo(x0, y0);
    context.lineTo(x1, y1);
    context.strokeStyle = color;
    context.lineWidth = 2;
    context.stroke();
    context.closePath();

    if (!emit) { return; }
    var w = canvas.width;
    var h = canvas.height;

    var paintObject = {
      x0: x0 / w,
      y0: y0 / h,
      x1: x1 / w,
      y1: y1 / h,
      color: color
    };
    socket.emit('paint', paintObject);
    drawings.push(paintObject);
  }
  function onButtonClick(){
    socket.emit("clearall");
    console.log("button pressed");
    socket.emit('paint',{});
    drawings=[]
    redraw();
    //window.location.reload();
  }
  function onMouseDown(e){
    drawing = true;
    current.x = e.clientX;
    current.y = e.clientY;
  }

  function onMouseUp(e){
    if (!drawing) { return; }
    drawing = false;
    drawLine(current.x, current.y, e.clientX, e.clientY, current.color, true);
  }

  function onMouseMove(e){
    if (!drawing) { return; }
    drawLine(current.x, current.y, e.clientX, e.clientY, current.color, true);
    current.x = e.clientX;
    current.y = e.clientY;
  }

  function onColorUpdate(e){
    current.color = e.target.className.split(' ')[1];
  }

  // limit the number of events per second
  function throttle(callback, delay) {
    var previousCall = new Date().getTime();
    return function() {
      var time = new Date().getTime();

      if ((time - previousCall) >= delay) {
        previousCall = time;
        callback.apply(null, arguments);
      }
    };
  }

  function onInit(data) {
    drawings = [].concat(data);
    redraw();
  }

  function onDrawingEvent(data) {
    //console.log(data);
    if(data==="clearit"){
      drawings=[]
      redraw();
    }
    else{
      var w = canvas.width;
      var h = canvas.height;
      drawLine(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color);
    }
  }

  function onRefresh(data){
    console.log("HIIIIIIIIIIIIIIIII");
    drawings = [].concat(data);
    redraw();
  }

  function onClear() {
    drawings = [];
    context.clearRect(0, 0, canvas.width, canvas.height);
  }

  function redraw() {
    var w = canvas.width;
    var h = canvas.height;
    if(drawings!==undefined)
    for (i = 0; i < drawings.length; i++) {
      drawLine(drawings[i].x0 * w, drawings[i].y0 * h, drawings[i].x1 * w, drawings[i].y1 * h, drawings[i].color);
    }
  }

  // make the canvas fill its parent
  function onResize() {
    canvas.width = parent.innerWidth;
    canvas.height = parent.innerHeight;
    context.clearRect(0, 0, canvas.width, canvas.height);
    redraw();
  }

})();
