# What is this?

Zenbu's goal is to remove the friction a developer has when making a website.
Specifically, Zenbu wants to:

**Improve bad devtool experience**
  - Console crashes when trying to search over too many logs
  - Network panel only records when its open
  - Hard to interpret/debug network panel
  - Low signal metrics in performance panel
  - Minified JS in source panel/source maps are not always reliable
  - Hard to interpret
    
**Give models the same tools an experienced developer would use**
  - Models should be able to see all data exposed via chrome devtools
  - Models should be able to see video of the website
  - Models should be able to run code in the browser
    
**Improve developer expressability with models**
  - Tldraw overlaid to express what you want something to look like
  - Record a section of a website when describing bugs to model

**Bridge AI web generation tools and local development**
  - Remote website builders (v0, lovable, bolt) all perform edits on file systems that are not yours
  - Zenbu writes directly to your file system, there is no syncing needed
  - Zenbu works on all projects you have ever written immedietely, no upload needed
  - Zenbu exposes all data collected via an MCP server, you are not locked in to using zenbu
    
**Be quiet when not needed**
  - Zenbu is hidden when not being used

**Be extremely clear what's happening**
  - Tools like cursor hide prompts from you, limiting your ability to understand what the model knows and how you should interact with it
  - Zenbu shows all system prompts, and allows them to be edited by you

**Cross editor**
  - You should be able to have a high quality experience using models regardless of your editor

# How?
You use zenbu through the low footprint toolbar overlaid ontop your website.

The toolbar provides:
 - improved implementations of the most used chrome devtool features
 - a chat sidebar that allows you to talk to a model that can access your projects file system

This means models can see everything you see in your browser and code editor. With the ability to write directly to your project.

Zenbu can communicate with your project by running a server directly next to your project, that communicates with the zenbu toolbar

# Architecture
![image](https://github.com/user-attachments/assets/ec4a3f70-5922-4897-9960-1540f2754306)

  
# Roadmap

- [ ] Context from devtools (react scan, inspector, network, console)
- [ ] Tldraw directly overlaid on website and screenshot provided to model
- [ ] Screen sharing + video editing, pass to gemini
- [ ] Better gemini codebase indexer (fully implement chunk codebase into geminis to feed into query gemini)
- [ ] Modify styles on an element with AI apply
- [ ] Plugin to add source location to components (sentry style)
- [ ] Gemini semantic search
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
