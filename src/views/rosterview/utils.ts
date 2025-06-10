import { _converse } from "@convo";
import type { Profile, RosterContact } from "@converse/headless";

function getFilterCriteria(contact: Profile | RosterContact) {
	const nick =
		contact instanceof (_converse.exports.Profile as typeof Profile) ? contact.getNickname() : contact.get("nickname");
	const jid = contact.get("jid");
	let criteria = contact.getDisplayName({ context: "roster" });
	criteria = !criteria.includes(jid) ? criteria.concat(`   ${jid}`) : criteria;
	criteria = !criteria.includes(nick) ? criteria.concat(`   ${nick}`) : criteria;
	return criteria.toLowerCase();
}

export function isContactFiltered(contact: Profile | RosterContact, groupname: string) {
	const filter = _converse.state.roster_filter;
	const type = filter.get("type");
	const q = type === "state" ? filter.get("state").toLowerCase() : filter.get("text").toLowerCase();

	if (!q) return false;

	if (type === "state") {
		const sticky_groups = [_converse.labels.HEADER_REQUESTING_CONTACTS, _converse.labels.HEADER_UNREAD];
		if (sticky_groups.includes(groupname)) {
			// When filtering by chat state, we still want to
			// show sticky groups, even though they don't
			// match the state in question.
			return false;
		} else if (q === "unread_messages") {
			return contact.get("num_unread") === 0;
		} else if (q === "online") {
			return ["offline", "unavailable", "dnd", "away", "xa"].includes(contact.getStatus());
		} else {
			return !contact.getStatus().includes(q);
		}
	} else if (type === "items") {
		return !getFilterCriteria(contact).includes(q);
	}
}

export function shouldShowContact(contact: RosterContact | Profile, groupname: string, isFiltering = false) {
	if (!isFiltering) return true;

	/*
	const chat_status = contact.getStatus();
	
  if (api.settings.get("hide_offline_users") && chat_status === "offline") {
		// If pending or requesting, show
		if (
			contact.get("ask") === "subscribe" ||
			contact.get("subscription") === "from" ||
			contact.get("requesting") === true
		) {
			return !isContactFiltered(contact, groupname);
		}
		return false;
	}
  */
	return !isContactFiltered(contact, groupname);
}

export function groupsComparator(a: string, b: string): 0 | 1 | -1 {
	const HEADER_WEIGHTS: any = {};
	const {
		HEADER_CURRENT_CONTACTS,
		HEADER_REQUESTING_CONTACTS,
		HEADER_UNGROUPED,
		HEADER_UNREAD,
		HEADER_PENDING_CONTACTS,
		HEADER_UNSAVED_CONTACTS,
	} = _converse.labels as any;

	HEADER_WEIGHTS[HEADER_UNREAD] = 0;
	HEADER_WEIGHTS[HEADER_UNSAVED_CONTACTS] = 1;
	HEADER_WEIGHTS[HEADER_REQUESTING_CONTACTS] = 2;
	HEADER_WEIGHTS[HEADER_CURRENT_CONTACTS] = 3;
	HEADER_WEIGHTS[HEADER_UNGROUPED] = 4;
	HEADER_WEIGHTS[HEADER_PENDING_CONTACTS] = 5;

	const WEIGHTS = HEADER_WEIGHTS;
	const special_groups = Object.keys(HEADER_WEIGHTS);
	const a_is_special = special_groups.includes(a);
	const b_is_special = special_groups.includes(b);
	if (!a_is_special && !b_is_special) {
		return a.toLowerCase() < b.toLowerCase() ? -1 : a.toLowerCase() > b.toLowerCase() ? 1 : 0;
	} else if (a_is_special && b_is_special) {
		return WEIGHTS[a] < WEIGHTS[b] ? -1 : WEIGHTS[a] > WEIGHTS[b] ? 1 : 0;
	} else if (!a_is_special && b_is_special) {
		const a_header = HEADER_CURRENT_CONTACTS;
		return WEIGHTS[a_header] < WEIGHTS[b] ? -1 : WEIGHTS[a_header] > WEIGHTS[b] ? 1 : 0;
	} else if (a_is_special && !b_is_special) {
		const b_header = HEADER_CURRENT_CONTACTS;
		return WEIGHTS[a] < WEIGHTS[b_header] ? -1 : WEIGHTS[a] > WEIGHTS[b_header] ? 1 : 0;
	}

	console.error("THIS IS WHY YOU NEED TYPESCRIPT BRUV");
	return 0;
}

export function shouldShowGroup(group: string, isFiltering = false) {
	if (!isFiltering) return true;

	const filter = _converse.state.roster_filter;
	const type = filter.get("type");
	if (type === "groups") {
		const q = filter.get("text")?.toLowerCase();
		if (!q) {
			return true;
		}
		if (!group.toLowerCase().includes(q)) {
			return false;
		}
	}
	return true;
}

export type ContactsMap = {
	[key: string]: (Profile | RosterContact)[];
};

export function populateContactsMap(contacts_map: ContactsMap, contact: RosterContact | Profile): ContactsMap {
	const u = _converse.env.u;
	const labels: Record<string, string> = _converse.labels as any;

	const contact_groups: string[] = u.unique(contact.get("groups") ?? []);

	if (u.isOwnJID(contact.get("jid")) && !contact_groups.length) {
		contact_groups.push(labels.HEADER_UNGROUPED);
	} else if (contact.get("requesting")) {
		contact_groups.push(labels.HEADER_REQUESTING_CONTACTS);
	} else if (contact.get("ask") === "subscribe") {
		contact_groups.push(labels.HEADER_PENDING_CONTACTS);
	} else if (contact.get("subscription") === undefined) {
		contact_groups.push(labels.HEADER_UNSAVED_CONTACTS);
	}
	//  else if (!api.settings.get("roster_groups")) {
	//  	contact_groups.push(labels.HEADER_CURRENT_CONTACTS);
	// }
	else if (!contact_groups.length) {
		contact_groups.push(labels.HEADER_UNGROUPED);
	}

	for (const name of contact_groups) {
		if (contacts_map[name]?.includes(contact)) {
			continue;
		}
		contacts_map[name] ? contacts_map[name].push(contact) : (contacts_map[name] = [contact]);
	}

	if (contact.get("num_unread")) {
		const name = labels.HEADER_UNREAD;
		contacts_map[name] ? contacts_map[name].push(contact) : (contacts_map[name] = [contact]);
	}
	return contacts_map;
}

export function contactsComparator(contact1: RosterContact | Profile, contact2: RosterContact | Profile) {
	const { STATUS_WEIGHTS } = _converse.constants;

	const status1 = (contact1 as Profile).getStatus();
	const status2 = (contact2 as Profile).getStatus();

	if (STATUS_WEIGHTS[status1] === STATUS_WEIGHTS[status2]) {
		const name1 = contact1.getDisplayName().toLowerCase();
		const name2 = contact2.getDisplayName().toLowerCase();
		return name1 < name2 ? -1 : name1 > name2 ? 1 : 0;
	} else {
		return STATUS_WEIGHTS[status1] < STATUS_WEIGHTS[status2] ? -1 : 1;
	}
}
