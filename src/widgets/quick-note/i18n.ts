type SupportedLocale = "en" | "de";

type Messages = {
	defaultTitle: string;
	bodyPlaceholder: string;
	statusSaving: string;
	statusSaved: string;
	configTitle: string;
	configTitleLabel: string;
	configSave: string;
	configCancel: string;
};

const messages: Record<SupportedLocale, Messages> = {
	en: {
		defaultTitle: "Quick Note",
		bodyPlaceholder: "Write your note here...",
		statusSaving: "Saving...",
		statusSaved: "Saved",
		configTitle: "Widget Configuration",
		configTitleLabel: "Title",
		configSave: "Save",
		configCancel: "Cancel"
	},
	de: {
		defaultTitle: "Schnellnotiz",
		bodyPlaceholder: "Schreibe hier deine Notiz...",
		statusSaving: "Speichert...",
		statusSaved: "Gespeichert",
		configTitle: "Widget-Konfiguration",
		configTitleLabel: "Titel",
		configSave: "Speichern",
		configCancel: "Abbrechen"
	}
};

const DEFAULT_LOCALE: SupportedLocale = "en";

function resolveLocale(raw: string | undefined): SupportedLocale {
	if (!raw) {
		return DEFAULT_LOCALE;
	}
	const normalized: string = raw.toLowerCase().split(/[-_]/)[0];
	if (normalized === "de") {
		return "de";
	}
	return DEFAULT_LOCALE;
}

export function getMessages(): Messages {
	return messages[resolveLocale(YTApp.locale)];
}
