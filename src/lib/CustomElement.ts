import { EventEmitter } from "@converse/skeletor";

class MockLitElement {
	initialize() {}
}

class CustomElement extends EventEmitter(MockLitElement) {}

export default CustomElement;
