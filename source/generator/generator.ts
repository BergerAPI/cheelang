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
	 * Here we put all parts into a string.
	 */
	generate(): string {

		// First we generate the global variables
		this.llvm.global(".str", LLVMType.array(LLVMType.integer(8), 6), "c\"Naruto\"", [VariableAttributes.CONSTANT]);

		this.llvm.declareFunction("printf", LLVMType.integer(32), [new FunctionParameter(LLVMType.integer(8))]);
		this.llvm.defineFunction("main", LLVMType.integer(32));

		this.llvm.return("0");

		// Generate code
		//this.tree.children.forEach(child => this.generateExpression(child));

		return this.llvm.toString();
	}

}