import fs from "fs";
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
	private print(message: string, messageLength: string): void {
		this.assembly.instruction("mov", "rax", "0x02000004", "Saying that we want to write. (MacOS)");
		this.assembly.instruction("mov", "rsi", message, "The message to write.");
		this.assembly.instruction("mov", "rdx", messageLength, "The length of the message.");
		this.assembly.instruction("syscall");
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
	public defineString(name: string, value: string): void {
		this.assembly.setSection(".data");

		this.assembly.sectionInstruction(name, "db", "\"" + value + "\", 0x0A");
		this.assembly.sectionInstruction(name + "Length", "equ", "$-" + name);

		this.assembly.backSection();
	}

	/**
	 * Here we write all the assembly instructions.
	 */
	private prepare(): void {
		this.defineString("testMessage", "narutoooooo = chee");
		this.print("testMessage", "testMessageLength");

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