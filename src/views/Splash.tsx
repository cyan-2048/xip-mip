import { createSignal, onMount } from "solid-js";
import styles from "./Splash.module.scss";
import { _loginCheckDone, _splashDone, _splashScreen, setStatusbarColor } from "@/stores";
import { sleep } from "@utils";

export default function Splash(props: { setShow: (v: boolean) => void }) {
	const [fade, setFade] = createSignal(false);

	onMount(() => {
		setStatusbarColor("#6800a5");

		Promise.all([_splashScreen, _loginCheckDone]).then(() => {
			setFade(true);
			_splashDone.resolve();
			sleep(400).then(() => {
				props.setShow(false);
			});
		});
	});

	return (
		<div
			classList={{
				LOADING: true,
				[styles.splash]: true,
				[styles.fadeOut]: fade(),
			}}
		></div>
	);
}
