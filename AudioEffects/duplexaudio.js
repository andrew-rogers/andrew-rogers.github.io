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

var DuplexAudio=function(buffer_size, callback_init, callback_process_samples) {
    this.buffer_size = buffer_size;
    this.callback_init = callback_init;
    this.callback_process_samples = callback_process_samples;

    navigator.getUserMedia = (navigator.getUserMedia ||
                            navigator.webkitGetUserMedia ||
                             navigator.mozGetUserMedia ||
                             navigator.msGetUserMedia);

    var constraints = { video: false, audio: true };
    var that = this;
    navigator.getUserMedia(constraints, function(media) {that.initialiseAudioGraph(media);}, function(err) {
        // errorCallback
        console.log("getUserMedia(): " + err);
    });

    this.audioCtx = new AudioContext();
    this.source = null;
    this.spn = null;
};

DuplexAudio.prototype.initialiseAudioGraph=function(media) {
    this.source = this.audioCtx.createMediaStreamSource(media);
    
    // Create the ScriptProcessorNode
    this.spn = this.audioCtx.createScriptProcessor(this.buffer_size, 1, 1);

    var that = this;
    this.spn.onaudioprocess = function(e) {
        var channel = 0;
        var input = e.inputBuffer.getChannelData(channel);
        var output = e.outputBuffer.getChannelData(channel);
        that.callback_process_samples(input, output);
    }

    this.callback_init(media);
};

DuplexAudio.prototype.start = function() {
    this.source.connect(this.spn);
    this.spn.connect(this.audioCtx.destination);
};

DuplexAudio.prototype.stop = function() {
    this.source.disconnect(this.spn);
    this.spn.disconnect(this.audioCtx.destination);
};

