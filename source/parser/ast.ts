
/**
 * A basic Ast.
 */
export class AstTree {
	constructor(public type: string, public children: AstNode[]) { }
}

/**
 * A simple part in the ast node.
 */
export interface AstNode {
	type: string;
}

/**
 * Some cool expression (e.g. `a + b`)
 */
export class ExpressionNode implements AstNode {
	type = "ExpressionNode";

	constructor(public left: AstNode, public right: AstNode, public operator: string) {
	}
}

/**
 * Negative numbers (e.g. `-1`)
 */
export class UnaryNode implements AstNode {
	type = "UnaryNode";

	constructor(public operand: AstNode, public operator: string) {
	}
}

/**
 * A basic string.
 */
export class StringLiteralNode implements AstNode {
	type = "StringLiteralNode";

	constructor(public value: string) {
	}
}

/**
 * A basic number. (e.g. 1 or 1.1)
 */
export class NumberLiteralNode implements AstNode {
	type = "NumberLiteralNode";

	constructor(public value: number) {
	}
}

/**
 * A basic boolean.
 */
export class BooleanLiteralNode implements AstNode {
	type = "BooleanLiteralNode";

	constructor(public value: boolean) {
	}
}

/**
 * Referencing a variable.
 */
export class VariableNode implements AstNode {
	type = "VariableNode";

	constructor(public name: string) {
	}
}

/**
 * Creating a variable or setting the value of an already existing variable.
 */
export class SetVariableNode implements AstNode {
	type = "SetVariableNode";

	constructor(public name: string, public value: AstNode) {
	}
}

/**
 * Calling a function.
 */
export class CallNode implements AstNode {
	type = "CallNode";

	constructor(public name: string, public args: AstNode[]) {
	}
}