/* eslint-disable @typescript-eslint/no-explicit-any */
import { AstTree } from "../parser/ast";
import { FunctionParameter, LLVMType, VariableAttributes } from "./instructions";
import { LLVM } from "./llvm";

/**
 * Thats the part where we compile to llvm code.
 */
export class Generator {

	/**
	 * For using llvm
	 */
	private llvm: LLVM = new LLVM();

	constructor(public tree: AstTree) { }

	/**
	 * Generating a constant for the char array (the string)
	 * @param value the value of the string
	 */
	constantString(value: string, name = ""): string {
		const nName = name == "" ? (".str" + this.llvm.currentFunction?.scope.length) : name;

		this.llvm.global(nName, LLVMType.array(LLVMType.integer(8), value.length), `c"${value}"`, [VariableAttributes.PRIVATE, VariableAttributes.UNNAMED_ADDRESS, VariableAttributes.CONSTANT]);

		return nName;
	}

	/**
	 * Here we put all parts into a string.
	 */
	generate(): string {
		this.llvm.declareFunction("printf", LLVMType.integer(32), [new FunctionParameter(LLVMType.integer(8))]);
		this.llvm.defineFunction("main", LLVMType.void());

		this.llvm.return();

		// Generate code
		//this.tree.children.forEach(child => this.generateExpression(child));

		return this.llvm.toString();
	}

}