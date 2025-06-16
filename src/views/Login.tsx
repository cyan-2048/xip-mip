import Content from "./components/Content";
import Header from "./components/Header";
import KaiButton, { ButtonContainer } from "./components/KaiButton";
import styles from "./Login.module.scss";
import {
	$boshURL,
	$jid,
	$loginConnecting,
	$manualLogin,
	$password,
	$useAdvancedSettings,
	$wsURL,
	_splashDone,
	setSoftkeys,
	setStatusbarColor,
	start,
} from "@/stores";
import { batch, createEffect, createSignal, createUniqueId, onCleanup, onMount, Show } from "solid-js";
import SpatialNavigation from "@/lib/spatial_navigation";
import { alert } from "./modals";
import TextInput from "./components/TextInput";
import CheckboxInput from "./components/CheckboxInput";
import { Portal } from "solid-js/web";
import { sleep } from "@/utils";
import scrollIntoView from "scroll-into-view-if-needed";
import { useStore } from "@nanostores/solid";
import { _converse } from "@convo";

function isValidHttpUrl(maybeURL: string) {
	try {
		const url = new URL(maybeURL);
		return url.protocol === "http:" || url.protocol === "https:";
	} catch (_) {
		return false;
	}
}

function isValidWebSocketUrl(maybeURL: string) {
	try {
		const url = new URL(maybeURL);
		return url.protocol === "ws:" || url.protocol === "wss:";
	} catch (_) {
		return false;
	}
}

function SignIn(props: { onClose: () => void }) {
	const SN_ID = createUniqueId();

	const advanced = useStore($useAdvancedSettings);
	const loginConnecting = useStore($loginConnecting);

	createEffect(() => {
		setSoftkeys(null, null, loginConnecting() ? "Connect..." : "Connect");
	});

	onMount(() => {
		_splashDone.promise.then(() => {
			setStatusbarColor("#320574");
		});
		setSoftkeys("Back", "", $loginConnecting.get() ? "Connect..." : "Connect");

		SpatialNavigation.add(SN_ID, {
			selector: `.${SN_ID}`,
			restrict: "self-only",
		});

		SpatialNavigation.focus(SN_ID);
	});

	onCleanup(() => {
		SpatialNavigation.remove(SN_ID);
	});

	const [boshInvalid, setBoshInvalid] = createSignal(false);
	const [wsInvalid, setWsInvalid] = createSignal(false);

	const [username, setUsername] = createSignal($jid.get());
	const [usernameInvalid, setUsernameInvalid] = createSignal(false);

	const [password, setPassword] = createSignal($password.get());

	return (
		<Content mainClass={styles.login} before={<Header>Convo Login</Header>}>
			<div
				onKeyDown={(e) => {
					if (import.meta.env.DEV && e.key == "Backspace") {
						return;
					}
					if (e.key == "Backspace" || e.key == "SoftLeft") {
						e.preventDefault();
						props.onClose();
					}
					if (e.key == "SoftRight") {
						// if we are attempting to connect...
						if ($loginConnecting.get()) return;

						batch(() => {
							$password.set(password());
							$jid.set(username());
							$manualLogin.set(true);
						});

						start();
					}
				}}
			>
				<div class={styles.padding}>
					<p>Please enter your login details.</p>
				</div>
				<TextInput
					on:sn-focused={(e) => {
						e.currentTarget.scrollIntoView(false);
					}}
					invalid={usernameInvalid()}
					onInput={(e) => {
						const value = e.currentTarget.value;
						setUsername(value);

						if (!value) {
							setUsernameInvalid(false);
						} else {
							setUsernameInvalid(!_converse.env.u.isValidJID(value));
						}
					}}
					class={SN_ID}
					value={/*@once*/ $jid.get()}
					label="Username"
				></TextInput>
				<TextInput
					on:sn-focused={(e) => {
						scrollIntoView(e.currentTarget.parentElement!, {
							scrollMode: "if-needed",
							block: "nearest",
							inline: "nearest",
						});
					}}
					onInput={(e) => setPassword(e.currentTarget.value)}
					value={/*@once*/ $password.get()}
					class={SN_ID}
					type="password"
					label="Password"
				></TextInput>
				<CheckboxInput
					tabIndex={0}
					class={SN_ID}
					on:sn-focused={(e) => {
						scrollIntoView(e.currentTarget, {
							scrollMode: "if-needed",
							block: "nearest",
							inline: "nearest",
						});
					}}
					on:sn-enter-down={(e) => {
						const currentTarget = e.currentTarget;
						$useAdvancedSettings.set(!$useAdvancedSettings.get());

						sleep().then(() => {
							currentTarget.scrollIntoView(true);
						});
					}}
					checked={advanced()}
				>
					Advanced settings
				</CheckboxInput>
				<Show when={advanced()}>
					<TextInput
						class={SN_ID}
						on:sn-focused={(e) => {
							scrollIntoView(e.currentTarget.parentElement!, {
								scrollMode: "if-needed",
								block: "nearest",
								inline: "nearest",
							});
						}}
						invalid={boshInvalid()}
						onInput={(e) => {
							const value = e.currentTarget.value;
							if (value) {
								const valid = isValidHttpUrl(value);
								setBoshInvalid(!valid);
								$boshURL.set(valid ? value : "");
							} else {
								setBoshInvalid(false);
								$boshURL.set("");
							}
						}}
						value={
							/*@once*/
							$boshURL.get()
						}
						label="BOSH URL"
					></TextInput>
					<TextInput
						invalid={wsInvalid()}
						on:sn-focused={(e) => {
							scrollIntoView(e.currentTarget.parentElement!, {
								scrollMode: "if-needed",
								block: "nearest",
								inline: "nearest",
							});
						}}
						onInput={(e) => {
							const value = e.currentTarget.value;
							if (value) {
								const valid = isValidWebSocketUrl(value);
								setWsInvalid(!valid);
								$wsURL.set(valid ? value : "");
							} else {
								setWsInvalid(false);
								$wsURL.set("");
							}
						}}
						class={SN_ID}
						value={
							/*@once*/
							$wsURL.get()
						}
						label="WebSocket URL"
					></TextInput>
				</Show>
			</div>
		</Content>
	);
}

export default function Login() {
	const [showLogin, setShowLogin] = createSignal(false);

	const SN_ID = createUniqueId();

	const updateSoftkeys = () => setSoftkeys("Exit", "Select", "");

	onMount(() => {
		_splashDone.promise.then(() => {
			setStatusbarColor("#320574");
		});

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
		<>
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
							onFocus={updateSoftkeys}
							class={SN_ID}
							tabIndex={0}
						>
							Create Account
						</KaiButton>
						<KaiButton
							on:sn-enter-down={() => {
								setShowLogin(true);
							}}
							onFocus={updateSoftkeys}
							class={SN_ID}
							tabIndex={0}
						>
							Sign in
						</KaiButton>
					</ButtonContainer>
				</div>
			</Content>
			<Show when={showLogin()}>
				<Portal>
					<SignIn
						onClose={async () => {
							setSoftkeys("Exit", "Select", "");
							setShowLogin(false);
							await sleep();
							SpatialNavigation.focus(SN_ID);
						}}
					></SignIn>
				</Portal>
			</Show>
		</>
	);
}
