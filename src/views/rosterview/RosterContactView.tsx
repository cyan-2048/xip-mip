import CustomElement from "@/lib/CustomElement";
import type { VCard, Profile, RosterContact } from "@converse/headless";
import { batch, createEffect, createRenderEffect, createSignal, Match, onCleanup, Switch, untrack } from "solid-js";
import Avatar from "../converse/Avatar";

const enum ContactTypes {
	Default,
	Requesting,
	Unsaved,
}

type ContactStatus = ReturnType<Profile["getStatus"]>;

function getUnreadMsgsDisplay(model: Profile | RosterContact) {
	const num_unread = model.get("num_unread") || 0;
	return num_unread < 100 ? String(num_unread) : "99+";
}

function RequestingContact(props: {
	jid: string;
	displayName: string; // el.model.getDisplayName()
	num_unread: string;
	vcard_updated: string;
	model: Profile | RosterContact;
}) {
	return (
		<div>
			<ul>
				<li>
					<Avatar
						model={props.model}
						height={30}
						width={30}
						name={props.displayName}
						nonce={props.vcard_updated}
					></Avatar>
				</li>
				<li>type: RequestingContact</li>
				<li>jid: {props.jid}</li>
				<li>num_unread: {props.num_unread}</li>
				<li>displayName: {props.displayName}</li>
				<li>vcard_updated: {props.vcard_updated}</li>
			</ul>
		</div>
	);
}

function UnsavedContact(props: {
	jid: string;
	displayName: string; // el.model.getDisplayName()
	num_unread: string;
	vcard_updated: string;
	model: Profile | RosterContact;
}) {
	return (
		<div>
			<ul>
				<li>
					<Avatar
						model={props.model}
						height={30}
						width={30}
						name={props.displayName}
						nonce={props.vcard_updated}
					></Avatar>
				</li>
				<li>type: UnsavedContact</li>
				<li>jid: {props.jid}</li>
				<li>num_unread: {props.num_unread}</li>
				<li>displayName: {props.displayName}</li>
				<li>vcard_updated: {props.vcard_updated}</li>
			</ul>
		</div>
	);
}

function RosterItem(props: {
	status: ContactStatus;
	jid: string;
	num_unread: string;
	displayName: string; // el.model.getDisplayName({ context: 'roster' })
	model: Profile | RosterContact;
}) {
	return (
		<div>
			<ul>
				<li>
					<Avatar model={props.model} height={30} width={30} name={props.displayName}></Avatar>
				</li>
				<li>type: RosterItem</li>
				<li>status: {props.status}</li>
				<li>jid: {props.jid}</li>
				<li>num_unread: {props.num_unread}</li>
				<li>displayName: {props.displayName}</li>
			</ul>
		</div>
	);
}

export default function RosterContactView(props: { model: RosterContact | Profile }) {
	const [contactType, setContactType] = createSignal(ContactTypes.Default);
	const [status, setStatus] = createSignal<ContactStatus | null>(null);
	const [jid, setJid] = createSignal("");
	const [num_unread, setNumUnread] = createSignal("");
	const [displayName, setDisplayName] = createSignal("");
	const [vcard_updated, setVcardUpdated] = createSignal("");

	class _RosterContactView extends CustomElement {
		render = () => {
			batch(() => {
				setJid(props.model.get("jid"));
				setNumUnread(getUnreadMsgsDisplay(props.model));
				setVcardUpdated("");

				let displayNameContext: null | { context: "roster" } = null;
				let vcard: VCard | null = null;

				if (props.model.get("requesting") === true) {
					setContactType(ContactTypes.Requesting);
					vcard = props.model.vcard;
				} else if (!props.model.get("subscription")) {
					setContactType(ContactTypes.Unsaved);
					vcard = props.model.vcard;
				} else {
					displayNameContext = { context: "roster" };
					setContactType(ContactTypes.Default);
					setStatus(props.model.getStatus() || "offline");
				}

				setDisplayName(
					displayNameContext ? props.model.getDisplayName(displayNameContext) : props.model.getDisplayName()
				);

				if (vcard) {
					setVcardUpdated(vcard.get("vcard_updated") || "");
				}
			});
		};

		initialize() {
			const render = this.render;

			this.listenTo(props.model, "change", render);
			this.listenTo(props.model, "highlight", render);
			this.listenTo(props.model, "vcard:add", render);
			this.listenTo(props.model, "vcard:change", render);
			this.listenTo(props.model, "presence:change", render);

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

	return (
		<div>
			<Switch>
				<Match when={contactType() == ContactTypes.Default}>
					<RosterItem
						status={status()!}
						jid={jid()}
						displayName={displayName()}
						model={props.model}
						num_unread={num_unread()}
					></RosterItem>
				</Match>
				<Match when={contactType() == ContactTypes.Unsaved}>
					<UnsavedContact
						jid={jid()}
						displayName={displayName()}
						model={props.model}
						num_unread={num_unread()}
						vcard_updated={vcard_updated()}
					></UnsavedContact>
				</Match>
				<Match when={contactType() == ContactTypes.Requesting}>
					<RequestingContact
						jid={jid()}
						displayName={displayName()}
						model={props.model}
						num_unread={num_unread()}
						vcard_updated={vcard_updated()}
					></RequestingContact>
				</Match>
			</Switch>
		</div>
	);
}
