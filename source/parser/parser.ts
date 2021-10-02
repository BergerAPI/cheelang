/* eslint-disable @typescript-eslint/no-explicit-any */
import { exit } from "process";
import { logger } from "..";
import { Lexer, Token } from "../lexer";
import { AstNode, BooleanLiteralNode, ExpressionNode, NumberLiteralNode, StringLiteralNode, UnaryNode } from "./ast";

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
			logger.error(`Expceted ${tokenType} but we got ${this.token.type}.`);
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

		if (tokenValue == "+" || tokenValue == "-" || tokenValue == "!") {
			this.expect(tokenName);
			return new UnaryNode(this.factor(), tokenValue);
		} else if (tokenName == "INTEGER_LITERAL" || tokenName == "FLOAT_LITERAL") {
			this.expect(tokenName);
			return new NumberLiteralNode(parseFloat(tokenValue));
		} else if (tokenName == "STRING_LITERAL") {
			this.expect(tokenName);
			return new StringLiteralNode(tokenValue);
		} else if (tokenName == "BOOLEAN_LITERAL") {
			this.expect(tokenName);
			return new BooleanLiteralNode(tokenValue == "true");
		} else if (tokenName == "LEFT_PARENTHESIS") {
			this.expect("LEFT_PARENTHESIS");
			const result = this.expression(false);
			this.expect("RIGHT_PARENTHESIS");
			return result;
		}

		return undefined;
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
	 * Parsing an expression.
	 */
	private expression(alone: boolean): AstNode {
		const token = this.token;

		if (!token)
			throw Error("Token = undefined?");

		// This expression has something to do with cring math or not
		let expr = this.term();

		// Lowest pritority
		while (this.token != undefined && ["+", "-", ">", "<", "<=", ">=", "==", "!="].includes(this.token.raw)) {
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

		if ((alone && !this.token) || (alone && this.token.raw != "."))
			logger.warn("Expression stands alone without a statement. Line: " + (this.token ? this.token.line.toString() : this.lexer.line.toString()));

		return expr;
	}

	/**
	 * Parsing a statement.
	 * @returns {AstNode}
	 */
	private decidePart() {
		let node = undefined;

		switch (this.token.type) {
			case "ARITHMETIC_OPERATOR":
			case "FLOAT_LITERAL":
			case "STRING_LITERAL":
			case "INTEGER_LITERAL":
			case "LEFT_PARENTHESIS":
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
	parse(): unknown {
		const block = [];

		while (this.token) {
			const node = this.decidePart();

			if (node)
				block.push(node);
			else {
				logger.error(`Unknown token ${this.token.raw}`);
				exit(1);
			}
		}

		return {
			name: "Program",
			block: block
		};
	}

}