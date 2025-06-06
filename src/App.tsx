import { createSignal, Match, onCleanup, onMount, Show, Switch } from "solid-js";
import { useStore } from "@nanostores/solid";
import Splash from "./views/Splash";
import { onBeforeMount, sleep } from "./utils";
import Softkeys from "./views/components/Softkeys";
import Modals from "./views/modals";
import { $view } from "./stores";
import Login from "./views/Login";
import SpatialNavigation from "./lib/spatial_navigation";

export default function App() {
	const [showSplash, setShowSplash] = createSignal(true);

	// onMount(() => {
	//  // this logs 2 LOADING elements
	// 	console.log("onMount", document.querySelectorAll(".LOADING"));
	// 	sleep(10).then(() => {});
	// });

	// like onMount but using createRenderEffect instead
	// createRenderEffect(() =>
	// 	untrack(() => {
	// 		// this logs only 1 LOADING element
	// 		// console.log("onBeforeMount", document.querySelectorAll(".LOADING"));
	//
	// 		const splash = document.querySelector<HTMLDivElement>(".LOADING");
	//
	// 		sleep(10).then(() => {
	// 			splash?.remove();
	// 		});
	// 	})
	// );

	onBeforeMount(() => {
		const splash = document.querySelector<HTMLDivElement>(".LOADING");

		sleep(10).then(() => {
			splash?.remove();
		});
	});

	onMount(() => {
		SpatialNavigation.init();
	});

	onCleanup(() => {
		SpatialNavigation.uninit();
	});

	const view = useStore($view);

	return (
		<>
			<Show when={showSplash()}>
				<Splash setShow={setShowSplash}></Splash>
			</Show>
			<Switch>
				<Match when={view() == "login"}>
					<Login></Login>
				</Match>
			</Switch>
			<Modals></Modals>
			<Softkeys></Softkeys>
		</>
	);
}
