import * as axios from "axios";
import { readFile } from "fs-extra";
import { IPresetFile } from "./IPresetFile";

export async function getPresetFromRef(
  presetRef: string
): Promise<IPresetFile> {
  let presetUrl = presetRef;
  if (!presetUrl.includes(":")) {
    presetUrl = presetRefToUrl(presetUrl);
  }
  const presetContents = await downloadPresetFile(presetUrl);
  return presetContents;
}

function presetRefToUrl(presetRef: string) {
  let { username, repo, filename, branch } = parsePresetRef(presetRef);

  if (!filename.includes(".")) {
    filename = filename + ".json";
  }
  return `https://raw.githubusercontent.com/${username}/${repo}/${branch}/${filename}`;
}

async function downloadPresetFile(presetUrl: string): Promise<IPresetFile> {
  if (presetUrl.startsWith("file:")) {
    const filePath = presetUrl.substring("file:".length);
    const fileContents = await readFile(filePath, "utf8");
    return JSON.parse(fileContents);
  }
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

export interface PresetRef {
  username: string;
  repo: string;
  filename: string;
  branch: string;
}
