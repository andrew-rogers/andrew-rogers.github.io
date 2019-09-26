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

var button_start = document.getElementById('button_start');
var button_stop = document.getElementById('button_stop');

var AudioUART = function() {
    var buffer_size = 4096;

    var that = this;
    var init = function(media) {
        that.duplexAudio.start();
    };

    var samplesCallback = function(ip, op) {
        that.processAudio(ip, op);
    };

    this.duplexAudio = new DuplexAudio(buffer_size, init, samplesCallback);
};

AudioUART.prototype.processAudio = function(inp, output) {
    for (var n = 0; n < output.length; n++) {

        // Sawtooth for now
        output[n] = (n/256)%2-1.0;
    }
};

