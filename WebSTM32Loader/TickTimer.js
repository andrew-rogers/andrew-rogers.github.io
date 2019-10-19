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

var TimerItem = function(timer, start, period, oneshot, callback) {
    this.timer = timer;
    this.start = start;
    this.period = period;
    this.oneshot = oneshot;
    this.callback = callback;
    this.expired = false;
};

TimerItem.prototype.restart = function(millis) {
    this.timer.restart(this, millis);
};

TimerItem.prototype.check = function(tick_cnt) {
    if (this.expired == false) {
        var elapsed = (tick_cnt-this.start) >>> 0; // Convert elapsed time to unsigned 32-bit
        if (elapsed >= this.period) {
            if(this.oneshot) this.expired = true;
            else this.start = (this.start + this.period) >>> 0;
            if(this.callback) this.callback();
        }
    }
};

TimerItem.prototype.disable = function() {
    this.expired = true;
};

var TickTimer = function(tick_rate) {
    this.tick_rate = tick_rate;
    this.tick_cnt = 0;
    this.timers = [];
};

TickTimer.prototype.oneShot = function(millis, callback) {
    var period = (millis*this.tick_rate/1000.0);
    timer = new TimerItem(this, this.tick_cnt, period, true, callback);
    this.timers.push(timer);
    return timer;
};

TickTimer.prototype.periodic = function(millis, callback) {
    var period = (millis*this.tick_rate/1000.0);
    timer = new TimerItem(this, this.tick_cnt, period, false, callback);
    this.timers.push(timer);
    return timer;
};

TickTimer.prototype.restart = function(timer, millis) {
    timer.start = this.tick_cnt;
    if(millis)timer.period = (millis*this.tick_rate/1000.0);
    timer.expired = false;
};

TickTimer.prototype.tick = function() {
    for (var n=0; n<this.timers.length; n++) this.timers[n].check(this.tick_cnt);
    this.tick_cnt = (this.tick_cnt + 1) | 0; // Increment and convert to 32-bit.
};

