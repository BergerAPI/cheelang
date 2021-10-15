/* eslint-disable @typescript-eslint/no-explicit-any */
import { AstTree } from "../parser/ast";
import * as llvm from "llvm-node";

/**
 * Thats the part where we compile to llvm code.
 */
export class Generator {

	/**
	 * For using llvm
	 */
	private context = new llvm.LLVMContext();
	private module = new llvm.Module("cheelang", this.context);

	constructor(public tree: AstTree) { }

	/**
	 * Here we put all parts into a string.
	 */
	generate(): string {
		// Default Print Function // TODO: Remove this
		this.module.getOrInsertFunction("printf", llvm.FunctionType.get(llvm.Type.getInt32Ty(this.context), [llvm.Type.getInt8PtrTy(this.context)], false));
		this.module.getOrInsertFunction("main", llvm.FunctionType.get(llvm.Type.getInt32Ty(this.context), [], false));

		// Generate the code
		const main = this.module.getFunction("main");
		const printf = this.module.getFunction("printf");

		if (!printf || !printf)
			throw new Error("Something went very wrong.");

		const entry = llvm.BasicBlock.create(this.context, "entry", main);
		const builder = new llvm.IRBuilder(entry);

		const arrayPtr = builder.createGlobalStringPtr("Hello world", "test", 0);

		builder.createCall(printf, [arrayPtr]);

		builder.createRet(llvm.ConstantInt.get(this.context, 0));

		return this.module.print();
	}

}