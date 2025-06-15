import { JSXElement } from "solid-js";
import styles from "./Separator.module.scss";

export default function Separator(props: { children: JSXElement; sticky?: number }) {
	return (
		<div
			style={
				typeof props.sticky == "number"
					? {
							position: "sticky",
							top: props.sticky + "px",
							"z-index": 1,
					  }
					: undefined
			}
			class={styles.separator}
		>
			{props.children}
		</div>
	);
}
