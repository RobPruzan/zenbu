import * as esbuild from "esbuild";

/**
 * A hacky plugin to build the worker file (resolving all imports), and inline
 * the javascript into a variable by replacing __WORKER_CODE__ string in bundle with the worker
 * build output
 */
export const workerPlugin = {
  name: "worker-plugin",
  setup(build: any) {
    console.log("i run");

    const workerResult = esbuild.buildSync({
      entryPoints: ["src/dom-to-png.worker.js"],
      bundle: true,
      write: false,
      format: "iife",
      platform: "browser",
      minify: true,
    });
    const workerCode = workerResult.outputFiles[0].text;

    build.onEnd((result: any) => {
      if (!result.outputFiles) return;

      for (const file of result.outputFiles) {
        console.log("sup", file.text.includes("__WORKER_CODE__"));
        console.log("yippy?", !!workerCode);

        const newText = file.text.replace(
          'var __WORKER_CODE__ = "";',
          `var __WORKER_CODE__ = ${JSON.stringify(workerCode)};`
        );
        console.log('new text?', newText.includes(workerCode));
        
        file.contents = Buffer.from(newText);
      }
    });
  },
};
