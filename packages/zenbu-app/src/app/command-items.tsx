import {
  AccessibilityIcon,
  Activity,
  ActivityIcon,
  Airplay,
  AlertOctagonIcon,
  AlertTriangle,
  AlertTriangleIcon,
  AlignEndHorizontal,
  ArchiveIcon,
  ArrowDownCircleIcon,
  ArrowDownIcon,
  ArrowDownLeftIcon,
  ArrowDownRightIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  ArrowUpLeftIcon,
  ArrowUpRightIcon,
  BabyIcon,
  BarChart,
  BarChartIcon,
  Bell,
  BookIcon,
  BookOpenIcon,
  Bot,
  BotIcon,
  Box,
  BrainIcon,
  Bug,
  Camera,
  CameraIcon,
  CheckCircle,
  CheckCircleIcon,
  CheckIcon,
  CheckSquare,
  CheckSquareIcon,
  CircleGauge,
  CircleIcon,
  CircleX,
  ClipboardCheckIcon,
  ClipboardIcon,
  Clock,
  ClockIcon,
  Code,
  CodeIcon,
  CompassIcon,
  Cookie,
  Cpu,
  CpuIcon,
  CreditCardIcon,
  Database,
  DatabaseIcon,
  DogIcon,
  DownloadCloudIcon,
  Edit,
  EyeIcon,
  EyeOffIcon,
  FileCode,
  FileImage,
  FileSearch,
  FileText,
  FileTextIcon,
  Filter,
  FlameIcon,
  FlaskConical,
  Folder,
  FolderPlus,
  Folders,
  Gauge,
  GitBranch,
  GitBranchIcon,
  GitFork,
  Github,
  GithubIcon,
  Globe,
  GlobeIcon,
  HardDrive,
  HardDriveIcon,
  HeadphonesIcon,
  HeartIcon,
  HelpCircle,
  HelpCircleIcon,
  ImageIcon,
  InfoIcon,
  Inspect,
  KeyIcon,
  Layout,
  LayoutIcon,
  LayoutList,
  LeafIcon,
  LinkIcon,
  Logs,
  MessageCircle,
  MessageSquare,
  MessageSquareIcon,
  MicIcon,
  Microscope,
  MousePointer,
  MousePointerClick,
  MousePointerClickIcon,
  Network,
  PackageIcon,
  Paintbrush,
  PaintbrushIcon,
  Palette,
  PaletteIcon,
  PanelLeft,
  PanelRight,
  PanelTop,
  Pencil,
  PenTool,
  Puzzle,
  RefreshCwIcon,
  Rewind,
  Rocket,
  Route,
  Rows,
  Scan,
  ScissorsIcon,
  Search,
  SearchIcon,
  ServerCog,
  ServerCrash,
  ServerIcon,
  Settings,
  Shapes,
  Share2,
  ShareIcon,
  ShieldAlert,
  ShieldIcon,
  SkullIcon,
  Sliders,
  SlidersIcon,
  SmartphoneIcon,
  Sparkles,
  Split,
  SplitSquareVertical,
  StickyNote,
  StickyNoteIcon,
  TabletIcon,
  Terminal,
  TerminalIcon,
  TerminalSquare,
  TrashIcon,
  UserIcon,
  VideoIcon,
  Wind,
  WindIcon,
  X,
  XIcon,
  Zap,
  ZapIcon,
  BookOpen,
  Link2,
  PanelBottom,
  Store,
  Plus,
} from "lucide-react";
import { ChatInstanceStore } from "~/components/chat-store";

export const getCommandItems = ({
  actions,
  state,
  inspector,
  onCreateProject,
}: ChatInstanceStore["toolbar"] & {
  inspector: ChatInstanceStore["inspector"];
  onCreateProject: () => void;
  // for now we keep it false, but may need a loading state if takes more than 100ms
  createProjectLoading: boolean;
}) => [
  {
    shortcut: "Create Project",
    icon: <Plus size={16} />,
    onSelect: () => {
      onCreateProject();
    },
  },

  {
    shortcut: "Toggle Terminal",
    icon: <PanelBottom size={16} />,
    onSelect: () => {
      window.dispatchEvent(new Event("toggle-bottom-panel"));
    },
  },
  {
    shortcut: "Cloudflare Tunnel",
    icon: <PanelBottom size={16} />,
    onSelect: () => {
      window.dispatchEvent(new Event("toggle-bottom-panel"));
    },
  },
  {
    shortcut: "Collaborative Share",
    icon: <PanelBottom size={16} />,
    onSelect: () => {
      window.dispatchEvent(new Event("toggle-bottom-panel"));
    },
  },
  {
    shortcut: "Toggle Chat (Left)",
    icon: <MessageSquare size={16} />,
    onSelect: () => {
      window.dispatchEvent(
        new CustomEvent("toggle-chat", { detail: { position: "left" } }),
      );
    },
  },
  {
    shortcut: "Toggle Chat (Right)",
    icon: <MessageSquare size={16} />,
    onSelect: () => {
      window.dispatchEvent(
        new CustomEvent("toggle-chat", { detail: { position: "right" } }),
      );
    },
  },
  {
    shortcut: "Toggle Website Tree (Left)",
    icon: <PanelLeft size={16} />,
    onSelect: () => {
      window.dispatchEvent(
        new CustomEvent("toggle-website-tree", {
          detail: { position: "left" },
        }),
      );
    },
  },
  {
    shortcut: "Toggle Website Tree (Right)",
    icon: <PanelRight size={16} />,
    onSelect: () => {
      window.dispatchEvent(
        new CustomEvent("toggle-website-tree", {
          detail: { position: "right" },
        }),
      );
    },
  },
  {
    shortcut: "Website Tree",
    icon: <Link2 size={16} />,
    onSelect: () => {
      window.dispatchEvent(new Event("toggle-website-tree"));
    },
  },
  {
    shortcut: "Chat",
    icon: <MessageSquare size={16} />,
    onSelect: () => {
      window.dispatchEvent(new Event("toggle-chat"));
    },
  },
  {
    shortcut: "Toggle Top Bar",
    icon: <PanelTop size={16} />,
    onSelect: () => {
      window.dispatchEvent(new Event("toggle-top-bar"));
    },
  },
  {
    shortcut: "Split View Right",
    icon: <Split size={16} />,
    onSelect: () => {
      window.dispatchEvent(new Event("toggle-split"));
    },
  },
  {
    shortcut: "Toggle Dense Tabs",
    icon: <LayoutList size={16} />,
    onSelect: () => {
      window.dispatchEvent(new Event("toggle-dense-tabs"));
    },
  },
  {
    shortcut: "TLDraw",
    icon: <Pencil size={16} />,
    onSelect: () => {
      actions.setIsDrawing(!state.drawing.active);
    },
  },
  {
    shortcut: "Screenshot",
    icon: <Airplay size={16} />,
    onSelect: () => {
      actions.setIsScreenshotting(!state.screenshotting.active);
    },
  },
  {
    shortcut: "Record",
    icon: <Camera size={16} />,
    onSelect: () => {
      actions.setIsRecording(!state.recording.active);
    },
  },
  {
    shortcut: "Console",
    icon: <Logs size={16} />,
    onSelect: () => {
      actions.setRoute(state.activeRoute === "console" ? "off" : "console");
    },
  },
  {
    shortcut: "Network",
    icon: <DownloadCloudIcon size={16} />,
    onSelect: () => {
      actions.setRoute(state.activeRoute === "network" ? "off" : "network");
    },
  },
  {
    shortcut: "Performance",
    icon: <Gauge size={16} />,
    onSelect: () => {
      actions.setRoute(
        state.activeRoute === "performance" ? "off" : "performance",
      );
    },
  },
  {
    shortcut: "Close Devtools",
    icon: <CircleX size={16} />,
    onSelect: () => {
      actions.setRoute("off");
    },
  },
  {
    shortcut: "Inspect Element",
    icon: <Inspect size={16} />,
    onSelect: () => {
      inspector.actions.setInspectorState({
        kind: inspector.state.kind === "inspecting" ? "off" : "inspecting",
      });
    },
  },
  {
    shortcut: "Code",
    icon: <Folder />,
    onSelect: () => {},
  },
  {
    shortcut: "Experiment",
    icon: <FlaskConical />,
    onSelect: () => {},
  },
  {
    shortcut: "Terminal",
    icon: <TerminalSquare />,
    onSelect: () => {},
  },
  {
    shortcut: "CPU Usage",
    icon: <Cpu size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "SQLite explorer",
    icon: <Database size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Process Memory Usage",
    icon: <BarChart size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "HTTP Client",
    icon: <Globe size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "New Project",
    icon: <FolderPlus size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Fork Project",
    icon: <GitFork size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "View Projects",
    icon: <Folders size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Active Ports",
    icon: <Network size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Git",
    icon: <GitBranch size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "REPL",
    icon: <Terminal size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "TS Playground",
    icon: <FileCode size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Auto QA",
    icon: <CheckCircle size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Deep Research",
    icon: <Search size={16} />,
    onSelect: () => {},
  },

  {
    shortcut: "Routes",
    icon: <Route size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "React Scan Outlines",
    icon: <Scan size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Profile Interactions",
    icon: <MousePointer size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Server Console Logs",
    icon: <ServerCog size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Server Network",
    icon: <ServerCrash size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Server Tracing",
    icon: <Activity size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Record Area",
    icon: <VideoIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Explain Area",
    icon: <HelpCircle size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Change Area",
    icon: <Edit size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Split Right",
    icon: <PanelRight size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Move Sidebar to Right",
    icon: <PanelRight size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Move Sidebar To Left",
    icon: <PanelLeft size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Community Plugins",
    icon: <Puzzle size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Settings",
    icon: <Settings size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Model Config",
    icon: <Sliders size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Excalidraw",
    icon: <Pencil size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Excalidraw Page",
    icon: <FileImage size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "TLDraw Page",
    icon: <PenTool size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Leave Note",
    icon: <StickyNote size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Leave Note on Element",
    icon: <MessageSquare size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "View Replay",
    icon: <Rewind size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Create Todo",
    icon: <CheckSquare size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Create Github Issue",
    icon: <Bug size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Open Cursor",
    icon: <MousePointerClick size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Open VScode",
    icon: <Code size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Talk to GPT4o",
    icon: <Bot size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Talk to Gemini",
    icon: <Sparkles size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Live Chat",
    icon: <MessageCircle size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Close All",
    icon: <X size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Local Storage",
    icon: <HardDrive size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "View Cookies",
    icon: <Cookie size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Search Tailwind Style",
    icon: <Paintbrush size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Create Manim Project",
    icon: <Shapes size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Create ThreeJS Project",
    icon: <Box size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Quick Question",
    icon: <HelpCircle size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Semantic Grep",
    icon: <Filter size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Show FPS",
    icon: <Gauge size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Restore Checkpoint",
    icon: <Rewind size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Open Windsurf",
    icon: <Wind size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Deploy",
    icon: <Rocket size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "View Project Github",
    icon: <Github size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Check for Type Errors",
    icon: <AlertTriangle size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "New WS Server",
    icon: <Share2 size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "New Effect Server",
    icon: <Zap size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Audit Dependencies",
    icon: <ShieldAlert size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Add 1s of Network Delay",
    icon: <Clock size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "View Shadcn Component",
    icon: <Shapes size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Find Files Related to Area",
    icon: <FileSearch size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Computer Use Query",
    icon: <Database size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Split Down",
    icon: <SplitSquareVertical size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Mount Toolbar As Footer",
    icon: <AlignEndHorizontal size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Mount Toolbar As Opposite Sidebar",
    icon: <Layout size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Open Graph View",
    icon: <Network size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "View Experiments",
    icon: <FlaskConical size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Create SVG",
    icon: <ImageIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Create 3D Model",
    icon: <Box size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Remind Me",
    icon: <Bell size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Color Blind Filters",
    icon: <Palette size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "View React Component Tree",
    icon: <GitBranch size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Inspect Component",
    icon: <Microscope size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Design Critique",
    icon: <Paintbrush size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Cursor Agent",
    icon: <BotIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "v0 Agent",
    icon: <BotIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Bolt Agent",
    icon: <ZapIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Claude Artifacts",
    icon: <FileTextIcon size={16} />,
    onSelect: () => {},
  },

  {
    shortcut: "Lovable Agent",
    icon: <HeartIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Devin",
    icon: <CodeIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Modify Styles",
    icon: <PaintbrushIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "IndexDB Viewer",
    icon: <DatabaseIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Create Ephemeral Link",
    icon: <LinkIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Add Testing Instructions",
    icon: <ClipboardCheckIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Leave Invariant Notes",
    icon: <StickyNoteIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Leave Audio Note",
    icon: <MicIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "View Audio Notes",
    icon: <HeadphonesIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Change Page Theme Config",
    icon: <PaletteIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Animation Function Preview",
    icon: <ActivityIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Create Sharable Screenshot",
    icon: <CameraIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Create Sharable Clip",
    icon: <VideoIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Open NeoVim",
    icon: <TerminalIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Open Component In VScode",
    icon: <CodeIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Open Component In Cursor",
    icon: <MousePointerClickIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Open Component In Windsurf",
    icon: <WindIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Open Component In NeoVim",
    icon: <TerminalIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Open Page in VSCode",
    icon: <CodeIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Open Page in Cursor",
    icon: <MousePointerClickIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Open Page in Windsurf",
    icon: <WindIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Open Page in NeoVim",
    icon: <TerminalIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Show Server Components",
    icon: <ServerIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Show Layout",
    icon: <LayoutIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Show Invariant Violations",
    icon: <AlertTriangleIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Crash on Invariant Violation",
    icon: <AlertOctagonIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Don't crash on Invariant Violation",
    icon: <ShieldIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Show SSR Rendering Stats",
    icon: <BarChartIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "View Route Cache",
    icon: <HardDriveIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Visualize Prefetch",
    icon: <ArrowDownCircleIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Image Inspector",
    icon: <ImageIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Aggressive Page Compilation",
    icon: <ZapIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "RSC Viewer",
    icon: <EyeIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Hide Toolbar",
    icon: <EyeOffIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Show Toolbar",
    icon: <EyeIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Paste Image Over Screen",
    icon: <ClipboardIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Next.JS Docs",
    icon: <BookOpenIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "How Do I (Next.JS)",
    icon: <HelpCircleIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "How Do I (React)",
    icon: <HelpCircleIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "How Do I (Tailwind)",
    icon: <HelpCircleIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "How Do I (Framer Motion)",
    icon: <HelpCircleIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "SQLite Query",
    icon: <DatabaseIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Lucide Icons",
    icon: <PackageIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Make Baby Version",
    icon: <BabyIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "View Drizzle Performance",
    icon: <ActivityIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Make KV Server",
    icon: <ServerIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Make Local S3 Server",
    icon: <ServerIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Make Hosting Server",
    icon: <ServerIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Make FastAPI Server",
    icon: <ServerIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Make Semantic Search Server",
    icon: <SearchIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Make Auth Service",
    icon: <KeyIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Make Payment Service",
    icon: <CreditCardIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Add Github Actions Template",
    icon: <GithubIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Add E2E Testing",
    icon: <CheckCircleIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Add React Tests",
    icon: <CheckSquareIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Create JS Package",
    icon: <PackageIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Make Segmentation Service",
    icon: <ScissorsIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Make Object Recognition Service",
    icon: <EyeIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Make Local LLM Service",
    icon: <BrainIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Create Evals",
    icon: <ClipboardCheckIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Create Analytics Service",
    icon: <BarChartIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Add Otel",
    icon: <ActivityIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Autonomous Operator",
    icon: <BotIcon size={16} />,
    onSelect: () => {},
  },

  {
    shortcut: "Add Feedback Service",
    icon: <MessageSquareIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Add Marketing Website",
    icon: <GlobeIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Analyze Profile",
    icon: <UserIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Add Session Replay Service",
    icon: <VideoIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Add Docs",
    icon: <FileTextIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "My GitHub Issues",
    icon: <GithubIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Github Issues",
    icon: <GithubIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Add Video Service",
    icon: <VideoIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Add Image Optimization Server",
    icon: <ImageIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Make Slide Show",
    icon: <SlidersIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Add Generative AI Art Service",
    icon: <PaletteIcon size={16} />,
    onSelect: () => {},
  },

  {
    shortcut: "Hours Logger",
    icon: <ClockIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Show Redundant Renders",
    icon: <RefreshCwIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "View In Mobile",
    icon: <SmartphoneIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "View In Tablet",
    icon: <TabletIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "View In Safari",
    icon: <CompassIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "View In FireFox",
    icon: <FlameIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "View In Chrome",
    icon: <GlobeIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "View In Arc",
    icon: <CircleIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "View In Zen",
    icon: <LeafIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Memory Usage",
    icon: <CpuIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Accessibility",
    icon: <AccessibilityIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Bundle Analyzer",
    icon: <PackageIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Open Graph Viewer",
    icon: <ShareIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Image Editor",
    icon: <ImageIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "View Recordings",
    icon: <VideoIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Next Code Mod",
    icon: <CodeIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "SWR Devtools",
    icon: <RefreshCwIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Graph Message History",
    icon: <MessageSquareIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Codebase Wiki",
    icon: <BookIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Turn On Tabs",
    icon: <LayoutIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Turn on Clutter Mode",
    icon: <TrashIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Create Eslint Plugin",
    icon: <CodeIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "View Process Resource Consumption",
    icon: <CpuIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Auto Span Functions",
    icon: <ActivityIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "View Profiles",
    icon: <UserIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Toolbar Top Right",
    icon: <ArrowUpRightIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Toolbar Bottom Left",
    icon: <ArrowDownLeftIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Toolbar Bottom Right",
    icon: <ArrowDownRightIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Toolbar Top Left",
    icon: <ArrowUpLeftIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Export as ZIP",
    icon: <ArchiveIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Remove Stupid Comments",
    icon: <TrashIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Remove Console Logs",
    icon: <TrashIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Comment Console Logs",
    icon: <MessageSquareIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Accept All Changes",
    icon: <CheckIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Discard All Changes (and tell model)",
    icon: <XIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Critique Area",
    icon: <MessageSquareIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Bisect Manager",
    icon: <GitBranchIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Leave Info on Commit",
    icon: <InfoIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Search Through Commit Info's",
    icon: <SearchIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Dead Code Analyzer",
    icon: <SkullIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Create Model Fine Tuning Project",
    icon: <BrainIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Create Bert (best variant) Trainer Project",
    icon: <BrainIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Create Semantic Cluster Model Trainer Project",
    icon: <BrainIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Generate Synthetic Data Project",
    icon: <DatabaseIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Create Tauri Project",
    icon: <PackageIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Create Electron Project",
    icon: <PackageIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Add Dog",
    icon: <DogIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Performance Guides",
    icon: <CircleGauge size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Split Focused Right",
    icon: <ArrowRightIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Split Focused Left",
    icon: <ArrowLeftIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Split Focused Down",
    icon: <ArrowDownIcon size={16} />,
    onSelect: () => {},
  },
  {
    shortcut: "Split Focused Up",
    icon: <ArrowUpIcon size={16} />,
    onSelect: () => {},
  },
  {
    id: "toggle-plugin-store",
    title: "Open Plugin Store",
    shortcut: "Ctrl+Shift+P",
    icon: <Store className="h-5 w-5" />,
    onSelect: () =>
      window.dispatchEvent(new CustomEvent("toggle-plugin-store")),
  },
  {
    id: "toggle-plugin-store",
    shortcut: "Find Element by Screenshot",
    icon: <Store className="h-5 w-5" />,
    onSelect: () =>
      window.dispatchEvent(new CustomEvent("toggle-plugin-store")),
  },
  {
    id: "toggle-plugin-store",
    shortcut: "Next Server Stats",
    icon: <Store className="h-5 w-5" />,
    onSelect: () =>
      window.dispatchEvent(new CustomEvent("toggle-plugin-store")),
  },
];
