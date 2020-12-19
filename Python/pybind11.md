# Creating a Python module from C++ functions using pybind11

## Creating the pybind11 bindings source file

Create the file my_module.cpp which is mostly copied from the [pybind11 documentation](https://pybind11.readthedocs.io/en/stable/basics.html) but with a few extras added.
```
#include <pybind11/pybind11.h>
#include <pybind11/numpy.h>

namespace py = pybind11;

py::array_t<double> add_arrays(py::array_t<double> input1, py::array_t<double> input2) {
    py::buffer_info buf1 = input1.request(), buf2 = input2.request();

    if (buf1.ndim != 1 || buf2.ndim != 1)
        throw std::runtime_error("Number of dimensions must be one");

    if (buf1.size != buf2.size)
        throw std::runtime_error("Input shapes must match");

    /* No pointer is passed, so NumPy will allocate the buffer */
    auto result = py::array_t<double>(buf1.size);

    py::buffer_info buf3 = result.request();

    double *ptr1 = static_cast<double *>(buf1.ptr);
    double *ptr2 = static_cast<double *>(buf2.ptr);
    double *ptr3 = static_cast<double *>(buf3.ptr);

    for (size_t idx = 0; idx < buf1.shape[0]; idx++)
        ptr3[idx] = ptr1[idx] + ptr2[idx];

    return result;
}

float add(float a, float b)
{
    return a+b;
}

py::array_t<double> half_length(py::array_t<double> input)
{
    py::buffer_info buf = input.request();
    auto result = py::array_t<double>(buf.size);
    py::buffer_info ret = result.request();
    
    double *ptr1 = static_cast<double *>(buf.ptr);
    double *ptr2 = static_cast<double *>(ret.ptr);
    
    for (size_t i = 0; i < buf.shape[0]; i++)
    {
        ptr2[i] = ptr1[i];
        ptr1[i] = 0.0;
    }
        
    result.resize({buf.shape[0]/2});
    
    return result; 
}

PYBIND11_MODULE(my_module, m)
{
    m.def("add", &add, "Add two numbers");
    m.def("add_arrays", &add_arrays, "Add two NumPy arrays");
    m.def("half_length", &half_length, "Return first half of array and set input array to zeros");
}
```

## Building for GNU/Linux

Install required packages

```
$ python -m pip install pybind11
$ python -m pip install numpy
```

To build the python extension module

```
$ c++ -O3 -Wall -shared -std=c++11 -fPIC `python3 -m pybind11 --includes` my_module.cpp -o my_module`python3-config --extension-suffix`
```


## Building for Windows

Install [MSYS2](https://www.msys2.org/)

Install required packages using pacman from within MSYS2 command window

```
$ pacman -S mingw-w64-x86_64-pybind11
$ pacman -S mingw-w64-x86_64-python
$ pacman -S mingw-w64-x86_64-gcc
$ pacman -S mingw-w64-x86_64-python-numpy
```

To build the python extension module

```
$ g++ -shared -std=c++11 -fPIC -I /mingw64/include/python3.8 -L /mingw64/lib my_module.cpp -o my_module.pyd -lpython3.8.dll
```

## Testing

```
#!/usr/bin/env python

import my_module as mm

s=mm.add_arrays([4,5],[3,2])
print(s)
```

