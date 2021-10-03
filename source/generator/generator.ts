import { AstTree } from "../parser/ast";
import { Parser } from "../parser/parser";

/**
 * Generating the asm code.
 */
export class Generator {

	constructor(public parser: AstTree) {

	}

	/**
	 * Generating the code.
	 */
	public generate(path: string) {
		console.log("s");
	}

}