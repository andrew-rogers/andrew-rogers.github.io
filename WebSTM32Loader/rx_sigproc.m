%
%    AudioUART
%    Copyright (C) 2019  Andrew Rogers
%
%    This program is free software; you can redistribute it and/or modify
%    it under the terms of the GNU General Public License as published by
%    the Free Software Foundation; either version 2 of the License, or
%    (at your option) any later version.
%
%    This program is distributed in the hope that it will be useful,
%    but WITHOUT ANY WARRANTY; without even the implied warranty of
%    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
%    GNU General Public License for more details.
%
%    You should have received a copy of the GNU General Public License along
%    with this program; if not, write to the Free Software Foundation, Inc.,
%    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
%

M=16; % 16 samples per bit

% Load the recorded signal
fp=fopen("sig_detect.vec")
  rx=fscanf(fp,"%f");
fclose(fp)

rx=rx(4500:5000);

% Just plot it
plot(rx);

% Low-pass filter to remove high frequency noise
pkg load signal
[b,a]=butter(2,1/M);
rxf=filter(b,a,rx);
hold on
plot(rxf);

% Edge detect filter
b=[1 -1]
rxe=M*filter(b,1,rxf);
plot(rxe);

% Create clean signal for STM32 USART bootloader NACK
nack=[ 1 1 1 0 1 1 1 1 1 0 0 0 1 1 1 1 1];
nack_sig=repelem(nack*2-1,1,M);
offset=75;
nack_sig=[ones(1,offset) nack_sig ones(1,length(rx)-length(nack_sig)-offset)];
plot(nack_sig);

legend({"Rx sig","Filtered","Edge detect","Clean NACK"});
