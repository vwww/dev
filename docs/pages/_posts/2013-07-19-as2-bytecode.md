---
title: Flasm (ActionScript 2) Bytecode Equivalents
date: "2013-07-19 17:55:00 -0700"
category: Programming
blog_tags: ActionScript ActionScript-2 Assembly Flash Programming Web
---
<mark>[Flasm](https://nowrap.de/flasm) allows people to disassemble flash files (.swf) into human-readable bytecode</mark>. I have discovered some of the <mark>Flash compiler techniques and other interesting things</mark>.

ActionScript // Flasm

```as3
Number.POSITIVE_INFINITY // POSITIVE_INFINITY or POSITIVE_INFINITYF
Number.NAN // _NAN or _NANF
return; // push UNDEF / return
trace(x) // push x / trace
// operators: push a / push b / [op]
| // bitwiseOr
^ // bitwiseXor
& // bitwiseAnd
<< // shiftLeft
>> // shiftRight
+ // add
- // subtract
* // multiply
/ // divide
% // modulo
```

What I find <mark>the most interesting is how it compiles logical expressions</mark>:

<!--more-->

(_a &amp;&amp; b_) or (_a || b_)

```nasm
push [a]
dup
not ; only for &&
branchIfTrue label1
pop
push [b]
label1:
not
branchIfTrue label2
>>[body if true]<<
branch label3 ; only if else is present
label2:
>>[body if false]<<
label3: ; only if else is present
```

Now, <mark>how does it compile a compound expression</mark>?

Let's start with (_a \[op1\] b \[op2\] c_), special case: (_\[op1\] &ne; ||_), (_\[op2\] &ne; &amp;&amp;_)

```nasm
push [a]
dup
not ; only for [op1] == &&
branchIfTrue label1 ; special case: branchIfTrue label2
pop
push [b]
label1: ; not in special case
{dup}
not ; only for [op2] == &&
branchIfTrue {new_label
pop
push [c]
new_label:
not
branchIfTrue label2}
>>[body if true]<<
branch label3 ; only if else is present
label2:
>>[body if false]<<
label3: ; only if else is present
```

In the special case, operator precedence will cause (_b &amp;&amp; c_) to be evaluated together. After testing (_a &amp;&amp; (b || c)_), I have discovered that the same thing as the special case occurs above.

I'm still not so sure about why they compile the conditionals like this. But it is interesting how **<mark>an *OR* operator can become an *AND* operator with one *not*</mark> instruction**.
