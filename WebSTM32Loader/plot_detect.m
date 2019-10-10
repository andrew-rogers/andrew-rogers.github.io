fp=fopen("sig_detect.vec")
  det=fscanf(fp,"%f");
fclose(fp)

plot(det);
