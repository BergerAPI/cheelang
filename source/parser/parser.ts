import { exit } from "process";
import { logger } from "..";
import { Lexer, Token } from "../lexer";

/**
 * Syntax checking and preparing the Abstract Syntax Tree (AST) for the
 * Code-Generator.
 */
export class Parser {

	/**
	 * The current token
	 */
	token: Token;

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

}