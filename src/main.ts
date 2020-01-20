#!/usr/bin/env node

import { downloadBinaries } from "ffbinaries";
import * as program from "commander";
import { spawn } from "child_process";
import { parse } from "path";
import { flattenDeep } from "lodash";
import * as Debug from "debug";

import { IPresetFile } from "./lib/IPresetFile";
import { childProcessPromise } from "./lib/childProcessPromise";
import { collect } from "./lib/collect";
import { sleep } from "./lib/sleep";
import { getPresetFromRef } from "./lib/PresetRef";

const debug = Debug("ffpreset");

program
  .arguments("<presetRef> [inputFilePath...]")
  .option("-r, --respawn", "restart process if it exists")
  .option("-V, --var <value>", "key value pairs to use in preset", collect, {})
  .action(async (presetRef: string, inputFilePaths: string[]) => {
    const extraVars: Record<string, string> = program.var;
    const respawn: boolean = program.respawn;

    print({ presetRef, inputFilePaths, extraVars, respawn });

    await ensureBinaries();

    const presetContents = await getPresetFromRef(presetRef);

    do {
      for (let inputFilePath of inputFilePaths) {
        const args = getFfmpegArgs(presetContents, inputFilePath, extraVars);

        try {
          const ffmpegProcess = spawn("./.bin/ffmpeg", args, {
            stdio: "inherit"
          });
          await childProcessPromise(ffmpegProcess);
        } catch (err) {
          debug(err);
        }
      }

      if (respawn) {
        await sleep(2000);
      }
    } while (respawn);
  });

program.parse(process.argv);

function getFfmpegArgs(
  presetContents: IPresetFile,
  inputFilePath: string,
  extraVars: Record<string, string>
) {
  const parsedFilename = parse(inputFilePath);

  const replacements = {
    ...presetContents.vars,
    input: inputFilePath,
    inputFilename: parsedFilename.name,
    inputBasename: parsedFilename.base,
    ...extraVars
  };

  const args = flattenDeep(presetContents.args).map(arg => {
    arg.replace(
      /\$([a-zA-Z_]+[a-zA-Z0-9_]*)|\$\{([a-zA-Z_]+[a-zA-Z0-9_]*)\}/,
      (_, m1, m2) => {
        const variable = m1 ?? m2;
        if (!(variable in replacements)) {
          throw new Error(`unbound variable ${variable}`);
        }
        return replacements[variable];
      }
    );
    return arg;
  });
  return args;
}

function ensureBinaries() {
  return new Promise(resolve => {
    downloadBinaries({ destination: "./.bin" }, () => resolve());
  });
}

function print(...value: any[]) {
  debug(value.map(v => JSON.stringify(v)).join(" "));
}
