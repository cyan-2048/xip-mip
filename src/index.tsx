/* @refresh reload */
import { render } from "solid-js/web";

import App from "./App.tsx";
import "./styles.scss";
import "./dev.ts";

render(() => <App />, document.body);

console.log("LIBSIGNAL", window.libsignal);
