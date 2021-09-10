// Every token with the correct regex
export class TokenType {
    static STRING_LITERAL: RegExp = /^"([^"]*)"/;
    static INTEGER_LITERAL: RegExp = /^([0-9]+)/;
    static BOOLEAN_LITERAL: RegExp = /^(true|false)/
    static TRIM: RegExp = /^(,)/;
    static ARITHMETIC_OPERATOR: RegExp = /^([+-/*])/;
    static RELATIONAL_OPERATOR: RegExp = /^(&&|\|\||<=|>=|<|>|==|!=)/;
    static WHITESPACE: RegExp = /^(\s+)/;
    static LEFT_PARENTHESIS: RegExp = /^(\()/;
    static RIGHT_PARENTHESIS: RegExp = /^(\))/;
    static LEFT_BRACE: RegExp = /^(\{)/;
    static RIGHT_BRACE: RegExp = /^(\})/;
    static LEFT_BRACKET: RegExp = /^(\[)/;
    static RIGHT_BRACKET: RegExp = /^(\])/;
    static EQUALS: RegExp = /^(=)/;
    static FUNCTION_DEFINITION: RegExp = /^(fn)/;
    static IF_STATEMENT: RegExp = /^(if)/;
    static ELSE_STATEMENT: RegExp = /^(else)/;
    static WHILE_STATEMENT: RegExp = /^(while)/;
    static BREAK_STATEMENT: RegExp = /^(break)/;
    static RETURN_STATEMENT: RegExp = /^(return)/;
    static VARIABLE_DEFINITION: RegExp = /^(let|const)/;
    static IDENTIFIER: RegExp = /^([a-zA-Z0-9]+)/;
    static COLON: RegExp = /^(\:)/;
    static COMMENT: RegExp = /^(\#)/;
};

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
    line: number = 0;

    // On which position the lexer currently is.
    position: number = 0;

    // The content of the file we are currently parsing.
    content: string[];
    rawContent: string[];

    constructor(content: string) {
        this.content = content.split("\n").map(item => item.trim());
        this.rawContent = [...this.content];
    }

    /**
     * Getting the next token (this method increases the position.)
     */
    next(peek: boolean = false): any {
        let line = this.content[this.line]

        if (line == undefined) return undefined

        // This is a comment. We hate them.
        if (line.trim().startsWith("#")) {
            this.line++;
            return this.next(peek);
        };

        // We need the nearest match here.
        if (line.replace(" ", "").length != 0)
            for (let key of Object.keys(TokenType)) {
                const regex = TokenType[key as keyof typeof TokenType]
                const match = line.match(regex as RegExp)

                if (!match)
                    continue;

                if (!peek || key == "WHITESPACE") this.content[this.line] = line.substring(match[0].length);

                if (key == "WHITESPACE")
                    return this.next(peek)

                return new Token(
                    this.line, this.rawContent[this.line].length - this.content[this.line].length,
                    (this.rawContent[this.line].length - this.content[this.line].length) + match[0].length, match[0], key);

            }
        else {
            this.line++;

            return this.next(peek);
        }

        return undefined
    }

    /**
     * Returns the raw string of the current line
     * (@link line is just the index)
     */
    currentLine() {
        return this.content[this.line]
    }

}