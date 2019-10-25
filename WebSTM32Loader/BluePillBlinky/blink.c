/*
    WebSTM32Loader - Blink LED on PC13 of Blue Pill Board
    Copyright (C) 2019  Andrew Rogers

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/

#include <stdint.h>

void startup();

uint32_t* isr_vectors[2] __attribute__ ((section(".isr_vector")))= {
    (uint32_t *) 0x20001000, /* Stack */
    (uint32_t *) startup     /* Reset handler */
};

void delay(int ms)
{
    int i,j;
    for (i=0; i<ms; i++)
    {
        for (j=0; j<568; j++)
        {
            __asm("nop");
        }
    }
}

typedef struct {
    uint32_t r0,r1,r2,r3;
    uint32_t r4,r5,RCC_APB2ENR,r6;
} RCC_t;

#define RCC ((RCC_t *) 0x40021000)
#define IOPCEN (1<<4)

typedef struct {
    uint32_t RL,CRH,r2,ODR;
} GPIO_t;

#define GPIOC ((GPIO_t*) 0x40011000)


void startup()
{
    RCC->RCC_APB2ENR |= IOPCEN; /* Enable GPIOC clock */
    GPIOC->CRH = 0x44144444;    /* PC13 output push-pull */
    while(1)
    {
        GPIOC->ODR ^= 1<<13;
        delay(100);
    };
}

