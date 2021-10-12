
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

	private constructor(public width: number, public pointer: boolean = false) { }

	/**
	 * Creating a new Integer Type.
	 * @param width the bit width of this integer.
	 * @returns {IntegerType}
	 */
	static get(width: number, pointer = false): IntegerType {
		return new IntegerType(width, pointer);
	}

	/**
	 * @see {LLVMPart.toString}
	 * @returns {string}
	 */
	toString(): string {
		return `i${this.width}${this.pointer ? "*" : ""}`;
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
	 * @returns {VoidType}
	 */
	static get(): VoidType {
		return new VoidType();
	}
}

export class StringType implements LLVMType {
	type = "StringType";

	private constructor(public value: string, public context: LLVM, public stringConstant: string) { }

	/**
	 * @see {LLVMPart.toString}
	 * @returns {string}
	 */
	toString(): string {
		return this.stringConstant;
	}

	/**
	 * Creating a new String Type.
	 * @param value the value of this string.
	 * @param context we need the llvm context here to define some constants.
	 * @returns {StringType}
	 */
	static get(value: string, context: LLVM, newVariable = true): StringType {
		const valueLenght = value.length + 2;
		let name = context.getRandomName();

		context.globalVariable(`.str-${name}`, VoidType.get(), `private unnamed_addr constant [${valueLenght} x i8] c"${value}\\0A\\00"`);

		if (newVariable) {
			context.defineLocalVariable(name, `getelementptr [${valueLenght} x i8], [${valueLenght} x i8]* @.str-${name}, i64 0, i64 0`);

			name = "%" + name;
		} else name = `getelementptr [${valueLenght} x i8], [${valueLenght} x i8]* @.str-${name}, i64 0, i64 0`;

		return new StringType(value, context, name);
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
		return `define ${this.returnType.toString()} @${this.name}(${this.parameters.map(p => p.toString()).join(", ")}) {\n${this.block.map(p => p.toString()).join("\n")}\n}`;
	}
}

/**
 * A basic LLVM function declaration.
 */
export class LLVMFunctionDelcaration implements LLVMPart {
	constructor(public name: string, public returnType: LLVMType, public parameters: LLVMType[]) { }

	/**
	 * @see {LLVMPart.toString}
	 * @returns {string}
	 */
	toString(): string {
		return `declare ${this.returnType.toString()} @${this.name}(${this.parameters.map(p => p.toString()).join(", ")})`;
	}
}

export class LLVMVariableDeclaration implements LLVMPart {
	constructor(public name: string, public value: string) { }

	/**
	 * @see {LLVMPart.toString}
	 * @returns {string}
	 */
	toString(): string {
		return `%${this.name} = ${this.value}`;
	}
}

export class LLVMGlobalVariableDeclaration implements LLVMPart {
	constructor(public type: LLVMType, public name: string, public value: string) { }

	/**
	 * @see {LLVMPart.toString}
	 * @returns {string}
	 */
	toString(): string {
		return `@${this.name} = ${this.value}`;
	}
}

/**
 * A basic LLVM function call
 */
export class LLVMFunctionCall implements LLVMPart {
	constructor(public name: string, public parameters: LLVMPart[], public func: LLVMFunction | LLVMFunctionDelcaration) { }

	/**
	 * @see {LLVMPart.toString}
	 * @returns {string}
	 */
	toString(): string {
		if (this.func instanceof LLVMFunction)
			return `call ${this.func.returnType.toString()} @${this.name}(${this.parameters.map(p => p.toString()).join(", ")})`;

		return `call ${this.func.returnType.toString()} @${this.name}(${this.parameters.map((p, index) => this.func.parameters[index].toString() + p.toString()).join(", ")})`;
	}
}

/**
 * A basic LLVM function return.
 */
export class LLVMReturn implements LLVMPart {
	constructor(public value: string, public lFunction: LLVMFunction) { }

	/**
	 * @see {LLVMPart.toString}
	 * @returns {string}
	 */
	toString(): string {
		return `ret ${this.lFunction.returnType.toString()} ${this.value}`;
	}
}

/**
 * Basic LLVM API for typescript
 */
export class LLVM {

	/**
	 * The current function.
	 */
	private currentFunction: unknown = null;

	/**
	 * All globals.
	 */
	globals: LLVMGlobalVariableDeclaration[] = [];

	/**
	 * All function declarations.
	 */
	declarations: LLVMFunctionDelcaration[] = [];

	/**
	 * All functions that we could theoretically call.
	 */
	validFunctions: LLVMFunction[] = [];

	/**
	 * Adding a new function.
	 */
	defineFunction(name: string, type: LLVMType = VoidType.get(), block: LLVMPart[] = [], parameters: LLVMFunctionParameter[] = []): void {
		const newFunction = new LLVMFunction(name, type, parameters, block);

		this.validFunctions.push(newFunction);
		this.currentFunction = newFunction;
	}

	/**
	 * Declaring a new function without a block.
	 */
	declareFunction(name: string, returnType: LLVMType, parameters: LLVMType[]): void {
		this.declarations.push(new LLVMFunctionDelcaration(name, returnType, parameters));
	}

	/**
	 * Declaring a new global variable.
	 * @param name The name of the gloabl variable
	 * @param type The type of this variable
	 * @param value The value of this variable
	 */
	globalVariable(name: string, type: LLVMType, value: string): void {
		this.globals.push(new LLVMGlobalVariableDeclaration(type, name, value));
	}

	/**
	 * Defining a local variable.
	 * @param name The name of the variable.
	 * @param type The type of the variable.
	 * @todo convert value to an interface.
	 */
	defineLocalVariable(name: string, value: string): void {
		if (this.currentFunction === null || !(this.currentFunction instanceof LLVMFunction))
			throw new Error("Cannot define a local variable outside of a function.");

		this.currentFunction.block.push(new LLVMVariableDeclaration(name, value));
	}

	/**
	 * Calling a function.
	 * @param name The name of the function we want to call.
	 * @param parameters The parameters of the function we want to call.
	 */
	functionCall(name: string, parameters: LLVMPart[], func: LLVMFunction | LLVMFunctionDelcaration): void {
		if (this.currentFunction === null || !(this.currentFunction instanceof LLVMFunction))
			throw new Error("Cannot call a function outside of a function.");

		this.currentFunction.block.push(new LLVMFunctionCall(name, parameters, func));
	}

	/**
	 * Returning from a function.
	 * @param value The value we want to return.
	 */
	functionReturn(value: string): void {
		if (this.currentFunction === null || !(this.currentFunction instanceof LLVMFunction))
			throw new Error("Cannot return a value outside of a function.");

		this.currentFunction.block.push(new LLVMReturn(value, this.currentFunction));
		this.currentFunction = null;
	}

	/**
	 * Changing the current function.
	 * @param functionName the name of the function we want.
	 */
	setFunction(functionName: string): void {
		this.currentFunction = this.validFunctions.find(p => p.name === functionName);

		if (this.currentFunction === undefined)
			throw new Error(`Function ${functionName} does not exist.`);
	}

	/**
	 * Generating a random temp variable name.
	 */
	getRandomName(): string {
		return `tmp${this.globals.length + this.validFunctions.length}`;
	}

	/**
	 * Returning the code.
	 */
	toString(): string {
		return this.globals.map(p => p.toString()).join("\n") + "\n\n"
			+ this.declarations.map(p => p.toString()).join("\n") + "\n\n"
			+ this.validFunctions.map(p => p.toString()).join("\n") + "\n\n";
	}
}