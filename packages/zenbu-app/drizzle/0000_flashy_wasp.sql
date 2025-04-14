CREATE TABLE `zenbu-app_project` (
	`projectId` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `zenbu-app_projectChat` (
	`projectChatId` text PRIMARY KEY NOT NULL,
	`projectId` text NOT NULL,
	`events` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`projectId`) REFERENCES `zenbu-app_project`(`projectId`) ON UPDATE no action ON DELETE no action
);
