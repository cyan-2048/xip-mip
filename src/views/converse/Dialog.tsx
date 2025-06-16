import { ComponentProps, createRenderEffect, createSignal, JSXElement, splitProps } from "solid-js";
import styles from "./Dialog.module.scss";
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

export function getWeek(d: Date) {
	// Create a copy of this date object
	var target = new Date(d.valueOf());

	// ISO week date weeks start on monday
	// so correct the day number
	var dayNr = (d.getDay() + 6) % 7;

	// Set the target to the thursday of this week so the
	// target date is in the right year
	target.setDate(target.getDate() - dayNr + 3);

	// ISO 8601 states that week 1 is the week
	// with january 4th in it
	var jan4 = new Date(target.getFullYear(), 0, 4);

	// Number of days between target date and january 4th
	var dayDiff = (+target - +jan4) / 86400000;

	// Calculate week number: Week 1 (january 4th) plus the
	// number of weeks between target date and january 4th
	var weekNr = 1 + Math.ceil(dayDiff / 7);

	return weekNr;
}

export function isToday(date: Date, today = new Date()) {
	return (
		date.getDate() == today.getDate() &&
		date.getMonth() == today.getMonth() &&
		date.getFullYear() == today.getFullYear()
	);
}

export function timeStamp(date: Date) {
	const today = new Date();

	const isSameYear = today.getFullYear() == date.getFullYear();

	if (isSameYear) {
		if (isToday(date, today)) {
			return date.toLocaleTimeString(navigator.language, {
				hour: "numeric",
				minute: "numeric",
			});
		} else {
			const isSameWeek = getWeek(date) == getWeek(today);
			if (isSameWeek) {
				return date.toLocaleDateString(navigator.language, {
					weekday: "short",
				});
			} else {
				return date.toLocaleDateString(navigator.language, {
					month: "short",
					day: "numeric",
				});
			}
		}
	} else {
		return date.toLocaleDateString(navigator.language);
	}
}

export function DialogDate(props: { $: Date }) {
	const [text, setText] = createSignal("");

	createRenderEffect(() => {
		const date = props.$;

		setText(timeStamp(date));
	});

	return <>{text()}</>;
}
