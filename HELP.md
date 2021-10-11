# Notice

We don't use the offical llvm api, since there are no good ports for node. So we write it by ourselves. We try to document our own api as good as possible.

# LLVM Type System

[Reference](https://llvm.org/docs/LangRef.html#type-system)

## Summary

### `void`

Doesn't represent any value and has no size

### `function`

It consists of a return type and a list of formal parameter types

Syntax: `<returntype> (<parameter list>)`

### `integer`

Very simple data type. It specifies an arbitrary bit width for the integer type desired. Any bit width from 1 bit to 223(about 8 million) can be specified.

Example: `i8`, `i32`, `i1942652`
