CREATE TABLE `zenbu-app_tag` (
	`tagId` text PRIMARY KEY NOT NULL,
	`fromProjectId` text NOT NULL,
	`workspaceId` text NOT NULL,
	FOREIGN KEY (`workspaceId`) REFERENCES `zenbu-app_workspace`(`workspaceId`) ON UPDATE no action ON DELETE no action
);
