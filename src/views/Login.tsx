import Content from "./components/Content";
import Header from "./components/Header";
import KaiButton, { ButtonContainer } from "./components/KaiButton";
import styles from "./Login.module.scss";
import { _splashDone, setSoftkeys, setStatusbarColor } from "@/stores";
import { createUniqueId, onCleanup, onMount } from "solid-js";
import SpatialNavigation from "@/lib/spatial_navigation";
import { alert } from "./modals";

export default function Login() {
	const SN_ID = createUniqueId();

	onMount(() => {
		_splashDone.then(() => {
			setStatusbarColor("#320574");
		});
		setSoftkeys("Exit", "Select", "");

		SpatialNavigation.add(SN_ID, {
			selector: `.${SN_ID}`,
			restrict: "self-only",
		});

		SpatialNavigation.focus(SN_ID);
	});

	onCleanup(() => {
		SpatialNavigation.remove(SN_ID);
	});

	return (
		<Content before={<Header>Convo</Header>}>
			<div
				onKeyDown={(e) => {
					if (e.key == "SoftLeft") {
						// don't exit if not an actual device
						if (import.meta.env.DEV) {
							console.warn("window.close()");
							return;
						}
						window.close();
					}
				}}
			>
				<div class={styles.padding}>
					<p>Welcome to Convo!</p>
				</div>
				<ButtonContainer>
					<KaiButton
						on:sn-enter-down={() => {
							alert("Unfortunately, you cannot create an account yet :(");
						}}
						class={SN_ID}
						tabIndex={0}
					>
						Create Account
					</KaiButton>
					<KaiButton class={SN_ID} tabIndex={0}>
						Sign in
					</KaiButton>
				</ButtonContainer>
			</div>
		</Content>
	);
}
