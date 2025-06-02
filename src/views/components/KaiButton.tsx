// this button is meant to look KaiOS-like

import { ComponentProps, JSXElement } from "solid-js";
import styles from "./KaiButton.module.scss";

export default function KaiButton(props: ComponentProps<"button">) {
	return (
		<div classList={{ [styles.button_container]: true }}>
			<button {...props} />
		</div>
	);
}

export function ButtonContainer(props: { children: JSXElement }) {
	return <div class={styles.container}>{props.children}</div>;
}
