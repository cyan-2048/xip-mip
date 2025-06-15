import styles from "./Avatar.module.scss";
import type { Profile, RosterContact } from "@converse/headless";
import { batch, createMemo, createRenderEffect, createSignal, mergeProps, Show, untrack } from "solid-js";

function getInitials(name: string) {
	if (!name) return "";

	const names = name.split(" ");
	if (names.length > 1) {
		return names[0].charAt(0).toUpperCase() + names[names.length - 1].charAt(0).toUpperCase();
	} else if (names.length === 1) {
		return names[0].charAt(0).toUpperCase();
	}
	return "";
}

export default function Avatar(props_: {
	model: Profile | RosterContact;
	pickerdata?: { data_uri: string | null; image_type: string | null }; // might be useless
	width?: number;
	height?: number;
	nonce?: string; // apparently used to trigger rerenders
	name?: string;
	/**
	 * use this if square
	 */
	size?: number;
}) {
	const props = mergeProps(
		{
			height: 36,
			width: 36,
			name: "",
		},
		props_
	);

	const [src, setSrc] = createSignal("");
	const [color, setColor] = createSignal("");

	createRenderEffect(() => {
		const model = props.model;
		const pickerdata = props.pickerdata;
		props.nonce;

		untrack(() => {
			let image_type: string | null = null;
			let image: string | null = null;
			let data_uri: string | null = null;
			if (pickerdata) {
				image_type = pickerdata.image_type;
				data_uri = pickerdata.data_uri;
			} else {
				image_type = model.vcard?.get("image_type");
				image = model.vcard?.get("image");
			}

			batch(() => {
				if (image_type && (image || data_uri)) {
					setSrc(data_uri?.startsWith("data:") ? data_uri : `data:${image_type};base64,${image}`);
				} else {
					setSrc("");
					model.getColor().then(
						(color) => {
							// if model changes for some reason
							if (props.model != model) return;
							setColor(color);
						},
						() => {}
					);
				}
			});
		});
	});

	const size = createMemo(() => {
		const size = props.size;
		const width = props.width;
		const height = props.height;

		return size != null ? { width: size, height: size } : { width, height };
	});

	return (
		<Show
			when={src()}
			fallback={
				<div
					class={styles.avatar}
					style={{
						width: `${size().width}px`,
						height: `${size().height}px`,
						"font-size": `${size().width / 2}px`,
						"line-height": `${size().height}px`,
						"background-color": color() || "gray",
					}}
				>
					{getInitials(props.name)}
				</div>
			}
		>
			<div
				class={styles.avatar}
				style={{ width: `${props.width}px`, height: `${props.height}px`, "background-image": `url(${src()})` }}
			/>
		</Show>
	);
}
