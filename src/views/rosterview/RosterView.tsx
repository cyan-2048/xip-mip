import { createStore, reconcile } from "solid-js/store";
import { For, onCleanup, onMount } from "solid-js";
import CustomElement from "@/lib/CustomElement";
import { _converse } from "@convo";
import type { Profile, RosterContact } from "@converse/headless";
import {
	contactsComparator,
	ContactsMap,
	groupsComparator,
	populateContactsMap,
	shouldShowContact,
	shouldShowGroup,
} from "./utils";
import { _converse_ready } from "@/stores";
import RosterContactView from "./RosterContactView";

export default function RosterView() {
	const [state, setState] = createStore<Array<{ id: string; contacts: Array<Profile | RosterContact>; name: string }>>(
		[]
	);

	class _RosterView extends CustomElement {
		render = () => {
			console.log("UPDATE CALLED!");

			// const roster = [...(state.roster || []), ...(_converse.api.settings.get("show_self_in_roster") ? [state.xmppstatus] : [])];

			const roster = [...(_converse.state.roster || []), _converse.state.xmppstatus];

			const contacts_map: ContactsMap = roster.reduce((acc, contact) => populateContactsMap(acc, contact), {});

			const groupnames = Object.keys(contacts_map).filter((contact) => shouldShowGroup(contact));

			// I don't wanna code this lol
			// const is_closed = el.model.get("toggle_state") === CLOSED;

			groupnames.sort(groupsComparator);

			setState(
				reconcile(
					groupnames.map((name) => {
						const contacts = contacts_map[name].filter((c) => shouldShowContact(c, name));
						contacts.sort(contactsComparator);
						return { contacts, id: name, name };
					})
				)
			);
		};

		async initialize() {
			await _converse_ready.promise;
			await _converse.api.waitUntil("rosterInitialized");

			const render = this.render;

			const { chatboxes, presences, roster } = _converse.state;
			this.listenTo(_converse, "rosterContactsFetched", render);
			this.listenTo(presences, "change:show", render);
			this.listenTo(chatboxes, "change:hidden", render);
			this.listenTo(roster, "add", render);
			this.listenTo(roster, "destroy", render);
			this.listenTo(roster, "remove", render);
			this.listenTo(roster, "change", render);
			this.listenTo(roster, "presence:change", render);
			this.listenTo(roster.state, "change", render);

			render();
		}
	}

	const view = new _RosterView();

	const _promise = view.initialize();

	onCleanup(() => {
		_promise.then(() => {
			view.stopListening();
		});
	});

	return (
		<div>
			<For each={state}>
				{({ name, contacts }) => (
					<div>
						<div>
							{name} ({contacts.length})
						</div>
						<For each={contacts}>{(model) => <RosterContactView model={model}></RosterContactView>}</For>
					</div>
				)}
			</For>
		</div>
	);
}
