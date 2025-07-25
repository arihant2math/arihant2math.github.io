---
title: "Projects"
---

Most of my projects are on my GitHub profile: https://github.com/arihant2math.

A few other organizations have projects that I created/maintain:
- https://github.com/libffi-rs/
- https://github.com/Pixelators4014/
- https://github.com/The-Knights-of-Ni/
- https://github.com/ApesofWrath

# Open Source

## libffi-rs

I maintain libffi-rs: bindings for the libffi C library.
The library provides a (mostly) safe interface for making dynamic user-defined ffi calls at runtime with minimal overhead. It currently has over 1 million downloads.

- [Repository](https://github.com/libffi-rs/libffi-rs)


## VSLAM in FRC
Integration of VSLAM on a FRC robot for enhanced localization ablities.
VSLAM (Visual SLAM) is a technology that uses points of contrast in an enviorment to track the position of the camera within the enviorment.
The technology for this was provided by NVIDIA and an Intel Realsense camera was used for stereo camera input.
The VSLAM computations were running in conjunction with April Tag detection on an Orin Nano runnin ROS 2 (Robot Operating System 2).

I developed a sub-millisecond latency communication system to fuse the April Tag and the VSLAM localization data before sending it to the main processor to be used.

- [Blog Post](https://pixelators.org/blog/2024_05_25_orin_coprocessor/)
- [Repository](https://github.com/Pixelators4014/pixelization_rs)

## Prontus
A custom frontend (desktop app) written in Rust and Tauri for https://pronto.io.

- [Repository](https://github.com/arihant2math/prontus/)

# Research

More research can be found in the publications page.

## Traffic Detection from CCTV footage
Trained YOLOv8 to optimally detect cars via pre-installed CCTV on highways to calculate traffic flow in various areas.

- [Final Report](https://raw.githubusercontent.com/arihant2math/msb_final_project/master/MSB%20Final%20Report.pdf)
- [Repository](https://github.com/arihant2math/msb_final_project)
