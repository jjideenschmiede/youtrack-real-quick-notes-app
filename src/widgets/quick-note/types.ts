export interface WidgetConfiguration {
	title: string;
}

export interface WidgetCache {
	body: string;
}

export type SaveStatus = "idle" | "saving" | "saved";
