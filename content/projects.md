---
title: "Projects"
---
# Traffic Detection from CCTV footage
Train YOLOv8 to optimally detect cars via pre-installed CCTV on highways to calculate traffic flow in various areas.

- [Final Report](https://raw.githubusercontent.com/arihant2math/msb_final_project/master/MSB%20Final%20Report.pdf)
- [Repository](https://github.com/arihant2math/msb_final_project)

# VSLAM in FRC
Integration of VSLAM on a FRC robot for enhanced localization ablities.
VSLAM is a technology that uses points of contrast in an enviorment to track the position of the camera within the enviorment.
The technology for this was provided by NVIDIA and an Intel Realsense camera was used for stereo camera input.
The VSLAM computations were running in conjunction with April Tag detection on an Orin Nano runnin ROS 2 (Robot Operating System 2).

I developed a sub-millisecond latency communication system to fuse the April Tag and the VSLAM localization data before sending it to the main processor to be used.

- [Blog Post](https://pixelators.org/blog/2024_05_25_orin_coprocessor/)
- [Repository](https://github.com/Pixelators4014/pixelization_rs)

# Prontus
A custom frontend written in Rust and Tauri for https://pronto.io.

- [Repository](https://github.com/arihant2math/prontus/)
