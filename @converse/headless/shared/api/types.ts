import dayjs from "dayjs";
import { $build, $iq, $msg, $pres, Strophe, Stanza } from "strophe.js";
// @ts-ignore
import { Model, Collection } from "@converse/skeletor";
import u from "../../utils/index.js";
import sizzle from "sizzle";

/**
 * Utility methods and globals from bundled 3rd party libraries.
 */
export type ConverseEnv = {
	$build: typeof $build;
	$iq: typeof $iq;
	$msg: typeof $msg;
	$pres: typeof $pres;
	Collection: typeof Collection;
	Model: typeof Model;
	Stanza: typeof Stanza;
	Strophe: typeof Strophe;
	TimeoutError: any;
	dayjs: typeof dayjs;
	sizzle: typeof sizzle;
	sprintf: (...args: any[]) => string;
	u: typeof u;
};
