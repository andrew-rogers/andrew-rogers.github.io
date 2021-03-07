#!/usr/bin/env python3

""" QPSK functions. """

# Copyright (c) 2021 Andrew Rogers
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in
# all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
# THE SOFTWARE.

import numpy as np
from scipy.signal import resample_poly

def modulate( data, cfr, osr ) :
	""" Quadrature modulation - QPSK."""

	# Split data into I and Q
	# TODO
	
	# Interpolate I and Q
	I = resample_poly( I-0.5, osr, 1)
	
	# Multiply by cos and sin
	
	# Add
	#return c+s
	
def quad_down( sig, cfr, osr, phase=0 ) :
	""" Quadrature down conversion. """
	
	# Multiply by complex LO
	w = 2 * np.pi * cfr / osr
	theta = w * np.arange( len(sig) )
	bb = sig * np.exp(-1j * theta)
	
	# Decimate (and LPF) complex baseband signal
	bb = resample_poly( bb, 1, osr )
	
	return bb
	
def cos( data, cfr, osr ) :
	""" Cosine modulate only - BPSK."""
	
	# Interpolate I
	I = resample_poly( data-0.5, osr, 1)
	
	# Multiply by cos
	w = 2 * np.pi * cfr / osr
	theta = w * np.arange( len(I) )
	c = np.multiply( I, np.cos(theta) )
	
	return c

