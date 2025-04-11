export interface ReactComponentData {
  id: string;
  name: string;
  type: "component" | "element" | "fragment";
  children?: ReactComponentData[];
  props?: Record<string, any>;
  state?: Record<string, any>;
  context?: Record<string, any>;
}

const components = [
  // UI Components
  "App", "Layout", "Header", "Sidebar", "Main", "Footer", "Navigation", "Card", "List", "Item", 
  "Button", "Input", "Form", "Modal", "Dropdown", "Table", "Row", "Cell", "Tabs", "Tab",
  // Common Features
  "UserProfile", "Settings", "Dashboard", "Analytics", "Chart", "Graph", "Calendar", "Notifications",
  // Data Components
  "DataGrid", "TreeView", "Pagination", "SearchBar", "FilterPanel", "SortableList", "VirtualList",
  // Auth Components
  "LoginForm", "SignupForm", "AuthProvider", "PrivateRoute", "UserContext", "PermissionsProvider",
  // Layout Components
  "Grid", "Flex", "Stack", "Container", "Section", "Panel", "Divider", "Spacer", "AspectRatio",
  // Feedback Components
  "Toast", "Alert", "Progress", "Spinner", "Skeleton", "ErrorBoundary", "Suspense", "LoadingState"
];

const elements = ["div", "span", "p", "h1", "h2", "h3", "section", "article", "nav", "main", "footer", "aside", "header", "form", "ul", "ol", "li"];
const contexts = ["ThemeContext", "UserContext", "LanguageContext", "StoreContext", "RouterContext", "AuthContext"];

export function generateMockData(depth = 0, prefix = ""): ReactComponentData[] {
  if (depth > 4) return [];

  const result: ReactComponentData[] = [];
  const numChildren = Math.floor(Math.random() * 5) + (depth === 0 ? 5 : 1);

  for (let i = 0; i < numChildren; i++) {
    const isElement = Math.random() > 0.8;
    const isFragment = !isElement && Math.random() > 0.9;
    const name = isElement 
      ? elements[Math.floor(Math.random() * elements.length)]
      : components[Math.floor(Math.random() * components.length)];
    const id = `${prefix}${name}-${Math.random().toString(36).substr(2, 9)}`;

    const componentData: ReactComponentData = {
      id,
      name,
      type: isFragment ? "fragment" : (isElement ? "element" : "component"),
      children: generateMockData(depth + 1, `${id}-`),
      props: isElement ? {} : {
        className: "flex items-center gap-2 p-4",
        onClick: "() => handleClick()",
        style: { margin: "10px", padding: "15px" },
        disabled: Math.random() > 0.7,
        loading: Math.random() > 0.8,
        variant: ["primary", "secondary", "outline"][Math.floor(Math.random() * 3)],
        size: ["sm", "md", "lg"][Math.floor(Math.random() * 3)]
      },
      state: !isElement ? {
        count: Math.floor(Math.random() * 100),
        isOpen: Math.random() > 0.5,
        data: Array.from({ length: Math.floor(Math.random() * 5) }, (_, i) => `item${i}`),
        loading: Math.random() > 0.7,
        error: Math.random() > 0.9 ? new Error("Something went wrong") : null,
        selectedId: Math.random().toString(36).substr(2, 9)
      } : undefined,
      context: !isElement ? {
        theme: Math.random() > 0.5 ? "dark" : "light",
        user: { id: Math.floor(Math.random() * 1000), name: "John Doe", role: "admin" },
        [contexts[Math.floor(Math.random() * contexts.length)]]: {
          value: Math.random() > 0.5 ? "some value" : "other value",
          dispatch: "() => void"
        }
      } : undefined
    };

    result.push(componentData);
  }

  return result;
}

export const mockComponentTree = generateMockData(); 