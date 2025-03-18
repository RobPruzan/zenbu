import { validator } from 'hono/validator';
import { MiddlewareHandler, Env } from 'hono';

// Define the shim function with a single type parameter
export const shim = <T>(): MiddlewareHandler<
  Env,
  string,
  { in: { json: T }; out: { json: T } }
> => {
  return validator('json', async (value, c) => {
    // Assert the incoming value as type T and pass it through
    const data = value as T;
    return data;
  });
};