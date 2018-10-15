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



/* VariablePosSpinText
   
   Handles both integer non-integer numbers

   Position of digit being adjusted is variable to allow
   for large range and precision adjustments. The digit
   being adjusted is in <strong> as an indication to the
   user.

   Control buttons are not defined or handled here.
 */

var VariablePosSpinText=function(dp) {
  if(dp==null)dp=0;
  this.dp=dp;
  this.value=0;
  this.setAdjPos(-dp);
};

VariablePosSpinText.prototype.setAdjPos=function(di) {
  this.step=Math.pow(10,di);
  di=Math.floor(di);

  // If there is a decimal point and adj pos is right of 
  // decimal point then set pos back one more space to 
  // allow for decimal point.
  if(di>=0 && this.dp>0)di=di+1;
  this.cpos=-this.dp-di-1; // relative to string end
};

VariablePosSpinText.prototype.adj=function(nsteps) {
  this.value+=nsteps*this.step;
  return this.value;
};

VariablePosSpinText.prototype.getText=function() {
  var str=this.value.toFixed(this.dp);
  var sign='';
  if(str[0]=='-'){
    str=str.slice(1);
    var sign='-';
  }
  var cpos=str.length+this.cpos;
  for(;cpos<0;cpos++)str='0'+str;
  var str0=str.slice(0,cpos);
  var str1=str.slice(cpos,cpos+1);
  var str2=str.slice(cpos+1);
  return sign+str0+'<strong>'+str1+'</strong>'+str2;
};
