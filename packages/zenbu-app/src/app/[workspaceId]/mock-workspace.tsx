const getProjectsForWorkspace = (workspaceId: string) => {
  return [];
};

const workspaces = [
  "home",
  "work",
  "games",
  "reproductions",
  "reusable",
  "os",
  "productivity",
  "devtools",
  "packages",
];

export const MockWorkspace = ({
  workspace,
}: {
  workspace: {
    workspaceId: string;
    backgroundImageUrl: string | null;
    createdAt: Date;
  };
}) => {
  return <div className=""></div>;
};
