import { X, Search, Star, Download, ExternalLink } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Dialog, DialogContent } from "../ui/dialog";
import { useState } from "react";

interface Plugin {
  id: string;
  name: string;
  description: string;
  author: string;
  downloads: number;
  stars: number;
  isInstalled: boolean;
}

const mockPlugins: Plugin[] = [
  {
    id: "1",
    name: "Advanced Tables",
    description:
      "Enhance table formatting and manipulation with powerful features.",
    author: "Tony Grosinger",
    downloads: 542890,
    stars: 1245,
    isInstalled: false,
  },
  {
    id: "2",
    name: "Calendar",
    description: "Calendar view for your daily notes and events.",
    author: "Liam Cain",
    downloads: 423567,
    stars: 987,
    isInstalled: true,
  },
  {
    id: "3",
    name: "Dataview",
    description: "Complex data queries and filtering for your notes.",
    author: "Michael Brenan",
    downloads: 687432,
    stars: 2341,
    isInstalled: false,
  },
  {
    id: "4",
    name: "Templater",
    description: "Create and use powerful templates in your notes.",
    author: "SilentVoid",
    downloads: 345678,
    stars: 1567,
    isInstalled: false,
  },
  {
    id: "5",
    name: "Kanban",
    description: "Create markdown-based Kanban boards.",
    author: "mgmeyers",
    downloads: 234567,
    stars: 890,
    isInstalled: false,
  },
  {
    id: "6",
    name: "Mind Map",
    description: "Create beautiful mind maps from your notes.",
    author: "James Lynch",
    downloads: 198765,
    stars: 756,
    isInstalled: true,
  },
];

interface PluginStoreProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PluginStore({ isOpen, onClose }: PluginStoreProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "installed">("all");

  const filteredPlugins = mockPlugins.filter((plugin) => {
    const matchesSearch =
      plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plugin.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filter === "all" || (filter === "installed" && plugin.isInstalled);
    return matchesSearch && matchesFilter;
  });

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-5xl h-[80vh] flex flex-col p-0">
        <div className="flex items-center justify-between border-b  p-4">
          <div className="text-lg font-semibold">Plugin Store</div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-4 border-b  p-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search plugins..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={filter === "all" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              All
            </Button>
            <Button
              variant={filter === "installed" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter("installed")}
            >
              Installed
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPlugins.map((plugin) => (
              <div
                key={plugin.id}
                className="group rounded-lg border  p-4 hover:border-border transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">{plugin.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {plugin.author}
                    </p>
                  </div>
                  <Button
                    variant={plugin.isInstalled ? "outline" : "default"}
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {plugin.isInstalled ? "Uninstall" : "Install"}
                  </Button>
                </div>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                  {plugin.description}
                </p>
                <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Download className="h-3.5 w-3.5" />
                    {plugin.downloads.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5" />
                    {plugin.stars.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
