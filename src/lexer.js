import error from "./error.js"

const tokens = {
    "STRING_LITERAL": /^"([^"]*)"/,
    "INTEGER_LITERAL": /^([0-9]+)/,
    "BOOLEAN_LITERAL": /^(true|false)/,
    "TRIM": /^(,)/,
    "ARITHMETIC_OPERATOR": /^([+-/*])/,
    "RELATIONAL_OPERATOR": /^(&&|\|\||<=|>=|<|>|==|!=)/,
    "WHITESPACE": /^(\s+)/,
    "LEFT_PARENTHESIS": /^(\()/,
    "RIGHT_PARENTHESIS": /^(\))/,
    "LEFT_BRACE": /^(\{)/,
    "RIGHT_BRACE": /^(\})/,
    "LEFT_BRACKET": /^(\[)/,
    "RIGHT_BRACKET": /^(\])/,
    "EQUALS": /^(=)/,
    "FUNCTION_DEFINITION": /^(fn)/,
    "IF_STATEMENT": /^(if)/,
    "ELSE_STATEMENT": /^(else)/,
    "RETURN_STATEMENT": /^(return)/,
    "VARIABLE_DEFINITION": /^(let|const)/,
    "IDENTIFIER": /^([a-zA-Z0-9]+)/,
};

const reservedIdentifier = [
    "boolean", "string", "number", "if", "else", "return", "let"
];

/**
 * The basic lexer
 */
export class Lexer {

    /**
     * This lexer will split at the end of every line, so
     * it has an array of all lines. For this lines it will
     * create another array with every lexed line
     */
    constructor(content) {
        // Semicolons should akt as a new line (ask cheeseman why idk)
        content = content.replace(";", "\n")

        this.lines = content.split("\n");
        this.lexed = [];
        this.currentPosition = 0;

        // Starting the lexer
        this.lines.forEach((item, index) => {
            this.lexed = [
                ...this.lexed,
                ...this.tokenize(item.trim(), index).filter((item) => item.name != "WHITESPACE")
            ]
        })
    }

    /**
     * Replying with the next token without advancing the position
     */
    peek() {
        return this.lexed[ this.currentPosition + 1 ];
    }

    /**
     * Tokenizing a line/string
     */
    tokenize(input, line) {
        let resultTokens = []
        let cached = input

        // Keep processing until its empty
        while (input.length) {
            let result = this.getNextTokenInString(input, line)

            if (!result)
                error(cached, 0, cached.length, `Unexpected string.`)

            // Advance the string
            input = input.substring(result.value.length);

            resultTokens.push(result)
        }

        return resultTokens
    }

    /**
     * Getting the next token in the lexed array
     */
    getNextToken() {

        // We reached the end
        if (this.currentPosition >= this.lexed.length)
            return undefined;

        return this.lexed[ this.currentPosition++ ];
    }

    /**
     * Getting the previous token in the lexed array
     */
    getPreviousToken() {
        if (this.currentPosition <= 0)
            return undefined;

        return this.lexed[ this.currentPosition-- ];
    }

    /**
     * Searching the nearest match in all regexes
     */
    getNextTokenInString(input, line) {
        for (let key of Object.keys(tokens)) {
            const match = this.getNearestMatch(input, key, line)

            if (match) {
                if (match.name == "IDENTIFIER" && reservedIdentifier.includes(match.value))
                    return undefined

                return match
            }
        }

        return undefined
    }

    /**
     * Getting the next token in a string
     */
    getNearestMatch(input, regexKey, line) {
        const matches = input.match(tokens[ regexKey ]);

        if (matches) {
            const spaces = "     "

            return {
                name: regexKey,
                value: matches[ 0 ],
                from: input.length - spaces.length,
                to: input.length + matches[ 0 ].length - spaces.length,
                line
            };
        }
    }
}