
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
 * An array.
 */
export class DataTypeArray implements AstNode {
	type = "array"

	constructor(public dataType: string, public requireSize: boolean, public size: number = 64) { }
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
 * A basic number. (e.g. 1)
 */
export class IntegerLiteralNode implements AstNode {
	type = "IntegerLiteralNode";

	constructor(public value: number) {
	}
}

/**
 * A basic number. (e.g. 1)
 */
export class FloatLiteralNode implements AstNode {
	type = "FloatLiteralNode";

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
 * Setting the value of an already existing variable.
 */
export class SetVariableNode implements AstNode {
	type = "SetVariableNode";

	constructor(public name: string, public value: AstNode) {
	}
}

/**
 * Creating a new variable.
 */
export class DefineVariableNode implements AstNode {
	type = "DefineVariableNode";

	constructor(public name: string, public dataType: string | DataTypeArray, public value: AstNode | undefined) {
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

/**
 * If something is true, then do this, otherwise do that.
 */
export class IfNode implements AstNode {
	type = "IfNode";

	constructor(public condition: AstNode, public scope: AstNode[], public elseScope: AstNode[]) {
	}
}

/**
 * If something is true, then do this, otherwise do that.
 */
export class WhileNode implements AstNode {
	type = "WhileNode";

	constructor(public condition: AstNode, public scope: AstNode[]) {
	}
}

/**
 * A basic for-loop.
 */
export class ForNode implements AstNode {
	type = "ForNode";

	constructor(public variable: string, public start: AstNode, public condition: AstNode, public step: AstNode, public scope: AstNode[]) {
	}
}

/**
 * A function parameter.
 */
export class ParameterNode implements AstNode {
	type = "ParameterNode";

	constructor(public name: string, public paramType: string) {
	}
}

/**
 * A function definition.
 */
export class FunctionNode implements AstNode {
	type = "FunctionNode";

	constructor(public name: string, public args: ParameterNode[], public scope: AstNode[], public returnType: string, public isVarArg: boolean, public isExternal: boolean) {
	}
}

/**
 * Returning from a function
 */
export class ReturnNode implements AstNode {
	type = "ReturnNode";

	constructor(public value: AstNode | undefined) {
	}
}