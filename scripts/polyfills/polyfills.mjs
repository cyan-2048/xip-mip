/**
 * this file contains the polyfills that will be loaded before anything else
 * - WARNING: the code will also be executed in workers, be cautious in adding polyfills
 */

const IS_WORKER = typeof importScripts != "undefined";

self.globalThis ||= self;

const NativeWorker = self.Worker;
class Worker extends NativeWorker {
	constructor(url) {
		// all workers are iife!!!
		super(url);
	}
}

Worker.native = NativeWorker;
self.Worker = Worker;

if (import.meta.env.KAIOS != 3) {
	// well known symbols
	[
		// hasInstance is kinda useless?
		// you'd need to change all the instanceof calls to get it to work
		// "hasInstance",
		"toStringTag",
		"asyncIterator",
		"matchAll",
	].forEach((name) => {
		if (!Symbol.hasOwnProperty(name)) Symbol[name] = Symbol.for("Symbol." + name);
	});

	// Lesson learned: take polyfills from the actual proposal instead of random code you find online
	// https://github.com/tc39/proposal-object-getownpropertydescriptors
	if (!Object.hasOwnProperty("getOwnPropertyDescriptors")) {
		Object.defineProperty(Object, "getOwnPropertyDescriptors", {
			configurable: true,
			writable: true,
			value: function getOwnPropertyDescriptors(object) {
				return Reflect.ownKeys(object).reduce((descriptors, key) => {
					return Object.defineProperty(descriptors, key, {
						configurable: true,
						enumerable: true,
						writable: true,
						value: Object.getOwnPropertyDescriptor(object, key),
					});
				}, {});
			},
		});
	}

	String.prototype.trimEnd ||= String.prototype.trimRight;
	String.prototype.trimStart ||= String.prototype.trimLeft;

	require("./core-js.cjs");
	// import this after the promise polyfill
	// const { ReadableStream: _ReadableStream } = require("web-streams-polyfill/dist/ponyfill.js");

	// self.ReadableStream ||= _ReadableStream;

	Blob.prototype.arrayBuffer ||= function () {
		return Promise.resolve(new Response(this).arrayBuffer());
	};

	Blob.prototype.stream ||= function stream() {
		const blob = this;
		let position = 0;
		const CHUNK_SIZE = 2 * 1024 * 1024; // 5MB

		return new _ReadableStream({
			pull(controller) {
				if (position >= blob.size) {
					controller.close();
					return;
				}

				const chunk = blob.slice(position, position + CHUNK_SIZE);
				return chunk.arrayBuffer().then((buffer) => {
					position += buffer.byteLength;
					controller.enqueue(new Uint8Array(buffer));
				});
			},
		});
	};

	self.onerror = (...args) => {
		console.error(...args);
	};

	if (!IS_WORKER) {
		if (!("isConnected" in Node.prototype)) {
			Object.defineProperty(Node.prototype, "isConnected", {
				get() {
					return document.contains(this);
				},
			});
		}

		function docFragger(args) {
			const docFrag = document.createDocumentFragment();

			args.forEach((argItem) =>
				docFrag.appendChild(
					argItem instanceof Node ? argItem : document.createTextNode(String(argItem))
				)
			);

			return docFrag;
		}

		function define(item, name, value) {
			Object.defineProperty(item, name, {
				configurable: true,
				enumerable: true,
				writable: true,
				value,
			});
		}

		// Source: https://gitlab.com/ollycross/element-polyfill
		[Element.prototype, Document.prototype, DocumentFragment.prototype].forEach((item) => {
			if (!item) return;
			if (!item.hasOwnProperty("append")) {
				define(item, "append", function append(...args) {
					this.appendChild(docFragger(args));
				});
			}
			if (!item.hasOwnProperty("prepend")) {
				define(item, "prepend", function prepend(...args) {
					this.insertBefore(docFragger(args), this.firstChild);
				});
			}
			if (!item.hasOwnProperty("after")) {
				define(item, "after", function after(...argArr) {
					var docFrag = document.createDocumentFragment();

					argArr.forEach(function (argItem) {
						docFrag.appendChild(
							argItem instanceof Node ? argItem : document.createTextNode(String(argItem))
						);
					});

					this.parentNode.insertBefore(docFrag, this.nextSibling);
				});
			}
		});

		NodeList.prototype.forEach ||= Array.prototype.forEach;
	}
}

import "systemjs/dist/s.js";
import "systemjs/dist/extras/amd.js";
import "./event-target.js";
import "./abort-controller.js";
import { fetch_factory } from "./fetch.js";

// this is required for KaiOS 3.0 too
self._custom_fetch = fetch_factory();

class SystemXMLHttpRequest extends XMLHttpRequest {
	constructor() {
		super({ mozSystem: true, mozAnon: true });
	}
}

self._custom_XMLHttpRequest = SystemXMLHttpRequest;
