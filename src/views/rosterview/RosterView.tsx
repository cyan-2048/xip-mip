import { createStore, reconcile, SetStoreFunction } from "solid-js/store";
import { createUniqueId, For, onCleanup, onMount } from "solid-js";
import CustomElement from "@/lib/CustomElement";
import { _converse, api } from "@convo";
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
import Separator from "../components/Separator";
import SpatialNavigation from "@/lib/spatial_navigation";

class _RosterView extends CustomElement {
	constructor(
		private _setState: SetStoreFunction<
			{
				id: string;
				contacts: Array<Profile | RosterContact>;
				name: string;
			}[]
		>
	) {
		super();
	}

	setState(
		state: {
			id: string;
			contacts: Array<Profile | RosterContact>;
			name: string;
		}[]
	) {
		console.log("Render CALLED!");
		this._setState(reconcile(state));
	}

	render = () => {
		// const roster = [...(state.roster || []), ...(_converse.api.settings.get("show_self_in_roster") ? [state.xmppstatus] : [])];

		const roster = [...(_converse.state.roster || []), _converse.state.xmppstatus];

		const contacts_map: ContactsMap = roster.reduce((acc, contact) => populateContactsMap(acc, contact), {});

		const groupnames = Object.keys(contacts_map).filter((contact) => shouldShowGroup(contact));

		// I don't wanna code this lol
		// const is_closed = el.model.get("toggle_state") === CLOSED;

		groupnames.sort(groupsComparator);

		this.setState(
			groupnames.map((name) => {
				const contacts = contacts_map[name].filter((c) => shouldShowContact(c, name));
				contacts.sort(contactsComparator);
				return { contacts, id: name, name };
			})
		);
	};

	async initialize() {
		await _converse_ready.promise;
		await api.waitUntil("rosterInitialized");

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

export default function RosterView() {
	const [state, setState] = createStore<Array<{ id: string; contacts: Array<Profile | RosterContact>; name: string }>>(
		[]
	);

	const view = new _RosterView(setState);

	const _promise = view.initialize();

	const id = createUniqueId();

	onMount(() => {
		SpatialNavigation.add("rosters", {
			selector: `.${id} .focusable`,
			rememberSource: true,
			restrict: "self-only",
			defaultElement: `.${id}`,
			enterTo: "last-focused",
		});

		SpatialNavigation.focus("rosters");
	});

	onCleanup(() => {
		SpatialNavigation.remove("rosters");

		_promise.then(() => {
			view.stopListening();
		});
	});

	return (
		<div class={id}>
			<For each={state}>
				{({ name, contacts }) => (
					<>
						<Separator sticky={0}>
							{name} ({contacts.length})
						</Separator>

						<For each={contacts}>{(model) => <RosterContactView model={model}></RosterContactView>}</For>
					</>
				)}
			</For>
		</div>
	);
}
