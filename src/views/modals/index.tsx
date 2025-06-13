import { createSignal, Match, Switch } from "solid-js";
import Alert from "./Alert";
import Confirm from "./Confirm";
import Prompt from "./Prompt";
import { sleep } from "@utils";
import Select from "./Select";

const NOOP = () => {};

const enum Modal {
	Alert,
	Confirm,
	Prompt,
	Select,
}

export function alert(text = "", title = "Convo") {
	return alert.v(text, title);
}

alert.v = (_text: string, _title: string): Promise<void> => Promise.resolve();

export function confirm(text = "", title = "Convo", yes = "OK", no = "Cancel") {
	return confirm.v(text, title, yes, no);
}

confirm.v = (_text: string, _title: string, _yes: string, _no: string): Promise<boolean> => Promise.resolve(false);

export function prompt(text = "", defaultValue = "", title = "Convo", yes = "OK", no = "Cancel") {
	return prompt.v(text, defaultValue, title, yes, no);
}

prompt.v = (_text: string, _defaultValue: string, _title: string, _yes: string, _no: string): Promise<string | null> =>
	Promise.resolve(null);

export function select<T>(arr: [string, T][], selected?: T) {
	return select.v(arr, selected);
}

select.v = <T,>(_arr: [string, T][], _selected?: T): Promise<T | null> => Promise.resolve(null);

export default function Modals() {
	let text = "",
		title = "",
		resolveText = "",
		rejectText = "",
		promptDefault = "",
		selected: any = null,
		items: [string, any][] = [];

	const [modal, setModal] = createSignal<null | Modal>(null);

	let _callback: (val: any) => void = NOOP;

	select.v = function (_items, _selected) {
		return new Promise((res) => {
			selected = _selected;
			items = _items;

			setModal(Modal.Select);

			_callback = res;
		});
	};

	alert.v = function (_text, _title) {
		return new Promise((res) => {
			text = _text;
			title = _title;

			setModal(Modal.Alert);

			_callback = res;
		});
	};

	confirm.v = function (_text, _title, yes, no) {
		return new Promise((res) => {
			text = _text;
			title = _title;
			resolveText = yes;
			rejectText = no;

			setModal(Modal.Confirm);

			_callback = res;
		});
	};

	prompt.v = function (_text, defaultValue, _title, yes, no) {
		return new Promise((res) => {
			text = _text;
			title = _title;
			resolveText = yes;
			rejectText = no;
			promptDefault = defaultValue;

			setModal(Modal.Prompt);

			_callback = res;
		});
	};

	return (
		<Switch>
			<Match when={modal() == Modal.Select}>
				<Select
					items={items}
					selected={selected}
					onClose={async (result) => {
						setModal(null);

						selected = null;
						items = [];

						await sleep(10);
						_callback(result);
					}}
				></Select>
			</Match>
			<Match when={modal() == Modal.Alert}>
				<Alert
					title={title}
					text={text}
					onClose={() => {
						setModal(null);
						text = title = "";

						sleep(10).then(_callback);
					}}
				></Alert>
			</Match>
			<Match when={modal() == Modal.Confirm}>
				<Confirm
					title={title}
					text={text}
					reject={rejectText}
					resolve={resolveText}
					onClose={async (result) => {
						setModal(null);
						text = title = rejectText = resolveText = "";

						await sleep(10);
						_callback(result);
					}}
				></Confirm>
			</Match>
			<Match when={modal() == Modal.Prompt}>
				<Prompt
					defaultValue={promptDefault}
					title={title}
					text={text}
					reject={rejectText}
					resolve={resolveText}
					onClose={async (result) => {
						setModal(null);
						text = title = rejectText = resolveText = promptDefault = "";

						await sleep(10);
						_callback(result);
					}}
				></Prompt>
			</Match>
		</Switch>
	);
}
