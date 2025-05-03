CREATE TABLE `zenbu-app_workspace` (
	`workspaceId` text PRIMARY KEY NOT NULL,
	`backgroundImageUrl` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
DROP TABLE `zenbu-app_project`;--> statement-breakpoint
DROP TABLE `zenbu-app_projectChat`;