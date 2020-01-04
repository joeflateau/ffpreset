import { ChildProcess } from "child_process";

export async function childProcessPromise(process: ChildProcess) {
  await new Promise((resolve, reject) => {
    process.on("exit", code => {
      if (code === 0) {
        return resolve();
      }
      return reject(`Exited with non-zero code ${code}`);
    });
  });
}
