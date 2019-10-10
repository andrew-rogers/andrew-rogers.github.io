/**
 *
 * @licstart  The following is the entire license notice for the 
 *  JavaScript code in this page.
 *
 * Copyright (C) 2019  Andrew Rogers
 *
 *
 * The JavaScript code in this page is free software: you can
 * redistribute it and/or modify it under the terms of the GNU
 * General Public License (GNU GPL) as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option)
 * any later version.  The code is distributed WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE.  See the GNU GPL for more details.
 *
 * As additional permission under GNU GPL version 3 section 7, you
 * may distribute non-source (e.g., minimized or compacted) forms of
 * that code without the copy of the GNU GPL normally required by
 * section 4, provided you include this license notice and a URL
 * through which recipients can access the Corresponding Source.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this page.
 *
 */

// x[n] ---->(+)-------o--->--->(+)---> y[n]
//            ^        |   b0    ^
//            |       [ ]        |
//            |        |         |
//           (+)<--<---o--->--->(+)
//            ^   -a1  |   b1    ^
//            |       [ ]        |
//            |        |         |
//            '----<---o--->-----'
//                -a2      b2

var Biquad = function(b0,b1,b2,a1,a2) {
    this.b0 = b0;
    this.b1 = b1;
    this.b2 = b2;
    this.a1 = a1;
    this.a2 = a2;
    this.w1 = 0;
    this.w2 = 0;
};

Biquad.prototype.processSamples = function(input) {
    var w0;
    var output=[];
    for (var n=0; n<input.length; n++) {
    
        // MACs
        w0=input[n] - this.a1*this.w1 - this.a2*this.w2;
        output[n]=this.b0*w0 + this.b1*this.w1 + this.b2*this.w2;
        
        // Delay line shift
        this.w2 = this.w1;
        this.w1 = w0;
    }
    return output; 
};

