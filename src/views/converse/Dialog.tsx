import { ComponentProps, JSXElement, splitProps } from "solid-js";
import styles from "./Dialog.module.scss";
import scrollIntoView from "scroll-into-view-if-needed";
import { centerScroll } from "@/utils";

export default function Dialog(_props: ComponentProps<"div">) {
	const [local, props] = splitProps(_props, ["classList", "tabIndex", "on:sn-willfocus"]);

	return (
		<div
			{...props}
			on:sn-willfocus={(e) => {
				centerScroll(e.currentTarget, false, 300);
			}}
			classList={{
				[styles.dialog]: true,
				...local.classList,
			}}
			tabIndex={local.tabIndex ?? -1}
		/>
	);
}

export function DialogIcon(props: { children: JSXElement }) {
	return <div class={styles.icon}>{props.children}</div>;
}

export function DialogDetails(props: { top: JSXElement; bottom: JSXElement }) {
	return (
		<div class={styles.details}>
			<div class={styles.top}>{props.top}</div>
			<div class={styles.bottom}>{props.bottom}</div>
		</div>
	);
}

export function DialogName(props: { children?: JSXElement }) {
	return <div class={styles.name}>{props.children}</div>;
}

export function DialogTime(props: { children?: JSXElement }) {
	return <div class={styles.time}>{props.children}</div>;
}

export function DialogMeta(props: { children?: JSXElement }) {
	return <div class={styles.meta}>{props.children}</div>;
}

export function DialogDescription(props: { children?: JSXElement }) {
	return <div class={styles.desc}>{props.children}</div>;
}

export function DialogCount(props: { children?: JSXElement }) {
	return <div class={styles.count}>{props.children}</div>;
}
