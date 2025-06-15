import Content from "./components/Content";

import Tabs, { Tab } from "./components/Tabs";
import { lazy } from "solid-js";

const RosterView = lazy(() => import("./rosterview/RosterView"));

export default function Home(props: { hidden?: boolean }) {
	return (
		<Content
			hidden={props.hidden}
			before={
				<Tabs>
					<Tab selected>Contacts</Tab>
					<Tab>Groupchats</Tab>
				</Tabs>
			}
		>
			<RosterView></RosterView>
		</Content>
	);
}
