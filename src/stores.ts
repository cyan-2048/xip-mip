import { atom, onMount } from "nanostores";
import { persistentAtom } from "@nanostores/persistent";
import { _converse, converse } from "./lib/converse";
import { getOpenPromise } from "@converse/openpromise";
import { sleep } from "@utils";

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

export const $xmppConnected = atom(false);
export const $jid = persistentAtom<string>("jid", "", noListen);
export const $password = persistentAtom<string>("password", "", noListen);

export const $useAdvancedSettings = persistentAtom("useAdvancedSettings", false, bool);
export const $boshURL = persistentAtom<string>("boshURL", "", noListen);
export const $wsURL = persistentAtom<string>("wsURL", "", noListen);

// splashScreen should be waited
export const _splashScreen = sleep(1000);
// resolve this once view should be able to change
export const _loginCheckDone = getOpenPromise<void>();
export const _splashDone = getOpenPromise<void>();

type Views = "login" | "home";
export const $view = atom<Views>("home");

onMount($xmppConnected, () => {
	let interval = setInterval(() => {
		let status = _converse.api.connection.connected() || false;
		$xmppConnected.set(status);

		if (status) clearInterval(interval);
	}, 1000);

	return function stop() {
		clearInterval(interval);
	};
});

export function start() {
	const jid = $jid.get();
	const password = $password.get();
	if (!jid || !password) {
		console.error("NOT LOGGED IN!");
		$view.set("login");
		_loginCheckDone.resolve();
		return;
	}

	converse
		.initialize({
			jid: jid,
			password: password,
			whitelisted_plugins: ["convo"],
			debug: true,
			auto_login: true,
			loglevel: "debug", // make 'debug' for debugging
			forward_messages: false,
			enable_smacks: true,
			allow_chat_pending_contacts: true,
			allow_non_roster_messaging: true,
			roster_groups: false,

			// Special optimisations to reduce memory usage on KaiOS
			mam_request_all_pages: false,
			muc_fetch_members: ["owner"], // no admin or member, to reduce load
			muc_respect_autojoin: false,
			archived_messages_page_size: 10,
			prune_messages_above: 30,

			// BOSH and WebSocket configuration
			// bosh_service_url: ($useAdvancedSettings && $boshURL) || undefined,
			// websocket_url: ($useAdvancedSettings && $wsURL) || undefined,
		})
		.then(() => {
			$view.set("home");
			_loginCheckDone.resolve();
		});
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
