MEMORY
{
  FLASH (rx)      : ORIGIN = 0x08000000, LENGTH = 64K
  RAM (xrw)       : ORIGIN = 0x20001000, LENGTH = 16K
}

SECTIONS
{
  
  /* The first entries are the vectors */
  .isr_vector :
  {
    . = ALIGN(4);
    _entry = .;
    KEEP(*(.isr_vector)) /* .isr_vector is not referenced, this ensures it's kept and not optimised away */
  } >RAM

  /* Code defaults to .text section */
  .text :
  {
    . = ALIGN(4);
    *(.text)
  } >RAM
}

ENTRY(_entry)

