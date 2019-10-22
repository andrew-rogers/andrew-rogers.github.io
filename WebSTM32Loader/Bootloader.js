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
    this.serial = new SerialWithTimeout(timer, serial);
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
        that.ack(1000).then(cb,function(err){cb(err.message);});
        callback('.');
    };

    var cb = function(result) {

        // If timeout or some other values then retry
        if (result=='T') {
            if (cnt++ < num_retries) sm.event(events.T);
        }
        else if (callback) callback(result);
    };

    this.serial.write([0x7f]);
    this.ack(1000).then(cb,function(err){cb(err.message);});
};

Bootloader.prototype.cmdGet = function() {
    var that = this;
    return this.sendCommand(0x00, 1000).then(function() {
        return that.getNumBytes();
    }).then(function(num_bytes) {
        return that.getData(num_bytes);
    }).then(function(cmds) {
        // TODO: Store the supported command list somewhere
        return that.ack(1000);
    });
};

Bootloader.prototype.cmdReadMemory = function(address, num_bytes) {
    var that = this;
    return this.sendCommand(0x11, 1000).then(function() {
        return that.sendAddress(address);
    }).then(function() {
        return that.sendNumBytes(num_bytes-1);
    }).then(function() {
        return that.getData(num_bytes);
    });
};

Bootloader.prototype.cmdWriteMemory = function(address, data) {
    var that = this;
    return this.sendCommand(0x31, 1000).then(function() {
        return that.sendAddress(address);
    }).then(function() {
        return that.sendData(data);
    });
};

Bootloader.prototype.sendCommand = function(cmd, timeout) {

    // Clear the read buffer.
    this.serial.readNC(1000);

    // Send command byte and its 1's compliment.
    this.serial.write([cmd, cmd^0xff]);

    // Return the ACK/NACK promise
    return this.ack(timeout);
};

Bootloader.prototype.getNumBytes = function() {

    var that = this;
    return new Promise(function(resolve, reject) {

        // Callback for serial read.
        var cb = function(rx) {
            if (rx.length > 0) resolve(rx[0]);
            else reject(new Error('T'));
        }

        // Read just one byte.
        that.serial.read(1, 1000, cb);
    });
};

Bootloader.prototype.getData = function(num_bytes) {

    var that = this;
    var buffer = [];
    return new Promise(function(resolve, reject) {

        // Callback for serial read.
        var cb = function(rx) {
            if (rx.length == 0) {
                var err = new Error('Could not get all data requested.');
                err.rx = buffer;
                reject(err);
            }
            else {
                for (var n=0; n<rx.length; n++) buffer.push(rx[n]);
                if (buffer.length >= num_bytes) resolve(rx);
            }
        }

        // Read the bytes.
        that.serial.read(num_bytes, 1000, cb);
    });
};

Bootloader.prototype.sendAddress = function(address) {

    // Clear the read buffer.
    this.serial.readNC(1000);

    // Send address bytes and checksum.
    var bytes=[(address >>> 24) & 0xff];
    bytes.push((address >>> 16) & 0xff);
    bytes.push((address >>> 8) & 0xff);
    bytes.push((address >>> 0) & 0xff);
    bytes.push(bytes[0]^bytes[1]^bytes[2]^bytes[3])
    this.serial.write(bytes);

    // Return the ACK/NACK promise
    return this.ack(1000);
};

Bootloader.prototype.sendNumBytes = function(num_bytes) {

    // Clear the read buffer.
    this.serial.readNC(1000);

    // Send command byte and its 1's compliment.
    this.serial.write([num_bytes, num_bytes^0xff]);

    // Return the ACK/NACK promise
    return this.ack(1000);
};

Bootloader.prototype.sendData = function(data) {

    // Clear the read buffer.
    this.serial.readNC(1000);

    // Get length, data and checksum
    var sum = (data.length-1) & 0xff;
    var tx = [sum];
    for (var n=0; n<data.length; n++) {
        sum = sum ^ (data[n] & 0xff);
        tx.push(data[n]);
    }
    tx.push(sum);

    // Send length, data and checksum
    this.serial.write(tx);

    // Return the ACK/NACK promise
    return this.ack(1000);
};

Bootloader.prototype.ack = function(timeout) {

    var that = this;
    return new Promise(function(resolve, reject) {

        // Callback for serial read.
        var cb = function(rx) {

            var result = 'T';

            // Iterate through received bytes looking for ACK or NACK
            for (var n=0; n<rx.length; n++) {
                if (rx[n]==0x1f) result='N';
                else if (rx[n]==0x79) result='A';
            }

            if (result=='A') resolve(result);
            else reject(new Error(result));
        }

        // Read just one byte.
        that.serial.read(1, timeout, cb);
    });
};

