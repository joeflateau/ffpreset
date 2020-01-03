# ffpreset

This tool allows you to create and distribute easy to use video encoding presets for ffmpeg.

This tool will install the ffmpeg binary using `ffbinaries`. You do not need to manually download/install ffmpeg.

## Example usage:

`npx ffpreset <presetRef> <videoFile>`

**presetRef** is a reference to a file in a git repo, it has three parts: username, repo, filename. For example: `joeflateau/ffpresets/my-preset.json`. That gets translated to `https://raw.githubusercontent.com/joeflateau/ffpresets/master/my-preset.json`. You can omit the repo name, in which case the default of `ffpresets` will be used. You can also omit the file extension in which case the default of `.json` will be used. For example: `joeflateau/ffpresets/simple-example.json` and `joeflateau/simple-example` are equivalent. 

## An example of a preset:

```json
{
  "args": [
    "-i", "$input",
    "-c:v", "libx264",
    "-c:a", "aac",
    "-profile:v", "main",
    "-b:v", "1200k", 
    "-b:a", "64k",
    "-vf", "scale=1280:-1",
    "-f", "mp4", "$inputFilename-compressed.mp4",
    "-y"
  ]
}
```

These args have replacements substituted and are passed to the ffmpeg binary. There are currently 3 replacements you can use in your preset: `$input`, which is the fill path to the video file; `$inputFilename` which is just the name of the video file without the directory or extension; and `$inputBasename` which is the filename with the extension but without the directory.


## Full usage example:

`npx ffpreset joeflateau/ffpresets/my-preset.json ~/Downloads/my-video-file.mp4`