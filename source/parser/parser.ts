/* eslint-disable @typescript-eslint/no-explicit-any */
import { exit } from "process";
import fs from "fs";
import { logger, options } from "..";
import { Lexer, Token } from "../lexer";
import { AstNode, AstTree, BooleanLiteralNode, CallNode, DefineVariableNode, ExpressionNode, FloatLiteralNode, ForNode, FunctionNode, IfNode, IntegerLiteralNode, ParameterNode, ReturnNode, SetVariableNode, StringLiteralNode, UnaryNode, VariableNode, WhileNode } from "./ast";

/**
 * Syntax checking and preparing the Abstract Syntax Tree (AST) for the
 * Code-Generator.
 */
export class Parser {

	/**
	 * The current token
	 */
	token: Token; // We can't use Token here because it could be undefined.

	constructor(public lexer: Lexer) {
		this.token = lexer.next();
	}

	/**
	 * Expecting a certain token.
	 */
	private expect(tokenType: string) {
		if (!this.token)
			return;

		if (this.token.type == tokenType)
			this.token = this.lexer.next();
		else {
			logger.error(`Expceted ${tokenType} but we got ${this.token.type} at line ${this.token.line}.`);
			exit(1);
		}

		return this.token;
	}

	/**
	* Math factor (+, -, int, LParan expr RParan)
	*/
	factor(): any {
		const tokenValue = this.token.raw;
		const tokenName = this.token.type;

		switch (tokenName) {
			case "ARITHMETIC_OPERATOR": {
				this.expect(tokenName);

				if (tokenValue == "+" || tokenValue == "-" || tokenValue == "!")
					return new UnaryNode(this.factor(), tokenValue);

				throw new Error("This isn't a factor lmao");
			}
			case "LEFT_PARENTHESIS": {
				this.expect(tokenName);
				const result = this.expression(false);
				this.expect("RIGHT_PARENTHESIS");
				return result;
			}

			case "INTEGER_LITERAL":
				this.expect(tokenName);
				return new IntegerLiteralNode(parseInt(tokenValue));
			case "FLOAT_LITERAL":
				this.expect(tokenName);
				return new FloatLiteralNode(parseFloat(tokenValue));
			case "STRING_LITERAL":
				this.expect(tokenName);
				return new StringLiteralNode(tokenValue);
			case "BOOLEAN_LITERAL":
				this.expect(tokenName);
				return new BooleanLiteralNode(tokenValue === "true");
		}

		return this.identifier();
	}

	/**
	* Math terms (
	*      factor / term
	*      factor * term
	*      factor - term
	*      factor
	* )
	*/
	private term() {
		let node = this.factor();

		while (this.token != undefined && ["/", "*"].includes(this.token.raw)) {
			const operator = this.token.raw;

			this.expect(this.token.type);

			node = new ExpressionNode(node, this.factor(), operator);
		}

		return node;
	}

	/**
	 * Parsing an identifier that could be a variable or a function for example.
	 */
	private identifier(): AstNode {
		const token = this.token;

		// We know that we have an identifer token.
		this.expect("IDENTIFIER");

		// Probably a function call
		if (this.token.type === "LEFT_PARENTHESIS") {
			this.expect("LEFT_PARENTHESIS");

			const args: AstNode[] = [];

			// Somehow, we have to use raw here, since otherwise typescript cries that this will
			// always return true
			while (this.token.raw !== ")") {
				args.push(this.expression(false));

				// Same thing why we use the raw token here
				if (this.token.raw != ")")
					this.expect("COMMA");
			}

			this.expect("RIGHT_PARENTHESIS");

			return new CallNode(token.raw, args);
		}

		// Probably a variable definition
		if (this.token.type === "EQUALS") {
			this.expect("EQUALS");

			return new SetVariableNode(token.raw, this.expression(false));
		}

		// If its not a function, it must be a variable reference.
		return new VariableNode(token.raw);
	}

	/**
	 * Parsing an expression.
	 */
	private expression(alone: boolean): AstNode {
		const token = this.token;

		if (!token)
			throw Error("Token = undefined?");

		// This expression has something to do with cring math or not
		let expr = this.term();

		// Lowest pritority
		while (this.token != undefined && ["+", "-", ">", "<", "<=", ">=", "==", "!=", "%"].includes(this.token.raw)) {
			const operator = this.token.raw;

			this.expect(this.token.type);

			expr = new ExpressionNode(expr, this.term(), operator);
		}

		// Highest priority
		if (this.token && ["&&", "||"].includes(this.token.raw)) {
			const operator = this.token.raw;

			this.expect("RELATIONAL_OPERATOR");

			return new ExpressionNode(expr, this.expression(false), operator);
		}

		if (((alone && !this.token) || (alone && this.token.raw != ".")) && (expr instanceof ExpressionNode || expr instanceof IntegerLiteralNode || expr instanceof FloatLiteralNode || expr instanceof StringLiteralNode || expr instanceof BooleanLiteralNode))
			logger.warn("Expression stands alone without a statement. Line: " + (this.token ? this.token.line.toString() : this.lexer.line.toString()));

		return expr;
	}

	/**
	 * We have an keyword.
	 */
	private keyword(): AstNode | undefined {
		const tokenValue = this.token.raw;
		const line = this.token.line;

		this.expect("KEYWORD");

		switch (tokenValue) {
			case "if": {
				const condition = this.expression(false);
				const scope = [];
				const elseScope = [];

				this.expect("LEFT_BRACE");

				while (this.token && this.token.type != "RIGHT_BRACE")
					scope.push(this.decidePart());

				this.expect("RIGHT_BRACE");

				if (this.token && this.token.type === "KEYWORD" && this.token.raw === "else") {
					this.expect("KEYWORD");
					this.expect("LEFT_BRACE");

					while (this.token) {
						const token = this.token;

						// I have to do it like this because otherwise typescript complains that this
						// will always return true
						if (token.type === "RIGHT_BRACE")
							break;

						elseScope.push(this.decidePart());
					}

					this.expect("RIGHT_BRACE");
				}

				if (elseScope.length === 0)
					logger.warn("Else scope without scope. Line: " + line.toString());

				if (scope.length == 0) {
					logger.warn("If statement without any scope. Line: " + line.toString());
					return undefined;
				}

				return new IfNode(condition, scope, elseScope);
			}
			case "while": {
				const condition = this.expression(false);
				const scope = [];

				this.expect("LEFT_BRACE");

				while (this.token && this.token.type != "RIGHT_BRACE")
					scope.push(this.decidePart());

				this.expect("RIGHT_BRACE");

				if (scope.length == 0) {
					logger.warn("While statement without any scope. Line: " + line.toString());
					return undefined;
				}

				return new WhileNode(condition, scope);
			}
			case "for": {
				const variableName = this.token.raw;
				const scope = [];

				this.expect("IDENTIFIER");
				this.expect("EQUALS");

				const start = this.expression(false);

				this.expect("SEMICOLON");
				const condition = this.expression(false);
				this.expect("SEMICOLON");
				const step = this.expression(false);

				this.expect("LEFT_BRACE");

				while (this.token && this.token.type != "RIGHT_BRACE")
					scope.push(this.decidePart());

				this.expect("RIGHT_BRACE");

				if (scope.length == 0) {
					logger.warn("For statement without any scope. Line: " + line.toString());
					return undefined;
				}

				return new ForNode(variableName, start, condition, step, scope);
			}
			case "func":
			case "external": {
				const isExternal = tokenValue === "external";

				if (isExternal)
					this.expect("KEYWORD");

				const functionName = this.token.raw;
				let returnType = "void";
				let isVarArg = false;
				const scope = [];
				const args = [];

				this.expect("IDENTIFIER");
				this.expect("LEFT_PARENTHESIS");

				while (this.token && this.token.raw != ")") {

					if (this.token.raw === ".") {
						this.expect("DOT");
						this.expect("DOT");
						this.expect("DOT");

						if (this.token.type !== "RIGHT_PARENTHESIS") {
							logger.error("VarArg must be at the end.");
							exit(1);
						} else {
							isVarArg = true;
							break;
						}
					}

					const name = this.token.raw;
					this.expect("IDENTIFIER");

					this.expect("COLON");

					const type = this.token.raw;
					this.expect("IDENTIFIER");

					args.push(new ParameterNode(name, type));

					if (this.token.raw != ")")
						this.expect("COMMA");
				}

				this.expect("RIGHT_PARENTHESIS");

				if (this.token.raw === ":") {
					this.expect("COLON");
					returnType = this.token.raw;
					this.expect("IDENTIFIER");
				}

				if (!isExternal) {
					this.expect("LEFT_BRACE");

					while (this.token && this.token.type != "RIGHT_BRACE") {
						const token = this.token;

						// I have to do it like this because otherwise typescript complains that this
						// will always return true
						if (token.type === "RIGHT_BRACE")
							break;

						scope.push(this.decidePart());
					}

					this.expect("RIGHT_BRACE");
				}

				return new FunctionNode(functionName, args, scope, returnType, isVarArg, isExternal);
			}
			case "return": {
				let value = undefined;

				if (this.token.type === "ARITHMETIC_OPERATOR" || this.token.type === "FLOAT_LITERAL" || this.token.type === "STRING_LITERAL" || this.token.type === "INTEGER_LITERAL" || this.token.type === "LEFT_PARENTHESIS" || this.token.type === "IDENTIFIER")
					value = this.expression(false);

				return new ReturnNode(value);
			}
			case "var": {
				const name = this.token.raw;
				let type = "";

				this.expect("IDENTIFIER");

				if (this.token.type === "COLON") {
					this.expect("COLON");

					type = this.token.raw;

					this.expect("IDENTIFIER");
				}

				if (this.token.type === "EQUALS") {
					this.expect("EQUALS");

					const value = this.expression(false);

					return new DefineVariableNode(name, type, value);
				}

				// No value variable
				return new DefineVariableNode(name, type, undefined);
			}
		}

		throw new Error("Unknown keyword: " + tokenValue);
	}

	/**
	 * Parsing a statement.
	 * @returns {AstNode}
	 */
	private decidePart(): AstNode {
		let node = undefined;

		switch (this.token.type) {
			case "KEYWORD":
				node = this.keyword();
				break;

			case "ARITHMETIC_OPERATOR":
			case "FLOAT_LITERAL":
			case "STRING_LITERAL":
			case "INTEGER_LITERAL":
			case "LEFT_PARENTHESIS":
			case "IDENTIFIER":
				node = this.expression(true);
				break;
			default:
				this.token = this.lexer.next();
		}

		return node as AstNode;
	}

	/**
	 * Creating the tree.
	 */
	parse(): AstTree {
		const block: AstNode[] = [];

		while (this.token) {
			const node = this.decidePart();

			if (node)
				block.push(node);
		}

		const result = new AstTree("Program", block);

		if (options.tree.value) {
			fs.writeFileSync("./build/tree.json", JSON.stringify(result, null, 4));
		}

		return result;
	}

}