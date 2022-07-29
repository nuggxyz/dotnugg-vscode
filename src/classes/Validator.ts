export class Validator {
	private _values: object = {};

	public get hasAnyUndefined() {
		return this.undefinedVarNames.length > 0;
	}

	public static isBroadlyUndefined(value: any) {
		return value === undefined || (Array.isArray(value) ? value.length === 0 : false) || JSON.stringify(value) === '{}';
	}

	// public get undefinedArray() {
	//     return this._values.filter((x) => Validator.isBroadlyUndefined(x));
	// }

	// public get asObject() {
	//     return this._values;
	// }

	public get undefinedVarNames() {
		const obj = this._values;
		return Object.keys(obj).filter((x) => Validator.isBroadlyUndefined(obj[x]));
	}

	// public get noBs(...args: any) {
	//     return
	// };

	// public static nestedResults(last: object) {
	//     let next = {};
	//     if (typeof last === 'object') {
	//         for (const [key, value] of Object.entries(last)) {
	//             if (typeof value === 'object') {
	//                 return { [key]: Validator.nestedResults(value) };
	//             } else if (Array.isArray(value)) {
	//                 return {
	//                     [key]: [
	//                         ...value.map((x) => {
	//                             return Validator.nestedResults(x);
	//                         }),
	//                     ],
	//                 };
	//             } else {
	//                 return { [key]: Validator.isBroadlyUndefined(false) };
	//             }
	//         }
	//     }
	//     return last;
	// }

	public get complete() {
		return !this.hasAnyUndefined;
	}

	public static anyUndefined(args: object) {
		const tmp = new Validator(args);
		return tmp.hasAnyUndefined;
	}

	constructor(args: object) {
		this.add(args);
	}

	public add(args: object) {
		this._values = { ...this._values, ...args };
	}
}
