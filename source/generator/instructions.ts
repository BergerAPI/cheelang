import { Generator } from "./generator";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Instruction {
	/**
	 * Generating the LLVM code for this part.
	 */
	generate(): string;
}

/**
 * Some data types
 * @todo Add more data types
 */
export class LLVMType {

	/**
	 * The value of the type.
	 */
	constructor(public value: string) {
	}

	/**
	 * A basic string.
	 */
	static string(value: string, context: Generator): LLVMType {
		const name = context.constantString(value);

		return new LLVMType(`getelementptr inbounds ([${value.length + 2} x i8], [${value.length + 2} x i8]* ${name}, i32 0, i32 0)`);
	}

	/**
	 * An Integer.
	 * @param width The width of an integer.
	 * @returns this
	 */
	static integer(width: number, pointer = false): LLVMType {
		return new LLVMType(`i${width}${pointer ? "*" : ""}`);
	}

	/**
	 * A void.
	 * @returns this
	 */
	static void(): LLVMType {
		return new LLVMType("void");
	}

	/**
	 * An array.
	 * @param type The type of the items in the array
	 * @param size The size of the array
	 * @returns this
	 */
	static array(type: LLVMType, size: number): LLVMType {
		return new LLVMType(`[${size} x ${type.value}]`);
	}
}

/**
 * An attribute for a function.
 * 
 * @todo expand.
 */
export enum FunctionAttributes {
	NO_UNWIND = "nounwind",
	BUILD_IN = "buildin"
}

/**
 * Some function parameters.
 * 
 * @note You don't have to pass a name (if you declare a function instead of defining a function)
 */
export class FunctionParameter {
	constructor(public type: LLVMType, public name: string = "") { }
}

/**
 * Defining a function.
 */
export class DefineInstruction implements Instruction {
	constructor(
		public name: string,
		public scope: Instruction[],
		public type: LLVMType,
		public attributes: FunctionAttributes[],
		public parameters: FunctionParameter[]
	) { }

	/**
	 * @see {Instruction}
	 */
	generate(): string {
		const attributes = this.attributes.map(a => `${a}`).join(" ");
		const parameters = this.parameters.map(p => `${p.type.value}${p.name != "" ? " " + p.name : ""}`).join(", ");

		return `define ${this.type.value} @${this.name}(${parameters}) ${attributes} {\n${this.scope.map(s => "\t" + s.generate()).join("\n")}\n}`;
	}
}

/**
 * Declaring a function.
 */
export class DeclareInstruction implements Instruction {
	constructor(
		public name: string,
		public type: LLVMType,
		public attributes: FunctionAttributes[],
		public parameters: FunctionParameter[]
	) { }

	/**
	 * @see {Instruction}
	 */
	generate(): string {
		const attributes = this.attributes.map(a => `${a}`).join(" ");
		const parameters = this.parameters.map(p => `${p.type.value}${p.name != "" ? " " + p.name : ""}`).join(", ");

		return `declare ${this.type.value} @${this.name}(${parameters}) ${attributes}`;
	}
}

/**
 * Calling a function.
 */
export class CallInstruction implements Instruction {
	constructor(
		public name: string,
		public parameters: FunctionParameter[]
	) { }

	/**
	 * @see {Instruction}
	 */
	generate(): string {
		const parameters = this.parameters.map(p => `\t${p.type} ${p.name}`).join(", ");

		return `call @${this.name}(${parameters})`;
	}
}

/**
 * An attribute for a global variable.
 * 
 * @todo expand.
 */
export enum VariableAttributes {
	PRIVATE = "private",
	UNNAMED_ADDRESS = "unnamed_addr",
	CONSTANT = "constant",
	GLOBAL = "global",
}

/**
 * Defining a global variable.
 */
export class GlobalInstruction implements Instruction {
	constructor(
		public name: string,
		public type: LLVMType,
		public value: string,
		public attributes: VariableAttributes[]
	) { }

	/**
	 * @see {Instruction}
	 */
	generate(): string {
		return `@${this.name} = ${this.attributes.length != 0 ? this.attributes.join(" ") + " " : ""}${this.type.value} ${this.value}`;
	}
}

/**
 * Defining a local variable.
 */
export class LocalInstruction implements Instruction {
	constructor(
		public name: string,
		public value: string
	) { }

	/**
	 * @see {Instruction}
	 */
	generate(): string {
		return `%${this.name} = ${this.value}`;
	}
}

/**
 * Allocating space for a local variable.
 */
export class AllocaInstruction implements Instruction {
	constructor(
		public name: string,
		public type: LLVMType,
		public alignment: number = 4
	) { }

	/**
	 * @see {Instruction}
	 */
	generate(): string {
		return `%${this.name} = alloca ${this.type}, align ${this.alignment}`;
	}
}

/**
 * Storing a value in a local variable.
 * 
 * @example store i32 5, i32* %a, align 4
 */
export class StoreInstruction implements Instruction {
	constructor(
		public name: string,
		public nameType: LLVMType,
		public value: string,
		public valueType: LLVMType,
		public alignment: number = 4
	) { }

	/**
	 * @see {Instruction}
	 */
	generate(): string {
		return `store ${this.valueType.value} ${this.value}, ${this.nameType.value} ${this.name}, align ${this.alignment}`;
	}
}

/**
 * Loading a value from a local variable.
 * 
 * @example %0 = load i32* %a, align 4
 */
export class LoadInstruction implements Instruction {
	constructor(
		public name: string,
		public locationType: LLVMType,
		public location: string,
		public alignment: number = 4
	) { }

	/**
	 * @see {Instruction}
	 */
	generate(): string {
		return `%${this.name} = load ${this.locationType.value} ${this.location}, align ${this.alignment}`;
	}
}

/**
 * Returning from a function
 */
export class ReturnInstruction implements Instruction {
	constructor(
		public value: string,
		public currentFunction: DefineInstruction
	) { }

	/**
	 * @see {Instruction}
	 */
	generate(): string {
		return `ret ${this.currentFunction.type.value} ${this.value}`;
	}
}