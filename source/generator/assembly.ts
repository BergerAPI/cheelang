
/**
 * A simple instruction in assembly.
 * 
 * @example ``	mov rax, 0x02000004``
 */
export class AssemblyInstruction {

	/**
	 * @param mnemonic The instruction mnemonic.
	 * 
	 * @example label: mnemonic [operandArgument{0,3}] [;comment]
	 */
	constructor(public mnemonic: string, public destinationOperand: string = "none",
		public sourceOperand: string = "none", public comment: string = "none", public ignoreSemi: boolean = false) { }

	/**
	 * Putting everything together
	 * 
	 * @example mnemonic = mov
	 * 			destinationOperand = rax
	 * 			sourceOperand = 0x02000004
	 * 			= ``mov rax, 0x02000004``
	 */
	build(): string {
		return `${this.mnemonic} ${this.destinationOperand !== "none" ? this.destinationOperand : ""}${this.sourceOperand !== "none" ? ((!this.ignoreSemi ? ", " : " ") + this.sourceOperand) : ""}	${this.comment !== "none" ? ("; " + this.comment) : ""}`;
	}

}

/**
 * A basic assembly function.
 * 
 * @example ```
 * 		example:
 * 			mov rax, 0x02000004
 *     		mov rsi, message
 *       	mov rdx, messageLength
 *      	syscall
 * ```
 */
export class AssemblyLabel {
	/**
	 * Every instruction in this label
	 */
	instructions: AssemblyInstruction[] = [];

	/**
	 * @param name The name of the label.
	 */
	constructor(public name: string) { }
}

export class AssemblySection {
	/**
	 * Every instruction in this section
	 */
	instructions: AssemblyInstruction[] = [];

	/**
	 * @param name The name of the section.
	 */
	constructor(public name: string) { }
}

/**
 * basic assembly functions.
 */
export class Assmebly {

	/**
	 * All labels
	 */
	private labels: AssemblyLabel[] = [];

	/**
	 * The current label
	 */
	private currentLabel = 0;

	/**
	 * All sections
	 */
	private sections: AssemblySection[] = [];

	/**
	 * The current section
	 */
	private currentSection = 0;

	/**
	 * The last section
	 */
	private lastSection = 0;

	/**
	 * Basically just setting the current section.
	 */
	constructor(mainFunction: string) {
		this.setSection(".text");
		this.sectionInstruction("global", mainFunction, "none", "Main function");
		this.setLabel(mainFunction);
	}

	/**
	 * Writing an instruction to the current label.
	 * 
	 * @see AssemblyInstruction
	 */
	public instruction(mnemonic: string, destinationOperand = "none", sourceOperand = "none", comment = "none"): void {
		this.labels[this.currentLabel].instructions.push(new AssemblyInstruction(mnemonic, destinationOperand, sourceOperand, comment));
	}

	/**
	 * Writing an instruction to the current section.
	 * 
	 * @see AssemblyInstruction
	 */
	public sectionInstruction(mnemonic: string, destinationOperand: string, sourceOperand = "none", comment = "none"): void {
		this.sections[this.currentSection].instructions.push(new AssemblyInstruction(mnemonic, destinationOperand, sourceOperand, comment, true));
	}

	/**
	 * Going back to the last section.
	 */
	public backSection(): void {
		this.currentSection = this.lastSection;
	}

	/**
	 * Building the entire source code together.
	 */
	public build(): string {
		let sourceCode = "";

		this.sections.forEach((section, index) => {
			sourceCode += `section ${section.name}`;

			for (const instruction of section.instructions)
				sourceCode += `\n	${instruction.build()}`;

			if (index < this.sections.length - 1)
				sourceCode += "\n\n";

			if (section.name === ".text")
				this.labels.forEach(label => {
					sourceCode += `${label.name}:`;

					for (const instruction of label.instructions)
						sourceCode += `\n	${instruction.build()}`;

					sourceCode += "\n\n";
				});
		});

		return sourceCode;
	}

	/**
	 * Setting the current label
	 */
	public setLabel(label: string): void {

		if (this.labels.find(f => f.name === label) != undefined)
			this.currentLabel = this.labels.findIndex(f => f.name === label);
		else {
			this.labels.push(new AssemblyLabel(label));
			this.currentLabel = this.labels.length - 1;
		}

	}

	/**
	 * Setting the current label
	 */
	public setSection(section: string): void {

		this.lastSection = this.currentSection;

		if (this.sections.find(f => f.name === section) != undefined)
			this.currentSection = this.sections.findIndex(f => f.name === section);
		else {
			this.sections.push(new AssemblySection(section));
			this.currentSection = this.sections.length - 1;
		}

	}
}