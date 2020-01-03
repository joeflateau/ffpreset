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
    const { username, repo, filename } = parsePresetSpec(presetSpec);
    const specUrl = specToUrl(username, repo, filename);

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

function specToUrl(username: string, repo: string, filename: string) {
  if (!filename.includes(".")) {
    filename = filename + ".json";
  }
  return `https://raw.githubusercontent.com/${username}/${repo}/master/${filename}`;
}

function parsePresetSpec(
  presetSpec: string
): { username: string; repo: string; filename: string } {
  const parts = presetSpec.split("/");

  if (parts.length === 2) {
    const [username, filename] = parts;
    return { username, repo: "ffpresets", filename };
  }
  if (parts.length === 3) {
    const [username, repo, filename] = parts;
    return { username, repo, filename };
  }

  throw new Error("Could not parse preset spec");
}

function ensureBinaries() {
  return new Promise(resolve => {
    downloadBinaries({ destination: "./.bin" }, () => resolve());
  });
}
