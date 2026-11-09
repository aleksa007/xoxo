import { Config } from "@remotion/cli/config";

// Three.js needs WebGL. "angle" uses the GPU when one exists; in GPU-less
// containers/CI pass `--gl=swangle` (SwiftShader software rendering).
Config.setChromiumOpenGlRenderer("angle");
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(92);
Config.setOverwriteOutput(true);
Config.setConcurrency(1);
