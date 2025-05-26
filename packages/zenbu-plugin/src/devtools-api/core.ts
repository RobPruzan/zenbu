/**
 * define what we want to do, and how we can iterate on it without the model
 *
 * - server functions
 * - devtool script functions
 * - type safe communication between boundaries per project
 * - app level changes? Injects? Hm
 *
 *
 * more granular
 * - want to run arbitrary cli commands
 * - UI lib for devtools
 * - where will devtool live?
 * - in the app of course
 * -
 *
 *
 *
 * does the llm call it?
 *
 * yes its a library used
 *
 * the llm writes files which run in different environments
 *
 *
 * its just a lib to make the devtool stuff easy
 *
 * api's to make things you may want to do on the devtool level easy
 *
 * imperative mounts onto the editor?
 *
 * on/off states?
 *
 * each case handles state as a discriminated union
 *
 * sidebar({
 *  on: ...,
 *  off: ...
 * })
 *
 * preview({
 *  on: ...,
 *  off: ...
 * })
 *
 *
 * toolbar({
 *  on: ...,
 *  off: ...
 * })
 *
 *
 */

export const serverRPC = (stub: string, args: any[]) => {};

export const rpcUnpack = (stub: string, args: any[]) => {};
