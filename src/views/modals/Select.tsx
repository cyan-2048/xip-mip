import styles from "./Alert.module.scss";
import softkeys from "@components/Softkeys.module.scss";
import ModalContainer from "./ModalContainer";
import ModalHeader from "./ModalHeader";
import { createUniqueId, For, onCleanup, onMount } from "solid-js";
import SpatialNavigation from "@/lib/spatial_navigation";
import scrollIntoView from "scroll-into-view-if-needed";

export default function Select(props: {
	items: [string, any][];
	selected: any;
	onClose: (val: any) => void;
}) {
	let lastFocusedElement!: HTMLElement;

	const SN_ID = createUniqueId();

	onMount(() => {
		lastFocusedElement = document.activeElement as HTMLElement;
		// console.log("lastFocusedElement", lastFocusedElement);
		SpatialNavigation.add(SN_ID, {
			selector: "." + SN_ID,
			restrict: "self-only",
			defaultElement: "." + styles.selected,
		});

		SpatialNavigation.focus(SN_ID);
	});

	onCleanup(() => {
		SpatialNavigation.remove(SN_ID);
		lastFocusedElement?.focus();
	});

	return (
		<ModalContainer select>
			<ModalHeader>Select</ModalHeader>
			<div
				onKeyDown={(e) => {
					if (e.key == "Enter" || e.key.startsWith("Arrow")) return;

					e.stopImmediatePropagation();
					e.stopPropagation();

					if (e.key == "SoftLeft" || e.key == "Backspace" || e.key == "EndCall") {
						e.preventDefault();
						props.onClose(null);
					}
				}}
				class={styles.select}
				on:sn-willfocus={(e) => {
					scrollIntoView(e.target, {
						scrollMode: "if-needed",
						block: "nearest",
						inline: "nearest",
					});
				}}
				on:sn-navigatefailed={(e) => {
					const direction = e.detail.direction;

					if (direction == "up" || direction == "down") {
						const target = e.target as HTMLElement;
						const elements = target.parentElement!.children;

						let nextFocus: HTMLElement;
						if (direction == "up") {
							nextFocus = elements[elements.length - 1] as HTMLElement;
						} else {
							nextFocus = elements[0] as HTMLElement;
						}

						scrollIntoView(nextFocus, {
							scrollMode: "if-needed",
							block: "nearest",
							inline: "nearest",
						});

						nextFocus.focus();
					}
				}}
			>
				<For each={props.items}>
					{([text, value]) => (
						<div
							classList={{
								[SN_ID]: true,
								[styles.selected]: value === props.selected,
								[styles.item]: true,
							}}
							tabIndex={-1}
							on:sn-enter-down={() => {
								props.onClose(value);
							}}
						>
							{text}
						</div>
					)}
				</For>
			</div>
			<div classList={{ [softkeys.softkeys]: true, [styles.softkeys]: true }}>
				<div classList={{ [softkeys.current]: true, [softkeys.black]: true }}>
					<div>Cancel</div>
					<div>SELECT</div>
				</div>
			</div>
		</ModalContainer>
	);
}
