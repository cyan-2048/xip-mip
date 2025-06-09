/* @refresh reload */
import { render } from "solid-js/web";

import App from "./App.tsx";
import "./styles.scss";

render(() => <App />, document.body);

if (import.meta.env.DEV || import.meta.env.CANARY) {
	import("./dev.ts");
}
