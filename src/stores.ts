import { atom } from "nanostores";
import { persistentAtom } from "@nanostores/persistent";
import { _converse, converse, ConverseConnectionStatus } from "./lib/converse";
import { sleep } from "@utils";
import Deferred from "./lib/Deferred";
import { alert } from "./views/modals";

class Connection {
	static get status() {
		return _converse.constants.CONNECTION_STATUS[
			_converse.state.connfeedback.get(
				"connection_status"
			) as keyof typeof _converse.constants.CONNECTION_STATUS
		];
	}

	static get message() {
		return _converse.state.connfeedback.get("message") as string;
	}
}

const noListen = { listen: false };

const bool = {
	decode(e: string) {
		return Boolean(+e);
	},
	encode(e: boolean) {
		return e ? "1" : "0";
	},
	listen: false,
};

export const $jid = persistentAtom<string>("jid", "", noListen);
export const $password = persistentAtom<string>("password", "", noListen);
// force relogin
export const $forceLogin = persistentAtom("forceLogin", true, bool);
// set to  true if this is a manual login
export const $manualLogin = atom(false);

type Views = "login" | "home";
export const $view = atom<Views>($forceLogin.get() ? "login" : "home");

export const $useAdvancedSettings = persistentAtom("useAdvancedSettings", false, bool);

export const $boshURL = persistentAtom<string>("boshURL", "", noListen);
export const $wsURL = persistentAtom<string>("wsURL", "", noListen);

export const $loginConnecting = atom(false);

export const $connectionStatus = atom<ConverseConnectionStatus | null>(null);

$connectionStatus.subscribe((status) => {
	if (status !== null) console.log("connection_status", Connection.status, Connection.message);

	if (!status) return;

	switch (status) {
		case "AUTHFAIL":
		case "CONNFAIL":
			$forceLogin.set(true);
			localStorage.removeItem("conversejs-session-jid");
			$loginConnecting.set(false);
			_loginCheckDone.resolve();

			$view.set("login");

			const message = Connection.message;

			sleep(100).then(() => alert(message));
			break;

		case "CONNECTING":
		case "AUTHENTICATING":
		case "RECONNECTING":
			$loginConnecting.set(true);
			break;
	}
});

// splashScreen should be waited
export const _splashScreen = sleep(1000);
// resolve this once view should be able to change
export const _loginCheckDone = new Deferred<void>();
export const _splashDone = new Deferred<void>();

function loginSucessful() {
	$forceLogin.set(false);
	$loginConnecting.set(false);

	$view.set("home");

	_loginCheckDone.resolve();
}

function initConvo() {
	// this part seems to be unnecessary?
	// const { _converse } = this;

	// const log = _converse.log;

	_converse.state.connfeedback.on("change:connection_status", () => {
		$connectionStatus.set(Connection.status);
	});

	_converse.api.listen.on("connected", () => {
		loginSucessful();
	});

	_converse.api.listen.on("reconnected", () => {
		// loginSucessful();
		console.log("Reconnected!");
	});

	_converse.api.listen.on("message", (msg: any) => {
		console.log(`${msg.attrs.from} says: ${msg.attrs.body}`);
	});

	// these events are dispatched if _converse.roster.models changes
	_converse.api.listen.on("rosterInitialized", () => {
		console.log("rosterInitialized", _converse.roster.models);
	});
	_converse.api.listen.on("rosterContactsFetched", () => {
		console.log("rosterContactsFetched", _converse.roster.models);
	});

	_converse.api.listen.on("pluginsInitialized", function () {
		// We only register event handlers after all plugins are
		// registered, because other plugins might override some of our
		// handlers.
		//_converse.api.listen.on('message', m => console.log('message', m));

		console.log("Handlers ready!");

		// emoji don't seem to be getting initialized,
		// so let's do it manually
		_converse.api.emojis.initialize();
	});
}

converse.plugins.add("convo", {
	initialize: initConvo,
});

const _init = converse
	.initialize({
		whitelisted_plugins: ["convo"],
		auto_login: false,
		auto_reconnect: true,

		loglevel: "debug", // make 'debug' for debugging
		// allow_non_roster_messaging: true,
		roster_groups: true,

		// if the login page is forced, set it to undefined
		password: $forceLogin.get() ? undefined : $password.get() || undefined,
		jid: $forceLogin.get() ? undefined : $jid.get() || undefined,

		authentication: "login",

		// Special optimisations to reduce memory usage on KaiOS
		muc_fetch_members: ["owner"], // no admin or member, to reduce load
		archived_messages_page_size: 10,
		// prune_messages_above: 30,

		// BOSH and WebSocket configuration
		// bosh_service_url: ($useAdvancedSettings && $boshURL) || undefined,
		// websocket_url: ($useAdvancedSettings && $wsURL) || undefined,
	})
	.catch(() => {
		console.error("initializing error!");
	});

export async function start() {
	const jid = $jid.get();
	const password = $password.get();
	const forceLogin = $forceLogin.get();
	const manualLogin = $manualLogin.get();

	$loginConnecting.set(true);

	await _init;

	if (!manualLogin) {
		if (forceLogin || !jid || !password) {
			console.error("NOT LOGGED IN");
			$view.set("login");
			$loginConnecting.set(false);
			_loginCheckDone.resolve();

			return;
		}
	} else {
		_converse.api.settings.set({ password, jid });
		_converse.api.user.login(jid);
	}
}

start();

export function setSoftkeys(
	_left?: string | null,
	_center?: string | null,
	_right?: string | null,
	_loading?: boolean | null,
	_black?: boolean | null
) {
	setSoftkeys.v.apply(null, arguments as any);
}

setSoftkeys.v = (
	_left?: string | null,
	_center?: string | null,
	_right?: string | null,
	_loading?: boolean | null,
	_black?: boolean | null
) => {};

setSoftkeys.hide = (_hide: boolean) => {};

export function hideSoftkeys(hide: boolean) {
	setSoftkeys.hide(hide);
}

const statusbarColor = atom("#000");

statusbarColor.subscribe((color) => {
	document.head.querySelector(`meta[name="theme-color"]`)?.setAttribute("content", color);
});

export function setStatusbarColor(color: string) {
	statusbarColor.set(color);
}
