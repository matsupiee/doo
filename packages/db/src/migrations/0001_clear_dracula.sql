CREATE TABLE `mission_category` (
	`id` text PRIMARY KEY NOT NULL,
	`mission_id` text NOT NULL,
	`category` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`mission_id`) REFERENCES `mission`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `mission_category_missionId_idx` ON `mission_category` (`mission_id`);--> statement-breakpoint
CREATE INDEX `mission_category_category_idx` ON `mission_category` (`category`);--> statement-breakpoint
CREATE UNIQUE INDEX `mission_category_mission_category_uidx` ON `mission_category` (`mission_id`,`category`);