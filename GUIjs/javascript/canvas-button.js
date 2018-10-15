/**
 *
 * @licstart  The following is the entire license notice for the 
 * JavaScript code in this page.
 *
 * The MIT License (MIT)
 *
 * Copyright (C) 2015  Andrew Rogers
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE. 
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this page.
 *
 */

var CanvasButton=function(el,type){
  // Set sizes if necessary
  if(el.width()<=0)el.width(50);
  if(el.height()<=0)el.height(50);

  el.html('');
  this.el=el;
  this.createCanvas();
  if( !!type ) this.drawButton(type);

  var jq=$(this);
  el.click( function() {
    jq.trigger('click');
  });
};

CanvasButton.prototype.createCanvas=function(){
  var canvas = document.createElement('canvas');
  canvas.width=this.el.width();
  canvas.height=this.el.height();
  this.el.html(canvas);
  if( !document.createElement('canvas').getContext ){
    window.G_vmlCanvasManager.initElement(canvas);
  }
  this.canvas=canvas;
};

CanvasButton.prototype.drawButton=function(type){
  var context = this.canvas.getContext('2d');
  var w=this.canvas.width;
  var h=this.canvas.height;
  var size=w;
  if(h<size)size=h;
  context.translate(w/2, h/2);
  context.scale(size,size);

  type=type.split('.');
  var dir=type[1];
  var subtype=type[1];
  type=type[0];

  if(type=='arrow'){
    // Draw circle     
    context.beginPath();
    context.arc(0, 0, 0.375, 0, 2 * Math.PI, false);
    context.lineWidth = 5;
    context.fillStyle = "#CEF";
    context.fill();// Draw triangle
    context.beginPath();

    // Draw arrow
    switch(dir){
      case 'down':
        context.moveTo(0.05,-0.3);
        context.lineTo(0.05,0.125);
        context.lineTo(0.175,0.125);
        context.lineTo(0,0.3);
        context.lineTo(-0.175,0.125);
        context.lineTo(-0.05,0.125);
        context.lineTo(-0.05,-0.3);
        break;
      case 'up':
        context.moveTo(0.05,0.3);
        context.lineTo(0.05,-0.125);
        context.lineTo(0.175,-0.125);
        context.lineTo(0,-0.3);
        context.lineTo(-0.175,-0.125);
        context.lineTo(-0.05,-0.125);
        context.lineTo(-0.05,0.3);
        break;
      case 'left':
	context.moveTo(0.3,0.05);
	context.lineTo(-0.125,0.05);
        context.lineTo(-0.125,0.175);
        context.lineTo(-0.3,0);
        context.lineTo(-0.125,-0.175);
        context.lineTo(-0.125,-0.05);
        context.lineTo(0.3,-0.05);
        break;
      case 'right':
        context.moveTo(-0.3,0.05);
	context.lineTo(0.125,0.05);
        context.lineTo(0.125,0.175);
        context.lineTo(0.3,0);
        context.lineTo(0.125,-0.175);
        context.lineTo(0.125,-0.05);
        context.lineTo(-0.3,-0.05);
    }
    context.fillStyle="#358";
    context.fill();
  }
  
  if(type=='triangle'){
    // Draw circle     
    context.beginPath();
    context.arc(0, 0, 0.375, 0, 2 * Math.PI, false);
    context.lineWidth = 5;
    context.fillStyle = "#CEF";
    context.fill();   

    // Draw triangle
    context.beginPath();
    switch(dir){
      case 'down':
        context.moveTo(-0.25,-0.125);
        context.lineTo(0,0.225);
        context.lineTo(0.25,-0.125);
        break;
      case 'up':
        context.moveTo(-0.25,0.125);
        context.lineTo(0,-0.225);
        context.lineTo(0.25,0.125);
        break;
      case 'left':
        context.moveTo(0.125,-0.25);
        context.lineTo(-0.225,0);
        context.lineTo(0.125,0.25);
        break;
      case 'right':
        context.moveTo(-0.125,-0.25);
        context.lineTo(0.225,0);
        context.lineTo(-0.125,0.25);
    }
    context.fillStyle="#358";
    context.fill();
  }

  if(type=='control' && subtype=='delete'){
    // Draw circle     
    context.beginPath();
    context.arc(0, 0, 0.375, 0, 2 * Math.PI, false);
    context.lineWidth = 0.1;
    context.fillStyle = "#f00";
    context.fill();   

    // Draw X
    context.beginPath();
    context.moveTo(-0.15,-0.15);
    context.lineTo(0.15,0.15);
    context.moveTo(-0.15,0.15);
    context.lineTo(0.15,-0.15);
    context.strokeStyle="#ccc";
    context.stroke();
  }
};
