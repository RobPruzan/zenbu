import { hc } from "hono/client";
import { AppType } from "zenbu-plugin/";

export const pluginRPC = hc<AppType>("http://localhost:5001/");

