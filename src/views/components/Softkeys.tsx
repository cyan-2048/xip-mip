import { batch, createEffect, createSignal, onCleanup } from "solid-js";
import styles from "./Softkeys.module.scss";
import { Show } from "solid-js";
import { sleep } from "@utils";
import { setSoftkeys } from "@stores";

function Softkeys__(props: {
	left?: string;
	center?: string;
	right?: string;
	loading?: boolean;
	black?: boolean;
	hidden?: boolean;
}) {
	const [previous, setPrevious] = createSignal<null | [string, string, string, boolean]>(null);
	const [softkeys, setSoftkeys] = createSignal<[string, string, string, boolean]>([
		props.left || "",
		props.center || "",
		props.right || "",
		Boolean(props.black),
	]);

	createEffect(() => {
		const keys: [string, string, string, boolean] = [
			props.left || "",
			props.center || "",
			props.right || "",
			Boolean(props.black),
		];
		setSoftkeys(keys);
		onCleanup(async () => {
			setPrevious(keys);
			await sleep(200);
			setPrevious(null);
		});
	});

	return (
		<div classList={{ [styles.softkeys]: true, [styles.hidden]: props.hidden }}>
			<Show when={previous()}>
				<div classList={{ [styles.previous]: true, [styles.black]: previous()![3] }}>
					<div>{previous()![0]}</div>
					<div>{previous()![1]}</div>
					<div>{previous()![2]}</div>
				</div>
			</Show>
			<div
				classList={{
					[styles.current]: true,
					[styles.loading]: props.loading,
					[styles.black]: softkeys()[3],
				}}
			>
				<div>{softkeys()[0]}</div>
				<div>{softkeys()[1]}</div>
				<div>{softkeys()[2]}</div>
			</div>
		</div>
	);
}

// I got lazy lol
export default function Softkeys() {
	const [softleft, setSoftleft] = createSignal("");
	const [softcenter, setSoftcenter] = createSignal("");
	const [softright, setSoftright] = createSignal("");
	const [softkeysLoading, setSoftkeysLoading] = createSignal(false);
	const [softkeysBlack, setSoftkeysBlack] = createSignal(false);
	const [hidden, setHidden] = createSignal(false);

	setSoftkeys.v = function (
		left?: string | null,
		center?: string | null,
		right?: string | null,
		loading?: boolean | null,
		black?: boolean | null
	) {
		batch(() => {
			left != undefined && setSoftleft(left);
			center != undefined && setSoftcenter(center);
			right != undefined && setSoftright(right);

			loading == undefined ? setSoftkeysLoading(false) : setSoftkeysLoading(Boolean(loading));
			black == undefined ? setSoftkeysBlack(false) : setSoftkeysBlack(Boolean(black));
		});
	};

	setSoftkeys.hide = function (hide) {
		setHidden(hide);
	};

	return (
		<Softkeys__
			left={softleft()}
			center={softcenter()}
			right={softright()}
			loading={softkeysLoading()}
			black={softkeysBlack()}
			hidden={hidden()}
		/>
	);
}
