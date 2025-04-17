![Under Construction](https://img.shields.io/badge/🚧-Under%20Construction-yellow?style=for-the-badge)
# What is this?

Making a website should feel as easy as making a markdown file

![Uploading image.png…]()






# Architecture
<img width="733" alt="image" src="https://github.com/user-attachments/assets/b16029ef-2251-4679-869b-a43024cb3db6" />


  
# Roadmap

- [ ] Context from devtools (react scan, inspector, network, console)
- [ ] Tldraw directly overlaid on website and screenshot provided to model
- [ ] Screen sharing + video editing, pass to gemini
- [ ] Better gemini codebase indexer (fully implement chunk codebase into geminis to feed into query gemini)
- [ ] Modify styles on an element with AI apply
- [ ] Plugin to add source location to components (sentry style)
- [ ] Gemini semantic search
- [ ] Experiments- optionally ask the model to write all UI in an experiments project. you can view the experiment through an iframe directly on the zenbu website
- [ ] Reasoner debugger tool
- [ ] Automated tests via raw simulated events
- [ ] Code runner tool (exec in browser)
- [ ] Rrweb always on recorder for bugs, replayer in browser, playright setup to convert to video if providing to model as context
- [ ] Gemini/4o imagegen to remix components + feed to model
- [ ] Type checker (use tsgo when tsx supported)
- [ ] Inspector tool that's not based on element boundingRect
  - Should be able to create arbitrary rects
  - Intersecting rects have their file path included in context when providing to model
- [ ] Generalize plugin setup (hardcoded on examples/iframe-website)
- [ ] Synthetic anthropic text edit tool to swap models when editing + stream code when running tool
- [ ] Fix multi file edits
- [ ] Better prompt caching
- [ ] Diff viewier in browser
- [ ] Source viewer in browser
  - Must at least support ts lsp
- [ ] Migrate plugin server to Effect
- [ ] Editable buffers in browser
  - Vim mode required
- [ ] Expose MCP's for all data so accessible in cursor
- [ ] Implement file mutexes when multithreading models
  - Semantic mutex is more optimal
- [ ] auto detect runtime error modals, fix in chat and provide context automatically
- [ ] "why is this slow" mode
- [ ] neovim in browser
- [ ] window manager for debugging multiplayer apps
- [ ] quick chat in command menu
- [ ] code exec in command menu with TS + LSP support
- [ ] cookie viewier using local server that reads cookies
- [ ] http client
- [ ] WS client
- [ ] open page in editor
- [ ] open component in editor
- [ ] record area
- [ ] remix area
- [ ] explain area
- [ ] find area
- [ ] plugin system for browser utils
- [ ] "new project" cli + global manager for quick switching + prewarming dev servers for instant switches
- [ ] auto port scanning to find projects
