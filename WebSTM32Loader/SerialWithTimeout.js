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

var SerialWithTimeout = function(timer, serial) {
    this.timer = timer;
    this.serial = serial;
    this.read_buffer = [];
    this.read_timer = null;

    var that = this;
    serial.on('data',function(data) {that.rxCallback(data);})
};

SerialWithTimeout.prototype.read = function(num_bytes, timeout, callback) {

    // Check if there are enough bytes to satisfy request
    if (this.read_buffer.length >= num_bytes) {
        callback(this.readNC(num_bytes));
    }
    else {

        // Store the callback and requested number of bytes in case of timeout
        this.read_requested = num_bytes;
        this.cb_readSerial = callback;

        // Start the timer
        var that = this;
        if (this.read_timer == null) this.read_timer = this.timer.oneShot(timeout, function() {that.timerCallback();});
        else this.read_timer.restart(timeout);
    }
};

// Return up to num_bytes data pulled from the receive buffer.
// returns immediately even if empty.
SerialWithTimeout.prototype.readNC = function(num_bytes) {
    var buf = [];
    if (num_bytes>this.read_buffer.length) num_bytes=this.read_buffer.length;
    for (var n=0; n<num_bytes; n++) buf.push(this.read_buffer[n]);
    this.read_buffer = this.read_buffer.slice(num_bytes);
    return buf;
};

SerialWithTimeout.prototype.write = function(data) {
    this.serial.write(data);
};

SerialWithTimeout.prototype.rxCallback = function(data) {

    logRx(data);

    // Put each byte of data in read buffer
    for (var n=0; n<data.length; n++) this.read_buffer.push(data[n]);

    if (this.read_requested > 0) {

        // Restart the timer
        this.read_timer.restart()

        // Check if there are enough bytes to satisfy request
        if (this.read_buffer.length >= this.read_requested) {
            this.cb_readSerial(this.readNC(this.read_requested));
            this.read_requested = 0;
        }

    }
};

SerialWithTimeout.prototype.timerCallback = function() {

    if (this.read_requested > 0) {

        // Timer elapsed therefore get any bytes that have been acquired so far
        this.cb_readSerial(this.readNC(this.read_requested));
        this.read_requested = 0;
    }
};

