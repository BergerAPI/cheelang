import { Lexer, Token } from "./lexer";

/**
 * The thing that this parser returns
 */
export class AstTree {
    name: string;
    block: CodeBlockNode;
    parser: Parser;

    constructor(name: string, parser: Parser) {
        this.name = name;
        this.block = new CodeBlockNode([]);
        this.parser = parser;

        this.parser.work(this);
    }

    /**
     * We need a better object. definetly.
     */
    toString() {
        return JSON.stringify({
            name: this.name,
            block: this.block
        }, null, 4)
    }
}

/**
 * Every other node is based on this.
 */
export interface AstNode {
    name: string
}

export class CodeBlockNode implements AstNode {
    name: string = "CodeBlockNode";

    /**
     * Elements of this expression
     */
    nodes: AstNode[];

    constructor(nodes: AstNode[]) {
        this.nodes = nodes;
    }
}

export class ExpressionNode implements AstNode {
    name: string = "ExpressionNode";

    /**
     * Elements of this expression
     */
    left: AstNode;
    right: AstNode;
    operator: string;

    constructor(left: AstNode, right: AstNode, operator: string) {
        this.left = left;
        this.right = right;
        this.operator = operator;
    }
}

export class IfStatementNode implements AstNode {
    name: string = "IfStatementNode";

    /**
     * Elements of this expression
     */
    condition: ExpressionNode;
    block: CodeBlockNode;

    constructor(condition: ExpressionNode, block: CodeBlockNode) {
        this.condition = condition;
        this.block = block;
    }
}

export class VariableDeclarationNode {
    name: string = "VariableDeclarationNode";
    variableName: string;
    variableValue: AstNode;

    constructor(variableName: string, variableValue: AstNode) {
        this.variableName = variableName;
        this.variableValue = variableValue;
    }
}

export class UnaryNode implements AstNode {
    name: string = "UnaryNode";
    operand: AstNode;
    operator: string;

    constructor(operand: AstNode, operator: string) {
        this.operand = operand;
        this.operator = operator;
    }
}

export class StringLiteralNode implements AstNode {
    name: string = "StringLiteralNode";
    value: string;

    constructor(value: string) {
        this.value = value;
    }
}

export class IntegerLiteralNode implements AstNode {
    name: string = "IntegerLiteralNode";
    value: number;

    constructor(value: number) {
        this.value = value;
    }
}

export class BooleanLiteralNode implements AstNode {
    name: string = "BooleanLiteralNode";
    value: boolean;

    constructor(value: boolean) {
        this.value = value;
    }
}

export class FloatLiteralNode implements AstNode {
    name: string = "FloatLiteralNode";
    value: number;

    constructor(value: number) {
        this.value = value;
    }
}

/**
 * Here we build the 
 */
export class Parser {

    /**
     * We want to control when to advance, etc..
     */
    lexer: Lexer;

    /**
     * The current token
     */
    token: Token;

    constructor(lexer: Lexer) {
        this.lexer = lexer;
        this.token = lexer.next();
    }

    /**
     * Consumes one specified token type.
     * In case, token type is not equal to the current one, it throws an error.
     * When you are consuming a token you are not expecting, it means broken syntax structure.
     * 
     * @example
     * const parser = new Parser('2 + 5'); // token = INTEGER
     * 
     * parser
     *  .eat(Token.INTEGER) // token = PLUS
     *  .eat(Token.PLUS) // token = INTEGER
     *  .eat(Token.PLUS) // throws an error, because token = INTEGER
     */
    eat(tokenType: string) {
        if (!this.token)
            return

        if (this.token.type == tokenType)
            this.token = this.lexer.next();
        else
            throw new Error(`You provided unexpected token type "${tokenType}" while current token is "${this.token.type}"`)

        return this.token
    }

    /**
     * Math factor (+, -, int, LParan expr RParan)
     */
    factor(): AstNode {
        const tokenValue = this.token.raw
        const tokenName = this.token.type

        if (tokenValue == "+" || tokenValue == "-") {
            this.eat(tokenName)
            return new UnaryNode(this.factor(), tokenValue)
        } else if (tokenName == "INTEGER_LITERAL") {
            this.eat(tokenName)
            return new IntegerLiteralNode(parseInt(tokenValue))
        } else if (tokenName == "STRING_LITERAL") {
            this.eat(tokenName)
            return new StringLiteralNode(tokenValue)
        } else if (tokenName == "BOOLEAN_LITERAL") {
            this.eat(tokenName)
            return new BooleanLiteralNode(tokenValue == "true")
        } else if (tokenName == "LEFT_PARENTHESIS") {
            this.eat("LEFT_PARENTHESIS")
            const result = this.expression()
            this.eat("RIGHT_PARENTHESIS")
            return result
        }

        throw Error("There was an error parsing a factor.")
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
        let node = this.factor();

        while (this.token != undefined && ["/", "*"].includes(this.token.raw)) {
            const operator = this.token.raw;

            this.eat(this.token.type);

            node = new ExpressionNode(node, this.factor(), operator);
        }

        return node;
    }

    /**
     * A default expression (can be: strings, arithmetic 
     * expressions, booleans, variables)
     * 
     * @return Binary Operator Node
     */
    expression(): AstNode {
        const token = this.token;

        if (!token)
            throw Error("Token = undefined?")

        // This expression has something to do with cring math or not
        let expr = this.term()

        // Lowest pritority
        while (this.token != undefined && ["+", "-", ">", "<", "<=", ">=", "==", "!="].includes(this.token.raw)) {
            const operator = this.token.raw

            this.eat(this.token.type)

            expr = new ExpressionNode(expr, this.term(), operator)
        }

        // Highest priority
        if (this.token && ["&&", "||"].includes(this.token.raw)) {
            const operator = this.token.raw

            this.eat("RELATIONAL_OPERATOR")

            return new ExpressionNode(expr, this.expression(), operator)
        }

        return expr
    }

    /**
     * A basic If-Statement (e.g. if 1 + 1 == 2)
     */
    ifStatement() {

    }

    /**
     * Defining a variable.
     */
    variableDeclaration() {
        this.eat("VARIABLE_DEFINITION")

        const variableName = this.token.raw;

        this.eat("IDENTIFIER")
        this.eat("EQUALS")

        return new VariableDeclarationNode(variableName, this.expression())
    }

    /**
     * Running the parser (pog asf)
     */
    work(tree: AstTree) {
        while (this.token != undefined) {
            let node: any = undefined;

            switch (this.token.type) {
                case "IF_STATEMENT":
                    node = this.ifStatement()
                    break;

                case "VARIABLE_DEFINITION":
                    node = this.variableDeclaration()
                    break;

                case "ARITHMETIC_OPERATOR":
                case "FLOAT_LITERAL":
                case "STRING_LITERAL":
                case "INTEGER_LITERAL":
                    node = this.expression()
                    break
                default:
                    this.token = this.lexer.next()
            }

            if (node)
                tree.block.nodes.push(node)
        }
    }

}