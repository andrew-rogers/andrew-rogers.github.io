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

var GridLayout=function(el,row_heights,col_widths) {
  el.html('');
  this.el=el;

  var row_heights=this._processSizeArray(row_heights);
  var col_widths=this._processSizeArray(col_widths);

  var nrows=row_heights.length;
  this.nrows=nrows;

  var ncols=col_widths.length;
  this.ncols=ncols;

  var cells=[];
  for( var row=0; row<nrows; row++){
    var height=row_heights[row]+'%';
    var row_el=$(document.createElement('div'));
    row_el.css("width","100%");
    row_el.css("height",height);
    el.append(row_el);
    cells.push([]); // push an empty row
    for( var col=0; col<ncols; col++){
      width=col_widths[col]+'%';
      var cell_el=$(document.createElement('div'));
      cell_el.css("width",width);
      cell_el.css("height","100%");
      cell_el.css("float","left");
      row_el.append(cell_el);
      cells[row].push(cell_el); // push cell into row
    }
  }
  this.cells=cells;
};

GridLayout.prototype.chequer=function(c0,c1){
  if(c0==null)c0='#ccc';
  if(c1==null)c1='#888';
  var colour=[c0,c1];
  for(var row=0; row<this.nrows; row++){
    for(var col=0; col<this.ncols; col++){
      var c=colour[(row+col)%2];
      this.cells[row][col].css('background-color',c);
    }
  }
};

GridLayout.prototype._processSizeArray=function(arr){
  // If array then normalise values so that row does not overflow
  if(Array.isArray(arr)){
    var sum=0.0;
    for(var i=0; i<arr.length; i++) sum+=arr[i]/100.0;
    for(var i=0; i<arr.length; i++) arr[i]=arr[i]/sum;
  }

  // otherwise assume n rows required
  else{
    var n=arr;
    arr=[];
    for(var i=0; i<n; i++) arr.push(100.0/n);
  }
  return arr;
};
