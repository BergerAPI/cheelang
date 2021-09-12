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

// https://dev.to/leonard/get-files-recursive-with-the-node-js-file-system-fs-2n7o
function getFiles(path = "./") {
    const entries = fs.readdirSync(path, { withFileTypes: true });

    const files = entries
        .filter(file => !file.isDirectory())
        .map(file => ({ ...file, path: path + file.name }));

    const folders = entries.filter(folder => folder.isDirectory());

    for (const folder of folders)
        files.push(...getFiles(`${path}${folder.name}/`));

    return files;
}

const files = getFiles("tests/basic/");

if (files.filter(f => f.name.replace(/\.[^/.]+$/, "") == "main").length == 0)
    throw new Error("We expected a 'main.lang' file.");

files.forEach(item => {
    let content = readFile(item.path)

    // Here begins the fun
    const lexer = new Lexer(content)
    const tree = new AstTree("Program", new Parser(lexer))
    const generator = new Generator(tree)

    generator.work(item.name.replace(/\.[^/.]+$/, ""))

    exec('clang-format ./output/bin/' + item.name.replace(/\.[^/.]+$/, "") + '.cpp', (err, stdout, stderr) => {
        if (stdout)
            fs.writeFileSync('./output/bin/' + item.name.replace(/\.[^/.]+$/, "") + '.cpp', stdout)
    });
})

const compileFiles: string[] = []

files.forEach(file => {
    compileFiles.push("./output/bin/" + file.name.replace(/\.[^/.]+$/, "") + ".cpp")
})

exec('g++ -std=c++17 ' + compileFiles.join(" ") + ' -o ./output/executable', (err, stdout, stderr) => {
    if (stdout)
        console.log(stdout)
    if (stderr)
        console.log(stderr)
});