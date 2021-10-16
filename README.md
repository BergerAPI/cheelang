# Cheelang

**WARNING! THIS LANGUAGE IS A WORK IN PROGRESS! ANYTHING CAN CHANGE AT ANY MOMENT WITHOUT ANY NOTICE! USE THIS LANGUAGE AT YOUR OWN RISK!**

This language specializes in combining a high-level syntax and a low-level compilation. We compile to LLVM IR (Intermediate Representation) and LLVM compiles to a native executable.

# Plans

- [X] Compiled
- [X] Native 
- [ ] Complete Syntax
- [ ] Feature-Rich default library
- [ ] Self-hosted
- [ ] Optimized

# Keywords

| Name          | Syntax                                                    | Description                                                                  |
|---------------|-----------------------------------------------------------|------------------------------------------------------------------------------|
| ``func``      | ``func <functionName>(<arguments>): <returnType> { .. }`` | Defining a new function (with a specific return type).                       |
| ``if-else``   | ``if <condition> { .. } else { .. }``                     | An if-else statement controls conditional branching.                         |
| ``while``     | ``while <condition> { .. }``                              | This loops through a block of code as long as a specified condition is true. |
| ``return``    | ``return <value>``                                        | Returning from a function.                                                   |
| ``external``  | ``external <function\|variable>``                         | Using a function or a variable from the system default C-Library.            |
| ``var``       | ``var <variableName>: <variableType> = <variableValue>``  | Defining a new variable (with a specific type).                              |

# Data Types

| Name    | Syntax      | Description                                         |
|---------|-------------|-----------------------------------------------------|
| Integer | ``int``     | A basic 0 decimal number.                           |
| Float   | ``float``   | A basic floating number.                            |
| Boolean | ``boolean`` | A number that can be 0 (for false) or 1 (for true). |
| String  | ``string``  | A dynamic char array.                               |

# Syntax Example

```
; Using an external clib function
external func printf(string text, ...): int

; Simple "Hello World!"
func main(): int {
    printf("Hello World!")
    
    return 0
}
```
