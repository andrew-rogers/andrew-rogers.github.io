M=16; % 16 samples per bit

% Load the recorded signal
fp=fopen("sig_rx.vec")
  rx=fscanf(fp,"%f");
fclose(fp)

% Just plot it
plot(rx);

% Low-pass filter to remove high frequency noise
pkg load signal
[b,a]=butter(2,1/M);
rxf=filter(b,a,rx);
hold on
plot(rxf);
