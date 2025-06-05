import { hc } from "hono/client";
import { AppType } from "zenbu-plugin/";
import { Hono } from "hono";
import { BlankEnv, BlankSchema } from "hono/types";
import { DaemonAppType } from "zenbu-daemon";

export const pluginRPC = hc<AppType>("http://localhost:5001/");

/**
 * you must think why are we using an rpc to communicate to the daemon when its on the same device?
 * we may want to deploy the next server to a public URL, and keeping a network boundary
 * allows us to deploy the next server on a serverless platform
 */
export const daemonRPC = hc<DaemonAppType>("http://localhost:40000/");
