/* eslint-disable @typescript-eslint/no-explicit-any */
import { AstNode, AstTree, BooleanLiteralNode, CallNode, DataTypeArray, DefineVariableNode, ExpressionNode, FloatLiteralNode, ForNode, FunctionNode, IfNode, IntegerLiteralNode, ReturnNode, SetVariableNode, StringLiteralNode, VariableNode, WhileNode } from "../parser/ast";
import * as llvm from "llvm-node";
import { logger } from "..";
import { exit } from "process";

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
	private currentFunction!: llvm.Function | undefined;

	constructor(public tree: AstTree) { }

	/**
	 * Generating an llvm type only by the data type name (e.g. string/int)
	 */
	generateTypeByName(name: string | DataTypeArray): llvm.Type {
		if (name instanceof DataTypeArray) {
			const type = llvm.Type.getInt32Ty(this.context);

			return llvm.ArrayType.get(type, name.size);
		}

		switch (name) {
			case "string": return llvm.Type.getInt8PtrTy(this.context);
			case "boolean": return llvm.Type.getInt1Ty(this.context);
			case "void": return llvm.Type.getVoidTy(this.context);
			case "float": return llvm.Type.getFloatTy(this.context);
			case "double": return llvm.Type.getDoubleTy(this.context);
			case "int": return llvm.Type.getInt32Ty(this.context);
			case "char": return llvm.Type.getInt8Ty(this.context);
		}

		throw new Error(`Unknown Type. (${name})`);
	}

	/**
	 * Generating an llvm type.
	 * 
	 * @param child The node from the AST
	 */
	generateValue(child: AstNode, builder: llvm.IRBuilder): llvm.Value {
		switch (child.type) {
			case "StringLiteralNode": {
				const node = child as StringLiteralNode;

				return builder.createGlobalStringPtr(node.value.substring(1, node.value.length - 1), "str.");
			}
			case "IntegerLiteralNode": {
				const node = child as IntegerLiteralNode;

				return llvm.ConstantInt.get(this.context, node.value);
			}
			case "FloatLiteralNode": {
				const node = child as FloatLiteralNode;

				return llvm.ConstantFP.get(this.context, node.value);
			}
			case "BooleanLiteralNode": {
				const node = child as BooleanLiteralNode;

				return llvm.ConstantInt.get(this.context, node.value ? 1 : 0, 1);
			}
			case "VariableNode": {
				const node = child as VariableNode;
				const variable = this.variables.find(v => v.name === node.name);

				if (!variable)
					throw new Error(`Variable ${node.name} doesn't exist.`);

				return builder.createLoad(variable.value, node.name);
			}
			case "ExpressionNode": {
				const node = child as ExpressionNode;
				const left = this.generateValue(node.left, builder);
				const right = this.generateValue(node.right, builder);

				switch (node.operator) {
					case "+": return builder.createAdd(left, right, "addtmp");
					case "-": return builder.createSub(left, right, "subtmp");
					case "*": return builder.createMul(left, right, "multmp");
					case "/": return builder.createSDiv(left, right, "divtmp");
					case "%": return builder.createSRem(left, right, "modtmp");
					case ">": return builder.createICmpSGT(left, right, "gt");
					case "<": return builder.createICmpSLT(left, right, "lt");
					case "==": return builder.createICmpEQ(left, right, "eq");
					case "!=": return builder.createICmpNE(left, right, "ne");
					case ">=": return builder.createICmpSGE(left, right, "ge");
					case "<=": return builder.createICmpSLE(left, right, "le");
					case "&&": return builder.createAnd(left, right, "andtmp");
					case "||": return builder.createOr(left, right, "ortmp");
				}

				throw new Error(`Operator ${node.operator} doesn't exist.`);
			}
			case "CallNode": {
				const node = child as CallNode;

				const callee = this.module.getFunction(node.name);

				if (!callee)
					throw new Error(`Function ${node.name} doesn't exist.`);

				return this.builder.createCall(callee, node.args.map(a => this.generateValue(a, builder)), "calltmp");
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

				if (!this.currentFunction || !this.builder)
					throw new Error("Can't call a function outside of an function.");

				const callee = this.module.getFunction(node.name);

				if (!callee)
					throw new Error(`Function ${node.name} doesn't exist.`);

				const args = node.args.map(p => this.generateValue(p, this.builder));

				this.builder.createCall(callee, args, node.name);
			} break;
			case "SetVariableNode": {
				const node = child as SetVariableNode;

				if (!this.currentFunction || !this.builder)
					throw new Error("Can't set an variable outside of a function.");

				const value = this.generateValue(node.value, this.builder);
				const variable = this.variables.find(v => v.name === node.name);

				if (!variable) throw new Error(`Variable ${node.name} doesn't exist.`);

				this.builder.createStore(value, variable.value);
			} break;
			case "DefineVariableNode": {
				const node = child as DefineVariableNode;

				if (!this.currentFunction || !this.builder)
					throw new Error("Can't set an variable outside of a function.");

				if (node.value == undefined && node.type == "") {
					logger.error("If you define a variable without a value, you need to provide a type.");
					exit(1);
				}

				if (node.value == undefined) {
					const type = this.generateTypeByName(node.dataType);
					const pointer = this.builder.createAlloca(type, undefined, node.name);

					this.variables.push(new Variable(pointer.name, pointer, type));
				} else {
					const value = this.generateValue(node.value, this.builder);
					let type: llvm.Type;

					if (node.dataType !== "")
						type = this.generateTypeByName(node.dataType);
					else
						type = value.type;

					const pointer = this.builder.createAlloca(type, undefined, node.name);

					this.variables.push(new Variable(pointer.name, pointer, type));
					this.builder.createStore(value, pointer);
				}
			} break;
			case "IfNode": {
				const node = child as IfNode;

				if (!this.currentFunction || !this.builder)
					throw new Error("IfNode can only be used inside a function.");

				const condition = this.generateValue(node.condition, this.builder);

				const scopeBlock = llvm.BasicBlock.create(this.context, "if_scope", this.currentFunction);
				const elseBlock = llvm.BasicBlock.create(this.context, "if_else", this.currentFunction);
				const endBlock = llvm.BasicBlock.create(this.context, "end_scope", this.currentFunction);

				this.builder.createCondBr(condition, scopeBlock, elseBlock);
				this.builder.setInsertionPoint(scopeBlock);

				// Saving the scope
				const currentScope = [...this.variables];

				node.scope.forEach(p => this.generateExpression(p));

				// Restoring the scope
				this.variables = currentScope;

				this.builder.createBr(endBlock);
				this.builder.setInsertionPoint(elseBlock);

				node.elseScope.forEach(p => this.generateExpression(p));

				// Restoring the scope
				this.variables = currentScope;

				this.builder.createBr(endBlock);
				this.builder.setInsertionPoint(endBlock);
			} break;
			case "WhileNode": {
				const node = child as WhileNode;

				if (!this.currentFunction || !this.builder)
					throw new Error("Cannot generate while loop outside of a function.");

				const conditionBlock = llvm.BasicBlock.create(this.context, "while_condition", this.currentFunction);
				const scopeBlock = llvm.BasicBlock.create(this.context, "while_scope", this.currentFunction);
				const endBlock = llvm.BasicBlock.create(this.context, "end_scope", this.currentFunction);

				this.builder.createBr(conditionBlock);

				// Checking if the condition is true
				this.builder.setInsertionPoint(conditionBlock);
				this.builder.createCondBr(this.generateValue(node.condition, this.builder), scopeBlock, endBlock);
				this.builder.setInsertionPoint(scopeBlock);

				// Saving the scope
				const currentScope = [...this.variables];

				node.scope.forEach(p => this.generateExpression(p));

				// Restoring the scope
				this.variables = currentScope;

				this.builder.createBr(conditionBlock);
				this.builder.setInsertionPoint(endBlock);
			} break;
			case "ForNode": {
				const node = child as ForNode;

				if (!this.currentFunction || !this.builder)
					throw new Error("Cannot define a for-loop outside of a function.");

				const conditionBlock = llvm.BasicBlock.create(this.context, "for_condition", this.currentFunction);
				const scopeBlock = llvm.BasicBlock.create(this.context, "for_scope", this.currentFunction);
				const endBlock = llvm.BasicBlock.create(this.context, "end_scope", this.currentFunction);

				const value = this.generateValue(node.start, this.builder);
				const pointer = this.builder.createAlloca(value.type, undefined, node.variable);

				this.variables.push(new Variable(node.variable, pointer, value.type));
				this.builder.createStore(value, pointer);

				this.builder.createBr(conditionBlock);

				// Checking if the condition is true
				this.builder.setInsertionPoint(conditionBlock);
				this.builder.createCondBr(this.generateValue(node.condition, this.builder), scopeBlock, endBlock);
				this.builder.setInsertionPoint(scopeBlock);

				// Saving the scope
				const currentScope = [...this.variables];

				node.scope.forEach(p => this.generateExpression(p));

				// Increasing the variable
				this.generateExpression(node.step);

				// Restoring the scope
				this.variables = currentScope;

				this.builder.createBr(conditionBlock);
				this.builder.setInsertionPoint(endBlock);
			} break;
			case "FunctionNode": {
				const node = child as FunctionNode;

				if (this.currentFunction)
					throw new Error("Cannot define a function inside another function.");

				if (node.isExternal) {
					this.module.getOrInsertFunction(node.name, llvm.FunctionType.get(this.generateTypeByName(node.returnType), node.args.map(p => this.generateTypeByName(p.paramType)), node.isVarArg));

					break;
				}

				const type = this.generateTypeByName(node.returnType);
				const functionType = llvm.FunctionType.get(type, node.args.map(p => this.generateTypeByName(p.paramType)), false);
				const createdFunction = llvm.Function.create(functionType, llvm.LinkageTypes.ExternalLinkage, node.name, this.module);

				this.currentFunction = createdFunction;

				const entryBlock = llvm.BasicBlock.create(this.context, "entry", this.currentFunction);

				if (!this.builder)
					this.builder = new llvm.IRBuilder(entryBlock);

				// Adding the arguments to the variable list
				this.variables = [...node.args.map((p, index) => {
					const type = this.generateTypeByName(p.paramType);
					const alloc = this.builder.createAlloca(type, undefined, p.name);

					const param = this.currentFunction?.getArguments()[index];

					if (!param)
						throw new Error(`Argument ${p.name} doesn't exist.`);

					// Accessing the argument here
					this.builder.createStore(param, alloc);

					return new Variable(p.name, alloc, type);
				})];

				this.builder.setInsertionPoint(entryBlock);

				node.scope.forEach(p => this.generateExpression(p));

				// If the function doesn't return anything, we need to add a return instruction
				const lastExpression = node.scope[node.scope.length - 1];

				if (!lastExpression || (type.isVoidTy() && lastExpression.type != "ReturnNode"))
					this.builder.createRetVoid();
				else if (lastExpression.type != "ReturnNode") {
					logger.error(`Function ${node.name} doesn't return anything.`);
					exit(1);
				}


				// We're outside of an function again
				this.currentFunction = undefined;
			} break;
			case "ReturnNode": {
				const node = child as ReturnNode;

				if (!this.currentFunction || !this.builder)
					throw new Error("Can't return because we're not in a function.");

				if (!node.value) {
					if (!this.currentFunction.type.elementType.returnType.isVoidTy()) {
						logger.error(`Function ${this.currentFunction.name} must return a value, since its not a void.`);
						exit(1);
					}

					this.builder.createRetVoid();

					break;
				}

				const value = this.generateValue(node.value, this.builder);

				this.builder.createRet(value);
			} break;
		}
	}

	/**
	 * Here we put all parts into a string.
	 */
	generate(): string {
		this.tree.children.forEach(child => this.generateExpression(child));

		return this.module.print();
	}

}