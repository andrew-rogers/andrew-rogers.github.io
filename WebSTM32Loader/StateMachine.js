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

StateMachine = function() {
    this.states = {};
    this.c_state = null;
};

StateMachine.prototype.addTransition = function(st_src, e, st_dst, callback) {
    var state = this.states[st_src] || this.newState(st_src);
    var next_state = this.states[st_dst] || this.newState(st_dst);

    state.on(e, next_state, callback);

    // Assume source state of first transition is the initial state
    if(this.c_state==null)this.c_state=state;
};

StateMachine.prototype.newState = function(name) {
    var state = {sm: this, handlers: []};
    this.states[name]=state;

    // Give the state an event registration method
    state.on = function(e, next_state, callback) {
        state.handlers[e] = {next_state: next_state, callback: callback};
    };

    // Give the state an event handling method
    state.event = function(e) {
        var handler = state.handlers[e];
        if(handler) {
            if(handler.callback) handler.callback.apply(this, arguments);
            return handler.next_state;
        }
        else return state;      
    };

    return state;
};

StateMachine.prototype.event = function() {
    this.c_state = this.c_state.event.apply(this, arguments);
};

