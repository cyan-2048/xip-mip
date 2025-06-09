import { onMount } from "solid-js";
import Content from "./components/Content";
import styles from "./Home.module.scss";
import { setSoftkeys } from "@/stores";

export default function Home() {
	onMount(() => {
		setSoftkeys("HI", "HI", "HI");
	});

	return (
		<Content>
			<div></div>
		</Content>
	);
}
