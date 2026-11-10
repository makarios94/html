import {Config} from '@remotion/cli/config';

// Lossless frames keep type edges clean before the H.264 encode. For fast previews pass --image-format=jpeg.
Config.setVideoImageFormat('png');
// Tag output as BT.709 so brand colours display the same in every player.
Config.setColorSpace('bt709');
Config.setOverwriteOutput(true);
Config.setEntryPoint('src/index.ts');
// new_project.py appends a setBrowserExecutable line here if the bundled headless browser cannot be downloaded.
