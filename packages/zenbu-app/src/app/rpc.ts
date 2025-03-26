import { hc } from "hono/client";
import { AppType } from "zenbu-plugin/";

// @ts-expect-error
export const pluginRPC = hc<AppType>("http://localhost:5001/");

