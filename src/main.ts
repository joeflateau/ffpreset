#!/usr/bin/env node

import { downloadBinaries } from "ffbinaries";
import * as axios from "axios";
import * as program from "commander";
import { spawn } from "child_process";
import { parse } from "path";
import { parse as parseQs } from "qs";
import { flatMap } from "lodash";
import { IPresetFile } from "IPresetFile";

function collect(value: string, previous: Record<string, string>) {
  const parsed = parseQs(value);
  return { ...previous, ...parsed };
}

program
  .arguments("<presetRef> <inputFilePath>")
  .option("-V, --var <value>", "key value pairs to use in preset", collect, {})
  .action(async (presetRef: string, inputFilePath: string) => {
    await ensureBinaries();

    // presetRef = will be [github username]/[repo]/[filename] but that must map to https://raw.githubusercontent.com/[github username]/[repo]/master/[filename]
    const { username, repo, filename, branch } = parsePresetRef(presetRef);
    const presetUrl = presetRefToUrl(username, repo, filename, branch);

    const presetContents: IPresetFile = (await axios.default.get(presetUrl))
      .data;

    const parsedFilename = parse(inputFilePath);

    const extraVars: Record<string, string> = program.var;

    // print({ extraVars });

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

    spawn("./.bin/ffmpeg", args, { stdio: "inherit" });
  });

program.parse(process.argv);

function presetRefToUrl(
  username: string,
  repo: string,
  filename: string,
  branch: string
) {
  if (!filename.includes(".")) {
    filename = filename + ".json";
  }
  return `https://raw.githubusercontent.com/${username}/${repo}/${branch}/${filename}`;
}

function parsePresetRef(
  presetRef: string
): { username: string; repo: string; filename: string; branch: string } {
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

// function print(...value: any[]) {
//   console.error(value.map(v => JSON.stringify(v)).join(" "));
// }
