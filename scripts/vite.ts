import esbuild from "esbuild";
import fs from "fs";
import { resolve } from "path";
import * as cheerio from "cheerio";
import { PluginOption, ResolvedConfig } from "vite";
import { minify } from "html-minifier-terser";
import MagicString from "magic-string";

const isKai3 = process.env.KAIOS == "3";
const isCanary = process.env.CANARY == "1";
// the plugin should only work if you're building for KaiOS
const production = process.env.NODE_ENV === "production";

const polyfillScript =
	(
		await esbuild.build({
			entryPoints: [`${__dirname}/polyfills/polyfills.mjs`],
			bundle: true,
			minify: !isCanary,
			target: isKai3 ? "es2020" : "es6",
			format: "iife",
			sourcemap: false,
			treeShaking: true,
			write: false,
			define: {
				"import.meta.env.KAIOS": isKai3 ? "3" : "2",
				"import.meta.env.DEV": JSON.stringify(!production),
				"import.meta.env.PROD": JSON.stringify(production),

				// replace these values in core-js
				ENVIRONMENT: '"BROWSER"',
				V8_VERSION: "NaN",

				NATIVE_BIND: "true",
				NATIVE_SYMBOL: "true",
				USE_SYMBOL_AS_UID: "true",
				DESCRIPTORS: "true",

				"Symbol.sham": "false",
				IS_WEBOS_WEBKIT: "false",
				IS_PURE: "false",
				IS_IOS: "false",
				IE8_DOM_DEFINE: "false",
				IS_IOS_PEBBLE: "false",
				IS_NODE: "false",
				V8_PROTOTYPE_DEFINE_BUG: "false",
				TO_STRING_TAG_SUPPORT: "false",
				BUGGY_SAFARI_ITERATORS: "false",
			},

			logOverride: {
				"package.json": "silent",
				"import-is-undefined": "silent",
			},

			plugins: [
				{
					name: "text-replace",
					setup(build) {
						build.onLoad({ filter: /dist\/(s|(extras\/amd))\.js$/ }, async (args) => {
							let contents = await fs.promises.readFile(args.path, "utf8");

							// for now, there's pretty much no use case for SystemJS on KaiOS 3.0
							// on KaiOS 3.0 esm on WebWorkers don't work
							// but using SystemJS when bare esm support exists doesn't sound right
							if (isKai3) {
								contents = "";
							} /* else if (args.path.endsWith("systemjs/dist/s.js")) {
								// for debug purposes, will remove once I am confident about specific things
								contents = contents.replace(
									"document.head.removeChild(script);",
									`console.info("Module loaded: ",script.src);document.head.removeChild(script);`
								);
							} */

							return { contents, loader: "js" };
						});

						if (isKai3) {
							// we don't need EventTarget polyfill on KaiOS 3.0
							build.onLoad({ filter: /event-target.js$/ }, () => {
								return { contents: "", loader: "js" };
							});

							// we don't need ReadableStream polyfill on KaiOS 3.0
							build.onLoad({ filter: /web-streams-polyfill\/dist\/ponyfill.js$/ }, () => {
								return { contents: "", loader: "js" };
							});

							build.onLoad({ filter: /core-js/ }, () => {
								return { contents: "", loader: "js" };
							});
						} else {
							// why do I need to do this?
							build.onLoad({ filter: /core-js/ }, async (args) => {
								const absoluteReplacements: [string, string][] = [
									// Reflect is fully supported on KaiOS 2.5
									[
										"core-js/internals/is-constructor.js",
										"var isCallable = require('../internals/is-callable');\n\nvar noop = function () { /* empty */ };\nvar construct = Reflect.construct;\n\nvar isConstructorModern = function isConstructor(argument) {\n  if (!isCallable(argument)) return false;\n  try {\n    construct(noop, [], argument);\n    return true;\n  } catch (error) {\n    return false;\n  }\n};\n\n// `IsConstructor` abstract operation\n// https://tc39.es/ecma262/#sec-isconstructor\nmodule.exports = isConstructorModern;\n",
									],
									["core-js/internals/own-keys.js", "module.exports = Reflect.ownKeys;"],

									// no need to test these static methods
									["core-js/internals/object-get-prototype-of.js", "module.exports = Object.getPrototypeOf;"],
									["core-js/internals/object-set-prototype-of.js", "module.exports = Object.setPrototypeOf"],
									["core-js/internals/object-define-property.js", "exports.f = Object.defineProperty;"],
									[
										"core-js/internals/object-get-own-property-descriptor.js",
										"exports.f = Object.getOwnPropertyDescriptor;",
									],
									["core-js/internals/object-create.js", "module.exports = Object.create;"],

									// these are supported on KaiOS 2.5
									["core-js/modules/es.array.iterator.js", ""],
									["core-js/modules/es.string.from-code-point.js", ""],
									["core-js/modules/es.string.iterator.js", ""],

									[
										"core-js/internals/is-callable.js",
										"module.exports = function (argument) {\n  return typeof argument == 'function';\n};",
									],
								];

								for (const [path, contents] of absoluteReplacements) {
									if (args.path.endsWith(path)) {
										return {
											contents,
											loader: "js",
										};
									}
								}

								let contents = await fs.promises.readFile(args.path, "utf8");

								const replacements: ([string, string] | [string, string, [string, string][]])[] = [
									["var BUGGY_SAFARI_ITERATORS = IteratorsCore.BUGGY_SAFARI_ITERATORS;", ""],
									["var USE_SYMBOL_AS_UID = require('../internals/use-symbol-as-uid');", ""],
									["var DESCRIPTORS = require('../internals/descriptors');", ""],
									["var ENVIRONMENT = require('../internals/environment');", ""],
									[`var IS_NODE = require('../internals/environment-is-node');`, ""],
									["var V8_VERSION = require('../internals/environment-v8-version');", ""],
									["var IS_PURE = require('../internals/is-pure');", ""],
									["var IS_IOS = require('../internals/environment-is-ios');", ""],
									["var IS_WEBOS_WEBKIT = require('../internals/environment-is-webos-webkit');", ""],
									["var TO_STRING_TAG_SUPPORT = require('../internals/to-string-tag-support');", ""],
									// // who the fuck still uses I8???
									["var IE8_DOM_DEFINE = require('../internals/ie8-dom-define');", ""],
									["var V8_PROTOTYPE_DEFINE_BUG = require('../internals/v8-prototype-define-bug');", ""],
									["var NATIVE_SYMBOL = require('../internals/symbol-constructor-detection');", ""],
									["var objectKeys = require('../internals/object-keys');", "var objectKeys = Object.keys;"],

									// iterators exist on KaiOS 2.5 (except async ones)
									[
										"if ([].keys) {\n  arrayIterator = [].keys();\n  // Safari 8 has buggy iterators w/o `next`\n  if (!('next' in arrayIterator)) BUGGY_SAFARI_ITERATORS = true;\n  else {\n    PrototypeOfArrayIteratorPrototype = getPrototypeOf(getPrototypeOf(arrayIterator));\n    if (PrototypeOfArrayIteratorPrototype !== Object.prototype) IteratorPrototype = PrototypeOfArrayIteratorPrototype;\n  }\n}",
										"if ([].keys) {\n  arrayIterator = [].keys();\n  \n    PrototypeOfArrayIteratorPrototype = getPrototypeOf(getPrototypeOf(arrayIterator));\n    if (PrototypeOfArrayIteratorPrototype !== Object.prototype) IteratorPrototype = PrototypeOfArrayIteratorPrototype;\n  \n}",
										[
											[
												"var NEW_ITERATOR_PROTOTYPE = !isObject(IteratorPrototype) || fails(function () {\n  var test = {};\n  // FF44- legacy iterators case\n  return IteratorPrototype[ITERATOR].call(test) !== test;\n});\n\nif (NEW_ITERATOR_PROTOTYPE) IteratorPrototype = {};\nelse if (IS_PURE) IteratorPrototype = create(IteratorPrototype);",
												"",
											],
										],
									],

									[
										"var errorsArray = [];\n  iterate(errors, push, { that: errorsArray });",
										"var errorsArray = [...errors];",
										[
											["var iterate = require('../internals/iterate');", ""],
											["var push = [].push;", ""],
										],
									],

									// Promise.allSettled
									[
										"iterate(iterable, function (promise) {\n        var index = counter++;\n        var alreadyCalled = false;\n        remaining++;\n        call(promiseResolve, C, promise).then(function (value) {\n          if (alreadyCalled) return;\n          alreadyCalled = true;\n          values[index] = { status: 'fulfilled', value: value };\n          --remaining || resolve(values);\n        }, function (error) {\n          if (alreadyCalled) return;\n          alreadyCalled = true;\n          values[index] = { status: 'rejected', reason: error };\n          --remaining || resolve(values);\n        });\n      });",
										"[...iterable].forEach(promise => {\n        var index = counter++;\n        var alreadyCalled = false;\n        remaining++;\n        call(promiseResolve, C, promise).then(function (value) {\n          if (alreadyCalled) return;\n          alreadyCalled = true;\n          values[index] = { status: 'fulfilled', value: value };\n          --remaining || resolve(values);\n        }, function (error) {\n          if (alreadyCalled) return;\n          alreadyCalled = true;\n          values[index] = { status: 'rejected', reason: error };\n          --remaining || resolve(values);\n        });\n      });",
										[["var iterate = require('../internals/iterate');", ""]],
									],
									// Promise.all
									[
										"iterate(iterable, function (promise) {\n        var index = counter++;\n        var alreadyCalled = false;\n        remaining++;\n        call($promiseResolve, C, promise).then(function (value) {\n          if (alreadyCalled) return;\n          alreadyCalled = true;\n          values[index] = value;\n          --remaining || resolve(values);\n        }, reject);\n      });",
										"[...iterable].forEach(promise => {\n        var index = counter++;\n        var alreadyCalled = false;\n        remaining++;\n        call($promiseResolve, C, promise).then(function (value) {\n          if (alreadyCalled) return;\n          alreadyCalled = true;\n          values[index] = value;\n          --remaining || resolve(values);\n        }, reject);\n      })",
										[["var iterate = require('../internals/iterate');", ""]],
									],
									// Promise.any
									[
										"iterate(iterable, function (promise) {\n        var index = counter++;\n        var alreadyRejected = false;\n        remaining++;\n        call(promiseResolve, C, promise).then(function (value) {\n          if (alreadyRejected || alreadyResolved) return;\n          alreadyResolved = true;\n          resolve(value);\n        }, function (error) {\n          if (alreadyRejected || alreadyResolved) return;\n          alreadyRejected = true;\n          errors[index] = error;\n          --remaining || reject(new AggregateError(errors, PROMISE_ANY_ERROR));\n        });\n      });",
										"[...iterable].forEach(promise => {\n        var index = counter++;\n        var alreadyRejected = false;\n        remaining++;\n        call(promiseResolve, C, promise).then(function (value) {\n          if (alreadyRejected || alreadyResolved) return;\n          alreadyResolved = true;\n          resolve(value);\n        }, function (error) {\n          if (alreadyRejected || alreadyResolved) return;\n          alreadyRejected = true;\n          errors[index] = error;\n          --remaining || reject(new AggregateError(errors, PROMISE_ANY_ERROR));\n        });\n      });",
										[["var iterate = require('../internals/iterate');", ""]],
									],
									// Promise.race
									[
										"iterate(iterable, function (promise) {\n        call($promiseResolve, C, promise).then(capability.resolve, reject);\n      });",
										"[...iterable].forEach(promise => {\n        call($promiseResolve, C, promise).then(capability.resolve, reject);\n      });",
										[["var iterate = require('../internals/iterate');", ""]],
									],

									[
										"iterate(iterable, function (k, v) {\n      createProperty(obj, k, v);\n    }, { AS_ENTRIES: true });",
										"[...iterable].forEach(_ => {\n      var k = _[0];\n      var v = _[1];\n      createProperty(obj, k, v);\n    })",
										[["var iterate = require('../internals/iterate');", ""]],
									],

									// I prefer using Promise to emulate microtask
									[
										"var MutationObserver = globalThis.MutationObserver || globalThis.WebKitMutationObserver;",
										"var MutationObserver = false;",
									],
									["var IS_IOS_PEBBLE = require('../internals/environment-is-ios-pebble');", ""],
									["var trunc = require('../internals/math-trunc');", "var trunc = Math.trunc;"],
									[
										"NATIVE_WEAK_MAP || shared.state",
										"true",
										[
											["var NATIVE_WEAK_MAP = require('../internals/weak-map-basic-detection');", ""],
											["var createNonEnumerableProperty = require('../internals/create-non-enumerable-property');", ""],
											["var hasOwn = require('../internals/has-own-property');", ""],
											["var hiddenKeys = require('../internals/hidden-keys');", ""],
											["var STATE = sharedKey('state');", ""],
											["var sharedKey = require('../internals/shared-key');", ""],
										],
									],

									// use new Event instead of
									[
										"  if (DISPATCH_EVENT) {\n    event = document.createEvent('Event');\n    event.promise = promise;\n    event.reason = reason;\n    event.initEvent(name, false, true);\n    globalThis.dispatchEvent(event);\n  } else event = { promise: promise, reason: reason };",
										"  if (true) {\nevent = new Event(name, {\n\tbubbles: false,\n\tcancelable: true\n});\n/**\n   * Note: these properties should not be enumerable, which is the default setting\n   */\n  Object.defineProperties(event, {\n    promise: {\n      value: promise,\n      writable: false\n    },\n    reason: {\n      value: reason,\n      writable: false\n    }\n  });\n    globalThis.dispatchEvent(event);\n  } ",

										[
											["var DISPATCH_EVENT = !!(document && document.createEvent && globalThis.dispatchEvent);", ""],
											["var document = globalThis.document;", ""],
										],
									],

									[
										"var NATIVE_BIND = require('../internals/function-bind-native');",
										"",
										[
											[
												"module.exports = NATIVE_BIND ? uncurryThisWithBind : function (fn) {\n  return function () {\n    return call.apply(fn, arguments);\n  };\n};\n",
												"module.exports = uncurryThisWithBind;",
											],
											[
												"var FunctionPrototype = Function.prototype;\nvar apply = FunctionPrototype.apply;\nvar call = FunctionPrototype.call;\n\n// eslint-disable-next-line es/no-function-prototype-bind, es/no-reflect -- safe\nmodule.exports = typeof Reflect == 'object' && Reflect.apply || (NATIVE_BIND ? call.bind(apply) : function () {\n  return call.apply(apply, arguments);\n});",
												"module.exports = Reflect.apply;",
											],
										],
									],
								];

								for (const [match, replace, extra] of replacements) {
									if (contents.includes(match)) {
										contents = contents.replace(match, replace);

										if (extra) {
											// if a match occurs, here's some extra replacements that can be done
											for (const [match, replace] of extra) {
												if (contents.includes(match)) {
													contents = contents.replace(match, replace);
												}
											}
										}
									}
								}

								return { contents, loader: "js" };
							});
						}
					},
				},
			],
		})
	).outputFiles[0].text || "";

const forConstRegex = /for((\s?)*)\(((\s?)*)const/g;

/**
 *
 * @returns {import("vite").Plugin | undefined}
 */
export default function polyfillKaiOS(): PluginOption {
	let config: ResolvedConfig;
	const jsFiles = [];

	if (production)
		return {
			name: "polyfill-kai",

			configResolved(_config) {
				config = _config;
			},

			transformIndexHtml(html) {
				const $ = cheerio.load(html);

				$("script").each(function () {
					const script = $(this);
					jsFiles.push(script.attr("src"));

					if (!isKai3) script.attr("type", "systemjs-module");
					script.removeAttr("crossorigin");
				});

				$("head").prepend(
					`<script src="libsignal-protocol.js" async></script><script src="polyfills.js" defer></script>`
				);

				$("link").each(function () {
					const link = $(this);
					link.removeAttr("crossorigin");
				});

				return minify($.html(), { collapseWhitespace: true, collapseBooleanAttributes: true });
			},

			writeBundle() {
				const filePath = resolve(config.root, config.build.outDir, "polyfills.js");
				// console.log(filePath);

				const text = `("polyfills" + (typeof importScripts < "u" ? " (worker)" : ""));`;

				fs.writeFileSync(
					filePath,
					`"use strict";` +
						"console.time" +
						text +
						// replace use strict, this could be an esbuild issue actually
						polyfillScript.replaceAll(`"use strict";`, "") +
						"console.timeEnd" +
						text +
						"\n"
				);
			},

			generateBundle(options, bundle) {
				for (const fileName in bundle) {
					// minify the json files
					if (fileName.endsWith(".json")) {
						const output = bundle[fileName];
						if (output && output.type == "asset") {
							const value = output.source;
							const text = typeof value === "string" ? value : Buffer.from(value).toString("utf-8");
							output.source = JSON.stringify(JSON.parse(text));
						}
					}
					if (fileName.endsWith(".js") && !isKai3) {
						const output = bundle[fileName];
						if (output && "code" in output) {
							const code = output.code;
							if (!code) continue;

							const magicString = new MagicString(code);

							magicString.replaceAll(forConstRegex, "for(let  ");

							output.code = magicString.toString();
							if (options.sourcemap)
								output.map = magicString.generateMap({
									hires: true,
									source: fileName,
									includeContent: true,
								});
						}
					}
				}
			},
		};
}

export function polyfillKaiOSWorker(): PluginOption {
	if (production)
		return {
			name: "polyfill-kai",

			generateBundle(options, bundle) {
				if (isKai3) return;
				for (const fileName in bundle) {
					if (fileName.endsWith(".js")) {
						const output = bundle[fileName];
						if (output && "code" in output) {
							const code = output.code;
							if (!code) continue;

							const magicString = new MagicString(code);

							magicString.replaceAll(forConstRegex, "for(let  ");

							// add import for polyfills for workers

							// we only need this polyfill in service worker
							if (fileName.startsWith("sw")) {
								magicString.prepend(
									`Object.hasOwnProperty("getOwnPropertyDescriptors")||Object.defineProperty(Object,"getOwnPropertyDescriptors",{configurable:!0,writable:!0,value:function(e){return Reflect.ownKeys(e).reduce((t,r)=>Object.defineProperty(t,r,{configurable:!0,enumerable:!0,writable:!0,value:Object.getOwnPropertyDescriptor(e,r)}),{})}});`
								);
							} else {
								magicString.prepend(`self.__POLYFILL__||(importScripts("/polyfills.js"),self.__POLYFILL__=!0);`);
							}

							output.code = magicString.toString();

							if (options.sourcemap)
								output.map = magicString.generateMap({
									hires: true,
									source: fileName,
									includeContent: true,
								});
						}
					}
				}
			},
		};
}

export function libsignalInjector(): PluginOption {
	return {
		name: "libsignal-dev-inject",
		apply: "serve", // Only run in dev (not build)
		transformIndexHtml(html) {
			return {
				html,
				tags: [
					{
						tag: "script",
						attrs: {
							src: "/libsignal-protocol.js",
							defer: "",
						},
						injectTo: "head-prepend",
					},
				],
			};
		},
	};
}
