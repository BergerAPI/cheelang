import { DeclareInstruction, DefineInstruction, FunctionParameter, GlobalInstruction, LLVMType, ReturnInstruction, VariableAttributes } from "./instructions";

/**
 * Basic LLVM API for typescript
 */
export class LLVM {

	/**
	 * The current function.
	 */
	private currentFunction: DefineInstruction | undefined = undefined;

	/**
	 * All globals.
	 */
	globals: GlobalInstruction[] = [];

	/**
	 * All function declarations.
	 */
	declarations: DeclareInstruction[] = [];

	/**
	 * All functions that we could theoretically call.
	 */
	validFunctions: DefineInstruction[] = [];

	/**
	 * Generating a new Function
	 */
	defineFunction(name: string, type: LLVMType, parameters: FunctionParameter[] = []): void {
		this.validFunctions.push(new DefineInstruction(name, [], type, [], parameters));
		this.setFunction(name);
	}

	/**
	 * Returning from a function.
	 * @param value the value to return.
	 */
	return(value: string): void {
		if (!this.currentFunction)
			throw new Error("Can't return outside a function.");

		this.currentFunction.scope.push(new ReturnInstruction(value, this.currentFunction));
	}


	global(name: string, type: LLVMType, value: string, attributes: VariableAttributes[] = []): void {
		this.globals.push(new GlobalInstruction(name, type, value, attributes));
	}

	/**
	 * Generating a new Function
	 */
	declareFunction(name: string, type: LLVMType, parameters: FunctionParameter[] = []): void {
		this.declarations.push(new DeclareInstruction(name, type, [], parameters));
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
		if (!this.currentFunction)
			throw new Error("Can't generate a random name outside a function.");

		return `tmp${this.currentFunction.scope.length}`;
	}

	/**
	 * Returning the code.
	 */
	toString(): string {
		return this.globals.map(p => p.generate()).join("\n")
			+ (this.globals.length != 0 ? "\n\n" : "")
			+ this.declarations.map(p => p.generate()).join("\n") + "\n\n"
			+ this.validFunctions.map(p => p.generate()).join("\n");
	}
}