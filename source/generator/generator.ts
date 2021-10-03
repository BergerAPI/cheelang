import { AstTree } from "../parser/ast";
import { Assmebly } from "./assembly";

/**
 * Generating the asm code.
 */
export class Generator {

	/**
	 * Assmebly syntax.
	 */
	assembly: Assmebly = new Assmebly("_main");

	constructor(public tree: AstTree) {
	}

	/**
	 * Generating the code.
	 */
	public generate(path: string) {
		this.assembly.setLabel("_main");
		this.assembly.instruction("mov", "eax", "0", "Doing something.");

		console.log(this.assembly.build());
	}

}