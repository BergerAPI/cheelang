import { AstTree } from "../parser/ast";
import { IntegerType, LLVM, StringType } from "./llvm";

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

		// Default function
		this.llvm.declareFunction("printf", IntegerType.get("32"), [IntegerType.get("8", true)]);

		this.llvm.defineFunction("main", IntegerType.get("32"));
		this.llvm.functionCall("printf", [StringType.get("Hello World!", this.llvm)], IntegerType.get("32"));
		this.llvm.functionReturn("0");

		return this.llvm.toString();
	}

}