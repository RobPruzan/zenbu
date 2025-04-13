import { hc } from "hono/client";
import { AppType } from "zenbu-plugin/";
import { DaemonAppType } from "zenbu-daemon";
import { Hono } from "hono";
import { BlankEnv, BlankSchema } from "hono/types";

export const pluginRPC = hc<AppType>("http://localhost:5001/");


// bug in tsc: Type instantiation is excessively deep and possibly infinite.ts(2589)
// but reproduces on hello world def, but not when directly referencing the type
// export const daemonRPC = hc<DaemonAppType>("http://localhost:40000/")

// type Fuck<T extends Hono<BlankEnv, BlankSchema, "/">> = T // Removed

// type why = Fuck<DaemonAppType> // Removed
  