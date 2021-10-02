import { exit } from "process";
import { logger } from ".";

// Every token with the correct regex
export class TokenType {
	static STRING_LITERAL = /^"([^"]*)"/;
	static FLOAT_LITERAL = /^([0-9]+\.[0-9]+)/;
	static INTEGER_LITERAL = /^([0-9]+)/;
	static BOOLEAN_LITERAL = /^(true|false)/
	static COMMA = /^(,)/;
	static COMMENT = /^(\/\/)/;
	static DOT = /^(\.)/;
	static ARITHMETIC_OPERATOR = /^([+-/*])/;
	static RELATIONAL_OPERATOR = /^(&&|\|\||<=|>=|<|>|==|!=)/;
	static WHITESPACE = /^(\s+)/;
	static LEFT_PARENTHESIS = /^(\()/;
	static RIGHT_PARENTHESIS = /^(\))/;
	static LEFT_BRACE = /^(\{)/;
	static RIGHT_BRACE = /^(\})/;
	static LEFT_BRACKET = /^(\[)/;
	static RIGHT_BRACKET = /^(\])/;
	static EQUALS = /^(=)/;
	static EXCLAMATION_MARK = /^(!)/;
	static KEYWORD = /^(let|const|if|else|while|break|return)/;
	static IDENTIFIER = /^([a-zA-Z0-9_]+)/;
}

// A basic token, that the lexer gonna put into his array
export class Token {

	// On which line we can find this token
	// (This is important for the pre-error-
	// finding and showing them the found errors)
	line: number;

	// On which position on the already specified line
	// we can find this token
	from: number;
	to: number;

	// When we found a matching token
	// we have a raw value. For example, if we have
	// a string, this would be be '"test string123"'
	raw: string;

	// To identify this token.
	type: string;

	constructor(line: number, from: number, to: number, raw: string, type: string) {
		this.line = line;
		this.from = from;
		this.to = to;
		this.raw = raw;
		this.type = type;
	}
}

// Basic Lexer (Putting everything into a array of tokens)
export class Lexer {

	// On which line the lexer currently is.
	line = 0;

	// On which position the lexer currently is.
	position = 0;

	// The content of the file we are currently parsing.
	content: string[];
	rawContent: string[];

	constructor(content: string[]) {
		this.content = content.join("\n").split("\n").map(item => item.trim());
		this.rawContent = [...this.content];
	}

	/**
	 * Getting the next token (this method increases the position.)
	 */
	next(peek = false): Token {
		const line = this.content[this.line];

		if (line == undefined) {
			logger.error("Somehow, the line is undefined.");
			exit(1);
		}

		// We need the nearest match here.
		if (line.replace(" ", "").length != 0)
			for (const key of Object.keys(TokenType)) {
				const regex = TokenType[key as keyof typeof TokenType];
				const match = line.match(regex as RegExp);

				if (!match)
					continue;

				if (!peek || key == "WHITESPACE") this.content[this.line] = line.substring(match[0].length);

				if (key == "WHITESPACE")
					return this.next(peek);

				if (key == "COMMENT") {
					this.line++;
					return this.next(peek);
				}

				return new Token(
					this.line, this.rawContent[this.line].length - this.content[this.line].length,
					(this.rawContent[this.line].length - this.content[this.line].length) + match[0].length, match[0], key);

			}
		else {
			this.line++;

			return this.next(peek);
		}

		logger.error("This shouldn't happen, but it did.");
		exit(1);
	}

	/**
	 * Returns the raw string of the current line
	 * (@link line is just the index)
	 */
	currentLine(): string {
		return this.content[this.line];
	}

}