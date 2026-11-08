// node_modules/devalue/src/constants.js
var MAX_ARRAY_LEN = 2 ** 32 - 1;
var MAX_ARRAY_INDEX = MAX_ARRAY_LEN - 1;
// node_modules/devalue/src/utils.js
/** @type {Record<string, string>} */
var escaped = {
	"<": "\\u003C",
	"\\": "\\\\",
	"\b": "\\b",
	"\f": "\\f",
	"\n": "\\n",
	"\r": "\\r",
	"	": "\\t",
	"\u2028": "\\u2028",
	"\u2029": "\\u2029"
};
var DevalueError = class extends Error {
	/**
	* @param {string} message
	* @param {string[]} keys
	* @param {any} [value] - The value that failed to be serialized
	* @param {any} [root] - The root value being serialized
	*/
	constructor(message, keys, value, root) {
		super(message);
		this.name = "DevalueError";
		this.path = keys.join("");
		this.value = value;
		this.root = root;
	}
};
/** @param {any} thing */
function is_primitive(thing) {
	return thing === null || typeof thing !== "object" && typeof thing !== "function";
}
var object_proto_names = /* @__PURE__ */ Object.getOwnPropertyNames(Object.prototype).sort().join("\0");
/** @param {any} thing */
function is_plain_object(thing) {
	const proto = Object.getPrototypeOf(thing);
	return proto === Object.prototype || proto === null || Object.getPrototypeOf(proto) === null || Object.getOwnPropertyNames(proto).sort().join("\0") === object_proto_names;
}
/** @param {any} thing */
function get_type(thing) {
	return Object.prototype.toString.call(thing).slice(8, -1);
}
/** @param {any} thing */
function is_buffer(thing) {
	return typeof Buffer !== "undefined" && Buffer.isBuffer(thing);
}
/** @param {string} char */
function get_escaped_char(char) {
	switch (char) {
		case "\"": return "\\\"";
		case "<": return "\\u003C";
		case "\\": return "\\\\";
		case "\n": return "\\n";
		case "\r": return "\\r";
		case "	": return "\\t";
		case "\b": return "\\b";
		case "\f": return "\\f";
		case "\u2028": return "\\u2028";
		case "\u2029": return "\\u2029";
		default: return char < " " ? `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}` : "";
	}
}
/** @param {string} str */
function stringify_string(str) {
	let result = "";
	let last_pos = 0;
	const len = str.length;
	for (let i = 0; i < len; i += 1) {
		const char = str[i];
		const replacement = get_escaped_char(char);
		if (replacement) {
			result += str.slice(last_pos, i) + replacement;
			last_pos = i + 1;
		}
	}
	return `"${last_pos === 0 ? str : result + str.slice(last_pos)}"`;
}
/** @param {Record<string | symbol, any>} object */
function enumerable_symbols(object) {
	return Object.getOwnPropertySymbols(object).filter((symbol) => Object.getOwnPropertyDescriptor(object, symbol).enumerable);
}
var is_identifier = /^[a-zA-Z_$][a-zA-Z_$0-9]*$/;
/** @param {string} key */
function stringify_key(key) {
	return is_identifier.test(key) ? "." + key : "[" + JSON.stringify(key) + "]";
}
/** @param {number} n */
function is_valid_array_index(n) {
	if (!Number.isInteger(n)) return false;
	if (n < 0) return false;
	if (n > MAX_ARRAY_INDEX) return false;
	return true;
}
/** @param {number} n */
function is_valid_array_len(n) {
	if (!Number.isInteger(n)) return false;
	if (n < 0) return false;
	if (n > MAX_ARRAY_LEN) return false;
	return true;
}
/** @param {string} s */
function is_valid_array_index_string(s) {
	if (s.length === 0) return false;
	if (s.length > 1 && s.charCodeAt(0) === 48) return false;
	for (let i = 0; i < s.length; i++) {
		const c = s.charCodeAt(i);
		if (c < 48 || c > 57) return false;
	}
	return is_valid_array_index(+s);
}
/**
* Returns the length of the leading run of valid array indices in `keys`.
* @param {readonly string[]} keys
*/
function array_index_cut(keys) {
	for (var i = keys.length - 1; i >= 0; i--) if (is_valid_array_index_string(keys[i])) break;
	return i + 1;
}
/**
* Finds the populated indices of an array.
* @param {unknown[]} array
*/
function valid_array_indices(array) {
	const keys = Object.keys(array);
	keys.length = array_index_cut(keys);
	return keys;
}
/**
* Given the own enumerable string keys of an array-like value, in property
* order, returns the leading run of them that are valid array indices.
*
* This is the filtering half of the `indicesOf` stringify operation,
* exposed so that custom operations — which typically already have the keys
* in hand, e.g. from a foreign runtime — don't have to reimplement it.
*
* Does not modify `keys`.
*
* @param {readonly string[]} keys
* @returns {string[]}
*/
function filter_array_indices(keys) {
	return keys.slice(0, array_index_cut(keys));
}
// node_modules/devalue/src/uneval.js
var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$";
var MIN_STRING_LENGTH = 128;
var unsafe_chars = /[<\b\f\n\r\t\0\u2028\u2029]/g;
var reserved = /^(?:do|if|in|for|int|let|new|try|var|byte|case|char|else|enum|goto|long|this|void|with|await|break|catch|class|const|final|float|short|super|throw|while|yield|delete|double|export|import|native|return|switch|throws|typeof|boolean|default|extends|finally|package|private|abstract|continue|debugger|function|volatile|interface|protected|transient|implements|instanceof|synchronized)$/;
/**
* Turn a value into the JavaScript that creates an equivalent value
* @param {any} value
* @param {(value: any, uneval: (value: any) => string) => string | void} [replacer]
*/
function uneval(value, replacer) {
	const counts = /* @__PURE__ */ new Map();
	/** @type {string[]} */
	const keys = [];
	const custom = /* @__PURE__ */ new Map();
	/** @type {Map<string | bigint, string> | undefined} */
	let primitives;
	/** @param {any} thing */
	function stringify_cached_primitive(thing) {
		if (typeof thing === "string" && thing.length >= MIN_STRING_LENGTH || typeof thing === "bigint") {
			primitives ??= /* @__PURE__ */ new Map();
			let literal = primitives.get(thing);
			if (literal === void 0) {
				literal = stringify_primitive$1(thing);
				primitives.set(thing, literal);
			}
			return literal;
		}
		return stringify_primitive$1(thing);
	}
	/** @param {any} thing */
	function walk(thing) {
		if (!is_primitive(thing)) {
			if (counts.has(thing)) {
				counts.set(thing, counts.get(thing) + 1);
				return;
			}
			counts.set(thing, 1);
			if (replacer) {
				const str = replacer(thing, (value) => uneval(value, replacer));
				if (typeof str === "string") {
					custom.set(thing, str);
					return;
				}
			}
			if (typeof thing === "function") throw new DevalueError(`Cannot stringify a function`, keys, thing, value);
			switch (get_type(thing)) {
				case "BigInt":
				case "String":
					walk(thing.valueOf());
					return;
				case "Number":
				case "Boolean":
				case "Date":
				case "RegExp":
				case "URL":
				case "URLSearchParams": return;
				case "Array":
					for (const i of valid_array_indices(thing)) {
						keys.push(`[${i}]`);
						walk(thing[i]);
						keys.pop();
					}
					break;
				case "Set":
					Array.from(thing).forEach(walk);
					break;
				case "Map":
					for (const [key, value] of thing) {
						keys.push(`.get(${is_primitive(key) ? stringify_cached_primitive(key) : "..."})`);
						walk(key);
						walk(value);
						keys.pop();
					}
					break;
				case "Int8Array":
				case "Uint8Array":
				case "Uint8ClampedArray":
				case "Int16Array":
				case "Uint16Array":
				case "Float16Array":
				case "Int32Array":
				case "Uint32Array":
				case "Float32Array":
				case "Float64Array":
				case "BigInt64Array":
				case "BigUint64Array":
				case "DataView":
					if (!is_buffer(thing)) walk(thing.buffer);
					return;
				case "ArrayBuffer": return;
				case "Temporal.Duration":
				case "Temporal.Instant":
				case "Temporal.PlainDate":
				case "Temporal.PlainTime":
				case "Temporal.PlainDateTime":
				case "Temporal.PlainMonthDay":
				case "Temporal.PlainYearMonth":
				case "Temporal.ZonedDateTime": return;
				default:
					if (!is_plain_object(thing)) throw new DevalueError(`Cannot stringify arbitrary non-POJOs`, keys, thing, value);
					if (enumerable_symbols(thing).length > 0) throw new DevalueError(`Cannot stringify POJOs with symbolic keys`, keys, thing, value);
					for (const key of Object.keys(thing)) {
						if (key === "__proto__") throw new DevalueError(`Cannot stringify objects with __proto__ keys`, keys, thing, value);
						keys.push(stringify_key(key));
						walk(thing[key]);
						keys.pop();
					}
			}
		} else if (typeof thing === "symbol") throw new DevalueError(`Cannot stringify a Symbol primitive`, keys, thing, value);
		else if (typeof thing === "string" && thing.length >= MIN_STRING_LENGTH || typeof thing === "bigint") counts.set(thing, (counts.get(thing) || 0) + 1);
	}
	walk(value);
	const names = /* @__PURE__ */ new Map();
	/** @type {Array<[any, number]>} */
	const repeated = [];
	counts.forEach((count, thing) => {
		if (count > 1) repeated.push([thing, count]);
	});
	repeated.sort((a, b) => b[1] - a[1]).forEach(([thing, count]) => {
		const name = get_name(names.size);
		if (is_primitive(thing)) {
			const length = stringify_cached_primitive(thing).length;
			if (length * count <= length + (count + 1) * name.length + 25) return;
		}
		names.set(thing, name);
	});
	/**
	* @param {any} thing
	* @returns {string}
	*/
	function stringify(thing) {
		if (names.has(thing)) return names.get(thing);
		if (is_primitive(thing)) return stringify_primitive$1(thing);
		if (custom.has(thing)) return custom.get(thing);
		const type = get_type(thing);
		switch (type) {
			case "Number":
			case "String":
			case "Boolean":
			case "BigInt": return `Object(${stringify(thing.valueOf())})`;
			case "RegExp":
				const { source, flags } = thing;
				return flags ? `new RegExp(${stringify_string(source)},"${flags}")` : `new RegExp(${stringify_string(source)})`;
			case "Date": return `new Date(${thing.getTime()})`;
			case "URL": return `new URL(${stringify_string(thing.toString())})`;
			case "URLSearchParams": return `new URLSearchParams(${stringify_string(thing.toString())})`;
			case "Array": {
				let has_holes = false;
				let result = "[";
				for (let i = 0; i < thing.length; i += 1) {
					if (i > 0) result += ",";
					if (Object.hasOwn(thing, i)) result += stringify(thing[i]);
					else if (!has_holes) {
						const populated_keys = valid_array_indices(thing);
						const population = populated_keys.length;
						const d = String(thing.length).length;
						const array = stringify_sparse_array(thing.length);
						if (thing.length + 2 > array.length + 18 + population * (d + 2)) return `Object.assign(${array},{${populated_keys.map((k) => `${k}:${stringify(thing[k])}`).join(",")}})`;
						has_holes = true;
					}
				}
				const tail = thing.length === 0 || Object.hasOwn(thing, thing.length - 1) ? "" : ",";
				return result + tail + "]";
			}
			case "Set":
			case "Map": return `new ${type}([${Array.from(thing).map(stringify).join(",")}])`;
			case "Int8Array":
			case "Uint8Array":
			case "Uint8ClampedArray":
			case "Int16Array":
			case "Uint16Array":
			case "Float16Array":
			case "Int32Array":
			case "Uint32Array":
			case "Float32Array":
			case "Float64Array":
			case "BigInt64Array":
			case "BigUint64Array": {
				if (is_buffer(thing)) thing = new Uint8Array(thing);
				let str = `new ${type}`;
				if (!names.has(thing.buffer)) str += `([${stringify_typed_array_elements(type, thing.buffer)}])`;
				else str += `(${stringify(thing.buffer)})`;
				if (thing.byteLength !== thing.buffer.byteLength) {
					const start = thing.byteOffset / thing.BYTES_PER_ELEMENT;
					const end = start + thing.length;
					str += `.subarray(${start},${end})`;
				}
				return str;
			}
			case "DataView": {
				let str = `new DataView`;
				if (!names.has(thing.buffer)) str += `(new Uint8Array([${new Uint8Array(thing.buffer)}]).buffer`;
				else str += `(${stringify(thing.buffer)}`;
				if (thing.byteLength !== thing.buffer.byteLength) str += `,${thing.byteOffset},${thing.byteLength}`;
				return str + ")";
			}
			case "ArrayBuffer": return `new Uint8Array([${new Uint8Array(thing).toString()}]).buffer`;
			case "Temporal.Duration":
			case "Temporal.Instant":
			case "Temporal.PlainDate":
			case "Temporal.PlainTime":
			case "Temporal.PlainDateTime":
			case "Temporal.PlainMonthDay":
			case "Temporal.PlainYearMonth":
			case "Temporal.ZonedDateTime": return `${type}.from(${stringify_string(thing.toString())})`;
			default:
				const keys = Object.keys(thing);
				const obj = keys.map((key) => `${safe_key(key)}:${stringify(thing[key])}`).join(",");
				if (Object.getPrototypeOf(thing) === null) return keys.length > 0 ? `{${obj},__proto__:null}` : `{__proto__:null}`;
				return `{${obj}}`;
		}
	}
	const str = stringify(value);
	if (names.size) {
		/** @type {string[]} */
		const params = [];
		/** @type {string[]} */
		const statements = [];
		/** @type {string[]} */
		const values = [];
		/** @type {string[]} */
		const reconstructions = [];
		names.forEach((name, thing) => {
			params.push(name);
			if (custom.has(thing)) {
				values.push(custom.get(thing));
				return;
			}
			if (is_primitive(thing)) {
				values.push(stringify_cached_primitive(thing));
				return;
			}
			const type = get_type(thing);
			switch (type) {
				case "Number":
				case "String":
				case "Boolean":
				case "BigInt": {
					const primitive = thing.valueOf();
					if (names.has(primitive)) {
						values.push("{}");
						reconstructions.push(`${name}=Object(${stringify(primitive)})`);
					} else values.push(`Object(${stringify(primitive)})`);
					break;
				}
				case "RegExp":
					const { source, flags } = thing;
					const regexp = flags ? `new RegExp(${stringify_string(source)},"${flags}")` : `new RegExp(${stringify_string(source)})`;
					values.push(regexp);
					break;
				case "Date":
					values.push(`new Date(${thing.getTime()})`);
					break;
				case "URL":
					values.push(`new URL(${stringify_string(thing.toString())})`);
					break;
				case "URLSearchParams":
					values.push(`new URLSearchParams(${stringify_string(thing.toString())})`);
					break;
				case "Array": {
					const populated_keys = valid_array_indices(thing);
					values.push(thing.length > 32 + 2 * populated_keys.length ? stringify_sparse_array(thing.length) : `Array(${thing.length})`);
					for (const i of populated_keys) statements.push(`${name}[${i}]=${stringify(thing[i])}`);
					break;
				}
				case "Set": {
					values.push(`new Set`);
					const adds = Array.from(thing).map((v) => `.add(${stringify(v)})`);
					if (adds.length > 0) statements.push(name + adds.join(""));
					break;
				}
				case "Map": {
					values.push(`new Map`);
					const sets = Array.from(thing).map(([k, v]) => `.set(${stringify(k)}, ${stringify(v)})`);
					if (sets.length > 0) statements.push(name + sets.join(""));
					break;
				}
				case "Int8Array":
				case "Uint8Array":
				case "Uint8ClampedArray":
				case "Int16Array":
				case "Uint16Array":
				case "Float16Array":
				case "Int32Array":
				case "Uint32Array":
				case "Float32Array":
				case "Float64Array":
				case "BigInt64Array":
				case "BigUint64Array": {
					if (is_buffer(thing)) thing = new Uint8Array(thing);
					let str = `new ${type}`;
					if (!names.has(thing.buffer)) str += `([${stringify_typed_array_elements(type, thing.buffer)}])`;
					else str += `(${stringify(thing.buffer)})`;
					if (thing.byteLength !== thing.buffer.byteLength) {
						const start = thing.byteOffset / thing.BYTES_PER_ELEMENT;
						const end = start + thing.length;
						str += `.subarray(${start},${end})`;
					}
					values.push(`{}`);
					reconstructions.push(`${name}=${str}`);
					break;
				}
				case "DataView": {
					let str = `new DataView`;
					if (!names.has(thing.buffer)) str += `(new Uint8Array([${new Uint8Array(thing.buffer)}]).buffer`;
					else str += `(${stringify(thing.buffer)}`;
					if (thing.byteLength !== thing.buffer.byteLength) str += `,${thing.byteOffset},${thing.byteLength}`;
					str += ")";
					values.push(`{}`);
					reconstructions.push(`${name}=${str}`);
					break;
				}
				case "ArrayBuffer":
					values.push(`new Uint8Array([${new Uint8Array(thing)}]).buffer`);
					break;
				case "Temporal.Duration":
				case "Temporal.Instant":
				case "Temporal.PlainDate":
				case "Temporal.PlainTime":
				case "Temporal.PlainDateTime":
				case "Temporal.PlainMonthDay":
				case "Temporal.PlainYearMonth":
				case "Temporal.ZonedDateTime":
					values.push(`${type}.from(${stringify_string(thing.toString())})`);
					break;
				default:
					values.push(Object.getPrototypeOf(thing) === null ? "Object.create(null)" : "{}");
					Object.keys(thing).forEach((key) => {
						statements.push(`${name}${safe_prop(key)}=${stringify(thing[key])}`);
					});
			}
		});
		statements.push(`return ${str}`);
		const body = [...reconstructions, ...statements].join(";");
		if (params.length > 65534) return `(function(){var[${params.join(",")}]=arguments[0];${body}}([${values.join(",")}]))`;
		return `(function(${params.join(",")}){${body}}(${values.join(",")}))`;
	} else return str;
}
/**
* Emit an array whose storage is not proportional to its declared length.
* As in the default parse operations, touching and deleting the largest valid
* index forces V8 into dictionary-elements mode before setting the length.
* Merely starting with [] and assigning .length still eagerly allocates.
* @param {number} length
*/
function stringify_sparse_array(length) {
	return `(function(a){a[${MAX_ARRAY_INDEX}]=0;delete a[${MAX_ARRAY_INDEX}];a.length=${length};return a}([]))`;
}
/**
* Serialize the elements of `buffer`, read as `type`, as a comma-separated list.
* The view is created from `type` rather than from the serialized value's own
* constructor, which may be a subclass like Node's `Buffer` whose `toString`
* decodes the bytes instead of listing them.
* `BigInt64Array`/`BigUint64Array` elements are bigints and must be written
* with an `n` suffix, otherwise the emitted `new BigInt64Array([...])` throws.
* @param {string} type
* @param {ArrayBufferLike} buffer
*/
function stringify_typed_array_elements(type, buffer) {
	const array = new globalThis[type](buffer);
	if (type === "BigInt64Array" || type === "BigUint64Array") return Array.from(array, (element) => `${element}n`).join(",");
	if (array instanceof Float32Array || array instanceof Float64Array || typeof Float16Array !== "undefined" && array instanceof Float16Array) return Array.from(array, (element) => Object.is(element, -0) ? "-0" : `${element}`).join(",");
	return array.toString();
}
/** @param {number} num */
function get_name(num) {
	let name = "";
	do {
		name = chars[num % 54] + name;
		num = ~~(num / 54) - 1;
	} while (num >= 0);
	return reserved.test(name) ? `${name}0` : name;
}
/** @param {string} c */
function escape_unsafe_char(c) {
	return escaped[c] || c;
}
/** @param {string} str */
function escape_unsafe_chars(str) {
	return str.replace(unsafe_chars, escape_unsafe_char);
}
/** @param {string} key */
function safe_key(key) {
	return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key) ? key : escape_unsafe_chars(JSON.stringify(key));
}
/** @param {string} key */
function safe_prop(key) {
	return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key) ? `.${key}` : `[${escape_unsafe_chars(JSON.stringify(key))}]`;
}
/** @param {any} thing */
function stringify_primitive$1(thing) {
	const type = typeof thing;
	if (type === "string") return stringify_string(thing);
	if (thing === void 0) return "void 0";
	if (thing === 0 && 1 / thing < 0) return "-0";
	const str = String(thing);
	if (type === "number") return str.replace(/^(-)?0\./, "$1.");
	if (type === "bigint") return thing + "n";
	return str;
}
// node_modules/devalue/src/base64.js
/**	@type {(array_buffer: ArrayBuffer) => string} */
function encode_native(array_buffer) {
	return new Uint8Array(array_buffer).toBase64();
}
/**	@type {(base64: string) => ArrayBuffer} */
function decode_native(base64) {
	return Uint8Array.fromBase64(base64).buffer;
}
/** @type {(array_buffer: ArrayBuffer) => string} */
function encode_buffer(array_buffer) {
	return Buffer.from(array_buffer).toString("base64");
}
/**	@type {(base64: string) => ArrayBuffer} */
function decode_buffer(base64) {
	return Uint8Array.from(Buffer.from(base64, "base64")).buffer;
}
/** @type {(array_buffer: ArrayBuffer) => string} */
function encode_legacy(array_buffer) {
	const array = new Uint8Array(array_buffer);
	let binary = "";
	const chunk_size = 32768;
	for (let i = 0; i < array.length; i += chunk_size) {
		const chunk = array.subarray(i, i + chunk_size);
		binary += String.fromCharCode.apply(null, chunk);
	}
	return btoa(binary);
}
/**	@type {(base64: string) => ArrayBuffer} */
function decode_legacy(base64) {
	const binary_string = atob(base64);
	const len = binary_string.length;
	const array = new Uint8Array(len);
	for (let i = 0; i < len; i++) array[i] = binary_string.charCodeAt(i);
	return array.buffer;
}
var native = typeof Uint8Array.fromBase64 === "function";
var buffer = typeof process === "object" && process.versions?.node !== void 0;
var encode64 = native ? encode_native : buffer ? encode_buffer : encode_legacy;
var decode64 = native ? decode_native : buffer ? decode_buffer : decode_legacy;
// node_modules/devalue/src/operations.js
/**
* Merges caller-provided operation overrides over the defaults. Iterating the
* default keys (rather than the override's own keys) means nullish members
* fall back to the default, and inherited members — e.g. from a class
* instance — are picked up.
*
* @template {Record<string, any>} T
* @param {T} defaults
* @param {Partial<T> | undefined} overrides
* @returns {T}
*/
function merge_operations(defaults, overrides) {
	if (!overrides) return defaults;
	const merged = {};
	for (const key of Object.keys(defaults)) merged[key] = overrides[key] ?? defaults[key];
	return merged;
}
/** @type {{ kind: 'not-plain' }} */
var NOT_PLAIN = /* @__PURE__ */ Object.freeze({ kind: "not-plain" });
/** @type {{ kind: 'symbol-keys' }} */
var SYMBOL_KEYS = /* @__PURE__ */ Object.freeze({ kind: "symbol-keys" });
var default_stringify_operations = /* @__PURE__ */ Object.freeze({
	identify: (value) => value,
	typeOf: (value) => value === null ? "null" : typeof value,
	toPrimitive: (value) => value,
	tagOf: (value) => get_type(value),
	isThenable: (value) => typeof value.then === "function",
	toPromise: (thenable) => Promise.resolve(thenable),
	unbox: (boxed) => boxed.valueOf(),
	toISOString: (date) => isNaN(date.getDate()) ? "" : date.toISOString(),
	toStringValue: (value) => value.toString(),
	regExpInfo: (regexp) => ({
		source: regexp.source,
		flags: regexp.flags
	}),
	valuesOf: (set) => set,
	entriesOf: (map) => map,
	viewInfo: (view) => {
		if (is_buffer(view)) view = new Uint8Array(view);
		return {
			buffer: view.buffer,
			byteOffset: view.byteOffset,
			byteLength: view.byteLength,
			length: view.length,
			bufferByteLength: view.buffer.byteLength
		};
	},
	toArrayBuffer: (buffer) => buffer,
	lengthOf: (array) => array.length,
	hasOwn: (value, key) => Object.hasOwn(value, key),
	indicesOf: (array) => valid_array_indices(array),
	shapeOf: (value) => {
		if (!is_plain_object(value)) return NOT_PLAIN;
		if (enumerable_symbols(value).length > 0) return SYMBOL_KEYS;
		return {
			kind: Object.getPrototypeOf(value) === null ? "null-proto" : "plain",
			keys: Object.keys(value)
		};
	},
	get: (value, key) => value[key]
});
var array_buffer_byte_length = Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, "byteLength").get;
var shared_array_buffer_byte_length = typeof SharedArrayBuffer === "undefined" ? void 0 : Object.getOwnPropertyDescriptor(SharedArrayBuffer.prototype, "byteLength").get;
var default_parse_operations = /* @__PURE__ */ Object.freeze({
	fromPrimitive: (primitive) => primitive,
	fromISOString: (iso) => new Date(iso),
	fromStringValue: (tag, text) => {
		if (tag === "URL") return new URL(text);
		if (tag === "URLSearchParams") return new URLSearchParams(text);
		return Temporal[tag.slice(9)].from(text);
	},
	fromArrayBuffer: (buffer) => buffer,
	fromRegExpInfo: (source, flags) => new RegExp(source, flags),
	fromViewInfo: (tag, buffer, byteOffset, length) => {
		try {
			array_buffer_byte_length.call(buffer);
		} catch (error) {
			if (!shared_array_buffer_byte_length) throw error;
			shared_array_buffer_byte_length.call(buffer);
		}
		const Constructor = globalThis[tag];
		return byteOffset !== void 0 ? new Constructor(buffer, byteOffset, length) : new Constructor(buffer);
	},
	box: (value) => Object(value),
	createArray: (length) => new Array(length),
	createSparseArray: (length) => {
		/** @type {any[]} */
		const array = [];
		array[MAX_ARRAY_INDEX] = void 0;
		delete array[MAX_ARRAY_INDEX];
		array.length = length;
		return array;
	},
	createObject: () => ({}),
	createNullPrototypeObject: () => Object.create(null),
	createSet: () => /* @__PURE__ */ new Set(),
	createMap: () => /* @__PURE__ */ new Map(),
	set: (target, key, value) => {
		target[key] = value;
	},
	addValue: (set, value) => {
		set.add(value);
	},
	addEntry: (map, key, value) => {
		map.set(key, value);
	}
});
// node_modules/devalue/src/parse.js
/**
* Revive a value serialized with `devalue.stringify`
* @param {string} serialized
* @param {Record<string, (value: any) => any>} [revivers]
* @param {import('./types.js').ParseOptions} [options]
*/
function parse(serialized, revivers, options) {
	return unflatten(JSON.parse(serialized), revivers, options);
}
/**
* Revive a value flattened with `devalue.stringify`
* @param {number | any[]} parsed
* @param {Record<string, (value: any) => any>} [revivers]
* @param {import('./types.js').ParseOptions} [options]
*/
function unflatten(parsed, revivers, options) {
	/** @type {import('./types.js').ParseOperations} */
	const ops = merge_operations(default_parse_operations, options?.operations);
	if (typeof parsed === "number") return hydrate(parsed, true);
	if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("Invalid input");
	const values = parsed;
	const hydrated = Array(values.length);
	/**
	* A set of values currently being hydrated with custom revivers,
	* used to detect invalid cyclical dependencies
	* @type {Set<number> | null}
	*/
	let hydrating = null;
	/**
	* @param {number} index
	* @returns {any}
	*/
	function hydrate(index, standalone = false) {
		if (index === -1) return ops.fromPrimitive(void 0);
		if (index === -3) return ops.fromPrimitive(NaN);
		if (index === -4) return ops.fromPrimitive(Infinity);
		if (index === -5) return ops.fromPrimitive(-Infinity);
		if (index === -6) return ops.fromPrimitive(-0);
		if (standalone || typeof index !== "number") throw new Error(`Invalid input`);
		if (index in hydrated) return hydrated[index];
		if (index >= values.length) throw new Error(`Invalid input`);
		const value = values[index];
		if (!value || typeof value !== "object") hydrated[index] = ops.fromPrimitive(value);
		else if (Array.isArray(value)) {
			if (typeof value[0] === "string") {
				const type = value[0];
				const reviver = revivers && Object.hasOwn(revivers, type) ? revivers[type] : void 0;
				if (reviver) {
					let i = value[1];
					if (typeof i !== "number") i = values.push(value[1]) - 1;
					if (Object.hasOwn(hydrated, i)) return hydrated[index] = reviver(hydrated[i]);
					hydrating ??= /* @__PURE__ */ new Set();
					if (hydrating.has(i)) throw new Error("Invalid circular reference");
					hydrating.add(i);
					hydrated[index] = reviver(hydrate(i));
					hydrating.delete(i);
					return hydrated[index];
				}
				switch (type) {
					case "Date":
						hydrated[index] = ops.fromISOString(value[1]);
						break;
					case "Set":
						const set = ops.createSet();
						hydrated[index] = set;
						for (let i = 1; i < value.length; i += 1) ops.addValue(set, hydrate(value[i]));
						break;
					case "Map":
						const map = ops.createMap();
						hydrated[index] = map;
						for (let i = 1; i < value.length; i += 2) ops.addEntry(map, hydrate(value[i]), hydrate(value[i + 1]));
						break;
					case "RegExp":
						hydrated[index] = ops.fromRegExpInfo(value[1], value[2]);
						break;
					case "Object": {
						const wrapped_index = value[1];
						if (typeof values[wrapped_index] === "object" && values[wrapped_index][0] !== "BigInt") throw new Error("Invalid input");
						hydrated[index] = ops.box(hydrate(wrapped_index));
						break;
					}
					case "BigInt":
						hydrated[index] = ops.fromPrimitive(BigInt(value[1]));
						break;
					case "null":
						const obj = ops.createNullPrototypeObject();
						hydrated[index] = obj;
						for (let i = 1; i < value.length; i += 2) {
							const key = value[i];
							if (typeof key !== "string") throw new Error("Cannot parse an object with a non-string key");
							if (key === "__proto__") throw new Error("Cannot parse an object with a `__proto__` property");
							ops.set(obj, key, hydrate(value[i + 1]));
						}
						break;
					case "Int8Array":
					case "Uint8Array":
					case "Uint8ClampedArray":
					case "Int16Array":
					case "Uint16Array":
					case "Float16Array":
					case "Int32Array":
					case "Uint32Array":
					case "Float32Array":
					case "Float64Array":
					case "BigInt64Array":
					case "BigUint64Array":
					case "DataView": {
						if (values[value[1]][0] !== "ArrayBuffer") throw new Error("Invalid data");
						const buffer = hydrate(value[1]);
						hydrated[index] = ops.fromViewInfo(type, buffer, value[2], value[3]);
						break;
					}
					case "ArrayBuffer": {
						const base64 = value[1];
						if (typeof base64 !== "string") throw new Error("Invalid ArrayBuffer encoding");
						hydrated[index] = ops.fromArrayBuffer(decode64(base64));
						break;
					}
					case "URL":
					case "URLSearchParams":
					case "Temporal.Duration":
					case "Temporal.Instant":
					case "Temporal.PlainDate":
					case "Temporal.PlainTime":
					case "Temporal.PlainDateTime":
					case "Temporal.PlainMonthDay":
					case "Temporal.PlainYearMonth":
					case "Temporal.ZonedDateTime":
						hydrated[index] = ops.fromStringValue(type, value[1]);
						break;
					default: throw new Error(`Unknown type ${type}`);
				}
			} else if (value[0] === -7) {
				const len = value[1];
				if (!is_valid_array_len(len)) throw new Error("Invalid input");
				const array = ops.createSparseArray(len);
				hydrated[index] = array;
				for (let i = 2; i < value.length; i += 2) {
					const idx = value[i];
					if (!is_valid_array_index(idx) || idx >= len) throw new Error("Invalid input");
					ops.set(array, idx, hydrate(value[i + 1]));
				}
			} else {
				const array = ops.createArray(value.length);
				hydrated[index] = array;
				for (let i = 0; i < value.length; i += 1) {
					const n = value[i];
					if (n === -2) continue;
					ops.set(array, i, hydrate(n));
				}
			}
		} else {
			const object = ops.createObject();
			hydrated[index] = object;
			for (const key of Object.keys(value)) {
				if (key === "__proto__") throw new Error("Cannot parse an object with a `__proto__` property");
				ops.set(object, key, hydrate(value[key]));
			}
		}
		return hydrated[index];
	}
	return hydrate(0);
}
// node_modules/devalue/src/stringify.js
/**
* Turn a value into a JSON string that can be parsed with `devalue.parse`
* @param {any} value
* @param {Record<string, (value: any) => any>} [reducers]
* @param {import('./types.js').StringifyOptions} [options]
*/
function stringify(value, reducers, options) {
	const stringified = run(false, value, reducers, options);
	return typeof stringified === "string" ? stringified : `[${stringified.join(",")}]`;
}
/**
* Turn a value into a JSON string that can be parsed with `devalue.parse`
* @param {any} value
* @param {Record<string, (value: any) => any>} [reducers]
* @param {import('./types.js').StringifyOptions} [options]
*/
async function stringifyAsync(value, reducers, options) {
	const stringified = run(true, value, reducers, options);
	if (typeof stringified === "string") return stringified;
	let out = "[";
	for (let i = 0; i < stringified.length; i += 1) {
		let value = stringified[i];
		if (typeof value !== "string") {
			await value;
			value = stringified[i];
			if (i === 0 && value < 0) return `${value}`;
		}
		out += value;
		if (i < stringified.length - 1) out += ",";
	}
	out += "]";
	return out;
}
/**
* @param {boolean} async
* @param {any} value
* @param {Record<string, (value: any) => any>} [reducers]
* @param {import('./types.js').StringifyOptions} [options]
*/
function run(async, value, reducers, options) {
	const ops = merge_operations(default_stringify_operations, options?.operations);
	/** @type {any[]} */
	const stringified = [];
	/** @type {Map<any, number>} */
	const indexes = /* @__PURE__ */ new Map();
	/** @type {Array<{ key: string, fn: (value: any) => any }>} */
	const custom = [];
	if (reducers) for (const key of Object.getOwnPropertyNames(reducers)) custom.push({
		key,
		fn: reducers[key]
	});
	/** @type {string[]} */
	const keys = [];
	let p = 0;
	/**
	* @param {any} thing
	* @param {number} [index]
	*/
	function flatten(thing, index) {
		const type = ops.typeOf(thing);
		if (type === "undefined") return -1;
		/** @type {number | undefined} */
		let number;
		if (type === "number") {
			number = ops.toPrimitive(thing);
			if (Number.isNaN(number)) return -3;
			if (number === Infinity) return -4;
			if (number === -Infinity) return -5;
			if (number === 0 && 1 / number < 0) return -6;
		}
		const id = ops.identify(thing);
		if (indexes.has(id)) return indexes.get(id);
		index ??= p++;
		indexes.set(id, index);
		for (const { key, fn } of custom) {
			const value = fn(thing);
			if (value) {
				stringified[index] = `["${key}",${flatten(value)}]`;
				return index;
			}
		}
		if (type === "function") throw new DevalueError(`Cannot stringify a function`, keys, thing, value);
		else if (type === "symbol") throw new DevalueError(`Cannot stringify a Symbol primitive`, keys, thing, value);
		/** @type {string | Promise<any>} */
		let str = "";
		if (type !== "object") str = stringify_primitive(type === "number" ? number : ops.toPrimitive(thing));
		else if (ops.isThenable(thing)) {
			if (!async) throw new DevalueError(`Cannot stringify a Promise or thenable — use stringifyAsync instead`, keys, thing, value);
			str = ops.toPromise(thing).then((value) => {
				const i = flatten(value, index);
				if (i < 0) stringified[index] = i;
			});
			str.catch(() => {});
		} else {
			const tag = ops.tagOf(thing);
			switch (tag) {
				case "Number":
				case "String":
				case "Boolean":
				case "BigInt":
					str = `["Object",${flatten(ops.unbox(thing))}]`;
					break;
				case "Date":
					str = `["Date","${ops.toISOString(thing)}"]`;
					break;
				case "URL":
					str = `["URL",${stringify_string(ops.toStringValue(thing))}]`;
					break;
				case "URLSearchParams":
					str = `["URLSearchParams",${stringify_string(ops.toStringValue(thing))}]`;
					break;
				case "RegExp":
					const { source, flags } = ops.regExpInfo(thing);
					str = flags ? `["RegExp",${stringify_string(source)},"${flags}"]` : `["RegExp",${stringify_string(source)}]`;
					break;
				case "Array": {
					let mostly_dense = false;
					const length = ops.lengthOf(thing);
					str = "[";
					for (let i = 0; i < length; i += 1) {
						if (i > 0) str += ",";
						if (ops.hasOwn(thing, i)) {
							keys.push(`[${i}]`);
							str += flatten(ops.get(thing, i));
							keys.pop();
						} else if (mostly_dense) str += -2;
						else {
							const populated_keys = ops.indicesOf(thing);
							const population = populated_keys.length;
							const d = String(length).length;
							if ((length - population) * 3 > 4 + d + population * (d + 1)) {
								str = "[-7," + length;
								for (let j = 0; j < populated_keys.length; j++) {
									const key = populated_keys[j];
									keys.push(`[${key}]`);
									str += "," + key + "," + flatten(ops.get(thing, key));
									keys.pop();
								}
								break;
							} else {
								mostly_dense = true;
								str += -2;
							}
						}
					}
					str += "]";
					break;
				}
				case "Set":
					str = "[\"Set\"";
					for (const value of ops.valuesOf(thing)) str += `,${flatten(value)}`;
					str += "]";
					break;
				case "Map":
					str = "[\"Map\"";
					for (const [key, value] of ops.entriesOf(thing)) {
						const key_type = ops.typeOf(key);
						const key_is_primitive = key_type !== "object" && key_type !== "function" && key_type !== "symbol";
						keys.push(`.get(${key_is_primitive ? stringify_primitive(ops.toPrimitive(key)) : "..."})`);
						str += `,${flatten(key)},${flatten(value)}`;
						keys.pop();
					}
					str += "]";
					break;
				case "Int8Array":
				case "Uint8Array":
				case "Uint8ClampedArray":
				case "Int16Array":
				case "Uint16Array":
				case "Float16Array":
				case "Int32Array":
				case "Uint32Array":
				case "Float32Array":
				case "Float64Array":
				case "BigInt64Array":
				case "BigUint64Array": {
					const info = ops.viewInfo(thing);
					str = "[\"" + tag + "\"," + flatten(info.buffer);
					if (info.byteLength !== info.bufferByteLength) str += `,${info.byteOffset},${info.length}`;
					str += "]";
					break;
				}
				case "DataView": {
					const info = ops.viewInfo(thing);
					str = "[\"" + tag + "\"," + flatten(info.buffer);
					if (info.byteLength !== info.bufferByteLength) str += `,${info.byteOffset},${info.byteLength}`;
					str += "]";
					break;
				}
				case "ArrayBuffer":
					str = `["ArrayBuffer","${encode64(ops.toArrayBuffer(thing))}"]`;
					break;
				case "Temporal.Duration":
				case "Temporal.Instant":
				case "Temporal.PlainDate":
				case "Temporal.PlainTime":
				case "Temporal.PlainDateTime":
				case "Temporal.PlainMonthDay":
				case "Temporal.PlainYearMonth":
				case "Temporal.ZonedDateTime":
					str = `["${tag}",${stringify_string(ops.toStringValue(thing))}]`;
					break;
				default: {
					const shape = ops.shapeOf(thing);
					if (shape.kind === "not-plain") throw new DevalueError(`Cannot stringify arbitrary non-POJOs`, keys, thing, value);
					if (shape.kind === "symbol-keys") throw new DevalueError(`Cannot stringify POJOs with symbolic keys`, keys, thing, value);
					if (shape.kind === "null-proto") {
						str = "[\"null\"";
						for (const key of shape.keys) {
							if (key === "__proto__") throw new DevalueError(`Cannot stringify objects with __proto__ keys`, keys, thing, value);
							keys.push(stringify_key(key));
							str += `,${stringify_string(key)},${flatten(ops.get(thing, key))}`;
							keys.pop();
						}
						str += "]";
					} else {
						str = "{";
						let started = false;
						for (const key of shape.keys) {
							if (key === "__proto__") throw new DevalueError(`Cannot stringify objects with __proto__ keys`, keys, thing, value);
							if (started) str += ",";
							started = true;
							keys.push(stringify_key(key));
							str += `${stringify_string(key)}:${flatten(ops.get(thing, key))}`;
							keys.pop();
						}
						str += "}";
					}
				}
			}
		}
		stringified[index] = str;
		return index;
	}
	const index = flatten(value);
	if (index < 0) return `${index}`;
	return stringified;
}
/**
* @param {any} thing
* @returns {string}
*/
function stringify_primitive(thing) {
	const type = typeof thing;
	if (type === "string") return stringify_string(thing);
	if (thing === void 0) return (-1).toString();
	if (thing === 0 && 1 / thing < 0) return (-6).toString();
	if (type === "bigint") return `["BigInt","${thing}"]`;
	return String(thing);
}
// node_modules/devalue/index.js
/** @typedef {import('./src/types.js').StringValueTag} StringValueTag */
/** @typedef {import('./src/types.js').ViewTag} ViewTag */
/** @typedef {import('./src/types.js').StringifyOperations} StringifyOperations */
/** @typedef {import('./src/types.js').DefaultStringifyOperations} DefaultStringifyOperations */
/** @typedef {import('./src/types.js').StringifyOptions} StringifyOptions */
/** @typedef {import('./src/types.js').ParseOperations} ParseOperations */
/** @typedef {import('./src/types.js').DefaultParseOperations} DefaultParseOperations */
/** @typedef {import('./src/types.js').ParseOptions} ParseOptions */
export { DevalueError, default_parse_operations as defaultParseOperations, default_stringify_operations as defaultStringifyOperations, filter_array_indices as filterArrayIndices, parse, stringify, stringifyAsync, uneval, unflatten };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQHN2ZWx0ZWpzX2tpdF9uX2RldmFsdWUuanMiLCJuYW1lcyI6WyJzdHJpbmdpZnlfcHJpbWl0aXZlIl0sInNvdXJjZXMiOlsiLi4vLi4vZGV2YWx1ZS9zcmMvY29uc3RhbnRzLmpzIiwiLi4vLi4vZGV2YWx1ZS9zcmMvdXRpbHMuanMiLCIuLi8uLi9kZXZhbHVlL3NyYy91bmV2YWwuanMiLCIuLi8uLi9kZXZhbHVlL3NyYy9iYXNlNjQuanMiLCIuLi8uLi9kZXZhbHVlL3NyYy9vcGVyYXRpb25zLmpzIiwiLi4vLi4vZGV2YWx1ZS9zcmMvcGFyc2UuanMiLCIuLi8uLi9kZXZhbHVlL3NyYy9zdHJpbmdpZnkuanMiLCIuLi8uLi9kZXZhbHVlL2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBjb25zdCBVTkRFRklORUQgPSAtMTtcbmV4cG9ydCBjb25zdCBIT0xFID0gLTI7XG5leHBvcnQgY29uc3QgTkFOID0gLTM7XG5leHBvcnQgY29uc3QgUE9TSVRJVkVfSU5GSU5JVFkgPSAtNDtcbmV4cG9ydCBjb25zdCBORUdBVElWRV9JTkZJTklUWSA9IC01O1xuZXhwb3J0IGNvbnN0IE5FR0FUSVZFX1pFUk8gPSAtNjtcbmV4cG9ydCBjb25zdCBTUEFSU0UgPSAtNztcblxuLy8gVGhlIGxhcmdlc3QgdmFsaWQgdmFsdWUgZm9yIGEgSmF2YVNjcmlwdCBhcnJheSdzIGBsZW5ndGhgIHByb3BlcnR5LFxuLy8gYW5kIHRoZSBsYXJnZXN0IHZhbGlkIGFycmF5IGluZGV4IChvbmUgbGVzcyB0aGFuIHRoZSBtYXggbGVuZ3RoKS5cbmV4cG9ydCBjb25zdCBNQVhfQVJSQVlfTEVOID0gMiAqKiAzMiAtIDE7XG5leHBvcnQgY29uc3QgTUFYX0FSUkFZX0lOREVYID0gTUFYX0FSUkFZX0xFTiAtIDE7XG4iLCJpbXBvcnQgeyBNQVhfQVJSQVlfSU5ERVgsIE1BWF9BUlJBWV9MRU4gfSBmcm9tICcuL2NvbnN0YW50cy5qcyc7XG5cbi8qKiBAdHlwZSB7UmVjb3JkPHN0cmluZywgc3RyaW5nPn0gKi9cbmV4cG9ydCBjb25zdCBlc2NhcGVkID0ge1xuXHQnPCc6ICdcXFxcdTAwM0MnLFxuXHQnXFxcXCc6ICdcXFxcXFxcXCcsXG5cdCdcXGInOiAnXFxcXGInLFxuXHQnXFxmJzogJ1xcXFxmJyxcblx0J1xcbic6ICdcXFxcbicsXG5cdCdcXHInOiAnXFxcXHInLFxuXHQnXFx0JzogJ1xcXFx0Jyxcblx0J1xcdTIwMjgnOiAnXFxcXHUyMDI4Jyxcblx0J1xcdTIwMjknOiAnXFxcXHUyMDI5J1xufTtcblxuZXhwb3J0IGNsYXNzIERldmFsdWVFcnJvciBleHRlbmRzIEVycm9yIHtcblx0LyoqXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlXG5cdCAqIEBwYXJhbSB7c3RyaW5nW119IGtleXNcblx0ICogQHBhcmFtIHthbnl9IFt2YWx1ZV0gLSBUaGUgdmFsdWUgdGhhdCBmYWlsZWQgdG8gYmUgc2VyaWFsaXplZFxuXHQgKiBAcGFyYW0ge2FueX0gW3Jvb3RdIC0gVGhlIHJvb3QgdmFsdWUgYmVpbmcgc2VyaWFsaXplZFxuXHQgKi9cblx0Y29uc3RydWN0b3IobWVzc2FnZSwga2V5cywgdmFsdWUsIHJvb3QpIHtcblx0XHRzdXBlcihtZXNzYWdlKTtcblx0XHR0aGlzLm5hbWUgPSAnRGV2YWx1ZUVycm9yJztcblx0XHR0aGlzLnBhdGggPSBrZXlzLmpvaW4oJycpO1xuXHRcdHRoaXMudmFsdWUgPSB2YWx1ZTtcblx0XHR0aGlzLnJvb3QgPSByb290O1xuXHR9XG59XG5cbi8qKiBAcGFyYW0ge2FueX0gdGhpbmcgKi9cbmV4cG9ydCBmdW5jdGlvbiBpc19wcmltaXRpdmUodGhpbmcpIHtcblx0cmV0dXJuIHRoaW5nID09PSBudWxsIHx8ICh0eXBlb2YgdGhpbmcgIT09ICdvYmplY3QnICYmIHR5cGVvZiB0aGluZyAhPT0gJ2Z1bmN0aW9uJyk7XG59XG5cbmNvbnN0IG9iamVjdF9wcm90b19uYW1lcyA9IC8qIEBfX1BVUkVfXyAqLyBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhPYmplY3QucHJvdG90eXBlKVxuXHQuc29ydCgpXG5cdC5qb2luKCdcXDAnKTtcblxuLyoqIEBwYXJhbSB7YW55fSB0aGluZyAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzX3BsYWluX29iamVjdCh0aGluZykge1xuXHRjb25zdCBwcm90byA9IE9iamVjdC5nZXRQcm90b3R5cGVPZih0aGluZyk7XG5cblx0cmV0dXJuIChcblx0XHRwcm90byA9PT0gT2JqZWN0LnByb3RvdHlwZSB8fFxuXHRcdHByb3RvID09PSBudWxsIHx8XG5cdFx0T2JqZWN0LmdldFByb3RvdHlwZU9mKHByb3RvKSA9PT0gbnVsbCB8fFxuXHRcdE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHByb3RvKS5zb3J0KCkuam9pbignXFwwJykgPT09IG9iamVjdF9wcm90b19uYW1lc1xuXHQpO1xufVxuXG4vKiogQHBhcmFtIHthbnl9IHRoaW5nICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0X3R5cGUodGhpbmcpIHtcblx0cmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh0aGluZykuc2xpY2UoOCwgLTEpO1xufVxuXG4vKiogQHBhcmFtIHthbnl9IHRoaW5nICovXG5leHBvcnQgZnVuY3Rpb24gaXNfYnVmZmVyKHRoaW5nKSB7XG5cdHJldHVybiB0eXBlb2YgQnVmZmVyICE9PSAndW5kZWZpbmVkJyAmJiBCdWZmZXIuaXNCdWZmZXIodGhpbmcpO1xufVxuXG4vKiogQHBhcmFtIHtzdHJpbmd9IGNoYXIgKi9cbmZ1bmN0aW9uIGdldF9lc2NhcGVkX2NoYXIoY2hhcikge1xuXHRzd2l0Y2ggKGNoYXIpIHtcblx0XHRjYXNlICdcIic6XG5cdFx0XHRyZXR1cm4gJ1xcXFxcIic7XG5cdFx0Y2FzZSAnPCc6XG5cdFx0XHRyZXR1cm4gJ1xcXFx1MDAzQyc7XG5cdFx0Y2FzZSAnXFxcXCc6XG5cdFx0XHRyZXR1cm4gJ1xcXFxcXFxcJztcblx0XHRjYXNlICdcXG4nOlxuXHRcdFx0cmV0dXJuICdcXFxcbic7XG5cdFx0Y2FzZSAnXFxyJzpcblx0XHRcdHJldHVybiAnXFxcXHInO1xuXHRcdGNhc2UgJ1xcdCc6XG5cdFx0XHRyZXR1cm4gJ1xcXFx0Jztcblx0XHRjYXNlICdcXGInOlxuXHRcdFx0cmV0dXJuICdcXFxcYic7XG5cdFx0Y2FzZSAnXFxmJzpcblx0XHRcdHJldHVybiAnXFxcXGYnO1xuXHRcdGNhc2UgJ1xcdTIwMjgnOlxuXHRcdFx0cmV0dXJuICdcXFxcdTIwMjgnO1xuXHRcdGNhc2UgJ1xcdTIwMjknOlxuXHRcdFx0cmV0dXJuICdcXFxcdTIwMjknO1xuXHRcdGRlZmF1bHQ6XG5cdFx0XHRyZXR1cm4gY2hhciA8ICcgJyA/IGBcXFxcdSR7Y2hhci5jaGFyQ29kZUF0KDApLnRvU3RyaW5nKDE2KS5wYWRTdGFydCg0LCAnMCcpfWAgOiAnJztcblx0fVxufVxuXG4vKiogQHBhcmFtIHtzdHJpbmd9IHN0ciAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0cmluZ2lmeV9zdHJpbmcoc3RyKSB7XG5cdGxldCByZXN1bHQgPSAnJztcblx0bGV0IGxhc3RfcG9zID0gMDtcblx0Y29uc3QgbGVuID0gc3RyLmxlbmd0aDtcblxuXHRmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSArPSAxKSB7XG5cdFx0Y29uc3QgY2hhciA9IHN0cltpXTtcblx0XHRjb25zdCByZXBsYWNlbWVudCA9IGdldF9lc2NhcGVkX2NoYXIoY2hhcik7XG5cdFx0aWYgKHJlcGxhY2VtZW50KSB7XG5cdFx0XHRyZXN1bHQgKz0gc3RyLnNsaWNlKGxhc3RfcG9zLCBpKSArIHJlcGxhY2VtZW50O1xuXHRcdFx0bGFzdF9wb3MgPSBpICsgMTtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gYFwiJHtsYXN0X3BvcyA9PT0gMCA/IHN0ciA6IHJlc3VsdCArIHN0ci5zbGljZShsYXN0X3Bvcyl9XCJgO1xufVxuXG4vKiogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nIHwgc3ltYm9sLCBhbnk+fSBvYmplY3QgKi9cbmV4cG9ydCBmdW5jdGlvbiBlbnVtZXJhYmxlX3N5bWJvbHMob2JqZWN0KSB7XG5cdHJldHVybiBPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKG9iamVjdCkuZmlsdGVyKFxuXHRcdChzeW1ib2wpID0+IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3Iob2JqZWN0LCBzeW1ib2wpLmVudW1lcmFibGVcblx0KTtcbn1cblxuY29uc3QgaXNfaWRlbnRpZmllciA9IC9eW2EtekEtWl8kXVthLXpBLVpfJDAtOV0qJC87XG5cbi8qKiBAcGFyYW0ge3N0cmluZ30ga2V5ICovXG5leHBvcnQgZnVuY3Rpb24gc3RyaW5naWZ5X2tleShrZXkpIHtcblx0cmV0dXJuIGlzX2lkZW50aWZpZXIudGVzdChrZXkpID8gJy4nICsga2V5IDogJ1snICsgSlNPTi5zdHJpbmdpZnkoa2V5KSArICddJztcbn1cblxuLyoqIEBwYXJhbSB7bnVtYmVyfSBuICovXG5leHBvcnQgZnVuY3Rpb24gaXNfdmFsaWRfYXJyYXlfaW5kZXgobikge1xuXHRpZiAoIU51bWJlci5pc0ludGVnZXIobikpIHJldHVybiBmYWxzZTtcblx0aWYgKG4gPCAwKSByZXR1cm4gZmFsc2U7XG5cdGlmIChuID4gTUFYX0FSUkFZX0lOREVYKSByZXR1cm4gZmFsc2U7XG5cdHJldHVybiB0cnVlO1xufVxuXG4vKiogQHBhcmFtIHtudW1iZXJ9IG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc192YWxpZF9hcnJheV9sZW4obikge1xuXHRpZiAoIU51bWJlci5pc0ludGVnZXIobikpIHJldHVybiBmYWxzZTtcblx0aWYgKG4gPCAwKSByZXR1cm4gZmFsc2U7XG5cdGlmIChuID4gTUFYX0FSUkFZX0xFTikgcmV0dXJuIGZhbHNlO1xuXHRyZXR1cm4gdHJ1ZTtcbn1cblxuLyoqIEBwYXJhbSB7c3RyaW5nfSBzICovXG5mdW5jdGlvbiBpc192YWxpZF9hcnJheV9pbmRleF9zdHJpbmcocykge1xuXHRpZiAocy5sZW5ndGggPT09IDApIHJldHVybiBmYWxzZTtcblx0aWYgKHMubGVuZ3RoID4gMSAmJiBzLmNoYXJDb2RlQXQoMCkgPT09IDQ4KSByZXR1cm4gZmFsc2U7IC8vIGxlYWRpbmcgemVyb1xuXHRmb3IgKGxldCBpID0gMDsgaSA8IHMubGVuZ3RoOyBpKyspIHtcblx0XHRjb25zdCBjID0gcy5jaGFyQ29kZUF0KGkpO1xuXHRcdGlmIChjIDwgNDggfHwgYyA+IDU3KSByZXR1cm4gZmFsc2U7XG5cdH1cblx0Ly8gYnkgdGhpcyBwb2ludCB3ZSBrbm93IGl0J3MgYSBzdHJpbmcgb2YgZGlnaXRzLCBidXQgaXQgaGFzIHRvIGJlIHdpdGhpblxuXHQvLyB0aGUgcmFuZ2Ugb2YgdmFsaWQgYXJyYXkgaW5kaWNlc1xuXHRyZXR1cm4gaXNfdmFsaWRfYXJyYXlfaW5kZXgoK3MpO1xufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIGxlbmd0aCBvZiB0aGUgbGVhZGluZyBydW4gb2YgdmFsaWQgYXJyYXkgaW5kaWNlcyBpbiBga2V5c2AuXG4gKiBAcGFyYW0ge3JlYWRvbmx5IHN0cmluZ1tdfSBrZXlzXG4gKi9cbmZ1bmN0aW9uIGFycmF5X2luZGV4X2N1dChrZXlzKSB7XG5cdGZvciAodmFyIGkgPSBrZXlzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG5cdFx0aWYgKGlzX3ZhbGlkX2FycmF5X2luZGV4X3N0cmluZyhrZXlzW2ldKSkge1xuXHRcdFx0YnJlYWs7XG5cdFx0fVxuXHR9XG5cdHJldHVybiBpICsgMTtcbn1cblxuLyoqXG4gKiBGaW5kcyB0aGUgcG9wdWxhdGVkIGluZGljZXMgb2YgYW4gYXJyYXkuXG4gKiBAcGFyYW0ge3Vua25vd25bXX0gYXJyYXlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkX2FycmF5X2luZGljZXMoYXJyYXkpIHtcblx0Y29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKGFycmF5KTtcblx0a2V5cy5sZW5ndGggPSBhcnJheV9pbmRleF9jdXQoa2V5cyk7XG5cdHJldHVybiBrZXlzO1xufVxuXG4vKipcbiAqIEdpdmVuIHRoZSBvd24gZW51bWVyYWJsZSBzdHJpbmcga2V5cyBvZiBhbiBhcnJheS1saWtlIHZhbHVlLCBpbiBwcm9wZXJ0eVxuICogb3JkZXIsIHJldHVybnMgdGhlIGxlYWRpbmcgcnVuIG9mIHRoZW0gdGhhdCBhcmUgdmFsaWQgYXJyYXkgaW5kaWNlcy5cbiAqXG4gKiBUaGlzIGlzIHRoZSBmaWx0ZXJpbmcgaGFsZiBvZiB0aGUgYGluZGljZXNPZmAgc3RyaW5naWZ5IG9wZXJhdGlvbixcbiAqIGV4cG9zZWQgc28gdGhhdCBjdXN0b20gb3BlcmF0aW9ucyDigJQgd2hpY2ggdHlwaWNhbGx5IGFscmVhZHkgaGF2ZSB0aGUga2V5c1xuICogaW4gaGFuZCwgZS5nLiBmcm9tIGEgZm9yZWlnbiBydW50aW1lIOKAlCBkb24ndCBoYXZlIHRvIHJlaW1wbGVtZW50IGl0LlxuICpcbiAqIERvZXMgbm90IG1vZGlmeSBga2V5c2AuXG4gKlxuICogQHBhcmFtIHtyZWFkb25seSBzdHJpbmdbXX0ga2V5c1xuICogQHJldHVybnMge3N0cmluZ1tdfVxuICovXG5leHBvcnQgZnVuY3Rpb24gZmlsdGVyX2FycmF5X2luZGljZXMoa2V5cykge1xuXHRyZXR1cm4ga2V5cy5zbGljZSgwLCBhcnJheV9pbmRleF9jdXQoa2V5cykpO1xufVxuIiwiaW1wb3J0IHsgTUFYX0FSUkFZX0lOREVYIH0gZnJvbSAnLi9jb25zdGFudHMuanMnO1xuaW1wb3J0IHtcblx0RGV2YWx1ZUVycm9yLFxuXHRlbnVtZXJhYmxlX3N5bWJvbHMsXG5cdGVzY2FwZWQsXG5cdGdldF90eXBlLFxuXHRpc19idWZmZXIsXG5cdGlzX3BsYWluX29iamVjdCxcblx0aXNfcHJpbWl0aXZlLFxuXHRzdHJpbmdpZnlfa2V5LFxuXHRzdHJpbmdpZnlfc3RyaW5nLFxuXHR2YWxpZF9hcnJheV9pbmRpY2VzXG59IGZyb20gJy4vdXRpbHMuanMnO1xuXG5jb25zdCBjaGFycyA9ICdhYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ekFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaXyQnO1xuLy8gU2hvcnQgc3RyaW5ncyBoYXZlIGJvdW5kZWQgZXNjYXBpbmcvb3V0cHV0IGNvc3RzIHBlciByZWZlcmVuY2UsIHNvIHRoZXkgY2Fubm90XG4vLyBjYXVzZSBxdWFkcmF0aWMgZXhwYW5zaW9uLiBLZWVwIHRoZW0gb24gdGhlIG9yaWdpbmFsIGZhc3QgcGF0aCByYXRoZXIgdGhhblxuLy8gcGF5aW5nIGZvciBkZWR1cGxpY2F0aW9uIG9uIGNvbW1vbiB2YWx1ZXMgc3VjaCBhcyBuYW1lcywgSURzIGFuZCBzdGF0dXMgZmllbGRzLlxuY29uc3QgTUlOX1NUUklOR19MRU5HVEggPSAxMjg7XG5jb25zdCB1bnNhZmVfY2hhcnMgPSAvWzxcXGJcXGZcXG5cXHJcXHRcXDBcXHUyMDI4XFx1MjAyOV0vZztcbmNvbnN0IHJlc2VydmVkID1cblx0L14oPzpkb3xpZnxpbnxmb3J8aW50fGxldHxuZXd8dHJ5fHZhcnxieXRlfGNhc2V8Y2hhcnxlbHNlfGVudW18Z290b3xsb25nfHRoaXN8dm9pZHx3aXRofGF3YWl0fGJyZWFrfGNhdGNofGNsYXNzfGNvbnN0fGZpbmFsfGZsb2F0fHNob3J0fHN1cGVyfHRocm93fHdoaWxlfHlpZWxkfGRlbGV0ZXxkb3VibGV8ZXhwb3J0fGltcG9ydHxuYXRpdmV8cmV0dXJufHN3aXRjaHx0aHJvd3N8dHlwZW9mfGJvb2xlYW58ZGVmYXVsdHxleHRlbmRzfGZpbmFsbHl8cGFja2FnZXxwcml2YXRlfGFic3RyYWN0fGNvbnRpbnVlfGRlYnVnZ2VyfGZ1bmN0aW9ufHZvbGF0aWxlfGludGVyZmFjZXxwcm90ZWN0ZWR8dHJhbnNpZW50fGltcGxlbWVudHN8aW5zdGFuY2VvZnxzeW5jaHJvbml6ZWQpJC87XG5cbi8qKlxuICogVHVybiBhIHZhbHVlIGludG8gdGhlIEphdmFTY3JpcHQgdGhhdCBjcmVhdGVzIGFuIGVxdWl2YWxlbnQgdmFsdWVcbiAqIEBwYXJhbSB7YW55fSB2YWx1ZVxuICogQHBhcmFtIHsodmFsdWU6IGFueSwgdW5ldmFsOiAodmFsdWU6IGFueSkgPT4gc3RyaW5nKSA9PiBzdHJpbmcgfCB2b2lkfSBbcmVwbGFjZXJdXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1bmV2YWwodmFsdWUsIHJlcGxhY2VyKSB7XG5cdGNvbnN0IGNvdW50cyA9IG5ldyBNYXAoKTtcblxuXHQvKiogQHR5cGUge3N0cmluZ1tdfSAqL1xuXHRjb25zdCBrZXlzID0gW107XG5cblx0Y29uc3QgY3VzdG9tID0gbmV3IE1hcCgpO1xuXG5cdC8vIE9ubHkgYWxsb2NhdGUgYSBsaXRlcmFsIGNhY2hlIHdoZW4gd2UgbmVlZCB0byByZXVzZSBhbiBleHBlbnNpdmUgcHJpbWl0aXZlLFxuXHQvLyBpbmNsdWRpbmcgbG9uZyBNYXAga2V5cyByZW5kZXJlZCBpbiBlcnJvciBwYXRocyBkdXJpbmcgdGhlIHdhbGsuXG5cdC8qKiBAdHlwZSB7TWFwPHN0cmluZyB8IGJpZ2ludCwgc3RyaW5nPiB8IHVuZGVmaW5lZH0gKi9cblx0bGV0IHByaW1pdGl2ZXM7XG5cblx0LyoqIEBwYXJhbSB7YW55fSB0aGluZyAqL1xuXHRmdW5jdGlvbiBzdHJpbmdpZnlfY2FjaGVkX3ByaW1pdGl2ZSh0aGluZykge1xuXHRcdGlmIChcblx0XHRcdCh0eXBlb2YgdGhpbmcgPT09ICdzdHJpbmcnICYmIHRoaW5nLmxlbmd0aCA+PSBNSU5fU1RSSU5HX0xFTkdUSCkgfHxcblx0XHRcdHR5cGVvZiB0aGluZyA9PT0gJ2JpZ2ludCdcblx0XHQpIHtcblx0XHRcdHByaW1pdGl2ZXMgPz89IG5ldyBNYXAoKTtcblx0XHRcdGxldCBsaXRlcmFsID0gcHJpbWl0aXZlcy5nZXQodGhpbmcpO1xuXHRcdFx0aWYgKGxpdGVyYWwgPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRsaXRlcmFsID0gc3RyaW5naWZ5X3ByaW1pdGl2ZSh0aGluZyk7XG5cdFx0XHRcdHByaW1pdGl2ZXMuc2V0KHRoaW5nLCBsaXRlcmFsKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBsaXRlcmFsO1xuXHRcdH1cblx0XHRyZXR1cm4gc3RyaW5naWZ5X3ByaW1pdGl2ZSh0aGluZyk7XG5cdH1cblxuXHQvKiogQHBhcmFtIHthbnl9IHRoaW5nICovXG5cdGZ1bmN0aW9uIHdhbGsodGhpbmcpIHtcblx0XHRpZiAoIWlzX3ByaW1pdGl2ZSh0aGluZykpIHtcblx0XHRcdGlmIChjb3VudHMuaGFzKHRoaW5nKSkge1xuXHRcdFx0XHRjb3VudHMuc2V0KHRoaW5nLCBjb3VudHMuZ2V0KHRoaW5nKSArIDEpO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdGNvdW50cy5zZXQodGhpbmcsIDEpO1xuXG5cdFx0XHRpZiAocmVwbGFjZXIpIHtcblx0XHRcdFx0Y29uc3Qgc3RyID0gcmVwbGFjZXIodGhpbmcsICh2YWx1ZSkgPT4gdW5ldmFsKHZhbHVlLCByZXBsYWNlcikpO1xuXG5cdFx0XHRcdGlmICh0eXBlb2Ygc3RyID09PSAnc3RyaW5nJykge1xuXHRcdFx0XHRcdGN1c3RvbS5zZXQodGhpbmcsIHN0cik7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGlmICh0eXBlb2YgdGhpbmcgPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0dGhyb3cgbmV3IERldmFsdWVFcnJvcihgQ2Fubm90IHN0cmluZ2lmeSBhIGZ1bmN0aW9uYCwga2V5cywgdGhpbmcsIHZhbHVlKTtcblx0XHRcdH1cblxuXHRcdFx0Y29uc3QgdHlwZSA9IGdldF90eXBlKHRoaW5nKTtcblxuXHRcdFx0c3dpdGNoICh0eXBlKSB7XG5cdFx0XHRcdGNhc2UgJ0JpZ0ludCc6XG5cdFx0XHRcdGNhc2UgJ1N0cmluZyc6XG5cdFx0XHRcdFx0d2Fsayh0aGluZy52YWx1ZU9mKCkpO1xuXHRcdFx0XHRcdHJldHVybjtcblxuXHRcdFx0XHRjYXNlICdOdW1iZXInOlxuXHRcdFx0XHRjYXNlICdCb29sZWFuJzpcblx0XHRcdFx0Y2FzZSAnRGF0ZSc6XG5cdFx0XHRcdGNhc2UgJ1JlZ0V4cCc6XG5cdFx0XHRcdGNhc2UgJ1VSTCc6XG5cdFx0XHRcdGNhc2UgJ1VSTFNlYXJjaFBhcmFtcyc6XG5cdFx0XHRcdFx0cmV0dXJuO1xuXG5cdFx0XHRcdGNhc2UgJ0FycmF5Jzpcblx0XHRcdFx0XHQvLyBmb3JFYWNoIHNjYW5zIHRoZSBsb2dpY2FsIGxlbmd0aCBvZiBkaWN0aW9uYXJ5LWJhY2tlZCBzcGFyc2Vcblx0XHRcdFx0XHQvLyBhcnJheXMuIFZpc2l0IG93biBlbnVtZXJhYmxlIGluZGljZXMgd2l0aG91dCBkb2luZyB3b3JrIGZvclxuXHRcdFx0XHRcdC8vIGV2ZXJ5IGhvbGUuXG5cdFx0XHRcdFx0Zm9yIChjb25zdCBpIG9mIHZhbGlkX2FycmF5X2luZGljZXModGhpbmcpKSB7XG5cdFx0XHRcdFx0XHRrZXlzLnB1c2goYFske2l9XWApO1xuXHRcdFx0XHRcdFx0d2Fsayh0aGluZ1tpXSk7XG5cdFx0XHRcdFx0XHRrZXlzLnBvcCgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRicmVhaztcblxuXHRcdFx0XHRjYXNlICdTZXQnOlxuXHRcdFx0XHRcdEFycmF5LmZyb20odGhpbmcpLmZvckVhY2god2Fsayk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cblx0XHRcdFx0Y2FzZSAnTWFwJzpcblx0XHRcdFx0XHRmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiB0aGluZykge1xuXHRcdFx0XHRcdFx0a2V5cy5wdXNoKGAuZ2V0KCR7aXNfcHJpbWl0aXZlKGtleSkgPyBzdHJpbmdpZnlfY2FjaGVkX3ByaW1pdGl2ZShrZXkpIDogJy4uLid9KWApO1xuXHRcdFx0XHRcdFx0d2FsayhrZXkpO1xuXHRcdFx0XHRcdFx0d2Fsayh2YWx1ZSk7XG5cdFx0XHRcdFx0XHRrZXlzLnBvcCgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRicmVhaztcblxuXHRcdFx0XHRjYXNlICdJbnQ4QXJyYXknOlxuXHRcdFx0XHRjYXNlICdVaW50OEFycmF5Jzpcblx0XHRcdFx0Y2FzZSAnVWludDhDbGFtcGVkQXJyYXknOlxuXHRcdFx0XHRjYXNlICdJbnQxNkFycmF5Jzpcblx0XHRcdFx0Y2FzZSAnVWludDE2QXJyYXknOlxuXHRcdFx0XHRjYXNlICdGbG9hdDE2QXJyYXknOlxuXHRcdFx0XHRjYXNlICdJbnQzMkFycmF5Jzpcblx0XHRcdFx0Y2FzZSAnVWludDMyQXJyYXknOlxuXHRcdFx0XHRjYXNlICdGbG9hdDMyQXJyYXknOlxuXHRcdFx0XHRjYXNlICdGbG9hdDY0QXJyYXknOlxuXHRcdFx0XHRjYXNlICdCaWdJbnQ2NEFycmF5Jzpcblx0XHRcdFx0Y2FzZSAnQmlnVWludDY0QXJyYXknOlxuXHRcdFx0XHRjYXNlICdEYXRhVmlldyc6XG5cdFx0XHRcdFx0Ly8gQSBOb2RlIEJ1ZmZlcidzIGJhY2tpbmcgc3RvcmUgbWF5IGJlIGEgc2hhcmVkIHBvb2wuIEl0IG11c3Rcblx0XHRcdFx0XHQvLyBuZXZlciBiZSB2aXNpdGVkIG9yIGhvaXN0ZWQganVzdCBiZWNhdXNlIGEgQnVmZmVyIHVzZXMgaXQuXG5cdFx0XHRcdFx0aWYgKCFpc19idWZmZXIodGhpbmcpKSB3YWxrKHRoaW5nLmJ1ZmZlcik7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXG5cdFx0XHRcdGNhc2UgJ0FycmF5QnVmZmVyJzpcblx0XHRcdFx0XHRyZXR1cm47XG5cblx0XHRcdFx0Y2FzZSAnVGVtcG9yYWwuRHVyYXRpb24nOlxuXHRcdFx0XHRjYXNlICdUZW1wb3JhbC5JbnN0YW50Jzpcblx0XHRcdFx0Y2FzZSAnVGVtcG9yYWwuUGxhaW5EYXRlJzpcblx0XHRcdFx0Y2FzZSAnVGVtcG9yYWwuUGxhaW5UaW1lJzpcblx0XHRcdFx0Y2FzZSAnVGVtcG9yYWwuUGxhaW5EYXRlVGltZSc6XG5cdFx0XHRcdGNhc2UgJ1RlbXBvcmFsLlBsYWluTW9udGhEYXknOlxuXHRcdFx0XHRjYXNlICdUZW1wb3JhbC5QbGFpblllYXJNb250aCc6XG5cdFx0XHRcdGNhc2UgJ1RlbXBvcmFsLlpvbmVkRGF0ZVRpbWUnOlxuXHRcdFx0XHRcdHJldHVybjtcblxuXHRcdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRcdGlmICghaXNfcGxhaW5fb2JqZWN0KHRoaW5nKSkge1xuXHRcdFx0XHRcdFx0dGhyb3cgbmV3IERldmFsdWVFcnJvcihgQ2Fubm90IHN0cmluZ2lmeSBhcmJpdHJhcnkgbm9uLVBPSk9zYCwga2V5cywgdGhpbmcsIHZhbHVlKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAoZW51bWVyYWJsZV9zeW1ib2xzKHRoaW5nKS5sZW5ndGggPiAwKSB7XG5cdFx0XHRcdFx0XHR0aHJvdyBuZXcgRGV2YWx1ZUVycm9yKGBDYW5ub3Qgc3RyaW5naWZ5IFBPSk9zIHdpdGggc3ltYm9saWMga2V5c2AsIGtleXMsIHRoaW5nLCB2YWx1ZSk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Zm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXModGhpbmcpKSB7XG5cdFx0XHRcdFx0XHRpZiAoa2V5ID09PSAnX19wcm90b19fJykge1xuXHRcdFx0XHRcdFx0XHR0aHJvdyBuZXcgRGV2YWx1ZUVycm9yKFxuXHRcdFx0XHRcdFx0XHRcdGBDYW5ub3Qgc3RyaW5naWZ5IG9iamVjdHMgd2l0aCBfX3Byb3RvX18ga2V5c2AsXG5cdFx0XHRcdFx0XHRcdFx0a2V5cyxcblx0XHRcdFx0XHRcdFx0XHR0aGluZyxcblx0XHRcdFx0XHRcdFx0XHR2YWx1ZVxuXHRcdFx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRrZXlzLnB1c2goc3RyaW5naWZ5X2tleShrZXkpKTtcblx0XHRcdFx0XHRcdHdhbGsodGhpbmdba2V5XSk7XG5cdFx0XHRcdFx0XHRrZXlzLnBvcCgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9IGVsc2UgaWYgKHR5cGVvZiB0aGluZyA9PT0gJ3N5bWJvbCcpIHtcblx0XHRcdHRocm93IG5ldyBEZXZhbHVlRXJyb3IoYENhbm5vdCBzdHJpbmdpZnkgYSBTeW1ib2wgcHJpbWl0aXZlYCwga2V5cywgdGhpbmcsIHZhbHVlKTtcblx0XHR9IGVsc2UgaWYgKFxuXHRcdFx0KHR5cGVvZiB0aGluZyA9PT0gJ3N0cmluZycgJiYgdGhpbmcubGVuZ3RoID49IE1JTl9TVFJJTkdfTEVOR1RIKSB8fFxuXHRcdFx0dHlwZW9mIHRoaW5nID09PSAnYmlnaW50J1xuXHRcdCkge1xuXHRcdFx0Y291bnRzLnNldCh0aGluZywgKGNvdW50cy5nZXQodGhpbmcpIHx8IDApICsgMSk7XG5cdFx0fVxuXHR9XG5cblx0d2Fsayh2YWx1ZSk7XG5cblx0Y29uc3QgbmFtZXMgPSBuZXcgTWFwKCk7XG5cblx0LyoqIEB0eXBlIHtBcnJheTxbYW55LCBudW1iZXJdPn0gKi9cblx0Y29uc3QgcmVwZWF0ZWQgPSBbXTtcblx0Ly8gQXZvaWQgYWxsb2NhdGluZyBlbnRyaWVzIGZvciBhbGwgdGhlIHZhbHVlcyB0aGF0IHdpbGwgbmV2ZXIgYmUgaG9pc3RlZC5cblx0Y291bnRzLmZvckVhY2goKGNvdW50LCB0aGluZykgPT4ge1xuXHRcdGlmIChjb3VudCA+IDEpIHJlcGVhdGVkLnB1c2goW3RoaW5nLCBjb3VudF0pO1xuXHR9KTtcblxuXHRyZXBlYXRlZFxuXHRcdC5zb3J0KChhLCBiKSA9PiBiWzFdIC0gYVsxXSlcblx0XHQuZm9yRWFjaCgoW3RoaW5nLCBjb3VudF0pID0+IHtcblx0XHRcdGNvbnN0IG5hbWUgPSBnZXRfbmFtZShuYW1lcy5zaXplKTtcblxuXHRcdFx0aWYgKGlzX3ByaW1pdGl2ZSh0aGluZykpIHtcblx0XHRcdFx0Y29uc3QgbGVuZ3RoID0gc3RyaW5naWZ5X2NhY2hlZF9wcmltaXRpdmUodGhpbmcpLmxlbmd0aDtcblx0XHRcdFx0Ly8gSG9pc3RpbmcgY29zdHMgb25lIGxpdGVyYWwsIGEgcGFyYW1ldGVyIGFuZCBhIHJlZmVyZW5jZSBwZXIgb2NjdXJyZW5jZS5cblx0XHRcdFx0Ly8gQWxsb3cgZm9yIHRoZSBJSUZFIHdyYXBwZXIgYW5kIHNlcGFyYXRvcnMgZXZlbiBpZiBvbmUgYWxyZWFkeSBleGlzdHMsXG5cdFx0XHRcdC8vIHNvIGluZXhwZW5zaXZlIHJlcGV0aXRpb25zIHN0YXkgaW5saW5lLlxuXHRcdFx0XHRpZiAobGVuZ3RoICogY291bnQgPD0gbGVuZ3RoICsgKGNvdW50ICsgMSkgKiBuYW1lLmxlbmd0aCArIDI1KSByZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdG5hbWVzLnNldCh0aGluZywgbmFtZSk7XG5cdFx0fSk7XG5cblx0LyoqXG5cdCAqIEBwYXJhbSB7YW55fSB0aGluZ1xuXHQgKiBAcmV0dXJucyB7c3RyaW5nfVxuXHQgKi9cblx0ZnVuY3Rpb24gc3RyaW5naWZ5KHRoaW5nKSB7XG5cdFx0aWYgKG5hbWVzLmhhcyh0aGluZykpIHtcblx0XHRcdHJldHVybiBuYW1lcy5nZXQodGhpbmcpO1xuXHRcdH1cblxuXHRcdGlmIChpc19wcmltaXRpdmUodGhpbmcpKSB7XG5cdFx0XHRyZXR1cm4gc3RyaW5naWZ5X3ByaW1pdGl2ZSh0aGluZyk7XG5cdFx0fVxuXG5cdFx0aWYgKGN1c3RvbS5oYXModGhpbmcpKSB7XG5cdFx0XHRyZXR1cm4gY3VzdG9tLmdldCh0aGluZyk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgdHlwZSA9IGdldF90eXBlKHRoaW5nKTtcblxuXHRcdHN3aXRjaCAodHlwZSkge1xuXHRcdFx0Y2FzZSAnTnVtYmVyJzpcblx0XHRcdGNhc2UgJ1N0cmluZyc6XG5cdFx0XHRjYXNlICdCb29sZWFuJzpcblx0XHRcdGNhc2UgJ0JpZ0ludCc6XG5cdFx0XHRcdHJldHVybiBgT2JqZWN0KCR7c3RyaW5naWZ5KHRoaW5nLnZhbHVlT2YoKSl9KWA7XG5cblx0XHRcdGNhc2UgJ1JlZ0V4cCc6XG5cdFx0XHRcdGNvbnN0IHsgc291cmNlLCBmbGFncyB9ID0gdGhpbmc7XG5cdFx0XHRcdHJldHVybiBmbGFnc1xuXHRcdFx0XHRcdD8gYG5ldyBSZWdFeHAoJHtzdHJpbmdpZnlfc3RyaW5nKHNvdXJjZSl9LFwiJHtmbGFnc31cIilgXG5cdFx0XHRcdFx0OiBgbmV3IFJlZ0V4cCgke3N0cmluZ2lmeV9zdHJpbmcoc291cmNlKX0pYDtcblxuXHRcdFx0Y2FzZSAnRGF0ZSc6XG5cdFx0XHRcdHJldHVybiBgbmV3IERhdGUoJHt0aGluZy5nZXRUaW1lKCl9KWA7XG5cblx0XHRcdGNhc2UgJ1VSTCc6XG5cdFx0XHRcdHJldHVybiBgbmV3IFVSTCgke3N0cmluZ2lmeV9zdHJpbmcodGhpbmcudG9TdHJpbmcoKSl9KWA7XG5cblx0XHRcdGNhc2UgJ1VSTFNlYXJjaFBhcmFtcyc6XG5cdFx0XHRcdHJldHVybiBgbmV3IFVSTFNlYXJjaFBhcmFtcygke3N0cmluZ2lmeV9zdHJpbmcodGhpbmcudG9TdHJpbmcoKSl9KWA7XG5cblx0XHRcdGNhc2UgJ0FycmF5Jzoge1xuXHRcdFx0XHQvLyBGb3IgZGVuc2UgYXJyYXlzIChubyBob2xlcyksIHdlIGl0ZXJhdGUgbm9ybWFsbHkuXG5cdFx0XHRcdC8vIFdoZW4gd2UgZW5jb3VudGVyIHRoZSBmaXJzdCBob2xlLCB3ZSBjb2xsZWN0IG93biBpbmRpY2VzXG5cdFx0XHRcdC8vIHRvIGRldGVybWluZSB0aGUgc3BhcnNlbmVzcywgdGhlbiBkZWNpZGUgYmV0d2Vlbjpcblx0XHRcdFx0Ly8gICAtIEFycmF5IGxpdGVyYWwgd2l0aCBob2xlczogWyxcImFcIiwsXSAoZGVmYXVsdClcblx0XHRcdFx0Ly8gICAtIE9iamVjdC5hc3NpZ24gd2l0aCBhIHNwYXJzZS1zYWZlIGFsbG9jYXRvciAoZm9yIHZlcnkgc3BhcnNlIGFycmF5cylcblx0XHRcdFx0Ly8gT25seSB0aGUgT2JqZWN0LmFzc2lnbiBwYXRoIGF2b2lkcyBpdGVyYXRpbmcgZXZlcnkgc2xvdCwgd2hpY2hcblx0XHRcdFx0Ly8gaXMgd2hhdCBwcm90ZWN0cyBhZ2FpbnN0IHRoZSBEb1Mgb2YgZS5nLiBgYXJyWzEwMDAwMDBdID0gMWAuXG5cdFx0XHRcdGxldCBoYXNfaG9sZXMgPSBmYWxzZTtcblxuXHRcdFx0XHRsZXQgcmVzdWx0ID0gJ1snO1xuXG5cdFx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgdGhpbmcubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRcdFx0XHRpZiAoaSA+IDApIHJlc3VsdCArPSAnLCc7XG5cblx0XHRcdFx0XHRpZiAoT2JqZWN0Lmhhc093bih0aGluZywgaSkpIHtcblx0XHRcdFx0XHRcdHJlc3VsdCArPSBzdHJpbmdpZnkodGhpbmdbaV0pO1xuXHRcdFx0XHRcdH0gZWxzZSBpZiAoIWhhc19ob2xlcykge1xuXHRcdFx0XHRcdFx0Ly8gRGVjaWRlIGJldHdlZW4gYXJyYXkgbGl0ZXJhbCBhbmQgT2JqZWN0LmFzc2lnbi5cblx0XHRcdFx0XHRcdC8vXG5cdFx0XHRcdFx0XHQvLyBBcnJheSBsaXRlcmFsOiBob2xlcyBhcmUgY29uc2VjdXRpdmUgY29tbWFzLlxuXHRcdFx0XHRcdFx0Ly8gRm9yIGV4YW1wbGUsIFssIFwiYVwiLCAsXSBpcyB3cml0dGVuIGFzIFssXCJhXCIsLF0uXG5cdFx0XHRcdFx0XHQvLyBFYWNoIGhvbGUgY29zdHMgMSBjaGFyIChhIGNvbW1hKS5cblx0XHRcdFx0XHRcdC8vXG5cdFx0XHRcdFx0XHQvLyBPYmplY3QuYXNzaWduOiBwb3B1bGF0ZWQgaW5kaWNlcyBhcmUgbGlzdGVkIGV4cGxpY2l0bHkuXG5cdFx0XHRcdFx0XHQvLyBGb3IgZXhhbXBsZSwgWywgXCJhXCIsICxdIHdvdWxkIGJlIHdyaXR0ZW4gYXNcblx0XHRcdFx0XHRcdC8vIE9iamVjdC5hc3NpZ24oc3BhcnNlKDMpLHsxOlwiYVwifSksIHdoZXJlIHNwYXJzZShuKSBzdGFuZHNcblx0XHRcdFx0XHRcdC8vIGZvciB0aGUgZXhwcmVzc2lvbiBlbWl0dGVkIGJ5IHN0cmluZ2lmeV9zcGFyc2VfYXJyYXkobikuXG5cdFx0XHRcdFx0XHQvLyBUaGlzIGF2b2lkcyBwYXlpbmcgcGVyLWhvbGUsIGJ1dCBoYXMgYSBsYXJnZSBmaXhlZFxuXHRcdFx0XHRcdFx0Ly8gb3ZlcmhlYWQgZm9yIHRoZSBhbGxvY2F0b3IgYW5kIE9iamVjdC5hc3NpZ24gd3JhcHBlcixcblx0XHRcdFx0XHRcdC8vIGFuZCBlYWNoIGVsZW1lbnQgY29zdHMgZXh0cmEgY2hhcnMgZm9yIGl0cyBpbmRleCBhbmQgY29sb24uXG5cdFx0XHRcdFx0XHQvL1xuXHRcdFx0XHRcdFx0Ly8gVGhlIHNlcmlhbGl6ZWQgdmFsdWVzIGFyZSB0aGUgc2FtZSBzaXplIGVpdGhlciB3YXksIHNvXG5cdFx0XHRcdFx0XHQvLyB0aGUgY2hvaWNlIGNvbWVzIGRvd24gdG8gdGhlIHN0cnVjdHVyYWwgb3ZlcmhlYWQ6XG5cdFx0XHRcdFx0XHQvL1xuXHRcdFx0XHRcdFx0Ly8gICBBcnJheSBsaXRlcmFsIG92ZXJoZWFkOlxuXHRcdFx0XHRcdFx0Ly8gICAgIDEgY2hhciBwZXIgZWxlbWVudCBvciBob2xlIChjb21tYSBzZXBhcmF0b3JzKVxuXHRcdFx0XHRcdFx0Ly8gICAgICsgMiBjaGFycyBmb3IgXCJbXCIgYW5kIFwiXVwiXG5cdFx0XHRcdFx0XHQvLyAgICAgPSBMICsgMlxuXHRcdFx0XHRcdFx0Ly9cblx0XHRcdFx0XHRcdC8vICAgT2JqZWN0LmFzc2lnbiBvdmVyaGVhZDpcblx0XHRcdFx0XHRcdC8vICAgICBcIk9iamVjdC5hc3NpZ24oXCIgICAgICDigJQgMTQgY2hhcnNcblx0XHRcdFx0XHRcdC8vICAgICArIGFsbG9jYXRvciBleHByZXNzaW9uIOKAlCBBIGNoYXJzXG5cdFx0XHRcdFx0XHQvLyAgICAgKyBcIix7XCIgICAgICAgICAgICAgICAgIOKAlCAyIGNoYXJzXG5cdFx0XHRcdFx0XHQvLyAgICAgKyBmb3IgZWFjaCBwb3B1bGF0ZWQgZWxlbWVudDpcblx0XHRcdFx0XHRcdC8vICAgICAgIGluZGV4ICsgXCI6XCIgKyBcIixcIiAgICAg4oCUIChkICsgMikgY2hhcnNcblx0XHRcdFx0XHRcdC8vICAgICArIFwifSlcIiAgICAgICAgICAgICAgICAg4oCUIDIgY2hhcnNcblx0XHRcdFx0XHRcdC8vICAgICA9ICgxOCArIEEpICsgUCAqIChkICsgMilcblx0XHRcdFx0XHRcdC8vXG5cdFx0XHRcdFx0XHQvLyB3aGVyZSBMIGlzIHRoZSBhcnJheSBsZW5ndGgsIFAgaXMgdGhlIG51bWJlciBvZlxuXHRcdFx0XHRcdFx0Ly8gcG9wdWxhdGVkIGVsZW1lbnRzLCBBIGlzIHRoZSBhbGxvY2F0b3IgZXhwcmVzc2lvbidzXG5cdFx0XHRcdFx0XHQvLyBsZW5ndGgsIGFuZCBkIGlzIHRoZSBudW1iZXIgb2YgZGlnaXRzIGluIEwgKGFuIHVwcGVyXG5cdFx0XHRcdFx0XHQvLyBib3VuZCBvbiB0aGUgZGlnaXRzIGluIGFueSBpbmRleCkuXG5cdFx0XHRcdFx0XHQvL1xuXHRcdFx0XHRcdFx0Ly8gT2JqZWN0LmFzc2lnbiBpcyBjaGVhcGVyIHdoZW46XG5cdFx0XHRcdFx0XHQvLyAgICgxOCArIEEpICsgUCAqIChkICsgMikgPCBMICsgMlxuXHRcdFx0XHRcdFx0Y29uc3QgcG9wdWxhdGVkX2tleXMgPSB2YWxpZF9hcnJheV9pbmRpY2VzKHRoaW5nKTtcblx0XHRcdFx0XHRcdGNvbnN0IHBvcHVsYXRpb24gPSBwb3B1bGF0ZWRfa2V5cy5sZW5ndGg7XG5cdFx0XHRcdFx0XHRjb25zdCBkID0gU3RyaW5nKHRoaW5nLmxlbmd0aCkubGVuZ3RoO1xuXHRcdFx0XHRcdFx0Y29uc3QgYXJyYXkgPSBzdHJpbmdpZnlfc3BhcnNlX2FycmF5KHRoaW5nLmxlbmd0aCk7XG5cblx0XHRcdFx0XHRcdGNvbnN0IGhvbGVfY29zdCA9IHRoaW5nLmxlbmd0aCArIDI7XG5cdFx0XHRcdFx0XHRjb25zdCBzcGFyc2VfY29zdCA9IGFycmF5Lmxlbmd0aCArIDE4ICsgcG9wdWxhdGlvbiAqIChkICsgMik7XG5cblx0XHRcdFx0XHRcdGlmIChob2xlX2Nvc3QgPiBzcGFyc2VfY29zdCkge1xuXHRcdFx0XHRcdFx0XHRjb25zdCBlbnRyaWVzID0gcG9wdWxhdGVkX2tleXMubWFwKChrKSA9PiBgJHtrfToke3N0cmluZ2lmeSh0aGluZ1trXSl9YCkuam9pbignLCcpO1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gYE9iamVjdC5hc3NpZ24oJHthcnJheX0seyR7ZW50cmllc319KWA7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdGhhc19ob2xlcyA9IHRydWU7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdC8vIGVsc2U6IGFscmVhZHkgZGVjaWRlZCBvbiBhcnJheSBsaXRlcmFsLCBob2xlIGlzIGp1c3QgYW4gZW1wdHkgc2xvdFxuXHRcdFx0XHRcdC8vICh0aGUgY29tbWEgc2VwYXJhdG9yIGlzIGFsbCB3ZSBuZWVkIOKAlCBubyBjb250ZW50IGZvciB0aGlzIHBvc2l0aW9uKVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0Y29uc3QgdGFpbCA9IHRoaW5nLmxlbmd0aCA9PT0gMCB8fCBPYmplY3QuaGFzT3duKHRoaW5nLCB0aGluZy5sZW5ndGggLSAxKSA/ICcnIDogJywnO1xuXHRcdFx0XHRyZXR1cm4gcmVzdWx0ICsgdGFpbCArICddJztcblx0XHRcdH1cblxuXHRcdFx0Y2FzZSAnU2V0Jzpcblx0XHRcdGNhc2UgJ01hcCc6XG5cdFx0XHRcdHJldHVybiBgbmV3ICR7dHlwZX0oWyR7QXJyYXkuZnJvbSh0aGluZykubWFwKHN0cmluZ2lmeSkuam9pbignLCcpfV0pYDtcblxuXHRcdFx0Y2FzZSAnSW50OEFycmF5Jzpcblx0XHRcdGNhc2UgJ1VpbnQ4QXJyYXknOlxuXHRcdFx0Y2FzZSAnVWludDhDbGFtcGVkQXJyYXknOlxuXHRcdFx0Y2FzZSAnSW50MTZBcnJheSc6XG5cdFx0XHRjYXNlICdVaW50MTZBcnJheSc6XG5cdFx0XHRjYXNlICdGbG9hdDE2QXJyYXknOlxuXHRcdFx0Y2FzZSAnSW50MzJBcnJheSc6XG5cdFx0XHRjYXNlICdVaW50MzJBcnJheSc6XG5cdFx0XHRjYXNlICdGbG9hdDMyQXJyYXknOlxuXHRcdFx0Y2FzZSAnRmxvYXQ2NEFycmF5Jzpcblx0XHRcdGNhc2UgJ0JpZ0ludDY0QXJyYXknOlxuXHRcdFx0Y2FzZSAnQmlnVWludDY0QXJyYXknOiB7XG5cdFx0XHRcdGlmIChpc19idWZmZXIodGhpbmcpKSB0aGluZyA9IG5ldyBVaW50OEFycmF5KHRoaW5nKTtcblxuXHRcdFx0XHRsZXQgc3RyID0gYG5ldyAke3R5cGV9YDtcblxuXHRcdFx0XHRpZiAoIW5hbWVzLmhhcyh0aGluZy5idWZmZXIpKSB7XG5cdFx0XHRcdFx0c3RyICs9IGAoWyR7c3RyaW5naWZ5X3R5cGVkX2FycmF5X2VsZW1lbnRzKHR5cGUsIHRoaW5nLmJ1ZmZlcil9XSlgO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHN0ciArPSBgKCR7c3RyaW5naWZ5KHRoaW5nLmJ1ZmZlcil9KWA7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBoYW5kbGUgc3ViYXJyYXlzXG5cdFx0XHRcdGlmICh0aGluZy5ieXRlTGVuZ3RoICE9PSB0aGluZy5idWZmZXIuYnl0ZUxlbmd0aCkge1xuXHRcdFx0XHRcdGNvbnN0IHN0YXJ0ID0gdGhpbmcuYnl0ZU9mZnNldCAvIHRoaW5nLkJZVEVTX1BFUl9FTEVNRU5UO1xuXHRcdFx0XHRcdGNvbnN0IGVuZCA9IHN0YXJ0ICsgdGhpbmcubGVuZ3RoO1xuXHRcdFx0XHRcdHN0ciArPSBgLnN1YmFycmF5KCR7c3RhcnR9LCR7ZW5kfSlgO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuIHN0cjtcblx0XHRcdH1cblxuXHRcdFx0Y2FzZSAnRGF0YVZpZXcnOiB7XG5cdFx0XHRcdGxldCBzdHIgPSBgbmV3IERhdGFWaWV3YDtcblxuXHRcdFx0XHRpZiAoIW5hbWVzLmhhcyh0aGluZy5idWZmZXIpKSB7XG5cdFx0XHRcdFx0c3RyICs9IGAobmV3IFVpbnQ4QXJyYXkoWyR7bmV3IFVpbnQ4QXJyYXkodGhpbmcuYnVmZmVyKX1dKS5idWZmZXJgO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHN0ciArPSBgKCR7c3RyaW5naWZ5KHRoaW5nLmJ1ZmZlcil9YDtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIGhhbmRsZSBzdWJ2aWV3c1xuXHRcdFx0XHRpZiAodGhpbmcuYnl0ZUxlbmd0aCAhPT0gdGhpbmcuYnVmZmVyLmJ5dGVMZW5ndGgpIHtcblx0XHRcdFx0XHRzdHIgKz0gYCwke3RoaW5nLmJ5dGVPZmZzZXR9LCR7dGhpbmcuYnl0ZUxlbmd0aH1gO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuIHN0ciArICcpJztcblx0XHRcdH1cblxuXHRcdFx0Y2FzZSAnQXJyYXlCdWZmZXInOiB7XG5cdFx0XHRcdGNvbnN0IHVpOCA9IG5ldyBVaW50OEFycmF5KHRoaW5nKTtcblx0XHRcdFx0cmV0dXJuIGBuZXcgVWludDhBcnJheShbJHt1aTgudG9TdHJpbmcoKX1dKS5idWZmZXJgO1xuXHRcdFx0fVxuXG5cdFx0XHRjYXNlICdUZW1wb3JhbC5EdXJhdGlvbic6XG5cdFx0XHRjYXNlICdUZW1wb3JhbC5JbnN0YW50Jzpcblx0XHRcdGNhc2UgJ1RlbXBvcmFsLlBsYWluRGF0ZSc6XG5cdFx0XHRjYXNlICdUZW1wb3JhbC5QbGFpblRpbWUnOlxuXHRcdFx0Y2FzZSAnVGVtcG9yYWwuUGxhaW5EYXRlVGltZSc6XG5cdFx0XHRjYXNlICdUZW1wb3JhbC5QbGFpbk1vbnRoRGF5Jzpcblx0XHRcdGNhc2UgJ1RlbXBvcmFsLlBsYWluWWVhck1vbnRoJzpcblx0XHRcdGNhc2UgJ1RlbXBvcmFsLlpvbmVkRGF0ZVRpbWUnOlxuXHRcdFx0XHRyZXR1cm4gYCR7dHlwZX0uZnJvbSgke3N0cmluZ2lmeV9zdHJpbmcodGhpbmcudG9TdHJpbmcoKSl9KWA7XG5cblx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyh0aGluZyk7XG5cdFx0XHRcdGNvbnN0IG9iaiA9IGtleXMubWFwKChrZXkpID0+IGAke3NhZmVfa2V5KGtleSl9OiR7c3RyaW5naWZ5KHRoaW5nW2tleV0pfWApLmpvaW4oJywnKTtcblx0XHRcdFx0Y29uc3QgcHJvdG8gPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YodGhpbmcpO1xuXHRcdFx0XHRpZiAocHJvdG8gPT09IG51bGwpIHtcblx0XHRcdFx0XHRyZXR1cm4ga2V5cy5sZW5ndGggPiAwID8gYHske29ian0sX19wcm90b19fOm51bGx9YCA6IGB7X19wcm90b19fOm51bGx9YDtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJldHVybiBgeyR7b2JqfX1gO1xuXHRcdH1cblx0fVxuXG5cdGNvbnN0IHN0ciA9IHN0cmluZ2lmeSh2YWx1ZSk7XG5cblx0aWYgKG5hbWVzLnNpemUpIHtcblx0XHQvKiogQHR5cGUge3N0cmluZ1tdfSAqL1xuXHRcdGNvbnN0IHBhcmFtcyA9IFtdO1xuXG5cdFx0LyoqIEB0eXBlIHtzdHJpbmdbXX0gKi9cblx0XHRjb25zdCBzdGF0ZW1lbnRzID0gW107XG5cblx0XHQvKiogQHR5cGUge3N0cmluZ1tdfSAqL1xuXHRcdGNvbnN0IHZhbHVlcyA9IFtdO1xuXG5cdFx0Ly8gUmVjb25zdHJ1Y3Rpb25zIChlLmcuIGBiID0gbmV3IFVpbnQ4QXJyYXkoLi4uKWApIHJlYXNzaWduIGEgcGxhY2Vob2xkZXJcblx0XHQvLyBwYXJhbWV0ZXIuIFRoZXkgbXVzdCBydW4gYmVmb3JlIHRoZSBgc3RhdGVtZW50c2AgdGhhdCByZWZlcmVuY2UgdGhlbSxcblx0XHQvLyBvdGhlcndpc2UgdGhvc2Ugc3RhdGVtZW50cyBjYXB0dXJlIHRoZSBwbGFjZWhvbGRlci4gVGhleSBvbmx5IGRlcGVuZCBvblxuXHRcdC8vIElJRkUgYXJndW1lbnRzIChuZXZlciBvbiBlYWNoIG90aGVyKSwgc28gZW1pdHRpbmcgdGhlbSBmaXJzdCBpcyBzYWZlLlxuXHRcdC8qKiBAdHlwZSB7c3RyaW5nW119ICovXG5cdFx0Y29uc3QgcmVjb25zdHJ1Y3Rpb25zID0gW107XG5cblx0XHRuYW1lcy5mb3JFYWNoKChuYW1lLCB0aGluZykgPT4ge1xuXHRcdFx0cGFyYW1zLnB1c2gobmFtZSk7XG5cblx0XHRcdGlmIChjdXN0b20uaGFzKHRoaW5nKSkge1xuXHRcdFx0XHR2YWx1ZXMucHVzaCgvKiogQHR5cGUge3N0cmluZ30gKi8gKGN1c3RvbS5nZXQodGhpbmcpKSk7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGlzX3ByaW1pdGl2ZSh0aGluZykpIHtcblx0XHRcdFx0dmFsdWVzLnB1c2goc3RyaW5naWZ5X2NhY2hlZF9wcmltaXRpdmUodGhpbmcpKTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCB0eXBlID0gZ2V0X3R5cGUodGhpbmcpO1xuXG5cdFx0XHRzd2l0Y2ggKHR5cGUpIHtcblx0XHRcdFx0Y2FzZSAnTnVtYmVyJzpcblx0XHRcdFx0Y2FzZSAnU3RyaW5nJzpcblx0XHRcdFx0Y2FzZSAnQm9vbGVhbic6XG5cdFx0XHRcdGNhc2UgJ0JpZ0ludCc6IHtcblx0XHRcdFx0XHRjb25zdCBwcmltaXRpdmUgPSB0aGluZy52YWx1ZU9mKCk7XG5cdFx0XHRcdFx0aWYgKG5hbWVzLmhhcyhwcmltaXRpdmUpKSB7XG5cdFx0XHRcdFx0XHQvLyBBIGhvaXN0ZWQgcHJpbWl0aXZlIGlzIG9ubHkgaW4gc2NvcGUgaW5zaWRlIHRoZSBJSUZFLCBub3QgaW5cblx0XHRcdFx0XHRcdC8vIGl0cyBhcmd1bWVudHMuIFJlY29uc3RydWN0IHRoZSBib3ggYmVmb3JlIGFzc2lnbmluZyByZWZlcmVuY2VzLlxuXHRcdFx0XHRcdFx0dmFsdWVzLnB1c2goJ3t9Jyk7XG5cdFx0XHRcdFx0XHRyZWNvbnN0cnVjdGlvbnMucHVzaChgJHtuYW1lfT1PYmplY3QoJHtzdHJpbmdpZnkocHJpbWl0aXZlKX0pYCk7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdHZhbHVlcy5wdXNoKGBPYmplY3QoJHtzdHJpbmdpZnkocHJpbWl0aXZlKX0pYCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Y2FzZSAnUmVnRXhwJzpcblx0XHRcdFx0XHRjb25zdCB7IHNvdXJjZSwgZmxhZ3MgfSA9IHRoaW5nO1xuXHRcdFx0XHRcdGNvbnN0IHJlZ2V4cCA9IGZsYWdzXG5cdFx0XHRcdFx0XHQ/IGBuZXcgUmVnRXhwKCR7c3RyaW5naWZ5X3N0cmluZyhzb3VyY2UpfSxcIiR7ZmxhZ3N9XCIpYFxuXHRcdFx0XHRcdFx0OiBgbmV3IFJlZ0V4cCgke3N0cmluZ2lmeV9zdHJpbmcoc291cmNlKX0pYFxuXHRcdFx0XHRcdHZhbHVlcy5wdXNoKHJlZ2V4cCk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cblx0XHRcdFx0Y2FzZSAnRGF0ZSc6XG5cdFx0XHRcdFx0dmFsdWVzLnB1c2goYG5ldyBEYXRlKCR7dGhpbmcuZ2V0VGltZSgpfSlgKTtcblx0XHRcdFx0XHRicmVhaztcblxuXHRcdFx0XHRjYXNlICdVUkwnOlxuXHRcdFx0XHRcdHZhbHVlcy5wdXNoKGBuZXcgVVJMKCR7c3RyaW5naWZ5X3N0cmluZyh0aGluZy50b1N0cmluZygpKX0pYCk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cblx0XHRcdFx0Y2FzZSAnVVJMU2VhcmNoUGFyYW1zJzpcblx0XHRcdFx0XHR2YWx1ZXMucHVzaChgbmV3IFVSTFNlYXJjaFBhcmFtcygke3N0cmluZ2lmeV9zdHJpbmcodGhpbmcudG9TdHJpbmcoKSl9KWApO1xuXHRcdFx0XHRcdGJyZWFrO1xuXG5cdFx0XHRcdGNhc2UgJ0FycmF5Jzoge1xuXHRcdFx0XHRcdGNvbnN0IHBvcHVsYXRlZF9rZXlzID0gdmFsaWRfYXJyYXlfaW5kaWNlcyh0aGluZyk7XG5cdFx0XHRcdFx0Ly8gT25seSBwcmVhbGxvY2F0ZSB3aGVuIHRoZSBsZW5ndGggaXMgYm91bmRlZCBieSB0aGUgbnVtYmVyXG5cdFx0XHRcdFx0Ly8gb2YgcG9wdWxhdGVkIGVsZW1lbnRzLCBwbHVzIGEgc21hbGwgY29uc3RhbnQgZm9yIHNob3J0IGFycmF5cy5cblx0XHRcdFx0XHR2YWx1ZXMucHVzaChcblx0XHRcdFx0XHRcdHRoaW5nLmxlbmd0aCA+IDMyICsgMiAqIHBvcHVsYXRlZF9rZXlzLmxlbmd0aFxuXHRcdFx0XHRcdFx0XHQ/IHN0cmluZ2lmeV9zcGFyc2VfYXJyYXkodGhpbmcubGVuZ3RoKVxuXHRcdFx0XHRcdFx0XHQ6IGBBcnJheSgke3RoaW5nLmxlbmd0aH0pYFxuXHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0Zm9yIChjb25zdCBpIG9mIHBvcHVsYXRlZF9rZXlzKSB7XG5cdFx0XHRcdFx0XHRzdGF0ZW1lbnRzLnB1c2goYCR7bmFtZX1bJHtpfV09JHtzdHJpbmdpZnkodGhpbmdbaV0pfWApO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGNhc2UgJ1NldCc6IHtcblx0XHRcdFx0XHR2YWx1ZXMucHVzaChgbmV3IFNldGApO1xuXHRcdFx0XHRcdGNvbnN0IGFkZHMgPSBBcnJheS5mcm9tKHRoaW5nKS5tYXAoKHYpID0+IGAuYWRkKCR7c3RyaW5naWZ5KHYpfSlgKTtcblx0XHRcdFx0XHQvLyBBbiBlbXB0eSBTZXQgaXMgZnVsbHkgYnVpbHQgYnkgYG5ldyBTZXRgOyBhIGNoYWluZWQgc3RhdGVtZW50IHdvdWxkXG5cdFx0XHRcdFx0Ly8gb3RoZXJ3aXNlIGJlIGEgZGFuZ2xpbmcgYG5hbWUuYC5cblx0XHRcdFx0XHRpZiAoYWRkcy5sZW5ndGggPiAwKSBzdGF0ZW1lbnRzLnB1c2gobmFtZSArIGFkZHMuam9pbignJykpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Y2FzZSAnTWFwJzoge1xuXHRcdFx0XHRcdHZhbHVlcy5wdXNoKGBuZXcgTWFwYCk7XG5cdFx0XHRcdFx0Y29uc3Qgc2V0cyA9IEFycmF5LmZyb20odGhpbmcpLm1hcChcblx0XHRcdFx0XHRcdChbaywgdl0pID0+IGAuc2V0KCR7c3RyaW5naWZ5KGspfSwgJHtzdHJpbmdpZnkodil9KWBcblx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdGlmIChzZXRzLmxlbmd0aCA+IDApIHN0YXRlbWVudHMucHVzaChuYW1lICsgc2V0cy5qb2luKCcnKSk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjYXNlICdJbnQ4QXJyYXknOlxuXHRcdFx0XHRjYXNlICdVaW50OEFycmF5Jzpcblx0XHRcdFx0Y2FzZSAnVWludDhDbGFtcGVkQXJyYXknOlxuXHRcdFx0XHRjYXNlICdJbnQxNkFycmF5Jzpcblx0XHRcdFx0Y2FzZSAnVWludDE2QXJyYXknOlxuXHRcdFx0XHRjYXNlICdGbG9hdDE2QXJyYXknOlxuXHRcdFx0XHRjYXNlICdJbnQzMkFycmF5Jzpcblx0XHRcdFx0Y2FzZSAnVWludDMyQXJyYXknOlxuXHRcdFx0XHRjYXNlICdGbG9hdDMyQXJyYXknOlxuXHRcdFx0XHRjYXNlICdGbG9hdDY0QXJyYXknOlxuXHRcdFx0XHRjYXNlICdCaWdJbnQ2NEFycmF5Jzpcblx0XHRcdFx0Y2FzZSAnQmlnVWludDY0QXJyYXknOiB7XG5cdFx0XHRcdFx0aWYgKGlzX2J1ZmZlcih0aGluZykpIHRoaW5nID0gbmV3IFVpbnQ4QXJyYXkodGhpbmcpO1xuXG5cdFx0XHRcdFx0bGV0IHN0ciA9IGBuZXcgJHt0eXBlfWA7XG5cblx0XHRcdFx0XHRpZiAoIW5hbWVzLmhhcyh0aGluZy5idWZmZXIpKSB7XG5cdFx0XHRcdFx0XHRzdHIgKz0gYChbJHtzdHJpbmdpZnlfdHlwZWRfYXJyYXlfZWxlbWVudHModHlwZSwgdGhpbmcuYnVmZmVyKX1dKWA7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdHN0ciArPSBgKCR7c3RyaW5naWZ5KHRoaW5nLmJ1ZmZlcil9KWA7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Ly8gaGFuZGxlIHN1YmFycmF5c1xuXHRcdFx0XHRcdGlmICh0aGluZy5ieXRlTGVuZ3RoICE9PSB0aGluZy5idWZmZXIuYnl0ZUxlbmd0aCkge1xuXHRcdFx0XHRcdFx0Y29uc3Qgc3RhcnQgPSB0aGluZy5ieXRlT2Zmc2V0IC8gdGhpbmcuQllURVNfUEVSX0VMRU1FTlQ7XG5cdFx0XHRcdFx0XHRjb25zdCBlbmQgPSBzdGFydCArIHRoaW5nLmxlbmd0aDtcblx0XHRcdFx0XHRcdHN0ciArPSBgLnN1YmFycmF5KCR7c3RhcnR9LCR7ZW5kfSlgO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHZhbHVlcy5wdXNoKGB7fWApO1xuXHRcdFx0XHRcdHJlY29uc3RydWN0aW9ucy5wdXNoKGAke25hbWV9PSR7c3RyfWApO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Y2FzZSAnRGF0YVZpZXcnOiB7XG5cdFx0XHRcdFx0bGV0IHN0ciA9IGBuZXcgRGF0YVZpZXdgO1xuXG5cdFx0XHRcdFx0aWYgKCFuYW1lcy5oYXModGhpbmcuYnVmZmVyKSkge1xuXHRcdFx0XHRcdFx0c3RyICs9IGAobmV3IFVpbnQ4QXJyYXkoWyR7bmV3IFVpbnQ4QXJyYXkodGhpbmcuYnVmZmVyKX1dKS5idWZmZXJgO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRzdHIgKz0gYCgke3N0cmluZ2lmeSh0aGluZy5idWZmZXIpfWA7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Ly8gaGFuZGxlIHN1YnZpZXdzXG5cdFx0XHRcdFx0aWYgKHRoaW5nLmJ5dGVMZW5ndGggIT09IHRoaW5nLmJ1ZmZlci5ieXRlTGVuZ3RoKSB7XG5cdFx0XHRcdFx0XHRzdHIgKz0gYCwke3RoaW5nLmJ5dGVPZmZzZXR9LCR7dGhpbmcuYnl0ZUxlbmd0aH1gO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHN0ciArPSAnKSc7XG5cblx0XHRcdFx0XHR2YWx1ZXMucHVzaChge31gKTtcblx0XHRcdFx0XHRyZWNvbnN0cnVjdGlvbnMucHVzaChgJHtuYW1lfT0ke3N0cn1gKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGNhc2UgJ0FycmF5QnVmZmVyJzpcblx0XHRcdFx0XHR2YWx1ZXMucHVzaChgbmV3IFVpbnQ4QXJyYXkoWyR7bmV3IFVpbnQ4QXJyYXkodGhpbmcpfV0pLmJ1ZmZlcmApO1xuXHRcdFx0XHRcdGJyZWFrO1xuXG5cdFx0XHRcdGNhc2UgJ1RlbXBvcmFsLkR1cmF0aW9uJzpcblx0XHRcdFx0Y2FzZSAnVGVtcG9yYWwuSW5zdGFudCc6XG5cdFx0XHRcdGNhc2UgJ1RlbXBvcmFsLlBsYWluRGF0ZSc6XG5cdFx0XHRcdGNhc2UgJ1RlbXBvcmFsLlBsYWluVGltZSc6XG5cdFx0XHRcdGNhc2UgJ1RlbXBvcmFsLlBsYWluRGF0ZVRpbWUnOlxuXHRcdFx0XHRjYXNlICdUZW1wb3JhbC5QbGFpbk1vbnRoRGF5Jzpcblx0XHRcdFx0Y2FzZSAnVGVtcG9yYWwuUGxhaW5ZZWFyTW9udGgnOlxuXHRcdFx0XHRjYXNlICdUZW1wb3JhbC5ab25lZERhdGVUaW1lJzpcblx0XHRcdFx0XHR2YWx1ZXMucHVzaChgJHt0eXBlfS5mcm9tKCR7c3RyaW5naWZ5X3N0cmluZyh0aGluZy50b1N0cmluZygpKX0pYCk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cblx0XHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0XHR2YWx1ZXMucHVzaChPYmplY3QuZ2V0UHJvdG90eXBlT2YodGhpbmcpID09PSBudWxsID8gJ09iamVjdC5jcmVhdGUobnVsbCknIDogJ3t9Jyk7XG5cdFx0XHRcdFx0T2JqZWN0LmtleXModGhpbmcpLmZvckVhY2goKGtleSkgPT4ge1xuXHRcdFx0XHRcdFx0c3RhdGVtZW50cy5wdXNoKGAke25hbWV9JHtzYWZlX3Byb3Aoa2V5KX09JHtzdHJpbmdpZnkodGhpbmdba2V5XSl9YCk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHRzdGF0ZW1lbnRzLnB1c2goYHJldHVybiAke3N0cn1gKTtcblxuXHRcdGNvbnN0IGJvZHkgPSBbLi4ucmVjb25zdHJ1Y3Rpb25zLCAuLi5zdGF0ZW1lbnRzXS5qb2luKCc7Jyk7XG5cdFx0Ly8gQSBmdW5jdGlvbiBtYXkgaGF2ZSBhdCBtb3N0IDY1NTM1IHBhcmFtZXRlcnMgKGFuZCBhIGNhbGwgYXQgbW9zdCB0aGF0XG5cdFx0Ly8gbWFueSBhcmd1bWVudHMpLiBGb3IgdmVyeSBsYXJnZSBncmFwaHMsIHBhc3MgdGhlIGhvaXN0ZWQgdmFsdWVzIGFzIGFcblx0XHQvLyBzaW5nbGUgYXJyYXkgYXJndW1lbnQgYW5kIGRlc3RydWN0dXJlIHRoZW0gaW50byB0aGUgcGxhY2Vob2xkZXIgbmFtZXMsXG5cdFx0Ly8gc28gdGhlIGVtaXR0ZWQgY29kZSBzdGF5cyB3aXRoaW4gdGhlIGVuZ2luZSBsaW1pdCAoIzkzKS5cblx0XHRpZiAocGFyYW1zLmxlbmd0aCA+IDY1NTM0KSB7XG5cdFx0XHRyZXR1cm4gYChmdW5jdGlvbigpe3Zhclske3BhcmFtcy5qb2luKCcsJyl9XT1hcmd1bWVudHNbMF07JHtib2R5fX0oWyR7dmFsdWVzLmpvaW4oJywnKX1dKSlgO1xuXHRcdH1cblxuXHRcdHJldHVybiBgKGZ1bmN0aW9uKCR7cGFyYW1zLmpvaW4oJywnKX0peyR7Ym9keX19KCR7dmFsdWVzLmpvaW4oJywnKX0pKWA7XG5cdH0gZWxzZSB7XG5cdFx0cmV0dXJuIHN0cjtcblx0fVxufVxuXG4vKipcbiAqIEVtaXQgYW4gYXJyYXkgd2hvc2Ugc3RvcmFnZSBpcyBub3QgcHJvcG9ydGlvbmFsIHRvIGl0cyBkZWNsYXJlZCBsZW5ndGguXG4gKiBBcyBpbiB0aGUgZGVmYXVsdCBwYXJzZSBvcGVyYXRpb25zLCB0b3VjaGluZyBhbmQgZGVsZXRpbmcgdGhlIGxhcmdlc3QgdmFsaWRcbiAqIGluZGV4IGZvcmNlcyBWOCBpbnRvIGRpY3Rpb25hcnktZWxlbWVudHMgbW9kZSBiZWZvcmUgc2V0dGluZyB0aGUgbGVuZ3RoLlxuICogTWVyZWx5IHN0YXJ0aW5nIHdpdGggW10gYW5kIGFzc2lnbmluZyAubGVuZ3RoIHN0aWxsIGVhZ2VybHkgYWxsb2NhdGVzLlxuICogQHBhcmFtIHtudW1iZXJ9IGxlbmd0aFxuICovXG5mdW5jdGlvbiBzdHJpbmdpZnlfc3BhcnNlX2FycmF5KGxlbmd0aCkge1xuXHRyZXR1cm4gYChmdW5jdGlvbihhKXthWyR7TUFYX0FSUkFZX0lOREVYfV09MDtkZWxldGUgYVske01BWF9BUlJBWV9JTkRFWH1dO2EubGVuZ3RoPSR7bGVuZ3RofTtyZXR1cm4gYX0oW10pKWA7XG59XG5cbi8qKlxuICogU2VyaWFsaXplIHRoZSBlbGVtZW50cyBvZiBgYnVmZmVyYCwgcmVhZCBhcyBgdHlwZWAsIGFzIGEgY29tbWEtc2VwYXJhdGVkIGxpc3QuXG4gKiBUaGUgdmlldyBpcyBjcmVhdGVkIGZyb20gYHR5cGVgIHJhdGhlciB0aGFuIGZyb20gdGhlIHNlcmlhbGl6ZWQgdmFsdWUncyBvd25cbiAqIGNvbnN0cnVjdG9yLCB3aGljaCBtYXkgYmUgYSBzdWJjbGFzcyBsaWtlIE5vZGUncyBgQnVmZmVyYCB3aG9zZSBgdG9TdHJpbmdgXG4gKiBkZWNvZGVzIHRoZSBieXRlcyBpbnN0ZWFkIG9mIGxpc3RpbmcgdGhlbS5cbiAqIGBCaWdJbnQ2NEFycmF5YC9gQmlnVWludDY0QXJyYXlgIGVsZW1lbnRzIGFyZSBiaWdpbnRzIGFuZCBtdXN0IGJlIHdyaXR0ZW5cbiAqIHdpdGggYW4gYG5gIHN1ZmZpeCwgb3RoZXJ3aXNlIHRoZSBlbWl0dGVkIGBuZXcgQmlnSW50NjRBcnJheShbLi4uXSlgIHRocm93cy5cbiAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlXG4gKiBAcGFyYW0ge0FycmF5QnVmZmVyTGlrZX0gYnVmZmVyXG4gKi9cbmZ1bmN0aW9uIHN0cmluZ2lmeV90eXBlZF9hcnJheV9lbGVtZW50cyh0eXBlLCBidWZmZXIpIHtcblx0Y29uc3QgYXJyYXkgPSBuZXcgKC8qKiBAdHlwZSB7YW55fSAqLyAoZ2xvYmFsVGhpcylbdHlwZV0pKGJ1ZmZlcik7XG5cblx0aWYgKHR5cGUgPT09ICdCaWdJbnQ2NEFycmF5JyB8fCB0eXBlID09PSAnQmlnVWludDY0QXJyYXknKSB7XG5cdFx0cmV0dXJuIEFycmF5LmZyb20oYXJyYXksIChlbGVtZW50KSA9PiBgJHtlbGVtZW50fW5gKS5qb2luKCcsJyk7XG5cdH1cblxuXHQvLyBGbG9hdCBhcnJheXMgY2FuIGhvbGQgYC0wYCwgd2hpY2ggYHRvU3RyaW5nKClgIGNvbGxhcHNlcyB0byBgXCIwXCJgLCBzaWxlbnRseVxuXHQvLyBsb3NpbmcgdGhlIHNpZ24gb24gcm91bmQtdHJpcC4gRW1pdCBgLTBgIGV4cGxpY2l0bHkgZm9yIHRob3NlIGVsZW1lbnRzLlxuXHRpZiAoXG5cdFx0YXJyYXkgaW5zdGFuY2VvZiBGbG9hdDMyQXJyYXkgfHxcblx0XHRhcnJheSBpbnN0YW5jZW9mIEZsb2F0NjRBcnJheSB8fFxuXHRcdCh0eXBlb2YgRmxvYXQxNkFycmF5ICE9PSAndW5kZWZpbmVkJyAmJiBhcnJheSBpbnN0YW5jZW9mIEZsb2F0MTZBcnJheSlcblx0KSB7XG5cdFx0cmV0dXJuIEFycmF5LmZyb20oYXJyYXksIChlbGVtZW50KSA9PiAoT2JqZWN0LmlzKGVsZW1lbnQsIC0wKSA/ICctMCcgOiBgJHtlbGVtZW50fWApKS5qb2luKCcsJyk7XG5cdH1cblxuXHRyZXR1cm4gYXJyYXkudG9TdHJpbmcoKTtcbn1cblxuLyoqIEBwYXJhbSB7bnVtYmVyfSBudW0gKi9cbmZ1bmN0aW9uIGdldF9uYW1lKG51bSkge1xuXHRsZXQgbmFtZSA9ICcnO1xuXG5cdGRvIHtcblx0XHRuYW1lID0gY2hhcnNbbnVtICUgY2hhcnMubGVuZ3RoXSArIG5hbWU7XG5cdFx0bnVtID0gfn4obnVtIC8gY2hhcnMubGVuZ3RoKSAtIDE7XG5cdH0gd2hpbGUgKG51bSA+PSAwKTtcblxuXHRyZXR1cm4gcmVzZXJ2ZWQudGVzdChuYW1lKSA/IGAke25hbWV9MGAgOiBuYW1lO1xufVxuXG4vKiogQHBhcmFtIHtzdHJpbmd9IGMgKi9cbmZ1bmN0aW9uIGVzY2FwZV91bnNhZmVfY2hhcihjKSB7XG5cdHJldHVybiBlc2NhcGVkW2NdIHx8IGM7XG59XG5cbi8qKiBAcGFyYW0ge3N0cmluZ30gc3RyICovXG5mdW5jdGlvbiBlc2NhcGVfdW5zYWZlX2NoYXJzKHN0cikge1xuXHRyZXR1cm4gc3RyLnJlcGxhY2UodW5zYWZlX2NoYXJzLCBlc2NhcGVfdW5zYWZlX2NoYXIpO1xufVxuXG4vKiogQHBhcmFtIHtzdHJpbmd9IGtleSAqL1xuZnVuY3Rpb24gc2FmZV9rZXkoa2V5KSB7XG5cdHJldHVybiAvXltfJGEtekEtWl1bXyRhLXpBLVowLTldKiQvLnRlc3Qoa2V5KSA/IGtleSA6IGVzY2FwZV91bnNhZmVfY2hhcnMoSlNPTi5zdHJpbmdpZnkoa2V5KSk7XG59XG5cbi8qKiBAcGFyYW0ge3N0cmluZ30ga2V5ICovXG5mdW5jdGlvbiBzYWZlX3Byb3Aoa2V5KSB7XG5cdHJldHVybiAvXltfJGEtekEtWl1bXyRhLXpBLVowLTldKiQvLnRlc3Qoa2V5KVxuXHRcdD8gYC4ke2tleX1gXG5cdFx0OiBgWyR7ZXNjYXBlX3Vuc2FmZV9jaGFycyhKU09OLnN0cmluZ2lmeShrZXkpKX1dYDtcbn1cblxuLyoqIEBwYXJhbSB7YW55fSB0aGluZyAqL1xuZnVuY3Rpb24gc3RyaW5naWZ5X3ByaW1pdGl2ZSh0aGluZykge1xuXHRjb25zdCB0eXBlID0gdHlwZW9mIHRoaW5nO1xuXHRpZiAodHlwZSA9PT0gJ3N0cmluZycpIHJldHVybiBzdHJpbmdpZnlfc3RyaW5nKHRoaW5nKTtcblx0aWYgKHRoaW5nID09PSB2b2lkIDApIHJldHVybiAndm9pZCAwJztcblx0aWYgKHRoaW5nID09PSAwICYmIDEgLyB0aGluZyA8IDApIHJldHVybiAnLTAnO1xuXHRjb25zdCBzdHIgPSBTdHJpbmcodGhpbmcpO1xuXHRpZiAodHlwZSA9PT0gJ251bWJlcicpIHJldHVybiBzdHIucmVwbGFjZSgvXigtKT8wXFwuLywgJyQxLicpO1xuXHRpZiAodHlwZSA9PT0gJ2JpZ2ludCcpIHJldHVybiB0aGluZyArICduJztcblx0cmV0dXJuIHN0cjtcbn1cbiIsIi8qIEJhc2VsaW5lIDIwMjUgcnVudGltZXMgKi9cblxuLyoqXHRAdHlwZSB7KGFycmF5X2J1ZmZlcjogQXJyYXlCdWZmZXIpID0+IHN0cmluZ30gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbmNvZGVfbmF0aXZlKGFycmF5X2J1ZmZlcikge1xuXHRyZXR1cm4gbmV3IFVpbnQ4QXJyYXkoYXJyYXlfYnVmZmVyKS50b0Jhc2U2NCgpO1xufVxuXG4vKipcdEB0eXBlIHsoYmFzZTY0OiBzdHJpbmcpID0+IEFycmF5QnVmZmVyfSAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlY29kZV9uYXRpdmUoYmFzZTY0KSB7XG5cdHJldHVybiBVaW50OEFycmF5LmZyb21CYXNlNjQoYmFzZTY0KS5idWZmZXI7XG59XG5cbi8qIE5vZGUtY29tcGF0aWJsZSBydW50aW1lcyAqL1xuXG4vKiogQHR5cGUgeyhhcnJheV9idWZmZXI6IEFycmF5QnVmZmVyKSA9PiBzdHJpbmd9ICovXG5leHBvcnQgZnVuY3Rpb24gZW5jb2RlX2J1ZmZlcihhcnJheV9idWZmZXIpIHtcblx0cmV0dXJuIEJ1ZmZlci5mcm9tKGFycmF5X2J1ZmZlcikudG9TdHJpbmcoJ2Jhc2U2NCcpO1xufVxuXG4vKipcdEB0eXBlIHsoYmFzZTY0OiBzdHJpbmcpID0+IEFycmF5QnVmZmVyfSAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlY29kZV9idWZmZXIoYmFzZTY0KSB7XG5cdHJldHVybiBVaW50OEFycmF5LmZyb20oQnVmZmVyLmZyb20oYmFzZTY0LCAnYmFzZTY0JykpLmJ1ZmZlcjtcbn1cblxuLyogTGVnYWN5IHJ1bnRpbWVzICovXG5cbi8qKiBAdHlwZSB7KGFycmF5X2J1ZmZlcjogQXJyYXlCdWZmZXIpID0+IHN0cmluZ30gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbmNvZGVfbGVnYWN5KGFycmF5X2J1ZmZlcikge1xuXHRjb25zdCBhcnJheSA9IG5ldyBVaW50OEFycmF5KGFycmF5X2J1ZmZlcik7XG5cdGxldCBiaW5hcnkgPSAnJztcblxuXHQvLyB0aGUgbWF4aW11bSBudW1iZXIgb2YgYXJndW1lbnRzIHRvIFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHlcblx0Ly8gc2hvdWxkIGJlIGFyb3VuZCAweEZGRkYgaW4gbW9kZXJuIGVuZ2luZXNcblx0Y29uc3QgY2h1bmtfc2l6ZSA9IDB4ODAwMDtcblx0Zm9yIChsZXQgaSA9IDA7IGkgPCBhcnJheS5sZW5ndGg7IGkgKz0gY2h1bmtfc2l6ZSkge1xuXHRcdGNvbnN0IGNodW5rID0gYXJyYXkuc3ViYXJyYXkoaSwgaSArIGNodW5rX3NpemUpO1xuXHRcdGJpbmFyeSArPSBTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KG51bGwsIGNodW5rKTtcblx0fVxuXG5cdHJldHVybiBidG9hKGJpbmFyeSk7XG59XG5cbi8qKlx0QHR5cGUgeyhiYXNlNjQ6IHN0cmluZykgPT4gQXJyYXlCdWZmZXJ9ICovXG5leHBvcnQgZnVuY3Rpb24gZGVjb2RlX2xlZ2FjeShiYXNlNjQpIHtcblx0Y29uc3QgYmluYXJ5X3N0cmluZyA9IGF0b2IoYmFzZTY0KTtcblx0Y29uc3QgbGVuID0gYmluYXJ5X3N0cmluZy5sZW5ndGg7XG5cdGNvbnN0IGFycmF5ID0gbmV3IFVpbnQ4QXJyYXkobGVuKTtcblxuXHRmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG5cdFx0YXJyYXlbaV0gPSBiaW5hcnlfc3RyaW5nLmNoYXJDb2RlQXQoaSk7XG5cdH1cblxuXHRyZXR1cm4gYXJyYXkuYnVmZmVyO1xufVxuXG5jb25zdCBuYXRpdmUgPSB0eXBlb2YgVWludDhBcnJheS5mcm9tQmFzZTY0ID09PSAnZnVuY3Rpb24nO1xuY29uc3QgYnVmZmVyID0gdHlwZW9mIHByb2Nlc3MgPT09ICdvYmplY3QnICYmIHByb2Nlc3MudmVyc2lvbnM/Lm5vZGUgIT09IHVuZGVmaW5lZDtcblxuZXhwb3J0IGNvbnN0IGVuY29kZTY0ID0gbmF0aXZlID8gZW5jb2RlX25hdGl2ZSA6IGJ1ZmZlciA/IGVuY29kZV9idWZmZXIgOiBlbmNvZGVfbGVnYWN5O1xuZXhwb3J0IGNvbnN0IGRlY29kZTY0ID0gbmF0aXZlID8gZGVjb2RlX25hdGl2ZSA6IGJ1ZmZlciA/IGRlY29kZV9idWZmZXIgOiBkZWNvZGVfbGVnYWN5O1xuIiwiaW1wb3J0IHsgTUFYX0FSUkFZX0lOREVYIH0gZnJvbSAnLi9jb25zdGFudHMuanMnO1xuaW1wb3J0IHtcblx0ZW51bWVyYWJsZV9zeW1ib2xzLFxuXHRnZXRfdHlwZSxcblx0aXNfYnVmZmVyLFxuXHRpc19wbGFpbl9vYmplY3QsXG5cdHZhbGlkX2FycmF5X2luZGljZXNcbn0gZnJvbSAnLi91dGlscy5qcyc7XG5cbi8qKlxuICogTWVyZ2VzIGNhbGxlci1wcm92aWRlZCBvcGVyYXRpb24gb3ZlcnJpZGVzIG92ZXIgdGhlIGRlZmF1bHRzLiBJdGVyYXRpbmcgdGhlXG4gKiBkZWZhdWx0IGtleXMgKHJhdGhlciB0aGFuIHRoZSBvdmVycmlkZSdzIG93biBrZXlzKSBtZWFucyBudWxsaXNoIG1lbWJlcnNcbiAqIGZhbGwgYmFjayB0byB0aGUgZGVmYXVsdCwgYW5kIGluaGVyaXRlZCBtZW1iZXJzIOKAlCBlLmcuIGZyb20gYSBjbGFzc1xuICogaW5zdGFuY2Ug4oCUIGFyZSBwaWNrZWQgdXAuXG4gKlxuICogQHRlbXBsYXRlIHtSZWNvcmQ8c3RyaW5nLCBhbnk+fSBUXG4gKiBAcGFyYW0ge1R9IGRlZmF1bHRzXG4gKiBAcGFyYW0ge1BhcnRpYWw8VD4gfCB1bmRlZmluZWR9IG92ZXJyaWRlc1xuICogQHJldHVybnMge1R9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtZXJnZV9vcGVyYXRpb25zKGRlZmF1bHRzLCBvdmVycmlkZXMpIHtcblx0aWYgKCFvdmVycmlkZXMpIHJldHVybiBkZWZhdWx0cztcblxuXHRjb25zdCBtZXJnZWQgPSAvKiogQHR5cGUge1R9ICovICh7fSk7XG5cblx0Zm9yIChjb25zdCBrZXkgb2YgLyoqIEB0eXBlIHsoa2V5b2YgVClbXX0gKi8gKE9iamVjdC5rZXlzKGRlZmF1bHRzKSkpIHtcblx0XHRtZXJnZWRba2V5XSA9IG92ZXJyaWRlc1trZXldID8/IGRlZmF1bHRzW2tleV07XG5cdH1cblxuXHRyZXR1cm4gbWVyZ2VkO1xufVxuXG4vKiogQHR5cGUge3sga2luZDogJ25vdC1wbGFpbicgfX0gKi9cbmNvbnN0IE5PVF9QTEFJTiA9IC8qIEBfX1BVUkVfXyAqLyBPYmplY3QuZnJlZXplKHsga2luZDogJ25vdC1wbGFpbicgfSk7XG5cbi8qKiBAdHlwZSB7eyBraW5kOiAnc3ltYm9sLWtleXMnIH19ICovXG5jb25zdCBTWU1CT0xfS0VZUyA9IC8qIEBfX1BVUkVfXyAqLyBPYmplY3QuZnJlZXplKHsga2luZDogJ3N5bWJvbC1rZXlzJyB9KTtcblxuLyoqXG4gKiBUaGUgZGVmYXVsdCBpbXBsZW1lbnRhdGlvbnMgb2YgZXZlcnkgaW50cm9zcGVjdGlvbi9leHRyYWN0aW9uIG9wZXJhdGlvblxuICogYHN0cmluZ2lmeWAgcGVyZm9ybXMgb24gdGhlIHZhbHVlIGJlaW5nIHNlcmlhbGl6ZWQuIEVhY2ggb25lIHVzZXMgbmF0aXZlXG4gKiBKYXZhU2NyaXB0IHNlbWFudGljcyAocHJvcGVydHkgYWNjZXNzLCBpdGVyYXRpb24sIHByb3RvdHlwZSBtZXRob2RzLCBldGMpLlxuICpcbiAqIFBhc3Mgb3ZlcnJpZGVzIHZpYSB0aGUgYG9wZXJhdGlvbnNgIG9wdGlvbiBvZiBgc3RyaW5naWZ5YC9gc3RyaW5naWZ5QXN5bmNgXG4gKiB0byBjdXN0b21pemUgaG93IHZhbHVlcyBhcmUgaW5zcGVjdGVkIOKAlCBlLmcuIHRvIHNlcmlhbGl6ZSB2YWx1ZXMgd2l0aG91dFxuICogdHJpZ2dlcmluZyBnZXR0ZXJzLCBwcm94eSB0cmFwcywgb3IgcGF0Y2hlZCBwcm90b3R5cGUgbWV0aG9kcywgb3IgdG9cbiAqIHNlcmlhbGl6ZSB2YWx1ZXMgdGhhdCBsaXZlIGluIGEgZGlmZmVyZW50IEphdmFTY3JpcHQgcnVudGltZSAoYSBgbm9kZTp2bWBcbiAqIGNvbnRleHQsIGEgV0FTTS1ob3N0ZWQgZW5naW5lLCBhIHJlbW90ZSBwcm9jZXNzKSB0aHJvdWdoIGhhbmRsZSBvYmplY3RzLlxuICpcbiAqIFRoZSBvYmplY3QgaXMgZnJvemVuIOKAlCBpdCBpcyBzaGFyZWQgYnkgZXZlcnkgYHN0cmluZ2lmeWAgY2FsbCB0aGF0IGRvZXNcbiAqIG5vdCBvdmVycmlkZSBhIGdpdmVuIG9wZXJhdGlvbi5cbiAqXG4gKi9cbi8qKiBAdHlwZSB7aW1wb3J0KCcuL3R5cGVzLmpzJykuRGVmYXVsdFN0cmluZ2lmeU9wZXJhdGlvbnN9ICovXG5jb25zdCBzdHJpbmdpZnlfb3BlcmF0aW9ucyA9IHtcblx0aWRlbnRpZnk6ICh2YWx1ZSkgPT4gdmFsdWUsXG5cblx0dHlwZU9mOiAodmFsdWUpID0+ICh2YWx1ZSA9PT0gbnVsbCA/ICdudWxsJyA6IHR5cGVvZiB2YWx1ZSksXG5cblx0dG9QcmltaXRpdmU6ICh2YWx1ZSkgPT4gdmFsdWUsXG5cblx0dGFnT2Y6ICh2YWx1ZSkgPT4gZ2V0X3R5cGUodmFsdWUpLFxuXG5cdGlzVGhlbmFibGU6ICh2YWx1ZSkgPT4gdHlwZW9mIHZhbHVlLnRoZW4gPT09ICdmdW5jdGlvbicsXG5cblx0dG9Qcm9taXNlOiAodGhlbmFibGUpID0+IFByb21pc2UucmVzb2x2ZSh0aGVuYWJsZSksXG5cblx0dW5ib3g6IChib3hlZCkgPT4gYm94ZWQudmFsdWVPZigpLFxuXG5cdHRvSVNPU3RyaW5nOiAoZGF0ZSkgPT4gKGlzTmFOKGRhdGUuZ2V0RGF0ZSgpKSA/ICcnIDogZGF0ZS50b0lTT1N0cmluZygpKSxcblxuXHR0b1N0cmluZ1ZhbHVlOiAodmFsdWUpID0+IHZhbHVlLnRvU3RyaW5nKCksXG5cblx0cmVnRXhwSW5mbzogKHJlZ2V4cCkgPT4gKHsgc291cmNlOiByZWdleHAuc291cmNlLCBmbGFnczogcmVnZXhwLmZsYWdzIH0pLFxuXG5cdHZhbHVlc09mOiAoc2V0KSA9PiBzZXQsXG5cblx0ZW50cmllc09mOiAobWFwKSA9PiBtYXAsXG5cblx0dmlld0luZm86ICh2aWV3KSA9PiB7XG5cdFx0Ly8gTm9kZSBCdWZmZXJzIG1heSBzaGFyZSBhIHBvb2wgY29udGFpbmluZyB1bnJlbGF0ZWQsIHNlbnNpdGl2ZSBkYXRhLlxuXHRcdC8vIENvcHkgb25seSB0aGUgdmlzaWJsZSBieXRlcywgd2l0aG91dCB1c2luZyBCdWZmZXIncyBwb29saW5nIG9yIHNsaWNlLlxuXHRcdGlmIChpc19idWZmZXIodmlldykpIHZpZXcgPSBuZXcgVWludDhBcnJheSh2aWV3KTtcblxuXHRcdHJldHVybiB7XG5cdFx0XHRidWZmZXI6IHZpZXcuYnVmZmVyLFxuXHRcdFx0Ynl0ZU9mZnNldDogdmlldy5ieXRlT2Zmc2V0LFxuXHRcdFx0Ynl0ZUxlbmd0aDogdmlldy5ieXRlTGVuZ3RoLFxuXHRcdFx0bGVuZ3RoOiB2aWV3Lmxlbmd0aCxcblx0XHRcdGJ1ZmZlckJ5dGVMZW5ndGg6IHZpZXcuYnVmZmVyLmJ5dGVMZW5ndGhcblx0XHR9O1xuXHR9LFxuXG5cdHRvQXJyYXlCdWZmZXI6IChidWZmZXIpID0+IGJ1ZmZlcixcblxuXHRsZW5ndGhPZjogKGFycmF5KSA9PiBhcnJheS5sZW5ndGgsXG5cblx0aGFzT3duOiAodmFsdWUsIGtleSkgPT4gT2JqZWN0Lmhhc093bih2YWx1ZSwga2V5KSxcblxuXHRpbmRpY2VzT2Y6IChhcnJheSkgPT4gdmFsaWRfYXJyYXlfaW5kaWNlcyhhcnJheSksXG5cblx0c2hhcGVPZjogKHZhbHVlKSA9PiB7XG5cdFx0aWYgKCFpc19wbGFpbl9vYmplY3QodmFsdWUpKSByZXR1cm4gTk9UX1BMQUlOO1xuXHRcdGlmIChlbnVtZXJhYmxlX3N5bWJvbHModmFsdWUpLmxlbmd0aCA+IDApIHJldHVybiBTWU1CT0xfS0VZUztcblxuXHRcdHJldHVybiB7XG5cdFx0XHRraW5kOiBPYmplY3QuZ2V0UHJvdG90eXBlT2YodmFsdWUpID09PSBudWxsID8gJ251bGwtcHJvdG8nIDogJ3BsYWluJyxcblx0XHRcdGtleXM6IE9iamVjdC5rZXlzKHZhbHVlKVxuXHRcdH07XG5cdH0sXG5cblx0Z2V0OiAodmFsdWUsIGtleSkgPT4gdmFsdWVba2V5XVxufTtcblxuZXhwb3J0IGNvbnN0IGRlZmF1bHRfc3RyaW5naWZ5X29wZXJhdGlvbnMgPSAvKiBAX19QVVJFX18gKi8gT2JqZWN0LmZyZWV6ZShzdHJpbmdpZnlfb3BlcmF0aW9ucyk7XG5cbmNvbnN0IGFycmF5X2J1ZmZlcl9ieXRlX2xlbmd0aCA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IoXG5cdEFycmF5QnVmZmVyLnByb3RvdHlwZSxcblx0J2J5dGVMZW5ndGgnXG4pLmdldDtcblxuY29uc3Qgc2hhcmVkX2FycmF5X2J1ZmZlcl9ieXRlX2xlbmd0aCA9XG5cdHR5cGVvZiBTaGFyZWRBcnJheUJ1ZmZlciA9PT0gJ3VuZGVmaW5lZCdcblx0XHQ/IHVuZGVmaW5lZFxuXHRcdDogT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihTaGFyZWRBcnJheUJ1ZmZlci5wcm90b3R5cGUsICdieXRlTGVuZ3RoJykuZ2V0O1xuXG4vKipcbiAqIFRoZSBkZWZhdWx0IGltcGxlbWVudGF0aW9ucyBvZiBldmVyeSBjb25zdHJ1Y3Rpb24gb3BlcmF0aW9uIGBwYXJzZWAgYW5kXG4gKiBgdW5mbGF0dGVuYCBwZXJmb3JtIHdoaWxlIHJldml2aW5nIGEgdmFsdWUuIEVhY2ggb25lIHVzZXMgbmF0aXZlXG4gKiBKYXZhU2NyaXB0IHNlbWFudGljcyAoYnVpbHQtaW4gY29uc3RydWN0b3JzLCBwcm9wZXJ0eSBhc3NpZ25tZW50LCBldGMpLlxuICpcbiAqIFBhc3Mgb3ZlcnJpZGVzIHZpYSB0aGUgYG9wZXJhdGlvbnNgIG9wdGlvbiBvZiBgcGFyc2VgL2B1bmZsYXR0ZW5gIHRvXG4gKiBjdXN0b21pemUgaG93IHZhbHVlcyBhcmUgYnVpbHQg4oCUIGUuZy4gdG8gY29uc3RydWN0IHRoZW0gZnJvbSB0aGVcbiAqIGludHJpbnNpY3Mgb2YgYSBkaWZmZXJlbnQgcmVhbG0gKGEgYG5vZGU6dm1gIGNvbnRleHQpLCBvciB0byBidWlsZCB1cFxuICogdmFsdWVzIGluc2lkZSBhbm90aGVyIEphdmFTY3JpcHQgcnVudGltZSAoYSBXQVNNLWhvc3RlZCBlbmdpbmUsIGEgcmVtb3RlXG4gKiBwcm9jZXNzKSB0aHJvdWdoIGhhbmRsZSBvYmplY3RzLlxuICpcbiAqIFRoZSBvYmplY3QgaXMgZnJvemVuIOKAlCBpdCBpcyBzaGFyZWQgYnkgZXZlcnkgYHBhcnNlYCBjYWxsIHRoYXQgZG9lcyBub3RcbiAqIG92ZXJyaWRlIGEgZ2l2ZW4gb3BlcmF0aW9uLlxuICpcbiAqL1xuLyoqIEB0eXBlIHtpbXBvcnQoJy4vdHlwZXMuanMnKS5EZWZhdWx0UGFyc2VPcGVyYXRpb25zfSAqL1xuY29uc3QgcGFyc2Vfb3BlcmF0aW9ucyA9IHtcblx0ZnJvbVByaW1pdGl2ZTogKHByaW1pdGl2ZSkgPT4gcHJpbWl0aXZlLFxuXG5cdGZyb21JU09TdHJpbmc6IChpc28pID0+IG5ldyBEYXRlKGlzbyksXG5cblx0ZnJvbVN0cmluZ1ZhbHVlOiAodGFnLCB0ZXh0KSA9PiB7XG5cdFx0aWYgKHRhZyA9PT0gJ1VSTCcpIHJldHVybiBuZXcgVVJMKHRleHQpO1xuXHRcdGlmICh0YWcgPT09ICdVUkxTZWFyY2hQYXJhbXMnKSByZXR1cm4gbmV3IFVSTFNlYXJjaFBhcmFtcyh0ZXh0KTtcblx0XHQvLyAnVGVtcG9yYWwuSW5zdGFudCcsICdUZW1wb3JhbC5QbGFpbkRhdGUnLCAuLi5cblx0XHQvLyBAdHMtZXhwZWN0LWVycm9yIFRTIGRvZXNuJ3Qga25vdyBhYm91dCBUZW1wb3JhbCB5ZXRcblx0XHRyZXR1cm4gVGVtcG9yYWxbdGFnLnNsaWNlKDkpXS5mcm9tKHRleHQpO1xuXHR9LFxuXG5cdGZyb21BcnJheUJ1ZmZlcjogKGJ1ZmZlcikgPT4gYnVmZmVyLFxuXG5cdGZyb21SZWdFeHBJbmZvOiAoc291cmNlLCBmbGFncykgPT4gbmV3IFJlZ0V4cChzb3VyY2UsIGZsYWdzKSxcblxuXHRmcm9tVmlld0luZm86ICh0YWcsIGJ1ZmZlciwgYnl0ZU9mZnNldCwgbGVuZ3RoKSA9PiB7XG5cdFx0Ly8gQSByZXZpdmVyIGNhbiByZXBsYWNlIGFuIEFycmF5QnVmZmVyIHdpdGggYSBsZW5ndGggb3IgYXJyYXktbGlrZSB2YWx1ZSxcblx0XHQvLyB3aGljaCBhIHR5cGVkIGFycmF5IGNvbnN0cnVjdG9yIHdvdWxkIHVzZSB0byBhbGxvY2F0ZSBhIG5ldyBidWZmZXIuXG5cdFx0Ly8gVGhlIG5hdGl2ZSBnZXR0ZXJzIGNoZWNrIGludGVybmFsIHNsb3RzLCBzbyB0aGV5IHdvcmsgYWNyb3NzIHJlYWxtc1xuXHRcdC8vIGFuZCBjYW5ub3QgYmUgZm9vbGVkIGJ5IGEgZm9yZ2VkIHByb3RvdHlwZSBvciBTeW1ib2wudG9TdHJpbmdUYWcuXG5cdFx0dHJ5IHtcblx0XHRcdGFycmF5X2J1ZmZlcl9ieXRlX2xlbmd0aC5jYWxsKGJ1ZmZlcik7XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdGlmICghc2hhcmVkX2FycmF5X2J1ZmZlcl9ieXRlX2xlbmd0aCkgdGhyb3cgZXJyb3I7XG5cdFx0XHRzaGFyZWRfYXJyYXlfYnVmZmVyX2J5dGVfbGVuZ3RoLmNhbGwoYnVmZmVyKTtcblx0XHR9XG5cblx0XHRjb25zdCBDb25zdHJ1Y3RvciA9IC8qKiBAdHlwZSB7YW55fSAqLyAoZ2xvYmFsVGhpcylbdGFnXTtcblx0XHRyZXR1cm4gYnl0ZU9mZnNldCAhPT0gdW5kZWZpbmVkXG5cdFx0XHQ/IG5ldyBDb25zdHJ1Y3RvcihidWZmZXIsIGJ5dGVPZmZzZXQsIGxlbmd0aClcblx0XHRcdDogbmV3IENvbnN0cnVjdG9yKGJ1ZmZlcik7XG5cdH0sXG5cblx0Ym94OiAodmFsdWUpID0+IE9iamVjdCh2YWx1ZSksXG5cblx0Y3JlYXRlQXJyYXk6IChsZW5ndGgpID0+IG5ldyBBcnJheShsZW5ndGgpLFxuXG5cdGNyZWF0ZVNwYXJzZUFycmF5OiAobGVuZ3RoKSA9PiB7XG5cdFx0LyoqIEB0eXBlIHthbnlbXX0gKi9cblx0XHRjb25zdCBhcnJheSA9IFtdO1xuXG5cdFx0Ly8gU2V0dGluZyBgYXJyYXkubGVuZ3RoID0gbGVuZ3RoYCAob3IgZXF1aXZhbGVudGx5IGNhbGxpbmdcblx0XHQvLyBgbmV3IEFycmF5KGxlbmd0aClgKSBvbiBhbiB1bnRydXN0ZWQgbGVuZ3RoIGlzIGEgRG9TIHZlY3RvcjogVjhcblx0XHQvLyBlYWdlcmx5IGFsbG9jYXRlcyBhIGNvbnRpZ3VvdXMgYmFja2luZyBzdG9yZSBmb3IgYXJyYXkgbGVuZ3RocyBiZWxvd1xuXHRcdC8vIH4xMF44LCBzbyBhIHNtYWxsIHBheWxvYWQgd2l0aCBhIGh1Z2UgZGVjbGFyZWQgbGVuZ3RoIGNhbiBmb3JjZVxuXHRcdC8vIGFyYml0cmFyeSBtZW1vcnkgYWxsb2NhdGlvbi4gVG91Y2hpbmcgdGhlIGxhcmdlc3QtcG9zc2libGUgaW5kZXhcblx0XHQvLyBmaXJzdCBmb3JjZXMgVjggaW50byBkaWN0aW9uYXJ5LWVsZW1lbnRzIG1vZGUsIHdoZXJlIGBsZW5ndGhgIGlzXG5cdFx0Ly8ganVzdCBhIG51bWJlciBhbmQgbm8gY29udGlndW91cyBhbGxvY2F0aW9uIG9jY3Vycy5cblx0XHRhcnJheVtNQVhfQVJSQVlfSU5ERVhdID0gdW5kZWZpbmVkO1xuXHRcdGRlbGV0ZSBhcnJheVtNQVhfQVJSQVlfSU5ERVhdO1xuXHRcdGFycmF5Lmxlbmd0aCA9IGxlbmd0aDtcblxuXHRcdHJldHVybiBhcnJheTtcblx0fSxcblxuXHRjcmVhdGVPYmplY3Q6ICgpID0+ICh7fSksXG5cblx0Y3JlYXRlTnVsbFByb3RvdHlwZU9iamVjdDogKCkgPT4gT2JqZWN0LmNyZWF0ZShudWxsKSxcblxuXHRjcmVhdGVTZXQ6ICgpID0+IG5ldyBTZXQoKSxcblxuXHRjcmVhdGVNYXA6ICgpID0+IG5ldyBNYXAoKSxcblxuXHRzZXQ6ICh0YXJnZXQsIGtleSwgdmFsdWUpID0+IHtcblx0XHR0YXJnZXRba2V5XSA9IHZhbHVlO1xuXHR9LFxuXG5cdGFkZFZhbHVlOiAoc2V0LCB2YWx1ZSkgPT4ge1xuXHRcdHNldC5hZGQodmFsdWUpO1xuXHR9LFxuXG5cdGFkZEVudHJ5OiAobWFwLCBrZXksIHZhbHVlKSA9PiB7XG5cdFx0bWFwLnNldChrZXksIHZhbHVlKTtcblx0fVxufTtcblxuZXhwb3J0IGNvbnN0IGRlZmF1bHRfcGFyc2Vfb3BlcmF0aW9ucyA9IC8qIEBfX1BVUkVfXyAqLyBPYmplY3QuZnJlZXplKHBhcnNlX29wZXJhdGlvbnMpO1xuIiwiaW1wb3J0IHsgZGVjb2RlNjQgfSBmcm9tICcuL2Jhc2U2NC5qcyc7XG5pbXBvcnQge1xuXHRIT0xFLFxuXHROQU4sXG5cdE5FR0FUSVZFX0lORklOSVRZLFxuXHRORUdBVElWRV9aRVJPLFxuXHRQT1NJVElWRV9JTkZJTklUWSxcblx0U1BBUlNFLFxuXHRVTkRFRklORURcbn0gZnJvbSAnLi9jb25zdGFudHMuanMnO1xuaW1wb3J0IHsgZGVmYXVsdF9wYXJzZV9vcGVyYXRpb25zLCBtZXJnZV9vcGVyYXRpb25zIH0gZnJvbSAnLi9vcGVyYXRpb25zLmpzJztcbmltcG9ydCB7IGlzX3ZhbGlkX2FycmF5X2luZGV4LCBpc192YWxpZF9hcnJheV9sZW4gfSBmcm9tICcuL3V0aWxzLmpzJztcblxuLyoqXG4gKiBSZXZpdmUgYSB2YWx1ZSBzZXJpYWxpemVkIHdpdGggYGRldmFsdWUuc3RyaW5naWZ5YFxuICogQHBhcmFtIHtzdHJpbmd9IHNlcmlhbGl6ZWRcbiAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgKHZhbHVlOiBhbnkpID0+IGFueT59IFtyZXZpdmVyc11cbiAqIEBwYXJhbSB7aW1wb3J0KCcuL3R5cGVzLmpzJykuUGFyc2VPcHRpb25zfSBbb3B0aW9uc11cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlKHNlcmlhbGl6ZWQsIHJldml2ZXJzLCBvcHRpb25zKSB7XG5cdHJldHVybiB1bmZsYXR0ZW4oSlNPTi5wYXJzZShzZXJpYWxpemVkKSwgcmV2aXZlcnMsIG9wdGlvbnMpO1xufVxuXG4vKipcbiAqIFJldml2ZSBhIHZhbHVlIGZsYXR0ZW5lZCB3aXRoIGBkZXZhbHVlLnN0cmluZ2lmeWBcbiAqIEBwYXJhbSB7bnVtYmVyIHwgYW55W119IHBhcnNlZFxuICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCAodmFsdWU6IGFueSkgPT4gYW55Pn0gW3Jldml2ZXJzXVxuICogQHBhcmFtIHtpbXBvcnQoJy4vdHlwZXMuanMnKS5QYXJzZU9wdGlvbnN9IFtvcHRpb25zXVxuICovXG5leHBvcnQgZnVuY3Rpb24gdW5mbGF0dGVuKHBhcnNlZCwgcmV2aXZlcnMsIG9wdGlvbnMpIHtcblx0LyoqIEB0eXBlIHtpbXBvcnQoJy4vdHlwZXMuanMnKS5QYXJzZU9wZXJhdGlvbnN9ICovXG5cdGNvbnN0IG9wcyA9IG1lcmdlX29wZXJhdGlvbnMoZGVmYXVsdF9wYXJzZV9vcGVyYXRpb25zLCBvcHRpb25zPy5vcGVyYXRpb25zKTtcblxuXHRpZiAodHlwZW9mIHBhcnNlZCA9PT0gJ251bWJlcicpIHJldHVybiBoeWRyYXRlKHBhcnNlZCwgdHJ1ZSk7XG5cblx0aWYgKCFBcnJheS5pc0FycmF5KHBhcnNlZCkgfHwgcGFyc2VkLmxlbmd0aCA9PT0gMCkge1xuXHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCBpbnB1dCcpO1xuXHR9XG5cblx0Y29uc3QgdmFsdWVzID0gLyoqIEB0eXBlIHthbnlbXX0gKi8gKHBhcnNlZCk7XG5cblx0Y29uc3QgaHlkcmF0ZWQgPSBBcnJheSh2YWx1ZXMubGVuZ3RoKTtcblxuXHQvKipcblx0ICogQSBzZXQgb2YgdmFsdWVzIGN1cnJlbnRseSBiZWluZyBoeWRyYXRlZCB3aXRoIGN1c3RvbSByZXZpdmVycyxcblx0ICogdXNlZCB0byBkZXRlY3QgaW52YWxpZCBjeWNsaWNhbCBkZXBlbmRlbmNpZXNcblx0ICogQHR5cGUge1NldDxudW1iZXI+IHwgbnVsbH1cblx0ICovXG5cdGxldCBoeWRyYXRpbmcgPSBudWxsO1xuXG5cdC8qKlxuXHQgKiBAcGFyYW0ge251bWJlcn0gaW5kZXhcblx0ICogQHJldHVybnMge2FueX1cblx0ICovXG5cdGZ1bmN0aW9uIGh5ZHJhdGUoaW5kZXgsIHN0YW5kYWxvbmUgPSBmYWxzZSkge1xuXHRcdGlmIChpbmRleCA9PT0gVU5ERUZJTkVEKSByZXR1cm4gb3BzLmZyb21QcmltaXRpdmUodW5kZWZpbmVkKTtcblx0XHRpZiAoaW5kZXggPT09IE5BTikgcmV0dXJuIG9wcy5mcm9tUHJpbWl0aXZlKE5hTik7XG5cdFx0aWYgKGluZGV4ID09PSBQT1NJVElWRV9JTkZJTklUWSkgcmV0dXJuIG9wcy5mcm9tUHJpbWl0aXZlKEluZmluaXR5KTtcblx0XHRpZiAoaW5kZXggPT09IE5FR0FUSVZFX0lORklOSVRZKSByZXR1cm4gb3BzLmZyb21QcmltaXRpdmUoLUluZmluaXR5KTtcblx0XHRpZiAoaW5kZXggPT09IE5FR0FUSVZFX1pFUk8pIHJldHVybiBvcHMuZnJvbVByaW1pdGl2ZSgtMCk7XG5cblx0XHRpZiAoc3RhbmRhbG9uZSB8fCB0eXBlb2YgaW5kZXggIT09ICdudW1iZXInKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgaW5wdXRgKTtcblx0XHR9XG5cblx0XHRpZiAoaW5kZXggaW4gaHlkcmF0ZWQpIHJldHVybiBoeWRyYXRlZFtpbmRleF07XG5cblx0XHRpZiAoaW5kZXggPj0gdmFsdWVzLmxlbmd0aCkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGlucHV0YCk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgdmFsdWUgPSB2YWx1ZXNbaW5kZXhdO1xuXG5cdFx0aWYgKCF2YWx1ZSB8fCB0eXBlb2YgdmFsdWUgIT09ICdvYmplY3QnKSB7XG5cdFx0XHRoeWRyYXRlZFtpbmRleF0gPSBvcHMuZnJvbVByaW1pdGl2ZSh2YWx1ZSk7XG5cdFx0fSBlbHNlIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuXHRcdFx0aWYgKHR5cGVvZiB2YWx1ZVswXSA9PT0gJ3N0cmluZycpIHtcblx0XHRcdFx0Y29uc3QgdHlwZSA9IHZhbHVlWzBdO1xuXG5cdFx0XHRcdGNvbnN0IHJldml2ZXIgPSByZXZpdmVycyAmJiBPYmplY3QuaGFzT3duKHJldml2ZXJzLCB0eXBlKSA/IHJldml2ZXJzW3R5cGVdIDogdW5kZWZpbmVkO1xuXG5cdFx0XHRcdGlmIChyZXZpdmVyKSB7XG5cdFx0XHRcdFx0bGV0IGkgPSB2YWx1ZVsxXTtcblx0XHRcdFx0XHRpZiAodHlwZW9mIGkgIT09ICdudW1iZXInKSB7XG5cdFx0XHRcdFx0XHQvLyBpZiBpdCdzIG5vdCBhIG51bWJlciwgaXQgd2FzIHNlcmlhbGl6ZWQgYnkgYSBidWlsdGluIHJldml2ZXJcblx0XHRcdFx0XHRcdC8vIHNvIHdlIG5lZWQgdG8gbXVuZ2UgaXQgaW50byB0aGUgZm9ybWF0IGV4cGVjdGVkIGJ5IGEgY3VzdG9tIHJldml2ZXJcblx0XHRcdFx0XHRcdGkgPSB2YWx1ZXMucHVzaCh2YWx1ZVsxXSkgLSAxO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdC8vIElmIHRoZSBwYXlsb2FkIGlzIGFscmVhZHkgaHlkcmF0ZWQsIGl0cyByZWN1cnNpb24gaGFzIGFscmVhZHlcblx0XHRcdFx0XHQvLyB0ZXJtaW5hdGVkIChlLmcuIGEgc2VsZi1yZWZlcmVudGlhbCBvYmplY3QgY2FjaGVkIGl0c2VsZiBiZWZvcmVcblx0XHRcdFx0XHQvLyBmb2xsb3dpbmcgaXRzIG93biBiYWNrLXJlZmVyZW5jZSksIHNvIHJldml2ZSBpdCBkaXJlY3RseS4gRmFsbGluZ1xuXHRcdFx0XHRcdC8vIHRocm91Z2ggdG8gdGhlIGBoeWRyYXRpbmdgIGd1YXJkIGhlcmUgd291bGQgd3JvbmdseSByZWplY3QgYSB2YWxpZFxuXHRcdFx0XHRcdC8vIGN5Y2xlLiBBbiBhY3R1YWxseSBpbmZpbml0ZSBwYXlsb2FkIChlLmcuIGBbW1wiQ3VzdG9tXCIsIDBdXWApIGlzIG5ldmVyXG5cdFx0XHRcdFx0Ly8gY2FjaGVkLCBzbyBpdCBzdGlsbCBoaXRzIHRoZSBndWFyZCBiZWxvdy5cblx0XHRcdFx0XHRpZiAoT2JqZWN0Lmhhc093bihoeWRyYXRlZCwgaSkpIHtcblx0XHRcdFx0XHRcdHJldHVybiAoaHlkcmF0ZWRbaW5kZXhdID0gcmV2aXZlcihoeWRyYXRlZFtpXSkpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGh5ZHJhdGluZyA/Pz0gbmV3IFNldCgpO1xuXG5cdFx0XHRcdFx0aWYgKGh5ZHJhdGluZy5oYXMoaSkpIHtcblx0XHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCBjaXJjdWxhciByZWZlcmVuY2UnKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRoeWRyYXRpbmcuYWRkKGkpO1xuXHRcdFx0XHRcdGh5ZHJhdGVkW2luZGV4XSA9IHJldml2ZXIoaHlkcmF0ZShpKSk7XG5cdFx0XHRcdFx0aHlkcmF0aW5nLmRlbGV0ZShpKTtcblxuXHRcdFx0XHRcdHJldHVybiBoeWRyYXRlZFtpbmRleF07XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRzd2l0Y2ggKHR5cGUpIHtcblx0XHRcdFx0XHRjYXNlICdEYXRlJzpcblx0XHRcdFx0XHRcdGh5ZHJhdGVkW2luZGV4XSA9IG9wcy5mcm9tSVNPU3RyaW5nKHZhbHVlWzFdKTtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXG5cdFx0XHRcdFx0Y2FzZSAnU2V0Jzpcblx0XHRcdFx0XHRcdGNvbnN0IHNldCA9IG9wcy5jcmVhdGVTZXQoKTtcblx0XHRcdFx0XHRcdGh5ZHJhdGVkW2luZGV4XSA9IHNldDtcblx0XHRcdFx0XHRcdGZvciAobGV0IGkgPSAxOyBpIDwgdmFsdWUubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRcdFx0XHRcdFx0b3BzLmFkZFZhbHVlKHNldCwgaHlkcmF0ZSh2YWx1ZVtpXSkpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0YnJlYWs7XG5cblx0XHRcdFx0XHRjYXNlICdNYXAnOlxuXHRcdFx0XHRcdFx0Y29uc3QgbWFwID0gb3BzLmNyZWF0ZU1hcCgpO1xuXHRcdFx0XHRcdFx0aHlkcmF0ZWRbaW5kZXhdID0gbWFwO1xuXHRcdFx0XHRcdFx0Zm9yIChsZXQgaSA9IDE7IGkgPCB2YWx1ZS5sZW5ndGg7IGkgKz0gMikge1xuXHRcdFx0XHRcdFx0XHRvcHMuYWRkRW50cnkobWFwLCBoeWRyYXRlKHZhbHVlW2ldKSwgaHlkcmF0ZSh2YWx1ZVtpICsgMV0pKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGJyZWFrO1xuXG5cdFx0XHRcdFx0Y2FzZSAnUmVnRXhwJzpcblx0XHRcdFx0XHRcdGh5ZHJhdGVkW2luZGV4XSA9IG9wcy5mcm9tUmVnRXhwSW5mbyh2YWx1ZVsxXSwgdmFsdWVbMl0pO1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cblx0XHRcdFx0XHRjYXNlICdPYmplY3QnOiB7XG5cdFx0XHRcdFx0XHRjb25zdCB3cmFwcGVkX2luZGV4ID0gdmFsdWVbMV07XG5cblx0XHRcdFx0XHRcdGlmIChcblx0XHRcdFx0XHRcdFx0dHlwZW9mIHZhbHVlc1t3cmFwcGVkX2luZGV4XSA9PT0gJ29iamVjdCcgJiZcblx0XHRcdFx0XHRcdFx0dmFsdWVzW3dyYXBwZWRfaW5kZXhdWzBdICE9PSAnQmlnSW50J1xuXHRcdFx0XHRcdFx0KSB7XG5cdFx0XHRcdFx0XHRcdC8vIGF2b2lkIGluZmluaXRlIHJlY3VzaW9uIGluIGNhc2Ugb2YgbWFsZm9ybWVkIGlucHV0XG5cdFx0XHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCBpbnB1dCcpO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRoeWRyYXRlZFtpbmRleF0gPSBvcHMuYm94KGh5ZHJhdGUod3JhcHBlZF9pbmRleCkpO1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Y2FzZSAnQmlnSW50Jzpcblx0XHRcdFx0XHRcdGh5ZHJhdGVkW2luZGV4XSA9IG9wcy5mcm9tUHJpbWl0aXZlKEJpZ0ludCh2YWx1ZVsxXSkpO1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cblx0XHRcdFx0XHRjYXNlICdudWxsJzpcblx0XHRcdFx0XHRcdGNvbnN0IG9iaiA9IG9wcy5jcmVhdGVOdWxsUHJvdG90eXBlT2JqZWN0KCk7XG5cdFx0XHRcdFx0XHRoeWRyYXRlZFtpbmRleF0gPSBvYmo7XG5cdFx0XHRcdFx0XHRmb3IgKGxldCBpID0gMTsgaSA8IHZhbHVlLmxlbmd0aDsgaSArPSAyKSB7XG5cdFx0XHRcdFx0XHRcdGNvbnN0IGtleSA9IHZhbHVlW2ldO1xuXHRcdFx0XHRcdFx0XHRpZiAodHlwZW9mIGtleSAhPT0gJ3N0cmluZycpIHtcblx0XHRcdFx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBwYXJzZSBhbiBvYmplY3Qgd2l0aCBhIG5vbi1zdHJpbmcga2V5Jyk7XG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRpZiAoa2V5ID09PSAnX19wcm90b19fJykge1xuXHRcdFx0XHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcignQ2Fubm90IHBhcnNlIGFuIG9iamVjdCB3aXRoIGEgYF9fcHJvdG9fX2AgcHJvcGVydHknKTtcblx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdG9wcy5zZXQob2JqLCBrZXksIGh5ZHJhdGUodmFsdWVbaSArIDFdKSk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRicmVhaztcblxuXHRcdFx0XHRcdGNhc2UgJ0ludDhBcnJheSc6XG5cdFx0XHRcdFx0Y2FzZSAnVWludDhBcnJheSc6XG5cdFx0XHRcdFx0Y2FzZSAnVWludDhDbGFtcGVkQXJyYXknOlxuXHRcdFx0XHRcdGNhc2UgJ0ludDE2QXJyYXknOlxuXHRcdFx0XHRcdGNhc2UgJ1VpbnQxNkFycmF5Jzpcblx0XHRcdFx0XHRjYXNlICdGbG9hdDE2QXJyYXknOlxuXHRcdFx0XHRcdGNhc2UgJ0ludDMyQXJyYXknOlxuXHRcdFx0XHRcdGNhc2UgJ1VpbnQzMkFycmF5Jzpcblx0XHRcdFx0XHRjYXNlICdGbG9hdDMyQXJyYXknOlxuXHRcdFx0XHRcdGNhc2UgJ0Zsb2F0NjRBcnJheSc6XG5cdFx0XHRcdFx0Y2FzZSAnQmlnSW50NjRBcnJheSc6XG5cdFx0XHRcdFx0Y2FzZSAnQmlnVWludDY0QXJyYXknOlxuXHRcdFx0XHRcdGNhc2UgJ0RhdGFWaWV3Jzoge1xuXHRcdFx0XHRcdFx0aWYgKHZhbHVlc1t2YWx1ZVsxXV1bMF0gIT09ICdBcnJheUJ1ZmZlcicpIHtcblx0XHRcdFx0XHRcdFx0Ly8gd2l0aG91dCB0aGlzLCBpZiB3ZSByZWNlaXZlIG1hbGZvcm1lZCBpbnB1dCB3ZSBjb3VsZFxuXHRcdFx0XHRcdFx0XHQvLyBlbmQgdXAgdHJ5aW5nIHRvIGh5ZHJhdGUgaW4gYSBjaXJjbGUgb3IgYWxsb2NhdGVcblx0XHRcdFx0XHRcdFx0Ly8gaHVnZSBhbW91bnRzIG9mIG1lbW9yeSB3aGVuIHdlIGNhbGwgYG5ldyBUeXBlZEFycmF5Q29uc3RydWN0b3IoYnVmZmVyKWBcblx0XHRcdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGRhdGEnKTtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0Y29uc3QgYnVmZmVyID0gaHlkcmF0ZSh2YWx1ZVsxXSk7XG5cblx0XHRcdFx0XHRcdGh5ZHJhdGVkW2luZGV4XSA9IG9wcy5mcm9tVmlld0luZm8odHlwZSwgYnVmZmVyLCB2YWx1ZVsyXSwgdmFsdWVbM10pO1xuXG5cdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRjYXNlICdBcnJheUJ1ZmZlcic6IHtcblx0XHRcdFx0XHRcdGNvbnN0IGJhc2U2NCA9IHZhbHVlWzFdO1xuXHRcdFx0XHRcdFx0aWYgKHR5cGVvZiBiYXNlNjQgIT09ICdzdHJpbmcnKSB7XG5cdFx0XHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCBBcnJheUJ1ZmZlciBlbmNvZGluZycpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0aHlkcmF0ZWRbaW5kZXhdID0gb3BzLmZyb21BcnJheUJ1ZmZlcihkZWNvZGU2NChiYXNlNjQpKTtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGNhc2UgJ1VSTCc6XG5cdFx0XHRcdFx0Y2FzZSAnVVJMU2VhcmNoUGFyYW1zJzpcblx0XHRcdFx0XHRjYXNlICdUZW1wb3JhbC5EdXJhdGlvbic6XG5cdFx0XHRcdFx0Y2FzZSAnVGVtcG9yYWwuSW5zdGFudCc6XG5cdFx0XHRcdFx0Y2FzZSAnVGVtcG9yYWwuUGxhaW5EYXRlJzpcblx0XHRcdFx0XHRjYXNlICdUZW1wb3JhbC5QbGFpblRpbWUnOlxuXHRcdFx0XHRcdGNhc2UgJ1RlbXBvcmFsLlBsYWluRGF0ZVRpbWUnOlxuXHRcdFx0XHRcdGNhc2UgJ1RlbXBvcmFsLlBsYWluTW9udGhEYXknOlxuXHRcdFx0XHRcdGNhc2UgJ1RlbXBvcmFsLlBsYWluWWVhck1vbnRoJzpcblx0XHRcdFx0XHRjYXNlICdUZW1wb3JhbC5ab25lZERhdGVUaW1lJzoge1xuXHRcdFx0XHRcdFx0Ly8gdGhlIHNhbWUgdGFncyBgdG9TdHJpbmdWYWx1ZWAgc2VyaWFsaXplcyBvbiB0aGUgc3RyaW5naWZ5IHNpZGVcblx0XHRcdFx0XHRcdGh5ZHJhdGVkW2luZGV4XSA9IG9wcy5mcm9tU3RyaW5nVmFsdWUodHlwZSwgdmFsdWVbMV0pO1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcihgVW5rbm93biB0eXBlICR7dHlwZX1gKTtcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIGlmICh2YWx1ZVswXSA9PT0gU1BBUlNFKSB7XG5cdFx0XHRcdC8vIFNwYXJzZSBhcnJheSBlbmNvZGluZzogW1NQQVJTRSwgbGVuZ3RoLCBpZHgsIHZhbCwgaWR4LCB2YWwsIC4uLl1cblx0XHRcdFx0Y29uc3QgbGVuID0gdmFsdWVbMV07XG5cblx0XHRcdFx0aWYgKCFpc192YWxpZF9hcnJheV9sZW4obGVuKSkge1xuXHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCBpbnB1dCcpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gYGxlbmAgY29tZXMgZnJvbSB0aGUgaW5wdXQgcmF0aGVyIHRoYW4gYmVpbmcgYm91bmRlZCBieSBpdCwgc29cblx0XHRcdFx0Ly8gYGNyZWF0ZVNwYXJzZUFycmF5YCBpcyByZXNwb25zaWJsZSBmb3Igbm90IGFsbG9jYXRpbmcgc3RvcmFnZVxuXHRcdFx0XHQvLyBwcm9wb3J0aW9uYWwgdG8gaXQuXG5cdFx0XHRcdGNvbnN0IGFycmF5ID0gb3BzLmNyZWF0ZVNwYXJzZUFycmF5KGxlbik7XG5cdFx0XHRcdGh5ZHJhdGVkW2luZGV4XSA9IGFycmF5O1xuXG5cdFx0XHRcdGZvciAobGV0IGkgPSAyOyBpIDwgdmFsdWUubGVuZ3RoOyBpICs9IDIpIHtcblx0XHRcdFx0XHRjb25zdCBpZHggPSB2YWx1ZVtpXTtcblxuXHRcdFx0XHRcdGlmICghaXNfdmFsaWRfYXJyYXlfaW5kZXgoaWR4KSB8fCBpZHggPj0gbGVuKSB7XG5cdFx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgaW5wdXQnKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRvcHMuc2V0KGFycmF5LCBpZHgsIGh5ZHJhdGUodmFsdWVbaSArIDFdKSk7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGNvbnN0IGFycmF5ID0gb3BzLmNyZWF0ZUFycmF5KHZhbHVlLmxlbmd0aCk7XG5cdFx0XHRcdGh5ZHJhdGVkW2luZGV4XSA9IGFycmF5O1xuXG5cdFx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgdmFsdWUubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRcdFx0XHRjb25zdCBuID0gdmFsdWVbaV07XG5cdFx0XHRcdFx0aWYgKG4gPT09IEhPTEUpIGNvbnRpbnVlO1xuXG5cdFx0XHRcdFx0b3BzLnNldChhcnJheSwgaSwgaHlkcmF0ZShuKSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0Y29uc3Qgb2JqZWN0ID0gb3BzLmNyZWF0ZU9iamVjdCgpO1xuXHRcdFx0aHlkcmF0ZWRbaW5kZXhdID0gb2JqZWN0O1xuXG5cdFx0XHRmb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyh2YWx1ZSkpIHtcblx0XHRcdFx0aWYgKGtleSA9PT0gJ19fcHJvdG9fXycpIHtcblx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBwYXJzZSBhbiBvYmplY3Qgd2l0aCBhIGBfX3Byb3RvX19gIHByb3BlcnR5Jyk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRvcHMuc2V0KG9iamVjdCwga2V5LCBoeWRyYXRlKHZhbHVlW2tleV0pKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gaHlkcmF0ZWRbaW5kZXhdO1xuXHR9XG5cblx0cmV0dXJuIGh5ZHJhdGUoMCk7XG59XG4iLCJpbXBvcnQgeyBEZXZhbHVlRXJyb3IsIHN0cmluZ2lmeV9rZXksIHN0cmluZ2lmeV9zdHJpbmcgfSBmcm9tICcuL3V0aWxzLmpzJztcbmltcG9ydCB7XG5cdEhPTEUsXG5cdE5BTixcblx0TkVHQVRJVkVfSU5GSU5JVFksXG5cdE5FR0FUSVZFX1pFUk8sXG5cdFBPU0lUSVZFX0lORklOSVRZLFxuXHRTUEFSU0UsXG5cdFVOREVGSU5FRFxufSBmcm9tICcuL2NvbnN0YW50cy5qcyc7XG5pbXBvcnQgeyBlbmNvZGU2NCB9IGZyb20gJy4vYmFzZTY0LmpzJztcbmltcG9ydCB7IGRlZmF1bHRfc3RyaW5naWZ5X29wZXJhdGlvbnMsIG1lcmdlX29wZXJhdGlvbnMgfSBmcm9tICcuL29wZXJhdGlvbnMuanMnO1xuXG4vKipcbiAqIFR1cm4gYSB2YWx1ZSBpbnRvIGEgSlNPTiBzdHJpbmcgdGhhdCBjYW4gYmUgcGFyc2VkIHdpdGggYGRldmFsdWUucGFyc2VgXG4gKiBAcGFyYW0ge2FueX0gdmFsdWVcbiAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgKHZhbHVlOiBhbnkpID0+IGFueT59IFtyZWR1Y2Vyc11cbiAqIEBwYXJhbSB7aW1wb3J0KCcuL3R5cGVzLmpzJykuU3RyaW5naWZ5T3B0aW9uc30gW29wdGlvbnNdXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdHJpbmdpZnkodmFsdWUsIHJlZHVjZXJzLCBvcHRpb25zKSB7XG5cdGNvbnN0IHN0cmluZ2lmaWVkID0gcnVuKGZhbHNlLCB2YWx1ZSwgcmVkdWNlcnMsIG9wdGlvbnMpO1xuXHRyZXR1cm4gdHlwZW9mIHN0cmluZ2lmaWVkID09PSAnc3RyaW5nJyA/IHN0cmluZ2lmaWVkIDogYFske3N0cmluZ2lmaWVkLmpvaW4oJywnKX1dYDtcbn1cblxuLyoqXG4gKiBUdXJuIGEgdmFsdWUgaW50byBhIEpTT04gc3RyaW5nIHRoYXQgY2FuIGJlIHBhcnNlZCB3aXRoIGBkZXZhbHVlLnBhcnNlYFxuICogQHBhcmFtIHthbnl9IHZhbHVlXG4gKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsICh2YWx1ZTogYW55KSA9PiBhbnk+fSBbcmVkdWNlcnNdXG4gKiBAcGFyYW0ge2ltcG9ydCgnLi90eXBlcy5qcycpLlN0cmluZ2lmeU9wdGlvbnN9IFtvcHRpb25zXVxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc3RyaW5naWZ5QXN5bmModmFsdWUsIHJlZHVjZXJzLCBvcHRpb25zKSB7XG5cdGNvbnN0IHN0cmluZ2lmaWVkID0gcnVuKHRydWUsIHZhbHVlLCByZWR1Y2Vycywgb3B0aW9ucyk7XG5cblx0aWYgKHR5cGVvZiBzdHJpbmdpZmllZCA9PT0gJ3N0cmluZycpIHtcblx0XHRyZXR1cm4gc3RyaW5naWZpZWQ7XG5cdH1cblxuXHRsZXQgb3V0ID0gJ1snO1xuXG5cdGZvciAobGV0IGkgPSAwOyBpIDwgc3RyaW5naWZpZWQubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRsZXQgdmFsdWUgPSBzdHJpbmdpZmllZFtpXTtcblxuXHRcdGlmICh0eXBlb2YgdmFsdWUgIT09ICdzdHJpbmcnKSB7XG5cdFx0XHRhd2FpdCB2YWx1ZTtcblx0XHRcdHZhbHVlID0gc3RyaW5naWZpZWRbaV07XG5cblx0XHRcdGlmIChpID09PSAwICYmIHZhbHVlIDwgMCkge1xuXHRcdFx0XHRyZXR1cm4gYCR7dmFsdWV9YDtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRvdXQgKz0gdmFsdWU7XG5cblx0XHRpZiAoaSA8IHN0cmluZ2lmaWVkLmxlbmd0aCAtIDEpIHtcblx0XHRcdG91dCArPSAnLCc7XG5cdFx0fVxuXHR9XG5cblx0b3V0ICs9ICddJztcblxuXHRyZXR1cm4gb3V0O1xufVxuXG4vKipcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gYXN5bmNcbiAqIEBwYXJhbSB7YW55fSB2YWx1ZVxuICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCAodmFsdWU6IGFueSkgPT4gYW55Pn0gW3JlZHVjZXJzXVxuICogQHBhcmFtIHtpbXBvcnQoJy4vdHlwZXMuanMnKS5TdHJpbmdpZnlPcHRpb25zfSBbb3B0aW9uc11cbiAqL1xuZnVuY3Rpb24gcnVuKGFzeW5jLCB2YWx1ZSwgcmVkdWNlcnMsIG9wdGlvbnMpIHtcblx0Y29uc3Qgb3BzID0gbWVyZ2Vfb3BlcmF0aW9ucyhkZWZhdWx0X3N0cmluZ2lmeV9vcGVyYXRpb25zLCBvcHRpb25zPy5vcGVyYXRpb25zKTtcblxuXHQvKiogQHR5cGUge2FueVtdfSAqL1xuXHRjb25zdCBzdHJpbmdpZmllZCA9IFtdO1xuXG5cdC8qKiBAdHlwZSB7TWFwPGFueSwgbnVtYmVyPn0gKi9cblx0Y29uc3QgaW5kZXhlcyA9IG5ldyBNYXAoKTtcblxuXHQvKiogQHR5cGUge0FycmF5PHsga2V5OiBzdHJpbmcsIGZuOiAodmFsdWU6IGFueSkgPT4gYW55IH0+fSAqL1xuXHRjb25zdCBjdXN0b20gPSBbXTtcblx0aWYgKHJlZHVjZXJzKSB7XG5cdFx0Zm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMocmVkdWNlcnMpKSB7XG5cdFx0XHRjdXN0b20ucHVzaCh7IGtleSwgZm46IHJlZHVjZXJzW2tleV0gfSk7XG5cdFx0fVxuXHR9XG5cblx0LyoqIEB0eXBlIHtzdHJpbmdbXX0gKi9cblx0Y29uc3Qga2V5cyA9IFtdO1xuXG5cdGxldCBwID0gMDtcblxuXHQvKipcblx0ICogQHBhcmFtIHthbnl9IHRoaW5nXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBbaW5kZXhdXG5cdCAqL1xuXHRmdW5jdGlvbiBmbGF0dGVuKHRoaW5nLCBpbmRleCkge1xuXHRcdGNvbnN0IHR5cGUgPSBvcHMudHlwZU9mKHRoaW5nKTtcblxuXHRcdGlmICh0eXBlID09PSAndW5kZWZpbmVkJykgcmV0dXJuIFVOREVGSU5FRDtcblxuXHRcdC8qKiBAdHlwZSB7bnVtYmVyIHwgdW5kZWZpbmVkfSAqL1xuXHRcdGxldCBudW1iZXI7XG5cblx0XHQvLyBgb3BzLnRvUHJpbWl0aXZlYCBpcyB0aGUgYm91bmRhcnkgYmV0d2VlbiB0aGUgdmFsdWUgYmVpbmcgc2VyaWFsaXplZCBhbmRcblx0XHQvLyBwbGFpbiBob3N0IEphdmFTY3JpcHQ6IGV2ZXJ5dGhpbmcgYmVsb3cgb3BlcmF0ZXMgb24gdGhlIGV4dHJhY3RlZCBob3N0XG5cdFx0Ly8gcHJpbWl0aXZlLCBzbyBuYXRpdmUgY29tcGFyaXNvbnMgYW5kIGFyaXRobWV0aWMgYXJlIGNvcnJlY3QgdGhlcmUuXG5cdFx0aWYgKHR5cGUgPT09ICdudW1iZXInKSB7XG5cdFx0XHRudW1iZXIgPSAvKiogQHR5cGUge251bWJlcn0gKi8gKG9wcy50b1ByaW1pdGl2ZSh0aGluZykpO1xuXHRcdFx0aWYgKE51bWJlci5pc05hTihudW1iZXIpKSByZXR1cm4gTkFOO1xuXHRcdFx0aWYgKG51bWJlciA9PT0gSW5maW5pdHkpIHJldHVybiBQT1NJVElWRV9JTkZJTklUWTtcblx0XHRcdGlmIChudW1iZXIgPT09IC1JbmZpbml0eSkgcmV0dXJuIE5FR0FUSVZFX0lORklOSVRZO1xuXHRcdFx0aWYgKG51bWJlciA9PT0gMCAmJiAxIC8gbnVtYmVyIDwgMCkgcmV0dXJuIE5FR0FUSVZFX1pFUk87XG5cdFx0fVxuXG5cdFx0Y29uc3QgaWQgPSBvcHMuaWRlbnRpZnkodGhpbmcpO1xuXG5cdFx0aWYgKGluZGV4ZXMuaGFzKGlkKSkgcmV0dXJuIC8qKiBAdHlwZSB7bnVtYmVyfSAqLyAoaW5kZXhlcy5nZXQoaWQpKTtcblxuXHRcdGluZGV4ID8/PSBwKys7XG5cdFx0aW5kZXhlcy5zZXQoaWQsIGluZGV4KTtcblxuXHRcdGZvciAoY29uc3QgeyBrZXksIGZuIH0gb2YgY3VzdG9tKSB7XG5cdFx0XHRjb25zdCB2YWx1ZSA9IGZuKHRoaW5nKTtcblx0XHRcdGlmICh2YWx1ZSkge1xuXHRcdFx0XHRzdHJpbmdpZmllZFtpbmRleF0gPSBgW1wiJHtrZXl9XCIsJHtmbGF0dGVuKHZhbHVlKX1dYDtcblx0XHRcdFx0cmV0dXJuIGluZGV4O1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmICh0eXBlID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHR0aHJvdyBuZXcgRGV2YWx1ZUVycm9yKGBDYW5ub3Qgc3RyaW5naWZ5IGEgZnVuY3Rpb25gLCBrZXlzLCB0aGluZywgdmFsdWUpO1xuXHRcdH0gZWxzZSBpZiAodHlwZSA9PT0gJ3N5bWJvbCcpIHtcblx0XHRcdHRocm93IG5ldyBEZXZhbHVlRXJyb3IoYENhbm5vdCBzdHJpbmdpZnkgYSBTeW1ib2wgcHJpbWl0aXZlYCwga2V5cywgdGhpbmcsIHZhbHVlKTtcblx0XHR9XG5cblx0XHQvKiogQHR5cGUge3N0cmluZyB8IFByb21pc2U8YW55Pn0gKi9cblx0XHRsZXQgc3RyID0gJyc7XG5cblx0XHRpZiAodHlwZSAhPT0gJ29iamVjdCcpIHtcblx0XHRcdHN0ciA9IHN0cmluZ2lmeV9wcmltaXRpdmUodHlwZSA9PT0gJ251bWJlcicgPyBudW1iZXIgOiBvcHMudG9QcmltaXRpdmUodGhpbmcpKTtcblx0XHR9IGVsc2UgaWYgKG9wcy5pc1RoZW5hYmxlKHRoaW5nKSkge1xuXHRcdFx0aWYgKCFhc3luYykge1xuXHRcdFx0XHR0aHJvdyBuZXcgRGV2YWx1ZUVycm9yKFxuXHRcdFx0XHRcdGBDYW5ub3Qgc3RyaW5naWZ5IGEgUHJvbWlzZSBvciB0aGVuYWJsZSDigJQgdXNlIHN0cmluZ2lmeUFzeW5jIGluc3RlYWRgLFxuXHRcdFx0XHRcdGtleXMsXG5cdFx0XHRcdFx0dGhpbmcsXG5cdFx0XHRcdFx0dmFsdWVcblx0XHRcdFx0KTtcblx0XHRcdH1cblxuXHRcdFx0c3RyID0gb3BzLnRvUHJvbWlzZSh0aGluZykudGhlbigodmFsdWUpID0+IHtcblx0XHRcdFx0Y29uc3QgaSA9IGZsYXR0ZW4odmFsdWUsIGluZGV4KTtcblx0XHRcdFx0aWYgKGkgPCAwKSBzdHJpbmdpZmllZFtpbmRleF0gPSBpO1xuXHRcdFx0fSk7XG5cblx0XHRcdC8vIFByb21pc2VzIGFyZSBhd2FpdGVkIHNlcXVlbnRpYWxseSwgYW5kIHRyYXZlcnNhbCBtYXkgdGhyb3cgYmVmb3JlXG5cdFx0XHQvLyByZWFjaGluZyB0aGVtLiBIYW5kbGUgcmVqZWN0aW9ucyBpbW1lZGlhdGVseSwgYnV0IGtlZXAgdGhlIG9yaWdpbmFsXG5cdFx0XHQvLyBwcm9taXNlIHNvIGF3YWl0aW5nIGl0IHN0aWxsIHByb3BhZ2F0ZXMgdGhlIGVycm9yIHRvIHRoZSBjYWxsZXIuXG5cdFx0XHRzdHIuY2F0Y2goKCkgPT4ge30pO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRjb25zdCB0YWcgPSBvcHMudGFnT2YodGhpbmcpO1xuXG5cdFx0XHRzd2l0Y2ggKHRhZykge1xuXHRcdFx0XHRjYXNlICdOdW1iZXInOlxuXHRcdFx0XHRjYXNlICdTdHJpbmcnOlxuXHRcdFx0XHRjYXNlICdCb29sZWFuJzpcblx0XHRcdFx0Y2FzZSAnQmlnSW50Jzpcblx0XHRcdFx0XHRzdHIgPSBgW1wiT2JqZWN0XCIsJHtmbGF0dGVuKG9wcy51bmJveCh0aGluZykpfV1gO1xuXHRcdFx0XHRcdGJyZWFrO1xuXG5cdFx0XHRcdGNhc2UgJ0RhdGUnOlxuXHRcdFx0XHRcdHN0ciA9IGBbXCJEYXRlXCIsXCIke29wcy50b0lTT1N0cmluZyh0aGluZyl9XCJdYDtcblx0XHRcdFx0XHRicmVhaztcblxuXHRcdFx0XHRjYXNlICdVUkwnOlxuXHRcdFx0XHRcdHN0ciA9IGBbXCJVUkxcIiwke3N0cmluZ2lmeV9zdHJpbmcob3BzLnRvU3RyaW5nVmFsdWUodGhpbmcpKX1dYDtcblx0XHRcdFx0XHRicmVhaztcblxuXHRcdFx0XHRjYXNlICdVUkxTZWFyY2hQYXJhbXMnOlxuXHRcdFx0XHRcdHN0ciA9IGBbXCJVUkxTZWFyY2hQYXJhbXNcIiwke3N0cmluZ2lmeV9zdHJpbmcob3BzLnRvU3RyaW5nVmFsdWUodGhpbmcpKX1dYDtcblx0XHRcdFx0XHRicmVhaztcblxuXHRcdFx0XHRjYXNlICdSZWdFeHAnOlxuXHRcdFx0XHRcdGNvbnN0IHsgc291cmNlLCBmbGFncyB9ID0gb3BzLnJlZ0V4cEluZm8odGhpbmcpO1xuXHRcdFx0XHRcdHN0ciA9IGZsYWdzXG5cdFx0XHRcdFx0XHQ/IGBbXCJSZWdFeHBcIiwke3N0cmluZ2lmeV9zdHJpbmcoc291cmNlKX0sXCIke2ZsYWdzfVwiXWBcblx0XHRcdFx0XHRcdDogYFtcIlJlZ0V4cFwiLCR7c3RyaW5naWZ5X3N0cmluZyhzb3VyY2UpfV1gO1xuXHRcdFx0XHRcdGJyZWFrO1xuXG5cdFx0XHRcdGNhc2UgJ0FycmF5Jzoge1xuXHRcdFx0XHRcdC8vIEZvciBkZW5zZSBhcnJheXMgKG5vIGhvbGVzKSwgd2UgaXRlcmF0ZSBub3JtYWxseS5cblx0XHRcdFx0XHQvLyBXaGVuIHdlIGVuY291bnRlciB0aGUgZmlyc3QgaG9sZSwgd2UgY2FsbCBPYmplY3Qua2V5c1xuXHRcdFx0XHRcdC8vIHRvIGRldGVybWluZSB0aGUgc3BhcnNlbmVzcywgdGhlbiBkZWNpZGUgYmV0d2Vlbjpcblx0XHRcdFx0XHQvLyAgIC0gSE9MRSBlbmNvZGluZzogWy0yLCB2YWwsIC0yLCAuLi5dIChkZWZhdWx0KVxuXHRcdFx0XHRcdC8vICAgLSBTcGFyc2UgZW5jb2Rpbmc6IFstNywgbGVuZ3RoLCBpZHgsIHZhbCwgLi4uXSAoZm9yIHZlcnkgc3BhcnNlIGFycmF5cylcblx0XHRcdFx0XHQvLyBPbmx5IHRoZSBzcGFyc2UgcGF0aCBhdm9pZHMgaXRlcmF0aW5nIGV2ZXJ5IHNsb3QsIHdoaWNoXG5cdFx0XHRcdFx0Ly8gaXMgd2hhdCBwcm90ZWN0cyBhZ2FpbnN0IHRoZSBEb1Mgb2YgZS5nLiBgYXJyWzEwMDAwMDBdID0gMWAuXG5cdFx0XHRcdFx0bGV0IG1vc3RseV9kZW5zZSA9IGZhbHNlO1xuXG5cdFx0XHRcdFx0Y29uc3QgbGVuZ3RoID0gb3BzLmxlbmd0aE9mKHRoaW5nKTtcblxuXHRcdFx0XHRcdHN0ciA9ICdbJztcblxuXHRcdFx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgbGVuZ3RoOyBpICs9IDEpIHtcblx0XHRcdFx0XHRcdGlmIChpID4gMCkgc3RyICs9ICcsJztcblxuXHRcdFx0XHRcdFx0aWYgKG9wcy5oYXNPd24odGhpbmcsIGkpKSB7XG5cdFx0XHRcdFx0XHRcdGtleXMucHVzaChgWyR7aX1dYCk7XG5cdFx0XHRcdFx0XHRcdHN0ciArPSBmbGF0dGVuKG9wcy5nZXQodGhpbmcsIGkpKTtcblx0XHRcdFx0XHRcdFx0a2V5cy5wb3AoKTtcblx0XHRcdFx0XHRcdH0gZWxzZSBpZiAobW9zdGx5X2RlbnNlKSB7XG5cdFx0XHRcdFx0XHRcdC8vIFVzZSBkZW5zZSBlbmNvZGluZy4gVGhlIGhldXJpc3RpYyBndWFyYW50ZWVzIHRoZVxuXHRcdFx0XHRcdFx0XHQvLyBhcnJheSBpcyBvbmx5IG1pbGRseSBzcGFyc2UsIHNvIGl0ZXJhdGluZyBvdmVyIGV2ZXJ5XG5cdFx0XHRcdFx0XHRcdC8vIHNsb3QgaXMgZmluZS5cblx0XHRcdFx0XHRcdFx0c3RyICs9IEhPTEU7XG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHQvLyBEZWNpZGUgYmV0d2VlbiBIT0xFIGVuY29kaW5nIGFuZCBzcGFyc2UgZW5jb2RpbmcuXG5cdFx0XHRcdFx0XHRcdC8vXG5cdFx0XHRcdFx0XHRcdC8vIEhPTEUgZW5jb2Rpbmc6IGVhY2ggaG9sZSBpcyBzZXJpYWxpemVkIGFzIHRoZSBIT0xFXG5cdFx0XHRcdFx0XHRcdC8vIHNlbnRpbmVsICgtMikuIEZvciBleGFtcGxlLCBbLCBcImFcIiwgLF0gYmVjb21lc1xuXHRcdFx0XHRcdFx0XHQvLyBbLTIsIDAsIC0yXS4gRWFjaCBob2xlIGNvc3RzIDMgY2hhcnMgKFwiLTJcIiArIGNvbW1hKS5cblx0XHRcdFx0XHRcdFx0Ly9cblx0XHRcdFx0XHRcdFx0Ly8gU3BhcnNlIGVuY29kaW5nOiBsaXN0cyBvbmx5IHBvcHVsYXRlZCBpbmRpY2VzLlxuXHRcdFx0XHRcdFx0XHQvLyBGb3IgZXhhbXBsZSwgWywgXCJhXCIsICxdIGJlY29tZXMgWy03LCAzLCAxLCAwXSDigJQgdGhlXG5cdFx0XHRcdFx0XHRcdC8vIC03IHNlbnRpbmVsLCB0aGUgYXJyYXkgbGVuZ3RoICgzKSwgdGhlbiBpbmRleC12YWx1ZVxuXHRcdFx0XHRcdFx0XHQvLyBwYWlycy4gVGhpcyBhdm9pZHMgcGF5aW5nIHBlci1ob2xlLCBidXQgZWFjaCBlbGVtZW50XG5cdFx0XHRcdFx0XHRcdC8vIGNvc3RzIGV4dHJhIGNoYXJzIHRvIHdyaXRlIGl0cyBpbmRleC5cblx0XHRcdFx0XHRcdFx0Ly9cblx0XHRcdFx0XHRcdFx0Ly8gVGhlIHZhbHVlcyBhcmUgdGhlIHNhbWUgc2l6ZSBlaXRoZXIgd2F5LCBzbyB0aGVcblx0XHRcdFx0XHRcdFx0Ly8gY2hvaWNlIGNvbWVzIGRvd24gdG8gc3RydWN0dXJhbCBvdmVyaGVhZDpcblx0XHRcdFx0XHRcdFx0Ly9cblx0XHRcdFx0XHRcdFx0Ly8gICBIT0xFIG92ZXJoZWFkOlxuXHRcdFx0XHRcdFx0XHQvLyAgICAgMyBjaGFycyBwZXIgaG9sZSAoXCItMlwiICsgY29tbWEpXG5cdFx0XHRcdFx0XHRcdC8vICAgICA9IChMIC0gUCkgKiAzXG5cdFx0XHRcdFx0XHRcdC8vXG5cdFx0XHRcdFx0XHRcdC8vICAgU3BhcnNlIG92ZXJoZWFkOlxuXHRcdFx0XHRcdFx0XHQvLyAgICAgXCItNyxcIiAgICAgICAgICDigJQgMyBjaGFycyAoc3BhcnNlIHNlbnRpbmVsICsgY29tbWEpXG5cdFx0XHRcdFx0XHRcdC8vICAgICArIGxlbmd0aCArIFwiLFwiIOKAlCAoZCArIDEpIGNoYXJzIChhcnJheSBsZW5ndGggKyBjb21tYSlcblx0XHRcdFx0XHRcdFx0Ly8gICAgICsgcGVyIGVsZW1lbnQ6IGluZGV4ICsgXCIsXCIg4oCUIChkICsgMSkgY2hhcnNcblx0XHRcdFx0XHRcdFx0Ly8gICAgID0gKDQgKyBkKSArIFAgKiAoZCArIDEpXG5cdFx0XHRcdFx0XHRcdC8vXG5cdFx0XHRcdFx0XHRcdC8vIHdoZXJlIEwgaXMgdGhlIGFycmF5IGxlbmd0aCwgUCBpcyB0aGUgbnVtYmVyIG9mXG5cdFx0XHRcdFx0XHRcdC8vIHBvcHVsYXRlZCBlbGVtZW50cywgYW5kIGQgaXMgdGhlIG51bWJlciBvZiBkaWdpdHNcblx0XHRcdFx0XHRcdFx0Ly8gaW4gTCAoYW4gdXBwZXIgYm91bmQgb24gdGhlIGRpZ2l0cyBpbiBhbnkgaW5kZXgpLlxuXHRcdFx0XHRcdFx0XHQvL1xuXHRcdFx0XHRcdFx0XHQvLyBTcGFyc2UgZW5jb2RpbmcgaXMgY2hlYXBlciB3aGVuOlxuXHRcdFx0XHRcdFx0XHQvLyAgICg0ICsgZCkgKyBQICogKGQgKyAxKSA8IChMIC0gUCkgKiAzXG5cdFx0XHRcdFx0XHRcdGNvbnN0IHBvcHVsYXRlZF9rZXlzID0gb3BzLmluZGljZXNPZih0aGluZyk7XG5cdFx0XHRcdFx0XHRcdGNvbnN0IHBvcHVsYXRpb24gPSBwb3B1bGF0ZWRfa2V5cy5sZW5ndGg7XG5cdFx0XHRcdFx0XHRcdGNvbnN0IGQgPSBTdHJpbmcobGVuZ3RoKS5sZW5ndGg7XG5cblx0XHRcdFx0XHRcdFx0Y29uc3QgaG9sZV9jb3N0ID0gKGxlbmd0aCAtIHBvcHVsYXRpb24pICogMztcblx0XHRcdFx0XHRcdFx0Y29uc3Qgc3BhcnNlX2Nvc3QgPSA0ICsgZCArIHBvcHVsYXRpb24gKiAoZCArIDEpO1xuXG5cdFx0XHRcdFx0XHRcdGlmIChob2xlX2Nvc3QgPiBzcGFyc2VfY29zdCkge1xuXHRcdFx0XHRcdFx0XHRcdHN0ciA9ICdbJyArIFNQQVJTRSArICcsJyArIGxlbmd0aDtcblx0XHRcdFx0XHRcdFx0XHRmb3IgKGxldCBqID0gMDsgaiA8IHBvcHVsYXRlZF9rZXlzLmxlbmd0aDsgaisrKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRjb25zdCBrZXkgPSBwb3B1bGF0ZWRfa2V5c1tqXTtcblx0XHRcdFx0XHRcdFx0XHRcdGtleXMucHVzaChgWyR7a2V5fV1gKTtcblx0XHRcdFx0XHRcdFx0XHRcdHN0ciArPSAnLCcgKyBrZXkgKyAnLCcgKyBmbGF0dGVuKG9wcy5nZXQodGhpbmcsIGtleSkpO1xuXHRcdFx0XHRcdFx0XHRcdFx0a2V5cy5wb3AoKTtcblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdFx0bW9zdGx5X2RlbnNlID0gdHJ1ZTtcblx0XHRcdFx0XHRcdFx0XHRzdHIgKz0gSE9MRTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHN0ciArPSAnXSc7XG5cblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGNhc2UgJ1NldCc6XG5cdFx0XHRcdFx0c3RyID0gJ1tcIlNldFwiJztcblxuXHRcdFx0XHRcdGZvciAoY29uc3QgdmFsdWUgb2Ygb3BzLnZhbHVlc09mKHRoaW5nKSkge1xuXHRcdFx0XHRcdFx0c3RyICs9IGAsJHtmbGF0dGVuKHZhbHVlKX1gO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHN0ciArPSAnXSc7XG5cdFx0XHRcdFx0YnJlYWs7XG5cblx0XHRcdFx0Y2FzZSAnTWFwJzpcblx0XHRcdFx0XHRzdHIgPSAnW1wiTWFwXCInO1xuXG5cdFx0XHRcdFx0Zm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2Ygb3BzLmVudHJpZXNPZih0aGluZykpIHtcblx0XHRcdFx0XHRcdGNvbnN0IGtleV90eXBlID0gb3BzLnR5cGVPZihrZXkpO1xuXHRcdFx0XHRcdFx0Y29uc3Qga2V5X2lzX3ByaW1pdGl2ZSA9XG5cdFx0XHRcdFx0XHRcdGtleV90eXBlICE9PSAnb2JqZWN0JyAmJiBrZXlfdHlwZSAhPT0gJ2Z1bmN0aW9uJyAmJiBrZXlfdHlwZSAhPT0gJ3N5bWJvbCc7XG5cdFx0XHRcdFx0XHRrZXlzLnB1c2goXG5cdFx0XHRcdFx0XHRcdGAuZ2V0KCR7a2V5X2lzX3ByaW1pdGl2ZSA/IHN0cmluZ2lmeV9wcmltaXRpdmUob3BzLnRvUHJpbWl0aXZlKGtleSkpIDogJy4uLid9KWBcblx0XHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0XHRzdHIgKz0gYCwke2ZsYXR0ZW4oa2V5KX0sJHtmbGF0dGVuKHZhbHVlKX1gO1xuXHRcdFx0XHRcdFx0a2V5cy5wb3AoKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRzdHIgKz0gJ10nO1xuXHRcdFx0XHRcdGJyZWFrO1xuXG5cdFx0XHRcdGNhc2UgJ0ludDhBcnJheSc6XG5cdFx0XHRcdGNhc2UgJ1VpbnQ4QXJyYXknOlxuXHRcdFx0XHRjYXNlICdVaW50OENsYW1wZWRBcnJheSc6XG5cdFx0XHRcdGNhc2UgJ0ludDE2QXJyYXknOlxuXHRcdFx0XHRjYXNlICdVaW50MTZBcnJheSc6XG5cdFx0XHRcdGNhc2UgJ0Zsb2F0MTZBcnJheSc6XG5cdFx0XHRcdGNhc2UgJ0ludDMyQXJyYXknOlxuXHRcdFx0XHRjYXNlICdVaW50MzJBcnJheSc6XG5cdFx0XHRcdGNhc2UgJ0Zsb2F0MzJBcnJheSc6XG5cdFx0XHRcdGNhc2UgJ0Zsb2F0NjRBcnJheSc6XG5cdFx0XHRcdGNhc2UgJ0JpZ0ludDY0QXJyYXknOlxuXHRcdFx0XHRjYXNlICdCaWdVaW50NjRBcnJheSc6IHtcblx0XHRcdFx0XHRjb25zdCBpbmZvID0gb3BzLnZpZXdJbmZvKHRoaW5nKTtcblx0XHRcdFx0XHRzdHIgPSAnW1wiJyArIHRhZyArICdcIiwnICsgZmxhdHRlbihpbmZvLmJ1ZmZlcik7XG5cblx0XHRcdFx0XHQvLyBoYW5kbGUgc3ViYXJyYXlzXG5cdFx0XHRcdFx0aWYgKGluZm8uYnl0ZUxlbmd0aCAhPT0gaW5mby5idWZmZXJCeXRlTGVuZ3RoKSB7XG5cdFx0XHRcdFx0XHRzdHIgKz0gYCwke2luZm8uYnl0ZU9mZnNldH0sJHtpbmZvLmxlbmd0aH1gO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHN0ciArPSAnXSc7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjYXNlICdEYXRhVmlldyc6IHtcblx0XHRcdFx0XHRjb25zdCBpbmZvID0gb3BzLnZpZXdJbmZvKHRoaW5nKTtcblx0XHRcdFx0XHRzdHIgPSAnW1wiJyArIHRhZyArICdcIiwnICsgZmxhdHRlbihpbmZvLmJ1ZmZlcik7XG5cblx0XHRcdFx0XHRpZiAoaW5mby5ieXRlTGVuZ3RoICE9PSBpbmZvLmJ1ZmZlckJ5dGVMZW5ndGgpIHtcblx0XHRcdFx0XHRcdHN0ciArPSBgLCR7aW5mby5ieXRlT2Zmc2V0fSwke2luZm8uYnl0ZUxlbmd0aH1gO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHN0ciArPSAnXSc7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjYXNlICdBcnJheUJ1ZmZlcic6IHtcblx0XHRcdFx0XHRjb25zdCBiYXNlNjQgPSBlbmNvZGU2NChvcHMudG9BcnJheUJ1ZmZlcih0aGluZykpO1xuXG5cdFx0XHRcdFx0c3RyID0gYFtcIkFycmF5QnVmZmVyXCIsXCIke2Jhc2U2NH1cIl1gO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Y2FzZSAnVGVtcG9yYWwuRHVyYXRpb24nOlxuXHRcdFx0XHRjYXNlICdUZW1wb3JhbC5JbnN0YW50Jzpcblx0XHRcdFx0Y2FzZSAnVGVtcG9yYWwuUGxhaW5EYXRlJzpcblx0XHRcdFx0Y2FzZSAnVGVtcG9yYWwuUGxhaW5UaW1lJzpcblx0XHRcdFx0Y2FzZSAnVGVtcG9yYWwuUGxhaW5EYXRlVGltZSc6XG5cdFx0XHRcdGNhc2UgJ1RlbXBvcmFsLlBsYWluTW9udGhEYXknOlxuXHRcdFx0XHRjYXNlICdUZW1wb3JhbC5QbGFpblllYXJNb250aCc6XG5cdFx0XHRcdGNhc2UgJ1RlbXBvcmFsLlpvbmVkRGF0ZVRpbWUnOlxuXHRcdFx0XHRcdHN0ciA9IGBbXCIke3RhZ31cIiwke3N0cmluZ2lmeV9zdHJpbmcob3BzLnRvU3RyaW5nVmFsdWUodGhpbmcpKX1dYDtcblx0XHRcdFx0XHRicmVhaztcblxuXHRcdFx0XHRkZWZhdWx0OiB7XG5cdFx0XHRcdFx0Y29uc3Qgc2hhcGUgPSBvcHMuc2hhcGVPZih0aGluZyk7XG5cblx0XHRcdFx0XHRpZiAoc2hhcGUua2luZCA9PT0gJ25vdC1wbGFpbicpIHtcblx0XHRcdFx0XHRcdHRocm93IG5ldyBEZXZhbHVlRXJyb3IoYENhbm5vdCBzdHJpbmdpZnkgYXJiaXRyYXJ5IG5vbi1QT0pPc2AsIGtleXMsIHRoaW5nLCB2YWx1ZSk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0aWYgKHNoYXBlLmtpbmQgPT09ICdzeW1ib2wta2V5cycpIHtcblx0XHRcdFx0XHRcdHRocm93IG5ldyBEZXZhbHVlRXJyb3IoYENhbm5vdCBzdHJpbmdpZnkgUE9KT3Mgd2l0aCBzeW1ib2xpYyBrZXlzYCwga2V5cywgdGhpbmcsIHZhbHVlKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAoc2hhcGUua2luZCA9PT0gJ251bGwtcHJvdG8nKSB7XG5cdFx0XHRcdFx0XHRzdHIgPSAnW1wibnVsbFwiJztcblx0XHRcdFx0XHRcdGZvciAoY29uc3Qga2V5IG9mIHNoYXBlLmtleXMpIHtcblx0XHRcdFx0XHRcdFx0aWYgKGtleSA9PT0gJ19fcHJvdG9fXycpIHtcblx0XHRcdFx0XHRcdFx0XHR0aHJvdyBuZXcgRGV2YWx1ZUVycm9yKFxuXHRcdFx0XHRcdFx0XHRcdFx0YENhbm5vdCBzdHJpbmdpZnkgb2JqZWN0cyB3aXRoIF9fcHJvdG9fXyBrZXlzYCxcblx0XHRcdFx0XHRcdFx0XHRcdGtleXMsXG5cdFx0XHRcdFx0XHRcdFx0XHR0aGluZyxcblx0XHRcdFx0XHRcdFx0XHRcdHZhbHVlXG5cdFx0XHRcdFx0XHRcdFx0KTtcblx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdGtleXMucHVzaChzdHJpbmdpZnlfa2V5KGtleSkpO1xuXHRcdFx0XHRcdFx0XHRzdHIgKz0gYCwke3N0cmluZ2lmeV9zdHJpbmcoa2V5KX0sJHtmbGF0dGVuKG9wcy5nZXQodGhpbmcsIGtleSkpfWA7XG5cdFx0XHRcdFx0XHRcdGtleXMucG9wKCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRzdHIgKz0gJ10nO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRzdHIgPSAneyc7XG5cdFx0XHRcdFx0XHRsZXQgc3RhcnRlZCA9IGZhbHNlO1xuXHRcdFx0XHRcdFx0Zm9yIChjb25zdCBrZXkgb2Ygc2hhcGUua2V5cykge1xuXHRcdFx0XHRcdFx0XHRpZiAoa2V5ID09PSAnX19wcm90b19fJykge1xuXHRcdFx0XHRcdFx0XHRcdHRocm93IG5ldyBEZXZhbHVlRXJyb3IoXG5cdFx0XHRcdFx0XHRcdFx0XHRgQ2Fubm90IHN0cmluZ2lmeSBvYmplY3RzIHdpdGggX19wcm90b19fIGtleXNgLFxuXHRcdFx0XHRcdFx0XHRcdFx0a2V5cyxcblx0XHRcdFx0XHRcdFx0XHRcdHRoaW5nLFxuXHRcdFx0XHRcdFx0XHRcdFx0dmFsdWVcblx0XHRcdFx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0aWYgKHN0YXJ0ZWQpIHN0ciArPSAnLCc7XG5cdFx0XHRcdFx0XHRcdHN0YXJ0ZWQgPSB0cnVlO1xuXHRcdFx0XHRcdFx0XHRrZXlzLnB1c2goc3RyaW5naWZ5X2tleShrZXkpKTtcblx0XHRcdFx0XHRcdFx0c3RyICs9IGAke3N0cmluZ2lmeV9zdHJpbmcoa2V5KX06JHtmbGF0dGVuKG9wcy5nZXQodGhpbmcsIGtleSkpfWA7XG5cdFx0XHRcdFx0XHRcdGtleXMucG9wKCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRzdHIgKz0gJ30nO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHN0cmluZ2lmaWVkW2luZGV4XSA9IHN0cjtcblx0XHRyZXR1cm4gaW5kZXg7XG5cdH1cblxuXHRjb25zdCBpbmRleCA9IGZsYXR0ZW4odmFsdWUpO1xuXG5cdC8vIHNwZWNpYWwgY2FzZSDigJTCoHZhbHVlIGlzIHJlcHJlc2VudGVkIGFzIGEgbmVnYXRpdmUgaW5kZXhcblx0aWYgKGluZGV4IDwgMCkgcmV0dXJuIGAke2luZGV4fWA7XG5cblx0cmV0dXJuIHN0cmluZ2lmaWVkO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7YW55fSB0aGluZ1xuICogQHJldHVybnMge3N0cmluZ31cbiAqL1xuZnVuY3Rpb24gc3RyaW5naWZ5X3ByaW1pdGl2ZSh0aGluZykge1xuXHRjb25zdCB0eXBlID0gdHlwZW9mIHRoaW5nO1xuXHRpZiAodHlwZSA9PT0gJ3N0cmluZycpIHJldHVybiBzdHJpbmdpZnlfc3RyaW5nKHRoaW5nKTtcblx0aWYgKHRoaW5nID09PSB2b2lkIDApIHJldHVybiBVTkRFRklORUQudG9TdHJpbmcoKTtcblx0aWYgKHRoaW5nID09PSAwICYmIDEgLyB0aGluZyA8IDApIHJldHVybiBORUdBVElWRV9aRVJPLnRvU3RyaW5nKCk7XG5cdGlmICh0eXBlID09PSAnYmlnaW50JykgcmV0dXJuIGBbXCJCaWdJbnRcIixcIiR7dGhpbmd9XCJdYDtcblx0cmV0dXJuIFN0cmluZyh0aGluZyk7XG59XG4iLCJleHBvcnQgeyB1bmV2YWwgfSBmcm9tICcuL3NyYy91bmV2YWwuanMnO1xuZXhwb3J0IHsgcGFyc2UsIHVuZmxhdHRlbiB9IGZyb20gJy4vc3JjL3BhcnNlLmpzJztcbmV4cG9ydCB7IHN0cmluZ2lmeSwgc3RyaW5naWZ5QXN5bmMgfSBmcm9tICcuL3NyYy9zdHJpbmdpZnkuanMnO1xuZXhwb3J0IHtcblx0ZGVmYXVsdF9zdHJpbmdpZnlfb3BlcmF0aW9ucyBhcyBkZWZhdWx0U3RyaW5naWZ5T3BlcmF0aW9ucyxcblx0ZGVmYXVsdF9wYXJzZV9vcGVyYXRpb25zIGFzIGRlZmF1bHRQYXJzZU9wZXJhdGlvbnNcbn0gZnJvbSAnLi9zcmMvb3BlcmF0aW9ucy5qcyc7XG5leHBvcnQgeyBEZXZhbHVlRXJyb3IsIGZpbHRlcl9hcnJheV9pbmRpY2VzIGFzIGZpbHRlckFycmF5SW5kaWNlcyB9IGZyb20gJy4vc3JjL3V0aWxzLmpzJztcblxuLyoqIEB0eXBlZGVmIHtpbXBvcnQoJy4vc3JjL3R5cGVzLmpzJykuU3RyaW5nVmFsdWVUYWd9IFN0cmluZ1ZhbHVlVGFnICovXG4vKiogQHR5cGVkZWYge2ltcG9ydCgnLi9zcmMvdHlwZXMuanMnKS5WaWV3VGFnfSBWaWV3VGFnICovXG4vKiogQHR5cGVkZWYge2ltcG9ydCgnLi9zcmMvdHlwZXMuanMnKS5TdHJpbmdpZnlPcGVyYXRpb25zfSBTdHJpbmdpZnlPcGVyYXRpb25zICovXG4vKiogQHR5cGVkZWYge2ltcG9ydCgnLi9zcmMvdHlwZXMuanMnKS5EZWZhdWx0U3RyaW5naWZ5T3BlcmF0aW9uc30gRGVmYXVsdFN0cmluZ2lmeU9wZXJhdGlvbnMgKi9cbi8qKiBAdHlwZWRlZiB7aW1wb3J0KCcuL3NyYy90eXBlcy5qcycpLlN0cmluZ2lmeU9wdGlvbnN9IFN0cmluZ2lmeU9wdGlvbnMgKi9cbi8qKiBAdHlwZWRlZiB7aW1wb3J0KCcuL3NyYy90eXBlcy5qcycpLlBhcnNlT3BlcmF0aW9uc30gUGFyc2VPcGVyYXRpb25zICovXG4vKiogQHR5cGVkZWYge2ltcG9ydCgnLi9zcmMvdHlwZXMuanMnKS5EZWZhdWx0UGFyc2VPcGVyYXRpb25zfSBEZWZhdWx0UGFyc2VPcGVyYXRpb25zICovXG4vKiogQHR5cGVkZWYge2ltcG9ydCgnLi9zcmMvdHlwZXMuanMnKS5QYXJzZU9wdGlvbnN9IFBhcnNlT3B0aW9ucyAqL1xuIl0sIm1hcHBpbmdzIjoiO0FBVUEsSUFBYSxnQkFBZ0IsS0FBSyxLQUFLO0FBQ3ZDLElBQWEsa0JBQWtCLGdCQUFnQjs7O0FDUi9DLElBQWEsVUFBVTtDQUN0QixLQUFLO0NBQ0wsTUFBTTtDQUNOLE1BQU07Q0FDTixNQUFNO0NBQ04sTUFBTTtDQUNOLE1BQU07Q0FDTixLQUFNO0NBQ04sVUFBVTtDQUNWLFVBQVU7QUFDWDtBQUVBLElBQWEsZUFBYixjQUFrQyxNQUFNOzs7Ozs7O0NBT3ZDLFlBQVksU0FBUyxNQUFNLE9BQU8sTUFBTTtFQUN2QyxNQUFNLE9BQU87RUFDYixLQUFLLE9BQU87RUFDWixLQUFLLE9BQU8sS0FBSyxLQUFLLEVBQUU7RUFDeEIsS0FBSyxRQUFRO0VBQ2IsS0FBSyxPQUFPO0NBQ2I7QUFDRDs7QUFHQSxTQUFnQixhQUFhLE9BQU87Q0FDbkMsT0FBTyxVQUFVLFFBQVMsT0FBTyxVQUFVLFlBQVksT0FBTyxVQUFVO0FBQ3pFO0FBRUEsSUFBTSxxQkFBcUMsdUJBQU8sb0JBQW9CLE9BQU8sU0FBUyxDQUFDLENBQ3JGLEtBQUssQ0FBQyxDQUNOLEtBQUssSUFBSTs7QUFHWCxTQUFnQixnQkFBZ0IsT0FBTztDQUN0QyxNQUFNLFFBQVEsT0FBTyxlQUFlLEtBQUs7Q0FFekMsT0FDQyxVQUFVLE9BQU8sYUFDakIsVUFBVSxRQUNWLE9BQU8sZUFBZSxLQUFLLE1BQU0sUUFDakMsT0FBTyxvQkFBb0IsS0FBSyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsS0FBSyxJQUFJLE1BQU07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LG1CQUZTLFNBQVMsSUFBSSxjQUFjLEtBQUssQ0FFakIsRUFBRTtLQUNoQztJQUdELEtBQUs7SUFDTCxLQUFLO0lBQ0wsS0FBSztJQUNMLEtBQUs7SUFDTCxLQUFLO0lBQ0wsS0FBSztJQUNMLEtBQUs7SUFDTCxLQUFLO0tBQ0osTUFBTSxLQUFLLElBQUksSUFBSSxpQkFBaUIsSUFBSSxjQUFjLEtBQUssQ0FBQyxFQUFFO0tBQzlEO0lBRUQsU0FBUztLQUNSLE1BQU0sUUFBUSxJQUFJLFFBQVEsS0FBSztLQUUvQixJQUFJLE1BQU0sU0FBUyxhQUNsQixNQUFNLElBQUksYUFBYSx3Q0FBd0MsTUFBTSxPQUFPLEtBQUs7S0FHbEYsSUFBSSxNQUFNLFNBQVMsZUFDbEIsTUFBTSxJQUFJLGFBQWEsNkNBQTZDLE1BQU0sT0FBTyxLQUFLO0tBR3ZGLElBQUksTUFBTSxTQUFTLGNBQWM7TUFDaEMsTUFBTTtNQUNOLEtBQUssTUFBTSxPQUFPLE1BQU0sTUFBTTtPQUM3QixJQUFJLFFBQVEsYUFDWCxNQUFNLElBQUksYUFDVCxnREFDQSxNQUNBLE9BQ0EsS0FDRDtPQUdELEtBQUssS0FBSyxjQUFjLEdBQUcsQ0FBQztPQUM1QixPQUFPLElBQUksaUJBQWlCLEdBQUcsRUFBRSxHQUFHLFFBQVEsSUFBSSxJQUFJLE9BQU8sR0FBRyxDQUFDO09BQy9ELEtBQUssSUFBSTtNQUNWO01BQ0EsT0FBTztLQUNSLE9BQU87TUFDTixNQUFNO01BQ04sSUFBSSxVQUFVO01BQ2QsS0FBSyxNQUFNLE9BQU8sTUFBTSxNQUFNO09BQzdCLElBQUksUUFBUSxhQUNYLE1BQU0sSUFBSSxhQUNULGdEQUNBLE1BQ0EsT0FDQSxLQUNEO09BR0QsSUFBSSxTQUFTLE9BQU87T0FDcEIsVUFBVTtPQUNWLEtBQUssS0FBSyxjQUFjLEdBQUcsQ0FBQztPQUM1QixPQUFPLEdBQUcsaUJBQWlCLEdBQUcsRUFBRSxHQUFHLFFBQVEsSUFBSSxJQUFJLE9BQU8sR0FBRyxDQUFDO09BQzlELEtBQUssSUFBSTtNQUNWO01BQ0EsT0FBTztLQUNSO0lBQ0Q7R0FDRDtFQUNEO0VBRUEsWUFBWSxTQUFTO0VBQ3JCLE9BQU87Q0FDUjtDQUVBLE1BQU0sUUFBUSxRQUFRLEtBQUs7Q0FHM0IsSUFBSSxRQUFRLEdBQUcsT0FBTyxHQUFHO0NBRXpCLE9BQU87QUFDUjs7Ozs7QUFNQSxTQUFTLG9CQUFvQixPQUFPO0NBQ25DLE1BQU0sT0FBTyxPQUFPO0NBQ3BCLElBQUksU0FBUyxVQUFVLE9BQU8saUJBQWlCLEtBQUs7Q0FDcEQsSUFBSSxVQUFVLEtBQUssR0FBRyxPQUFBLElBQUEsQ0FBaUIsU0FBUztDQUNoRCxJQUFJLFVBQVUsS0FBSyxJQUFJLFFBQVEsR0FBRyxPQUFBLElBQUEsQ0FBcUIsU0FBUztDQUNoRSxJQUFJLFNBQVMsVUFBVSxPQUFPLGNBQWMsTUFBTTtDQUNsRCxPQUFPLE9BQU8sS0FBSztBQUNwQiIsInhfZ29vZ2xlX2lnbm9yZUxpc3QiOlswLDEsMiwzLDQsNSw2LDddfQ==