import error from "./error.js"

/**
 * The basic Parser class.
 */
export class Parser {
    constructor(lexer) {
        this.lexer = lexer;
        this.currentToken = this.lexer.getNextToken();
    }

    /**
     * Consumes one specified token type.
     * In case, token type is not equal to the current one, it throws an error.
     * When you are consuming a token you are not expecting, it means broken syntax structure.
     * 
     * @example
     * const parser = new Parser('2 + 5'); // currentToken = INTEGER
     * 
     * parser
     *  .eat(Token.INTEGER) // currentToken = PLUS
     *  .eat(Token.PLUS) // currentToken = INTEGER
     *  .eat(Token.PLUS) // throws an error, because currentToken = INTEGER
     */
    eat(tokenType) {
        if (!this.currentToken)
            return

        if (this.currentToken.name == tokenType)
            this.currentToken = this.lexer.getNextToken();
        else
            error(this.lexer.lines[ this.currentToken.line ], this.currentToken.from, this.currentToken.to, `You provided unexpected token type "${tokenType}" while current token is "${this.currentToken.name}"`)

        return this.currentToken
    }

    /**
     * Expecting a certain syntax.
     */
    expect(...syntax) {
        const result = [ this.currentToken ]

        syntax.forEach(value => {
            if (value != "EXPR") result.push(this.eat(value));
            else result.push(this.defaultExpr());
        })

        return result
    }

    /**
     * Usage of a variable (e.g. x + 2 * y)
     */
    variable() {
        const token = this.currentToken;
        this.eat("IDENTIFIER");

        return {
            type: "VARIABLE_REFERENCE",
            id: token.value
        }
    }

    /**
     * Math factor (+, -, int, LParan expr RParan)
     */
    factor() {
        const tokenValue = this.currentToken.value
        const tokenName = this.currentToken.name

        if (tokenValue == "+") {
            this.eat(tokenName)
            return { type: "UNARY_OPERATOR", operator: tokenValue, operand: this.factor() }
        } else if (tokenValue == "-") {
            this.eat(tokenName)
            return { type: "UNARY_OPERATOR", operator: tokenValue, operand: this.factor() }
        } else if (tokenName == "INTEGER_LITERAL") {
            this.eat(tokenName)
            return { type: "INTEGER_LITERAL", value: tokenValue }
        } else if (tokenName == "STRING_LITERAL") {
            this.eat(tokenName)
            return { type: "STRING_LITERAL", value: tokenValue }
        } else if (tokenName == "BOOLEAN_LITERAL") {
            this.eat(tokenName)
            return { type: "BOOLEAN_LITERAL", value: tokenValue }
        } else if (tokenName == "LEFT_PARENTHESIS") {
            this.eat("LEFT_PARENTHESIS")
            const result = this.defaultExpr()
            this.eat("RIGHT_PARENTHESIS")
            return result
        }

        return this.variable()
    }

    /**
     * Math terms (
     *      factor / term
     *      factor * term
     *      factor - term
     *      factor
     * )
     */
    term() {
        let node = this.factor()

        while (this.currentToken != undefined && [ "/", "*" ].includes(this.currentToken.value)) {
            const operator = this.currentToken.value

            this.eat(this.currentToken.name)

            node = {
                type: "BINARY_OPERATOR",
                operator,
                left: node,
                right: this.factor(),
            }
        }

        return node
    }

    /**
     * A default expression (can be: strings, arithmetic 
     * expressions, booleans, variables)
     * 
     * @return Binary Operator Node
     */
    defaultExpr() {
        const token = this.currentToken;

        if (!token)
            return undefined

        // This expression has something to do with cring math or not
        let expr = this.term()

        // Lowest pritority
        while (this.currentToken != undefined && [ "+", "-", ">", "<", "<=", ">=", "==", "!=" ].includes(this.currentToken.value)) {
            const operator = this.currentToken.value

            this.eat(this.currentToken.name)

            expr = {
                type: "BINARY_OPERATOR",
                operator,
                left: expr,
                right: this.term(),
            }
        }

        // Highest priority
        if (this.currentToken && [ "&&", "||" ].includes(this.currentToken.value)) {
            const operator = this.currentToken.value

            this.eat("RELATIONAL_OPERATOR")

            const right = this.defaultExpr()

            return {
                type: "BINARY_OPERATOR",
                operator: operator,
                left: expr,
                right: right
            }
        }

        return expr
    }

    /**
     * Defining a variable
     * 
     * @return VariableDeclaration Node
     */
    variableDefinition() {
        // Expecting a variable name, then an equals, then a value
        const expectation = this.expect("VARIABLE_DEFINITION", "IDENTIFIER", "EQUALS", "EXPR");

        const definition = expectation[ 0 ];
        const variableName = expectation[ 1 ];

        // We need 4 here because the third is the character after the quals
        // (e.g ``let x = 2 + 2`` -> expressions[3] = ``2``)
        const expression = expectation[ 4 ];

        return {
            type: "VARIABLE_DECLARATION",
            kind: definition.value,
            declaration: {
                type: "VARIABLE_DECLARATOR",
                id: variableName.value,
                init: expression,
            },
        }
    }

    /**
     * If Statement (e.g. if x == 2 { ... })
     * 
     * @return If-Statement Node
     */
    ifStatement() {
        const expectation = this.expect("IF_STATEMENT", "EXPR");

        this.eat("LEFT_BRACE");
        const body = []

        while (this.currentToken != undefined && this.currentToken.name != "RIGHT_BRACE") {
            body.push(this.scopeTest());
        }
        this.eat("RIGHT_BRACE");

        return {
            type: "IF_STATEMENT",
            condition: expectation[ 2 ],
            body: body,
        };
    }

    /**
     * Function Call (e.g. x(2, 3) )
     * Variable assignment (e.g. x = 2 + 2)
     * 
     * @return CallExpression Node || AssignmentExpression Node
     */
    identifier() {
        const token = this.currentToken;

        this.eat("IDENTIFIER");

        if (this.currentToken && this.currentToken.value == "(") {
            this.eat("LEFT_PARENTHESIS");

            const args = []

            while (this.currentToken != undefined && this.currentToken.name != "RIGHT_PARENTHESIS") {
                args.push(this.defaultExpr())

                if (this.currentToken.name == "TRIM")
                    this.eat("TRIM")
            }

            this.eat("RIGHT_PARENTHESIS");

            return {
                type: "CALL_EXPRESSION",
                callee: token.value,
                arguments: args
            }
        } else {
            this.eat("EQUALS");

            return {
                type: "VARIABLE_ASSIGNMENT",
                id: token.value,
                value: this.defaultExpr()
            }
        }
    }

    /**
     * A function definition (e.g. fn x(a, b) { ... })
     * 
     * @return FunctionDeclaration Node
     */
    functionDefinition() {
        const expectation = this.expect("FUNCTION_DEFINITION", "IDENTIFIER");

        const name = expectation[ 1 ];
        const body = []
        const args = []

        // Reading the arguments
        this.eat("LEFT_PARENTHESIS");

        while (this.currentToken != undefined && this.currentToken.name != "RIGHT_PARENTHESIS") {
            args.push(this.defaultExpr())

            if (this.currentToken.name == "TRIM")
                this.eat("TRIM")
        }

        this.eat("RIGHT_PARENTHESIS");

        // Reading the body
        this.eat("LEFT_BRACE");

        while (this.currentToken != undefined && this.currentToken.name != "RIGHT_BRACE")
            body.push(this.scopeTest());

        this.eat("RIGHT_BRACE");

        return {
            type: "FUNCTION_DECLARATION",
            callee: name.value,
            arguments: args,
            body: body,
        }
    }

    /**
     * Defining a new codeblock (e.g. the main code block)
     * 
     * @return a token
     */
    scopeTest() {
        if (this.currentToken.name == "VARIABLE_DEFINITION") return this.variableDefinition();
        else if (this.currentToken.name == "IF_STATEMENT") return this.ifStatement();
        else if (this.currentToken.name == "IDENTIFIER") return this.identifier();
        else if (this.currentToken.name == "FUNCTION_DEFINITION") return this.functionDefinition();
        else this.currentToken = this.lexer.getNextToken();
    }

    /**
     * Starting the parser
     */
    parse() {
        const body = []

        while (this.currentToken != undefined)
            body.push(this.scopeTest());

        return {
            type: "Program",
            body: body
        }
    }
}