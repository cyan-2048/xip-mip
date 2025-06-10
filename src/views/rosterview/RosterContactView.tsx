import CustomElement from "@/lib/CustomElement";
import type { Profile, RosterContact } from "@converse/headless";
import { batch, createEffect, createRenderEffect, createSignal, onCleanup, untrack } from "solid-js";

const enum ContactTypes {
	Default,
	Requesting,
	Unsaved,
}

function UnsavedView(props: {
	jid: string;
	// el.model.getDisplayName();
	displayName: string;
	num_unread: string;
}) {}

function RosterItem(props: {
	status: Profile["getStatus"];

	jid: string;

	num_unread: string;
	// el.model.getDisplayName({ context: 'roster' });
	displayName: string;
}) {}

export default function RosterContactView(props: { model: RosterContact }) {
	const [contactType, setContactType] = createSignal(ContactTypes.Default);

	class _RosterContactView extends CustomElement {
		render = () => {
			batch(() => {
				setContactType(ContactTypes.Default);
				if (props.model.get("requesting") === true) {
					setContactType(ContactTypes.Requesting);
				} else if (!props.model.get("subscription")) {
					setContactType(ContactTypes.Unsaved);
				}
			});
		};

		initialize() {
			const render = this.render;

			this.listenTo(props.model, "change", () => render);
			this.listenTo(props.model, "highlight", () => render);
			this.listenTo(props.model, "vcard:add", () => render);
			this.listenTo(props.model, "vcard:change", () => render);
			this.listenTo(props.model, "presence:change", () => render);

			render();
		}
	}

	let view: _RosterContactView | null = null;

	createRenderEffect(() => {
		// if the model changes for some reason
		props.model;

		untrack(() => {
			view?.stopListening();
			view = new _RosterContactView();
			view.initialize();
		});
	});

	onCleanup(() => {
		view?.stopListening();
	});

	return <div></div>;
}
