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

var Bootloader = function(timer, serial) {
    this.timer = timer;
    this.serial = serial;
    this.read_buffer = [];
    this.read_timer = null;

    this.events = {};
    this.events.READ    = 0; // Request data from serial
    this.events.RX      = 1; // Got byte(s) from serial
    this.events.RX_LAST = 2; // Got the last byte(s) of the request from serial
    this.events.TIMEOUT = 3; // The timer elapsed

    var that = this;

    this.sm_serial = new StateMachine(this.events);
    this.sm_serial.addTransition("IDLE    --> RX_WAIT : READ   ", function(e, num_bytes, timeout, callback) {that.initRead(num_bytes, timeout, callback);});
    this.sm_serial.addTransition("RX_WAIT --> RX_WAIT : RX     ", function(e, data) {that.gotData(data);});
    this.sm_serial.addTransition("RX_WAIT --> IDLE    : RX_LAST", function(e, data) {that.lastData(data);});
    this.sm_serial.addTransition("RX_WAIT --> IDLE    : TIMEOUT", function() {that.timeoutElapsed();});
    
    serial.on('data',function(data) {that.rxCallback(data);})
};

Bootloader.prototype.rxCallback = function(data) {

    var e = this.events.RX;

    logRx(data);

    // Check if there are enough bytes to satisfy request
    if (this.read_buffer.length + data.length >= this.read_requested) e = this.events.RX_LAST;

    this.sm_serial.event(e, data);
};

Bootloader.prototype.gotData = function(data) {

    // Restart the timer
    this.read_timer.restart()

    // Put each byte of data in read buffer
    for (var n=0; n<data.length; n++) this.read_buffer.push(data[n]);
};

Bootloader.prototype.lastData = function(data) {

    // Put each byte of data in read buffer
    for (var n=0; n<data.length; n++) this.read_buffer.push(data[n]);

    this.cb_readSerial(this.pop(this.read_requested));
};

Bootloader.prototype.timerCallback = function() {

    this.sm_serial.event(this.events.TIMEOUT);
};

Bootloader.prototype.timeoutElapsed = function() {

    // Timer elapsed therefore get any bytes that have been acquired so far
    this.cb_readSerial(this.pop(this.read_requested));
};

Bootloader.prototype.pop = function(num_bytes) {
    var buf = [];
    if (num_bytes>this.read_buffer.length) num_bytes=this.read_buffer.length;
    for (var n=0; n<num_bytes; n++) buf.push(this.read_buffer[n]);
    this.read_buffer = this.read_buffer.slice(num_bytes);
    return buf;
};

Bootloader.prototype.readSerial = function(num_bytes, timeout, callback) {
    this.sm_serial.event(this.events.READ, num_bytes, timeout, callback);
};

Bootloader.prototype.initRead = function(num_bytes, timeout, callback) {

    // Store the callback and requested number of bytes in case of timeout
    this.read_requested = num_bytes;
    this.cb_readSerial = callback;
    
    // Start the timer
    var that = this;
    if (this.read_timer == null) this.read_timer = this.timer.oneShot(timeout, function() {that.timerCallback();});
    else this.read_timer.restart();
};

Bootloader.prototype.detectBaud = function(num_retries, callback) {
    var cnt = 1;
    var result = null;

    var that = this;

    var events={A: 0, N: 1, T: 2};
    var sm = new StateMachine(events);
    sm.addTransition("POLL --> POLL : T", function() {timeout();});

    var timeout = function() {
        that.serial.write([0x7f]);
        that.readSerial(1, 1000, cb)
    };

    var cb = function(rx) {

        // Iterate through received bytes looking for ACK or NACK
        for (var n=0; n<rx.length && result==null; n++) {
            if (rx[n]==0x1f) result='N';
            else if (rx[n]==0x79) result='A';
        }

        // If timeout or some other values then retry
        if (result==null) {
            if (cnt++ >= num_retries) result='T';
            else {
                sm.event(events.T);
            }
        }
        else if (callback) callback(result);
    };

    this.serial.write([0x7f]);
    this.readSerial(1, 1000, cb);
};

Bootloader.prototype.sendCommand = function(timeout) {
    // Send command byte
    // Send cmd^0xff
    // Wait ACK/NACK
};
