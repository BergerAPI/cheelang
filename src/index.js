import Interpreter from "./interpreter/interpreter.js"
import { Parser } from "./parser.js"
import { Lexer } from "./lexer.js"
import fs from "fs"

// The test file
const content = fs.readFileSync("./tests/test.che", "utf-8")

// The Lexer
const lexer = new Lexer(content)

// The Parser
const parser = new Parser(lexer)

// The ast tree
const ast = parser.parse()

// The Interpreter
const interpreter = new Interpreter()

// console.log(lexer.lexed)
console.log(JSON.stringify(ast, null, 2))
interpreter.interpret(ast.body)