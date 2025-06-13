import type {
	Profile,
	RosterContact,
	RosterContacts,
	_converse as __converse,
	api as _api,
	constants as _constants,
} from "@converse/headless";
import EventEmitter2 from "eventemitter2";
import { RosterContactAttributes } from "node_modules/@converse/headless/types/plugins/roster/types";
import { ConverseConfig } from "./converse_config";

interface ConversePlugins {
	add(name: string, plugin: Record<string, (this: { _converse: typeof _converse }) => void>): void;
}

interface Converse {
	initialize: (settings: Partial<ConverseConfig>) => Promise<void>;
	plugins: ConversePlugins;
}

type API = typeof _api;

interface ConverseApi extends API {
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

	waitUntil<T = unknown>(...args: any[]): Promise<T>;
}

type _Constants = typeof _constants;

interface ConverseConstants extends _Constants {
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
	[x: string]: any;
}

export type ConverseConnectionStatus =
	ConverseConstants["CONNECTION_STATUS"][keyof ConverseConstants["CONNECTION_STATUS"]];

class ConverseRosterContacts extends RosterContacts {
	[Symbol.iterator](): Iterator<RosterContact>;
}

interface ConnectionFeedback {
	get(attr: "connection_status"): keyof ConverseConstants["CONNECTION_STATUS"];
	get(attr: "message"): string;

	on: any;
}

export type RosterContactSubscription = RosterContactAttributes["subscription"];

// TODO: add proper types for these
export const converse: Converse;
export const _converse: Omit<
	typeof __converse,
	// replace incorrect "any"
	"api" | "constants" | "state"
> & {
	api: ConverseApi;
	roster: ConverseRosterContacts;
	constants: ConverseConstants;
	state: {
		[x: string]: any;
		connfeedback: ConnectionFeedback;
		roster: ConverseRosterContacts;
		xmppstatus: Profile;
	};
};

export const constants: ConverseConstants;

export const api: ConverseApi;
