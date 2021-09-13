import { Lexer, Token, TokenType } from "./lexer";

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
    condition: AstNode;
    block: CodeBlockNode;
    elseBlock: CodeBlockNode;

    constructor(condition: AstNode, block: CodeBlockNode, elseBlock: CodeBlockNode = new CodeBlockNode([])) {
        this.condition = condition;
        this.block = block;
        this.elseBlock = elseBlock
    }
}

export class VariableDeclarationNode {
    name: string = "VariableDeclarationNode";
    variableName: string;
    variableValue: AstNode;
    variableType: string;

    constructor(variableName: string, variableValue: AstNode, variableType: string) {
        this.variableName = variableName;
        this.variableValue = variableValue;
        this.variableType = variableType;
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

export class NumberLiteralNode implements AstNode {
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

export class VariableAssignmentNode implements AstNode {
    name: string = "VariableAssignmentNode";
    variableName: string;
    variableValue: AstNode;

    constructor(variableName: string, variableValue: AstNode) {
        this.variableName = variableName;
        this.variableValue = variableValue;
    }
}

export class VariableReferenceNode implements AstNode {
    name: string = "VariableReferenceNode";
    variableName: string;

    constructor(variableName: string) {
        this.variableName = variableName;
    }
}

export class CallExpressionNode implements AstNode {
    name: string = "CallExpressionNode";
    functionName: string;
    args: AstNode[];
    integrated: boolean;

    constructor(functionName: string, args: AstNode[], integrated: boolean) {
        this.functionName = functionName;
        this.args = args;
        this.integrated = integrated;
    }
}

export class WhileStatementNode implements AstNode {
    name: string = "WhileStatementNode";
    condition: AstNode;
    block: CodeBlockNode;

    constructor(condition: AstNode, block: CodeBlockNode) {
        this.condition = condition;
        this.block = block;
    }
}

export class BreakStatementNode implements AstNode {
    name: string = "BreakStatementNode";
}

export class FunctionDeclarationNode implements AstNode {
    name: string = "FunctionDeclarationNode";
    functionName: string;
    args: AstNode[];
    block: CodeBlockNode;
    returnType: string;

    constructor(functionName: string, args: AstNode[], block: CodeBlockNode, returnType: string) {
        this.functionName = functionName;
        this.args = args;
        this.block = block;
        this.returnType = returnType
    }
}

export class FunctionParameterNode implements AstNode {
    name: string = "FunctionParameterNode";
    variableName: string;
    variableType: string;

    constructor(variableName: string, variableType: string) {
        this.variableName = variableName;
        this.variableType = variableType;
    }
}

export class FunctionReturnNode implements AstNode {
    name: string = "FunctionReturnNode";
    value: AstNode;

    constructor(value: AstNode) {
        this.value = value;
    }
}

export class UseStatementNode implements AstNode {
    name: string = "UseStatementNode";
    packageName: string;

    constructor(packageName: string) {
        this.packageName = packageName;
    }
}

export class NamespaceDeclarationNode implements AstNode {
    name: string = "NamespaceDeclarationNode";
    namespaceName: string;
    block: CodeBlockNode;

    constructor(namespaceName: string, block: CodeBlockNode) {
        this.namespaceName = namespaceName;
        this.block = block;
    }
}

export class NamespaceReferenceNode implements AstNode {
    name: string = "NamespaceReferenceNode";
    namespaceName: string;
    block: AstNode;

    constructor(namespaceName: string, block: AstNode) {
        this.namespaceName = namespaceName;
        this.block = block;
    }
}

export class ClassDeclarationNode implements AstNode {
    name: string = "ClassDeclarationNode";
    className: string;
    block: CodeBlockNode;

    constructor(className: string, block: CodeBlockNode) {
        this.className = className;
        this.block = block;
    }
}

export class NoneNode implements AstNode {
    name: string = "NoneNode";
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

        if (tokenValue == "+" || tokenValue == "-" || tokenValue == "!") {
            this.eat(tokenName)
            return new UnaryNode(this.factor(), tokenValue)
        } else if (tokenName == "INTEGER_LITERAL" || tokenName == "FLOAT_LITERAL") {
            this.eat(tokenName)
            return new NumberLiteralNode(parseFloat(tokenValue))
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
     * Function Call (e.g. x(2, 3) )
     * Variable assignment (e.g. x = 2 + 2)
     * 
     * @return CallExpression Node || AssignmentExpression Node
     */
    identifier(): AstNode {
        const token = this.token;

        this.eat("IDENTIFIER");

        if (this.token && (this.token.type == "LEFT_PARENTHESIS" || this.token.type == "EXCLAMATION_MARK")) {
            let integrated = false
            const args = []

            if (this.token.type == "EXCLAMATION_MARK") {
                this.eat("EXCLAMATION_MARK")
                integrated = true
                this.eat("LEFT_PARENTHESIS")
            } else this.eat("LEFT_PARENTHESIS")

            while (this.token != undefined && this.token.raw != ")") {
                args.push(this.expression())

                if (this.token != undefined && this.token.raw == ",")
                    this.eat("COMMA")
            }

            this.eat("RIGHT_PARENTHESIS")

            return new CallExpressionNode(token.raw, args, integrated)
        } else if (this.token && this.token.type == "EQUALS") {
            this.eat("EQUALS");

            return new VariableAssignmentNode(token.raw, this.expression());
        } else if (this.token.type == "COLON") {
            this.eat("COLON")
            this.eat("COLON")

            return new NamespaceReferenceNode(token.raw, this.expression())
        }

        return new VariableReferenceNode(token.raw);
    }

    /**
     * A basic else statement (e.g. if 1 + 1 == 2 {...} else {...})
     */
    elseStatement() {
        const braces = this.token.type == "LEFT_BRACE"
        const nodes = []

        if (braces) {
            this.eat("LEFT_BRACE");

            while (this.token != undefined && this.token.type != "RIGHT_BRACE")
                nodes.push(this.codeBlock());

            this.eat("RIGHT_BRACE");
        } else nodes.push(this.codeBlock())

        return new CodeBlockNode(nodes)
    }

    /**
     * A basic If-Statement (e.g. if 1 + 1 == 2 {...})
     */
    ifStatement(): IfStatementNode {
        this.eat("IF_STATEMENT")

        const condition = this.expression();
        const nodes = []

        this.eat("LEFT_BRACE");

        while (this.token != undefined && this.token.type != "RIGHT_BRACE")
            nodes.push(this.codeBlock());

        this.eat("RIGHT_BRACE");

        // Checking for else thingies
        if (this.token.type == "ELSE_STATEMENT") {
            this.eat("ELSE_STATEMENT");

            return new IfStatementNode(condition, new CodeBlockNode(nodes), this.elseStatement());
        }

        return new IfStatementNode(condition, new CodeBlockNode(nodes));
    }

    /**
     * A basic While-Statement (e.g. while 1 + 1 == 2 {...})
     */
    whileStatement() {
        this.eat("WHILE_STATEMENT");

        const condition = this.expression();
        const nodes = []

        this.eat("LEFT_BRACE");

        while (this.token != undefined && this.token.type != "RIGHT_BRACE")
            nodes.push(this.codeBlock());

        this.eat("RIGHT_BRACE");

        return new WhileStatementNode(condition, new CodeBlockNode(nodes));
    }

    /**
     * Finding out, which type an expression returns
     */
    type(expression: AstNode): string {
        switch (expression.name) {
            case "StringLiteralNode": return "string"
            case "BooleanLiteralNode": return "boolean"
            case "IntegerLiteralNode": return (expression as NumberLiteralNode).value % 1 == 0 ? "int" : "float"
            case "ExpressionNode": {
                let operator = (expression as ExpressionNode).operator

                if (operator.match(TokenType.RELATIONAL_OPERATOR)) {
                    return "boolean"
                } else {
                    return "float"
                }
            }
            default: return "auto"
        }
    }

    /**
     * Defining a variable.
     */
    variableDeclaration() {
        let variableType = undefined;

        this.eat("VARIABLE_DEFINITION")

        const variableName = this.token.raw;

        // Checking if the thingy user defines a type
        const peek = this.lexer.next(true);

        if (peek.type == "COLON") {
            this.eat("IDENTIFIER")
            this.eat(peek.type);

            variableType = this.token.raw;

            this.eat("IDENTIFIER")
        } else this.eat("IDENTIFIER")

        this.eat("EQUALS")

        const expression = this.expression();

        if (!variableType) variableType = this.type(expression);

        return new VariableDeclarationNode(variableName, expression, variableType)
    }

    /**
     * A basic function definition (e.g. function x(a, b) {...})
     */
    functionDeclaration() {
        let returnType = "void"
        const parameters = []
        const nodes = []

        this.eat("FUNCTION_DEFINITION")

        const name = this.token.raw;

        this.eat("IDENTIFIER")
        this.eat("LEFT_PARENTHESIS")

        while (this.token != undefined && this.token.raw != ")") {
            const paramName = this.token.raw;
            this.eat("IDENTIFIER")
            this.eat("COLON")
            const paramType = this.token.raw;

            this.eat("IDENTIFIER")

            parameters.push(new FunctionParameterNode(paramName, paramType))

            if (this.token != undefined && this.token.raw == ",")
                this.eat("COMMA")
        }

        this.eat("RIGHT_PARENTHESIS")

        if (this.token.type == "COLON") {
            this.eat("COLON");
            returnType = this.token.raw
            this.eat("IDENTIFIER")
        }

        this.eat("LEFT_BRACE");

        while (this.token != undefined && this.token.type != "RIGHT_BRACE")
            nodes.push(this.codeBlock());

        this.eat("RIGHT_BRACE");

        return new FunctionDeclarationNode(name, parameters, new CodeBlockNode(nodes), returnType);
    }

    /**
     * Returning something from a function
     */
    returnStatement() {
        this.eat("RETURN_STATEMENT")

        if (this.token.type == "INTEGER_LITERAL" || this.token.type == "FLOAT_LITERAL" || this.token.type == "STRING_LITERAL" || this.token.type == "BOOLEAN_LITERAL" || this.token.type == "ARITHMETIC_OPERATOR" || this.token.type == "IDENTIFIER")
            return new FunctionReturnNode(this.expression());
        else return new FunctionReturnNode(new NoneNode())
    }

    /**
     * A basic import.
     * @returns {AstNode}
     */
    useStatement() {
        this.eat("USE_STATEMENT")
        this.eat("LEFT_PARENTHESIS")

        const packageName = this.token.raw;

        this.eat("STRING_LITERAL")
        this.eat("RIGHT_PARENTHESIS")

        return new UseStatementNode(packageName)
    }

    /**
     * A namespace to keep things clean.
     * @returns {AstNode}
     */
    namespaceStatement() {
        this.eat("NAMESPACE_STATEMENT")
        this.eat("LEFT_PARENTHESIS")

        const name = this.token.raw;
        const nodes = []

        this.eat("STRING_LITERAL")
        this.eat("RIGHT_PARENTHESIS")

        this.eat("LEFT_BRACE");

        while (this.token != undefined && this.token.type != "RIGHT_BRACE")
            nodes.push(this.codeBlock());

        this.eat("RIGHT_BRACE");

        return new NamespaceDeclarationNode(name, new CodeBlockNode(nodes))
    }

    /**
     * A basic class.
     */
    classDeclaration() {
        this.eat("CLASS_DEFINITION")

        const name = this.token.raw;

        this.eat("IDENTIFIER")

        const nodes = []

        this.eat("LEFT_BRACE");

        while (this.token != undefined && this.token.type != "RIGHT_BRACE")
            nodes.push(this.codeBlock());

        this.eat("RIGHT_BRACE");

        return new ClassDeclarationNode(name, new CodeBlockNode(nodes))
    }

    /**
     * Checks what type a node is
     * @returns {AstNode}
     */
    codeBlock() {
        let node: any = undefined;

        switch (this.token.type) {
            case "IF_STATEMENT":
                node = this.ifStatement()
                break;

            case "RETURN_STATEMENT":
                node = this.returnStatement()
                break;

            case "WHILE_STATEMENT":
                node = this.whileStatement()
                break;

            case "FUNCTION_DEFINITION":
                node = this.functionDeclaration()
                break;

            case "BREAK_STATEMENT":
                this.eat("BREAK_STATEMENT")
                node = new BreakStatementNode()
                break;

            case "USE_STATEMENT":
                node = this.useStatement()
                break;

            case "NAMESPACE_STATEMENT":
                node = this.namespaceStatement()
                break;

            case "CLASS_DEFINITION":
                node = this.classDeclaration()
                break;

            case "VARIABLE_DEFINITION":
                node = this.variableDeclaration()
                break;

            case "IDENTIFIER":
                node = this.identifier()
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

        return node
    }

    /**
     * Running the parser (pog asf)
     */
    work(tree: AstTree) {
        while (this.token != undefined) {
            let node = this.codeBlock()

            if (node)
                tree.block.nodes.push(node)
        }
    }

}