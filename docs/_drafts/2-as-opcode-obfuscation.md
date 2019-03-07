---
layout: post
title: Flash Opcode Obfuscation
date: "2013-11-30 14:32:33 -0700"
category: Programming
tags: ActionScript Assembly Flash Hacks
---
Typical Rewrite Obfuscation
[Block A]
jump L2
[Dead Code 1]
L1:
[Block B]
jump L3
[Dead Code 2]
L2:
[Block C]
jump L1
[Dead Code 2]
L3:

can be rewritten as
[Block A]
[Block C]
[Block B]

Basically, perfectly good code can be taken, broken into chunks, shuffled, and be obfuscated like the above. Of course,

Stack Swapping
t = a;
a = b;
b = a;

get a
set t
get b
set a
get t
set b

Optimizer:
get a
set t // 2. Removing this with 1 will eliminate redundancy!
get b
set a
get t // 1. Isn't this a before the set?
set b

get a
get b
set a
set b

What happens to the decompiler?

a = b;
b = a; // WRONG!

A correct solution:

temp = a; // the decompiler should detect that a value is changed, but its old value is still on the stack
a = b;
b = temp;
