// DEV env tools

import * as nanostores from "nanostores";
import * as utils from "@utils";
import * as stores from "@stores";
import * as modals from "@/views/modals";
import localforage from "localforage";

Object.assign(window, {
	$: {
		nanostores,
		utils,
		...stores,
		stores,
		localforage,
		modals,
		...modals,
	},
});

if (!navigator.mozApps) {
	const KeyboardEvent_key_property = Object.getOwnPropertyDescriptor(
		KeyboardEvent.prototype,
		"key"
	)!;
	Object.defineProperty(KeyboardEvent.prototype, "key", {
		enumerable: true,
		configurable: true,
		get(this: KeyboardEvent) {
			const evt_key = KeyboardEvent_key_property.get!.call(this) as string;
			if (
				(this.ctrlKey || this.altKey) &&
				evt_key.startsWith("Arrow") &&
				(evt_key.endsWith("Left") || evt_key.endsWith("Right"))
			) {
				return "Soft" + evt_key.slice(5);
			}

			if (
				this.shiftKey &&
				evt_key.startsWith("Arrow") &&
				(evt_key.endsWith("Left") || evt_key.endsWith("Right"))
			) {
				return evt_key.endsWith("Left") ? "*" : "#";
			}
			return evt_key;
		},
	});
}
