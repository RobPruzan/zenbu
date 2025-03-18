import { validator } from "hono/validator";
import { MiddlewareHandler, Env } from "hono";

export const shim = <T>(): MiddlewareHandler<
  Env,
  string,
  { in: { json: T }; out: { json: T } }
> => {
  return validator("json", async (value, c) => {
    const data = value as T;
    return data;
  });
};
