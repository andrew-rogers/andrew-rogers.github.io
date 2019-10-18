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

// Test the StateMachine class with a UART Receiver example

var fs = require('fs');

eval(''+fs.readFileSync('../StateMachine.js'));

UartRx = function() {

    // Format
    this.num_data_bits = 8;
    this.data_cnt = this.num_data_bits;

    // Define events
    this.events = {};
    this.events.F0 = 1; // Framing event 0 
    this.events.F1 = 2; // Framing event 1
    this.events.D = 3; // Data bit

    this.sm = new StateMachine(this.events);

    // Setup the state transitions
    var e = this.events;
    var that = this;

    this.sm.addTransition("IDLE",e.F0,"DATA", function() {that.startBit();});
    this.sm.addTransition("DATA",e.D,"DATA", function(e,b) {that.dataBit(b);});

    this.sm.addTransition("DATA",e.F0,"STOP", function() {that.parityBit(0);});
    this.sm.addTransition("DATA --> STOP : F1", function() {that.parityBit(1);});

    this.sm.addTransition("STOP",e.F0,"STOP", function() {that.stopBit(0);});
    this.sm.addTransition("STOP",e.F1,"IDLE", function() {that.stopBit(1);});

};

UartRx.prototype.startBit = function() {
    console.log("Start bit detected.");
    this.data_cnt = 0;
};

UartRx.prototype.dataBit = function(b) {
    console.log("Bit[" + this.data_cnt + "] = " +b);
    this.data_cnt++;
};

UartRx.prototype.parityBit = function(p) {
    console.log("Parity " + p);
};

UartRx.prototype.stopBit = function(s) {
    console.log("Stop " + s);
};

UartRx.prototype.bit = function(b) {

    // Default to framing bit
    var e = this.events.F0 + b;

    // If data is needed then raise data events
    if (this.data_cnt < this.num_data_bits) e = this.events.D;
 
    console.log("> " + b + " event="+e);
    this.sm.event(e,b);
}

uart_rx = new UartRx();

var bits=[1,1,1,1,0,1,0,0,1,1,1,1,0,1,0,0,1,1,1,1,1,1,0,1,0,0,1,1,1,1,0,1,1,1,1];
for (var n=0; n<bits.length; n++)
{
    uart_rx.bit(bits[n]);
}








