# Cheese Language

A language I made for fun and now I know how parsers work.

# Syntax Example

```rust
const neededForDrip = 150

fn dripCheck(dripValue, maxDrip) {
    const percentage = ((dripValue / maxDrip) * 100)

    println("Your drip level is: " + percentage + "%")
}

dripCheck(125, neededForDrip)
```
