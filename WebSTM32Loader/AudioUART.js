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

var AudioUART = function(ondata) {

    this.ondata = ondata;

    this.bit_queue_tx=[];
    this.sample_cnt=0;
    this.samples_per_bit=16;
    this.sig_tx_val = 1;

    this.tail=this.samples_per_bit*11; // Number of samples to record after signal detect
    this.tail_cnt=0;
    this.buffers=[];

    this.lpf = new Biquad(0.008443, 0.016885, 0.008443, -1.723776, 0.757547); // TODO: Manage inverted signal (use neg. b coeffs.)
    this.edge_diff = new Differentiator();
    this.bpf = new Biquad(0.100000, 0.000000, -0.100000, -1.829281, 0.980100);
    this.delay = new Delay(this.samples_per_bit);

    // Clear the Rx data recovery state
    this.prev_clk = 0;
    this.prev_sig = 0;
    this.data_diff1 = 0;
    this.data_diff2 = 0;
    this.logic_level = 1;

    // State machine variables
    this.rx_state = 0;
    this.rx_cnt = 0;
    this.rx_data = 0;
    this.rx_parity = 0;
};

AudioUART.prototype.write = function(data) {
    var bit_queue = this.bit_queue_tx;
    for (var b=0; b<data.length; b++) {
        bit_queue.push(0); // Start bit
        var byte = data[b];
        var parity = 0;
        for (var n=0; n<8; n++) {
            var bit = (byte>>n) & 1;
            parity = parity + bit;
            bit_queue.push(bit); // Data bits
        }
        bit_queue.push(parity & 1); // Even parity bit
        bit_queue.push(1); // Stop bit
    }
};

AudioUART.prototype.processTx = function(output) {

    var sample_cnt = this.sample_cnt;
    var samples_per_bit = this.samples_per_bit
    var bit_queue = this.bit_queue_tx;

    var bit_cnt = 0;
    var sig_tx_val = this.sig_tx_val;

    // The sample loop
    for (var n = 0; n < output.length; n++) {

        if(sample_cnt==0) {

            // Get the next bit from bit queue
            var bit = 1;
            if(bit_cnt<bit_queue.length) bit = bit_queue[bit_cnt++]
            sig_tx_val = bit * 2.0 - 1.0; // TODO: Manage inverted signal
            sample_cnt = samples_per_bit;
        }
        sample_cnt--;

        output[n] = sig_tx_val;
    }

    this.sig_tx_val = sig_tx_val; // Save the current bit in case it has only been partly synthesised

    this.sample_cnt = sample_cnt;

    this.bit_queue_tx = bit_queue.slice(bit_cnt); // Remove the bits that have been converted from the queue
};

AudioUART.prototype.processRx = function(input) {
    var save=false;
    var threshold=0.05;

    var cnt=this.tail_cnt;

    for (var n=0; n<input.length; n++) {
        if (input[n]>threshold || input[n]<-threshold) cnt=this.tail;
        if (cnt>0) {
            save = true;
            cnt--;
        }
    }
    this.tail_cnt=cnt;
    if (save) {
        this.buffers.push(input);
    }
    else if (this.buffers.length>0) {
        buffers=this.buffers;
        this.processBuffers();
        this.buffers = [];
    }
};

AudioUART.prototype.processBuffers = function() {
    for (var b=0; b<this.buffers.length; b++) {

        // Low-pass filter received signal
        var rxf = this.lpf.processSamples(this.buffers[b]);

        // Edge detector and resonator
        var rxe = this.edge_diff.processSamples(rxf);
        for (var n=0; n<rxe.length; n++) rxe[n]=rxe[n]*rxe[n];
        rxe = this.bpf.processSamples(rxe);

        // Delay the low-pass filtered signal to allow resonator to stabilise
        rxf = this.delay.processSamples(rxf);

        // Down-sample the signal and get the logic level signal
        var logic_levels = this.downSample(rxe, rxf);

        // UART state machine
        var data = this.stateMachine(logic_levels);

        // Concatenate UART Rx objects into output array
        var out=this.out;
        for (var n=0; n<data.length; n++) {
            out.push(data[n]);
        }
    }
};

AudioUART.prototype.downSample = function(clk, sig) {
    var output=[];
    var threshold = 0.2;
    var data_diff = 0;

    for (var n=0; n<clk.length; n++) {

        // Detect falling zero-crossing of clock
        if (this.prev_clk >= 0 && clk[n] < 0) {

            // Differentiate signal to detect data changes
            data_diff = sig[n]-this.prev_sig;
            this.prev_sig=sig[n];

            // Centre of peaks have to be larger than a threshold and both side
            // values must be below half the amplitude of the centre
            var l = this.data_diff2;
            var c = this.data_diff1;
            var r = data_diff;
            var c2= c/2;
            if (c > threshold && c2 > l && c2 > r) this.logic_level = 1;
            else if (c < -threshold && c2 < l && c2 < r) this.logic_level = 0;

            // Update delay line
            this.data_diff2 = this.data_diff1;
            this.data_diff1 = data_diff;

            output.push(this.logic_level);
        }

        this.prev_clk = clk[n];

    }
    return output;
};

AudioUART.prototype.stateMachine = function(logic_levels) {
    var output=[];

    const STOP = 0;
    const START = 1;
    const DATA = 2;
    const PARITY = 3;
    const FE = 4;

    for (var n=0; n<logic_levels.length; n++) {
        var l=logic_levels[n];
        switch(this.rx_state) {

            case STOP:
                if(l==0) this.rx_state = START;
                break;

            case START:
                this.rx_cnt = 1;
                this.rx_data = l;
                this.rx_parity = l;
                this.rx_state = DATA;
                break;

            case DATA:
                if (l==1) {
                    this.rx_data = this.rx_data | (1<<this.rx_cnt);
                    this.rx_parity++;
                }
                this.rx_cnt++;
                if (this.rx_cnt>=9) this.rx_state = PARITY;
                break;

            case PARITY:
                out={data: this.rx_data & 0xff}; // Remove parity bit from data
                out.pe = false;
                out.fe = false;
                if ((this.rx_parity & 1) == 1) {
                    // Parity error
                    out.pe=true;
                 }
                if (l==1) this.rx_state = STOP;
                else {
                    // Framing error
                    this.rx_state = FE;
                    out.fe = true;
                }
                this.ondata(out); // Call the callback passed in the constructor
                break;

            case FE:
                if (l==1) this.rx_state = STOP;
                break;

            default:
                this.rx_state = FE;
        }
    } // Next logic level sample

    return output;
};

