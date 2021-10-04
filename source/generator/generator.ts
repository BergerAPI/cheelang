import fs from "fs";
import { exit } from "process";
import { logger } from "..";
import { AstTree } from "../parser/ast";
import { Assmebly } from "./assembly";

/**
 * Generating the asm code.
 */
export class Generator {

	/**
	 * Assmebly syntax.
	 */
	assembly: Assmebly = new Assmebly("_main");

	/**
	 * How big our stack for local variables currently is.
	 */
	stackSize = 262_144;

	/**
	 * How big we have to split the stack.
	 */
	stackSteps = 4;
	regexSteps = /.{1,4}/g

	constructor(public tree: AstTree) {
	}

	/**
	 * Printing in the code.
	 * 
	 * @example ```
	 * 		mov rax, 0x02000004             ; system call write
	 *  	mov rsi, secondMessage
	 *   	mov rdx, secondMessageLength
	 *  	syscall
	 * ```
	 */
	private print(message: string, messageLength = "none"): void {
		// Checking if this is local.
		if (this.assembly.getValidVariables().find(v => v.name === message) === undefined) {
			if (messageLength === "none") {
				logger.error("To print a constant, you need to provide the length.");
				exit();
			}

			this.assembly.instruction("mov", "rax", "0x02000004", "Saying that we want to write. (MacOS)");
			this.assembly.instruction("mov", "rsi", message, "The message to write.");
			this.assembly.instruction("mov", "rdx", messageLength, "The length of the message.");
		} else {
			const variable = this.assembly.getValidVariables().find(v => v.name === message);

			if (!variable) {
				logger.error("Variable with name '" + message + "' is not defined.");
				exit();
			}

			const size = messageLength == "none" ? (variable.size * this.stackSteps).toString() : messageLength;

			this.assembly.instruction("mov", "eax", "1", "Saying that we want to write. (MacOS)");
			this.assembly.instruction("mov", "rax", "0x02000004", "Saying that we want to write. (MacOS)");
			this.assembly.instruction("lea", "rsi", "[rsp - " + variable.stack + "]", "The message to write.");
			this.assembly.instruction("mov", "edx", size, "The length of the message.");
		}

		this.assembly.instruction("syscall");
	}

	/**
	 * Doing the same as print but only printing a string.
	 */
	printText(message: string): void {
		const name = "tmp." + this.assembly.getValidVariables().length;

		this.defineVariable(name, message + "\\n");
		this.print(name, "none");
	}

	/**
	 * Calling a label in the code.
	 */
	private call(label: string): void {
		this.assembly.instruction("call", label, "none", "Calling label " + label + ".");
	}

	/**
	 * Exiting with status code 0.
	 */
	public exit(): void {
		this.assembly.instruction("mov", "rax", "0x02000001", "Saying that we want to exit. (Macos)");
		this.assembly.instruction("xor", "rdi", "rdi", "Status code 0.");
		this.assembly.instruction("syscall");
	}

	/**
	 * Defining a string in the data section
	 */
	public defineConstantString(name: string, value: string): void {
		this.assembly.setSection(".data");

		this.assembly.sectionInstruction(name, "db", "\"" + value + "\", 0x0A");
		this.assembly.sectionInstruction(name + "Length", "equ", "$-" + name);

		this.assembly.backSection();
	}

	/**
	 * Defining a variable in the current stack.
	 */
	public defineVariable(name: string, value: string): void {
		// Splitting the value into an array of elements with only 4 bytes.
		const elements = value.match(this.regexSteps);

		// Previous stack elements.
		const stack = this.assembly.getValidVariables();

		if (stack.find(v => v.name === name) != undefined) {
			logger.error("Variable with name '" + name + "' is already defined.");
			exit();
		}

		// Calculating the size of all variables
		const previousStackSize = this.stackSize - this.assembly.getValidVariables().map(v => v.size).reduce((a, b) => a + b, 0) * this.stackSteps;

		// Telling our assembly to store a variable in the current label.
		this.assembly.addValidVariable(name, value, previousStackSize);

		// Multiple lines (because we can only store 4 bytes per once), or only one
		if (elements)
			elements.forEach((element, index) => {
				this.assembly.instruction("mov", "dword [rsp - " + (previousStackSize - index * this.stackSteps) + "]", "`" + element + "`", "Defining a variable " + name + ".");
			});
		else
			this.assembly.instruction("mov", "dword [rsp - " + previousStackSize + "]", "", "Defining a variable " + name + ".");
	}

	/**
	 * Here we write all the assembly instructions.
	 */
	private prepare(): void {
		// Allocating
		this.assembly.setSection(".bss");
		this.assembly.setLabel("mem");

		this.assembly.instruction("mem", "resb " + this.stackSize.toString());

		this.assembly.backLabel();
		this.assembly.backSection();

		// Here begins the actual program.
		this.printText("Test Test Test Test Test Test Test");
		this.printText("Dies ist offiziell ein Test von der Nasa. Bitte beachten sie alle Regeln.");

		// Leaving the program.
		this.exit();
	}

	/**
	 * Generating the code.
	 */
	public generate(path: string): void {
		this.prepare();

		// Creating the misssing direcories recursively.
		const directories = path.split("/");
		directories.pop();
		fs.mkdirSync(directories.join("/") + "/", { recursive: true });

		// Writing to the file.
		fs.writeFileSync(path, this.assembly.build(), { encoding: "utf8" });
	}

}