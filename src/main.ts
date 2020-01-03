#!/usr/bin/env node

import { downloadBinaries } from "ffbinaries";
import * as axios from "axios";
import * as program from "commander";
import { spawn } from "child_process";
import { parse } from "path";

program
  .arguments("<presetSpec> <inputFilePath>")
  .action(async (presetSpec: string, inputFilePath: string) => {
    await ensureBinaries();

    // presetSpec = will be [github username]/[repo]/[filename] but that must map to https://raw.githubusercontent.com/[github username]/[repo]/master/[filename]
    const [username, repo, filename] = presetSpec.split("/");
    const specUrl = `https://raw.githubusercontent.com/${username}/${repo}/master/${filename}`;

    const specContents: { args: string[] } = (await axios.default.get(specUrl))
      .data;

    const parsedFilename = parse(inputFilePath);

    const replacements = Object.entries({
      input: inputFilePath,
      inputFilename: parsedFilename.name,
      inputBasename: parsedFilename.base
    }).sort(([keyA], [keyB]) => {
      return keyB.length - keyA.length;
    });

    const args = specContents.args.map(arg =>
      replacements.reduce((argValue, [key, value]) => {
        return argValue.replace(`$${key}`, value);
      }, arg)
    );

    spawn("./.bin/ffmpeg", args, { stdio: "inherit" });
  });

program.parse(process.argv);

function ensureBinaries() {
  return new Promise(resolve => {
    downloadBinaries({ destination: "./.bin" }, () => resolve());
  });
}
