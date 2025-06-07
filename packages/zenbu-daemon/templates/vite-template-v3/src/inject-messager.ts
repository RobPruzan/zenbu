/**
 * will be used for the model to on a path, which will allow us to communicate with the main
 * app
 *
 * hm what should it do
 *
 * i guess it just needs to be an idempotent socket client?
 *
 *
 * honestly it doesn't even need to be a socket, it can just be a fetch which works
 * better ngl
 *
 * send it to the ingest, then the ingest handles pushing with the websocket
 *
 *
 */

// const ingestUrl = "http://localhost:6001/ingest";
// export const sendMessage = async (name: string, data: any) => {
//   const res = await fetch(ingestUrl, {
//     method: "POST",
//     body: JSON.stringify({
//       name,
//       data,
//     }),
//   });
//   return res.json();
// };
