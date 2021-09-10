import { AstTree, Parser } from "./parser"
import { Lexer } from "./lexer"
import fs from 'fs';
import { Generator } from "./gen/generator";
import { exec } from "child_process";

/**
 * Reading the input file
 */
function readFile(path: string) {
    return fs.readFileSync(path, 'utf8');
}

let content = readFile("./tests/basic.lang")

// Here begins the fun
const lexer = new Lexer(content)
const tree = new AstTree("Program", new Parser(lexer))
const generator = new Generator(tree)

generator.work()

exec('g++ -std=c++17 ./bin/main.cpp -o ./executable', { cwd: './output/' }, (err, stdout, stderr) => {
    if (stdout)
        console.log(stdout)
    if (stderr)
        console.log(stderr)
});

exec('clang-format ./main.cpp', { cwd: './output/bin' }, (err, stdout, stderr) => {
    if (stdout)
        fs.writeFileSync('./output/bin/main.cpp', stdout)
});