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

var fs = require('fs');

eval(''+fs.readFileSync('AudioUART.js'));

var uartRx = new AudioUART();

fs.readFile('sig_rx.vec','ascii', function(err, data) {
    data=data.split("\n"); // Convert file to array of numbers
    
    var buffer_size=4096;
    
    // Chop up into Float32Array as WebAudio API would provide
    for (var b=0; b<data.length+1-buffer_size; b+=buffer_size) {
        var buf = new Float32Array(buffer_size);
        for (var n=0; n<buffer_size; n++) {
            buf[n]=data[b+n]/32767; // Convert 16-bit integers to Float32
        }
        uartRx.processRx(buf);
    }
    dumpSignal(uartRx.out, "sig_detect.vec")
});

dumpSignal = function(vec, filename) {
    var str=""+vec;
    str=str.split(',').join('\n');

    fs.writeFile(filename, str, function (err) {
    }); 
};


