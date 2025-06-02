interface ConverseConfig {
	jid: string;
	password: string;
	whitelisted_plugins: string[];
	debug: boolean;
	auto_login: boolean;
	loglevel: "debug" | "info" | "warn" | "error" | "fatal"; // make 'debug' for debugging
	forward_messages: boolean;
	enable_smacks: boolean;
	allow_chat_pending_contacts: boolean;
	allow_non_roster_messaging: boolean;
	roster_groups: boolean;

	// Special optimisations to reduce memory usage on KaiOS
	mam_request_all_pages: boolean;
	muc_fetch_members: string[];
	muc_respect_autojoin: boolean;
	archived_messages_page_size: number;
	prune_messages_above: number;

	// BOSH and WebSocket configuration
	bosh_service_url: string;
	websocket_url: string;
}

interface ConversePlugins {
	add(name: string, plugin: Record<string, (this: any) => void>): void;
}

interface Converse {
	initialize: (settings: Partial<ConverseConfig>) => Promise<void>;
	plugins: ConversePlugins;
}

// TODO: add proper types for these
export const converse: Converse;
export const _converse: any;
