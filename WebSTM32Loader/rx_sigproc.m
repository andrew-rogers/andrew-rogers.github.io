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
fp=fopen("sig_rx.vec")
  rx=fscanf(fp,"%f");
fclose(fp)

rx=rx/32767;



% Low-pass filter to remove high frequency noise
pkg load signal
[b,a]=butter(2,1/M);
printf("LPF coeffs = [ %f, %f, %f, %f, %f ]\n",b(1),b(2),b(3),a(2),a(3));
rxf=filter(b,a,rx);
hold on

% Edge detect filter
b=[1 -1] % Differentiator
rxe=M*filter(b,1,rxf);

b=[0.1 0 -0.1] % BPF
w=2*pi*1/M;
a=poly(0.99*exp(i*[w -w])); % High Q factor
rxe=filter(b,a,rxe.^2);


% Delay LPFed signal to allow edge detect filter to have good amplitude
rxf=[zeros(M,1); rxf];


% Resample on negative zero-crossing of edge detector
rx_dec=zeros(1,length(rxe));
k=1;
prev=0;
for n=2:length(rxe)
  if rxe(n-1)>=0 && rxe(n)<0
    rx_dec(k)=rxf(n)-prev; % Differential to get peaks for transitions
    prev=rxf(n);
    k=k+1;
  endif
endfor
rx_dec=rx_dec(1:k-1);

% Search peaks and flip logic level accordingly
% Centre of peaks have to be larger than a threshold and both side values must
%  be below half the amplitude of the centre
ll=1;
data=ones(1,length(rx_dec));
threshold=0.2;
for n=3:length(rx_dec)
  l=rx_dec(n-2);
  c=rx_dec(n-1);
  r=rx_dec(n);
  c2=c/2;
  if c > threshold && c2 > l && c2 > r
    ll=1;
  elseif c < -threshold && c2 < l && c2 < r
    ll=0;
  endif
  data(n)=ll;
endfor




% --------------- Plot waveforms ----------------
plot(rx)
hold on
plot(rxf)
plot(rxe)

% Interpolate data for plotting
data_int=repelem(data,1,M);
plot(data_int(76:end))

legend({"Rx sig","Filtered","Edge detect","Data"});
