---
layout: ../layouts/Base.astro
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
The library provides a (mostly) safe interface for making dynamic user-defined ffi calls at runtime with minimal overhead.
It currently is used by [Miri](https://github.com/rust-lang/miri), [deno](https://deno.com/), and [RustPython](https://rustpython.github.io/), among other projects.

Much of the remaining work is making this library actually safe to use across the many supported architectures.

- [Repo](https://github.com/libffi-rs/libffi-rs)


## VSLAM in FRC

Integration of VSLAM on a FRC robot for enhanced localization abilities.
VSLAM (Visual SLAM) is a technology that uses points of contrast in images to track the position of the camera within the environment.
The technology for this was provided by NVIDIA and an Intel Realsense camera was used for stereo camera input (which allowed for depth perception, interestingly enough).
The VSLAM computations were running in conjunction with April Tag detection on an Orin Nano running ROS 2 (Robot Operating System 2).

I developed a sub-millisecond latency communication system to fuse the April Tag and the VSLAM localization data before sending it to the main processor to be used.

This method seems to have gained some traction in the community; I see teams starting to use visual technology on the Orin.

- [Blog Post](https://pixelators.org/blog/2024_05_25_orin_coprocessor/)
- [Repo](https://github.com/Pixelators4014/pixelization_rs)

# Finished Projects

Projects that have reached an end-state. Research in pre-print or publication can be found in the [publications page](/publications).

## Prontus

A custom frontend (desktop app) written in Rust and Tauri for https://pronto.io.
It involved reverse-engineering pronto's http and websocket API.

This went quite well back in its day. Nowadays, however, it has become trivial to slop up a new pronto frontend in a weekend, making this project quite obsolete.

- [Repo](https://github.com/arihant2math/prontus/)

## Traffic Detection from CCTV footage
Trained YOLOv8 to optimally detect cars via pre-installed CCTV on highways to calculate traffic flow in various areas.

- [Final Report](https://raw.githubusercontent.com/arihant2math/msb_final_project/master/MSB%20Final%20Report.pdf)
- [Repo](https://github.com/arihant2math/msb_final_project)
