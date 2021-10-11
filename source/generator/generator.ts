import { AstTree } from "../parser/ast";
import { LLVM, LLVMFunction, VoidType } from "./llvm";

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
		this.llvm.defineFunction("main", []);

		return this.llvm.toString();
	}

}