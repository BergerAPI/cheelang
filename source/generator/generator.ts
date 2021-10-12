import { AstNode, AstTree, CallNode, StringLiteralNode } from "../parser/ast";
import { IntegerType, LLVM, LLVMType, StringType } from "./llvm";

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
	 * Generate a type.
	 */
	generateType(node: AstNode): LLVMType {
		let result = undefined;

		switch (node.type) {
			case "StringLiteralNode": {
				const child = node as StringLiteralNode;

				result = StringType.get(child.value.substring(1, child.value.length - 1), this.llvm);
			}
		}

		if (!result)
			throw new Error("Unknown type: " + node.type);

		return result;
	}

	/**
	 * Converting a node.
	 * @param node the node we want to convert.
	 */
	generateExpression(node: AstNode): void {
		switch (node.type) {
			case "CallNode": {
				const child = node as CallNode;
				const validFunction = this.llvm.validFunctions.find(f => f.name === child.name) ?? this.llvm.declarations.find(f => f.name === child.name);

				if (!validFunction)
					throw new Error("Unknown function: " + child.name);

				this.llvm.functionCall(child.name, child.args.map(arg => this.generateType(arg)), validFunction.returnType);
			}
		}
	}

	/**
	 * Here we put all parts into a string.
	 */
	generate(): string {

		// Default function
		this.llvm.declareFunction("printf", IntegerType.get("32"), [IntegerType.get("8", true)]);

		/* TODO: Replace this code with a function definition the code */ this.llvm.defineFunction("main", IntegerType.get("32"));

		// Generate code
		this.tree.children.forEach(child => this.generateExpression(child));

		/* TODO: Replace this code with a function definition the code */ this.llvm.functionReturn("0");

		return this.llvm.toString();
	}

}