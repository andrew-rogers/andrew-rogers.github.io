#!/usr/bin/env python3

"""Global Position System (GPS) Coarse Acquisition (C/A) demo.

 The Standard Positioning Service (SPS) spec can be found at 
 https://www.navcen.uscg.gov/pubs/gps/sigspec/gpssps1.pdf

"""

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
import matplotlib.pyplot as plt
import qpsk

# Chip rate of PRBS
fc = 1.023e6

# The L1 carrier frequency
fc_L1 = 1540 * fc

# Sampling frequency four times L1
fs = 4 * fc_L1

def mls(poly) :

	# Start with all ones (size determined from poly)
	reg = poly
	start = 0
	while reg > 0 :
		start = start | reg
		reg = reg >> 1
	seq = [0]*start

	done = False
	reg = start
	l=0
	while done == False :
		if reg & 1 :
			seq[l] = 1
			reg = (reg >> 1) ^ poly
		else :
			reg = reg >> 1
		if reg == start :
			done = True
		l=l+1
	return seq[0:l]

def tryPolys(l=0) :
	for p in range(3,1024) :
		if l==0:
			print(f'poly={p} len={len(mls(p))}')
		else :
			if len(mls(p))==l :
				print(f'poly={p}')


# List all polynomials that give length 1023 sequences.
tryPolys(1023)

# GPS uses a GOLD code generated from two LFSRs. But for now we just use an
#  arbitrarily chosen length 1023 sequence.
c=mls(777)
print(c)

# The carrier would normally be BPSK modulated. For now we work with base-band.
tx=np.array(c)-0.5

txc=qpsk.cos(np.array(c),10,40)
rxc = txc + np.random.normal(0,1,len(txc)) # Add some noise.
rx = qpsk.quad_down(rxc, 10.1, 40, 0.8) # 1% Frequency shift the LO, simulate doppler shift.

# Rotate the signal to simulate out-of-sync
y=np.roll(rx,157)

# Use the FFT - IFFT method to get correlation
#
#           .-----.           .------.
# y(n) ---->| FFT |--->(x)--->| IFFT |---> m(n)
#           '-----'     ^     '------'
#                       |
#             .-----.   | C'(k)
#    c'(n)--->| FFT |---'
#             '-----'
#
#   Convolution in time domain is multiplication in frequency domain.
#   Correlation is the same as convolution but with one of the input vectors
#   flipped. The local PRBS is flipped and its FFT taken. This can be stored
#   for later use to avoid recalculation
#
C=np.fft.fft(np.flip(c)-0.5)
Y=np.fft.fft(y)
M=np.multiply(Y,np.roll(C,-102)) # Shift the FFTed PRBS to compensate for LO frequency error.
m=np.abs(np.fft.ifft(M))

# Plot to show peak occurs at the code phase error
fig, ax = plt.subplots(1,1)
ax.plot(m)
plt.show()



