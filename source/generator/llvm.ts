
/**
 * A basic part in the LLVM code.
 */
export interface LLVMPart {

	/**
	 * Returns the LLVM code.
	 */
	toString(): string;
}

/**
 * A basic data type.
 */
export interface LLVMType extends LLVMPart {

	/**
	 * The name of this type.
	 */
	type: string;
}

/**
 * An integer.
 */
export class IntegerType implements LLVMType {
	type = "IntegerType";

	constructor(public width: string) { }

	/**
	 * Creating a new Integer Type.
	 * @param width the bit width of this integer.
	 * @returns {IntegerType}
	 */
	static get(width: string): IntegerType {
		return new IntegerType(width);
	}

	/**
	 * @see {LLVMPart.toString}
	 * @returns {string}
	 */
	toString(): string {
		return `i${this.width}`;
	}
}

export class VoidType implements LLVMType {
	type = "VoidType";

	/**
	 * @see {LLVMPart.toString}
	 * @returns {string}
	 */
	toString(): string {
		return "void";
	}

	/**
	 * Creating a new Void Type.
	 * @param width the bit width of this integer.
	 * @returns {IntegerType}
	 */
	static get(): VoidType {
		return new VoidType();
	}
}

export class LLVMFunctionParameter implements LLVMPart {
	constructor(public type: LLVMPart, public name: string) { }

	/**
	 * @see {LLVMPart.toString}
	 * @returns {string}
	 */
	toString(): string {
		return `${this.type.toString()} ${this.name}`;
	}
}

/**
 * A basic LLVM function.
 */
export class LLVMFunction implements LLVMPart {
	constructor(public name: string, public returnType: LLVMType, public parameters: LLVMFunctionParameter[], public block: LLVMPart[]) { }

	/**
	 * @see {LLVMPart.toString}
	 * @returns {string}
	 */
	toString(): string {
		return `define ${this.returnType.toString()} @${this.name}(${this.parameters.map(p => p.toString()).join(", ")}) {\n${this.block.map(p => p.toString())}\n}`;
	}
}

/**
 * Basic LLVM API for typescript
 */
export class LLVM {

	/**
	 * All parts in order.
	 */
	private parts: LLVMPart[] = [];

	/**
	 * Adding a new function.
	 */
	defineFunction(name: string, block: LLVMPart[], type: LLVMType = VoidType.get(), parameters: LLVMFunctionParameter[] = []): void {
		this.parts.push(new LLVMFunction(name, type, parameters, block));
	}

	/**
	 * Returning the code.
	 */
	toString(): string {
		return this.parts.map(p => p.toString()).join("\n");
	}
}