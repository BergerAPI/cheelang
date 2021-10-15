/* eslint-disable @typescript-eslint/no-explicit-any */
import { AstNode, AstTree, CallNode, ExpressionNode, IfNode, IntegerLiteralNode, SetVariableNode, StringLiteralNode, VariableNode } from "../parser/ast";
import * as llvm from "llvm-node";

/**
 * A simple variable.
 */
export class Variable {
	constructor(public name: string, public value: llvm.Value, public type: llvm.Type) {
	}
}

/**
 * Thats the part where we compile to llvm code.
 */
export class Generator {

	/**
	 * For using llvm
	 */
	private context = new llvm.LLVMContext();
	private module = new llvm.Module("cheelang", this.context);

	/**
	 * Current thingy.
	 */
	private builder!: llvm.IRBuilder;

	/**
	 * All variables in the current context.
	 */
	private variables: Variable[] = [];

	/**
	 * Current function.
	 */
	private currentFunction!: llvm.Function;

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

				return builder.createGlobalStringPtr(node.value.substring(1, node.value.length - 1).replaceAll("\\n", "\\0A"));
			}
			case "IntegerLiteralNode": {
				const node = child as IntegerLiteralNode;

				return llvm.ConstantInt.get(this.context, node.value);
			}
			case "VariableNode": {
				const node = child as VariableNode;
				const variable = this.variables.find(v => v.name === node.name);

				if (!variable)
					throw new Error(`Variable ${node.name} doesn't exist.`);

				return builder.createLoad(variable.value);
			}
			case "ExpressionNode": {
				const node = child as ExpressionNode;

				if (["+", "-", "*", "/", ">", "<", "==", "!="].includes(node.operator)) {
					const left = this.generateType(node.left, builder);
					const right = this.generateType(node.right, builder);

					switch (node.operator) {
						case "+": return builder.createAdd(left, right, "addtmp");
						case "-": return builder.createSub(left, right, "subtmp");
						case "*": return builder.createMul(left, right, "multmp");
						case "/": return builder.createSDiv(left, right, "divtmp");
						case ">": return builder.createICmpSGT(left, right, "gt");
						case "<": return builder.createICmpSLT(left, right, "lt");
						case "==": return builder.createICmpEQ(left, right, "eq");
						case "!=": return builder.createICmpNE(left, right, "ne");
					}
				} else throw new Error(`Operator ${node.operator} doesn't exist.`);
			}
		}

		throw new Error(`Unknown Type. (${child.type})`);
	}

	/**
	 * Generating an expression.
	 * 
	 * @param child The node from the AST
	 */
	generateExpression(child: AstNode): void {
		switch (child.type) {
			case "CallNode": {
				const node = child as CallNode;
				const callee = this.module.getFunction(node.name);

				if (!callee)
					throw new Error(`Function ${node.name} doesn't exist.`);

				const args = node.args.map(p => this.generateType(p, this.builder));

				this.builder.createCall(callee, args);
			} break;
			case "SetVariableNode": {
				const node = child as SetVariableNode;
				const value = this.generateType(node.value, this.builder);
				const pointer = this.builder.createAlloca(value.type, undefined, node.name);

				const variable = this.variables.find(v => v.name === node.name);

				// Store the value or overwrite it
				if (!variable)
					this.variables.push(new Variable(pointer.name, pointer, value.type));
				else
					variable.value = pointer;

				this.builder.createStore(value, pointer);
			} break;
			case "IfNode": {
				const node = child as IfNode;

				const condition = this.generateType(node.condition, this.builder);

				const scopeBlock = llvm.BasicBlock.create(this.context, "if_scope", this.currentFunction);
				const elseBlock = llvm.BasicBlock.create(this.context, "if_else", this.currentFunction);
				const endBlock = llvm.BasicBlock.create(this.context, "end_scope", this.currentFunction);

				this.builder.createCondBr(condition, scopeBlock, elseBlock);
				this.builder.setInsertionPoint(scopeBlock);

				node.scope.forEach(p => this.generateExpression(p));

				this.builder.createBr(endBlock);

				this.builder.setInsertionPoint(elseBlock);
				this.builder.createBr(endBlock);

				this.builder.setInsertionPoint(endBlock);
			} break;
		}
	}

	/**
	 * Here we put all parts into a string.
	 */
	generate(): string {
		// Default Print Function // TODO: Remove this
		this.module.getOrInsertFunction("printf", llvm.FunctionType.get(llvm.Type.getInt32Ty(this.context), [llvm.Type.getInt8PtrTy(this.context)], true));
		this.module.getOrInsertFunction("main", llvm.FunctionType.get(llvm.Type.getInt32Ty(this.context), [], false));

		// Generate the code
		const main = this.module.getFunction("main");

		if (!main)
			throw new Error("Main function doesn't exist.");

		const entry = llvm.BasicBlock.create(this.context, "entry", main);
		this.builder = new llvm.IRBuilder(entry);
		this.currentFunction = main;

		this.tree.children.forEach(child => this.generateExpression(child));

		this.builder.createRet(llvm.ConstantInt.get(this.context, 0));

		return this.module.print();
	}

}