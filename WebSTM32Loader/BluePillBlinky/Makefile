
CC = arm-none-eabi-gcc
LD = arm-none-eabi-ld
OBJDUMP = arm-none-eabi-objdump
OBJCOPY = arm-none-eabi-objcopy

all: blinky.hex blinky.dasm

blink.o: blink.c
	$(CC) -O0 -c -g -mcpu=cortex-m3 -mthumb -o $@ $<

blinky.elf: blink.o
	$(LD) -Tstm32_bp_ram.ld -o $@ $^

blinky.hex: blinky.elf
	$(OBJCOPY) -O ihex $< $@
	cat $@ | tr -d '\r' | sed 's/:/":/' | sed 's/$$/\\n" +/'

blinky.dasm: blinky.elf
	$(OBJDUMP) -dS $< > $@

clean:
	rm -f blinky.elf blinky.hex blinky.dasm blink.o

