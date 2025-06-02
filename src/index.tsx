/* @refresh reload */
import { render } from "solid-js/web";

import App from "./App.tsx";
import { converse } from "./lib/converse";
import "./styles.scss";

render(() => <App />, document.body);

if (import.meta.env.DEV) {
	import("./dev.ts");
}

converse.plugins.add("convo", {
	initialize: function () {
		const { _converse } = this;
		console.log("CONVO ACTUALLY WORKS!!!", _converse);
		// const log = _converse.log;

		_converse.api.listen.on("disconnected", () => {
			console.debug("We disconnected :/");
		});

		_converse.api.listen.on("initialized", () => {
			console.debug("The connection has now been initialised! :D");
		});

		_converse.api.listen.on("connected", () => {
			console.debug("Connected successfully ;)");

			_converse.api.listen.on("message", (msg: any) => {
				console.debug(`${msg.attrs.from} says: ${msg.attrs.body}`);
			});
		});

		_converse.api.listen.on("pluginsInitialized", function () {
			// We only register event handlers after all plugins are
			// registered, because other plugins might override some of our
			// handlers.
			//_converse.api.listen.on('message', m => console.log('message', m));

			console.debug("Handlers ready!");

			// emoji don't seem to be getting initialized,
			// so let's do it manually
			_converse.api.emojis.initialize();
		});
	},
});
