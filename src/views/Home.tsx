import { onMount } from "solid-js";
import Content from "./components/Content";
import styles from "./Home.module.scss";
import { setSoftkeys } from "@/stores";
import RosterView from "./rosterview/RosterView";

export default function Home() {
	onMount(() => {
		setSoftkeys("HI", "HI", "HI");
	});

	return (
		<Content>
			<RosterView></RosterView>
		</Content>
	);
}
