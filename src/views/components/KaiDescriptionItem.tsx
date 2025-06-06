import { JSXElement } from "solid-js";
import styles from "./KaiDescriptionItem.module.scss";

export default function KaiDescriptionItem(props: { children: JSXElement }) {
	return <div class={styles.description}>{props.children}</div>;
}
