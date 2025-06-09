import EventEmitter2 from "eventemitter2";

// TODO: get rid of deprecated settings
interface ConverseSettings {
	jid: string;
	password: string;
	whitelisted_plugins: string[];
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

	authentication: "login" | "external" | "anonymous" | "prebind";
	auto_reconnect: boolean;
}

interface ConversePlugins {
	add(name: string, plugin: Record<string, (this: { _converse: typeof _converse }) => void>): void;
}

interface Converse {
	initialize: (settings: Partial<ConverseSettings>) => Promise<void>;
	plugins: ConversePlugins;
}

interface ConverseApi {
	listen: {
		on: EventEmitter2["on"];
		once: EventEmitter2["on"];
	};
	emojis: any;
	connection: {
		connected(): boolean | undefined;
		get(): any;
	};

	settings: {
		set: any;
		get<T = unknown>(key: string): T;
		get(): Record<string, unknown>;
	};

	user: {
		login(jid: string, password?: string, automatic?: boolean): Promise<void>;
	};
}

interface ConverseConstants {
	CONNECTION_STATUS: Readonly<{
		0: "ERROR";
		1: "CONNECTING";
		2: "CONNFAIL";
		3: "AUTHENTICATING";
		4: "AUTHFAIL";
		5: "CONNECTED";
		6: "DISCONNECTED";
		7: "DISCONNECTING";
		8: "ATTACHED";
		9: "REDIRECT";
		13: "RECONNECTING";
	}>;
}

export type ConverseConnectionStatus =
	ConverseConstants["CONNECTION_STATUS"][keyof ConverseConstants["CONNECTION_STATUS"]];

// TODO: add proper types for these
export const converse: Converse;
export const _converse: Omit<
	import("@converse/headless/types/shared/api")._converse,
	"api" | "constants"
> & {
	api: ConverseApi;
	roster: any;
	constants: ConverseConstants;
};
