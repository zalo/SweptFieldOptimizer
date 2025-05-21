# [SweptFieldOptimizer](https://crispy-adventure-qrr5ngk.pages.github.io/)

<p align="left">
  <a href="https://github.com/zalo/SweptFieldOptimizer/deployments/activity_log?environment=github-pages">
      <img src="https://img.shields.io/github/deployments/zalo/SweptFieldOptimizer/github-pages?label=Github%20Pages%20Deployment" title="Github Pages Deployment"></a>
  <a href="https://github.com/zalo/SweptFieldOptimizer/commits/main">
      <img src="https://img.shields.io/github/last-commit/zalo/SweptFieldOptimizer" title="Last Commit Date"></a>
  <a href="https://github.com/zalo/SweptFieldOptimizer/blob/master/LICENSE">
      <img src="https://img.shields.io/github/license/zalo/SweptFieldOptimizer" title="License: MIT"></a>
</p>

A testbed for designing new magnet configurations for stable open-loop magnetic levitation in 3D Space.

Search Terms to learn more: "Quadrupole Ion Trap", "Rotating Saddle", "Hamdi Ucar" 

 # Building

This demo can either be run without building (in Chrome/Edge/Opera since raw three.js examples need [Import Maps](https://caniuse.com/import-maps)), or built with:
```
npm install
npm run build
```
After building, make sure to edit the index .html to point from `"./src/main.js"` to `"./build/main.js"`.

 # Dependencies
 - [three.js](https://github.com/mrdoob/three.js/) (3D Rendering Engine)
 - [esbuild](https://github.com/evanw/esbuild/) (Bundler)
