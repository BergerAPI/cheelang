/* eslint-disable @typescript-eslint/no-explicit-any */
import { AstNode, AstTree, CallNode, StringLiteralNode } from "../parser/ast";
import * as llvm from "llvm-node";

/**
 * Thats the part where we compile to llvm code.
 */
export class Generator {

	/**
	 * For using llvm
	 */
	private context = new llvm.LLVMContext();
	private module = new llvm.Module("cheelang", this.context);

	constructor(public tree: AstTree) { }

	/**
	 * Generating an llvm type.
	 * 
	 * @param child The node from the AST
	 */
	generateType(child: AstNode, builder: llvm.IRBuilder): llvm.Value {
		switch (child.type) {
			case "StringLiteralNode": {
				const node = child as StringLiteralNode;

				return builder.createGlobalStringPtr(node.value.substring(1, node.value.length - 1));
			}
		}

		throw new Error(`Unknown Type. (${child.type})`);
	}

	/**
	 * Generating an expression.
	 * 
	 * @param child The node from the AST
	 */
	generateExpression(child: AstNode, builder: llvm.IRBuilder): void {
		switch (child.type) {
			case "CallNode": {
				const node = child as CallNode;
				const callee = this.module.getFunction(node.name);

				if (!callee)
					throw new Error(`Function ${node.name} doesn't exist.`);

				const args = node.args.map(p => this.generateType(p, builder));

				builder.createCall(callee, args);

			} break;
		}
	}

	/**
	 * Here we put all parts into a string.
	 */
	generate(): string {
		// Default Print Function // TODO: Remove this
		this.module.getOrInsertFunction("printf", llvm.FunctionType.get(llvm.Type.getInt32Ty(this.context), [llvm.Type.getInt8PtrTy(this.context)], false));
		this.module.getOrInsertFunction("main", llvm.FunctionType.get(llvm.Type.getInt32Ty(this.context), [], false));

		// Generate the code
		const main = this.module.getFunction("main");

		const entry = llvm.BasicBlock.create(this.context, "entry", main);
		const builder = new llvm.IRBuilder(entry);

		this.tree.children.forEach(child => this.generateExpression(child, builder));

		builder.createRet(llvm.ConstantInt.get(this.context, 0));

		return this.module.print();
	}

}