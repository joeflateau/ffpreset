#!/usr/bin/env node

import { downloadBinaries } from "ffbinaries";
import * as axios from "axios";
import * as program from "commander";
import { spawn } from "child_process";
import { parse } from "path";
import { flatMap } from "lodash";
import * as Debug from "debug";

import { IPresetFile } from "./lib/IPresetFile";
import { PresetRef } from "./lib/PresetRef";
import { childProcessPromise } from "./lib/childProcessPromise";
import { collect } from "./lib/collect";

const debug = Debug("ffpreset");

program
  .arguments("<presetRef> <inputFilePath>")
  .option("-r, --respawn", "restart process if it exists")
  .option("-V, --var <value>", "key value pairs to use in preset", collect, {})
  .action(async (presetRef: string, inputFilePath: string) => {
    const extraVars: Record<string, string> = program.var;
    const respawn: boolean = program.respawn;

    print({ extraVars, respawn });

    await ensureBinaries();

    // presetRef = will be [github username]/[repo?]/[filename] but that must map to https://raw.githubusercontent.com/[github username]/[repo]/master/[filename]
    const presetUrl = presetRefToUrl(presetRef);

    const presetContents = await downloadPresetFile(presetUrl);

    const args = getFfmpegArgs(presetContents, inputFilePath, extraVars);

    do {
      const ffmpegProcess = spawn("./.bin/ffmpeg", args, { stdio: "inherit" });
      await childProcessPromise(ffmpegProcess);
    } while (respawn);
  });

program.parse(process.argv);

function getFfmpegArgs(
  presetContents: IPresetFile,
  inputFilePath: string,
  extraVars: Record<string, string>
) {
  const parsedFilename = parse(inputFilePath);
  const replacements = Object.entries({
    input: inputFilePath,
    inputFilename: parsedFilename.name,
    inputBasename: parsedFilename.base,
    ...extraVars
  }).sort(([keyA], [keyB]) => {
    return keyB.length - keyA.length;
  });
  const args = flatMap(presetContents.args, arg =>
    typeof arg === "string" ? [arg] : arg
  ).map(arg =>
    replacements.reduce((argValue, [key, value]) => {
      return argValue.replace(`$${key}`, value);
    }, arg)
  );
  return args;
}

function presetRefToUrl(presetRef: string) {
  let { username, repo, filename, branch } = parsePresetRef(presetRef);
  if (!filename.includes(".")) {
    filename = filename + ".json";
  }
  return `https://raw.githubusercontent.com/${username}/${repo}/${branch}/${filename}`;
}

async function downloadPresetFile(presetUrl: string): Promise<IPresetFile> {
  return (await axios.default.get(presetUrl)).data;
}

function parsePresetRef(presetRef: string): PresetRef {
  const parts = presetRef.split("/");

  if (parts.length === 2) {
    const [username, filename] = parts;
    return { username, repo: "ffpresets", filename, branch: "master" };
  }
  if (parts.length === 3) {
    const [username, repo, filename] = parts;
    return { username, repo, filename, branch: "master" };
  }
  if (parts.length === 4) {
    const [username, repo, filename, branch] = parts;
    return { username, repo, filename, branch };
  }

  throw new Error("Could not parse preset ref");
}

function ensureBinaries() {
  return new Promise(resolve => {
    downloadBinaries({ destination: "./.bin" }, () => resolve());
  });
}

function print(...value: any[]) {
  debug(value.map(v => JSON.stringify(v)).join(" "));
}
