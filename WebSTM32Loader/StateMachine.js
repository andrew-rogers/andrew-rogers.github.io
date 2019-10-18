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

StateMachine = function(states) {
    this.states = [];
    this.c_state = null;

    // Add all the states and assume the first state is the initial state.
    if (states.length > 0) {
        for (var n=0; n<states.length; n++) this.addState(states[n]);
        this.c_state = states[0];
    }
};

StateMachine.prototype.addState = function(state) {
    state.sm = this;
    state.id = this.states.length;
    state.handlers = [];

    // Give the state an event registration method
    state.on = function(e, next_state, callback) {
        state.handlers[e] = {next_state: next_state, callback: callback};
    };

    // Give the state an event handling method
    state.event = function(e) {
        var handler = state.handlers[e];
        if(handler) {
            if(handler.callback) handler.callback();
            return handler.next_state;
        }
        else return state;      
    };
    
    this.states.push(state);
};

StateMachine.prototype.event = function(e) {
    this.c_state = this.c_state.event(e);
};

