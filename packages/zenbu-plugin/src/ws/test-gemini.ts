// Make sure to include the following import:
import {
  createPartFromUri,
  createUserContent,
  GoogleGenAI,
} from "@google/genai";
import path from "path";
import fs from "fs/promises";
import { FileState } from "@google/generative-ai/server";
import { GoogleAIFileManager } from "@google/generative-ai/server";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

console.log('uploading...');

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
console.log('instance made');

let myfile = await ai.files.upload({
  file: path.join(
    "/Users/robby/zenbu/packages/zenbu-plugin/.zenbu/video/vid-1744158343309-K8J4VKAZrUQvdE4DfGz8j.webm"
  ),
  config: { mimeType: "video/webm" },
});
console.log("Uploaded video file:", myfile);

// Poll until the video file is completely processed (state becomes ACTIVE).
while (!myfile.state || myfile.state.toString() !== "ACTIVE") {
  console.log("Processing video...");
  console.log("File state: ", myfile.state);
  await sleep(1000);
  myfile = await ai.files.get({ name: myfile.name! });
}

const result = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: createUserContent([
    createPartFromUri(myfile.uri!, myfile.mimeType!),
    "Describe this video clip",
  ]),
});
console.log("result.text=", result.text);
