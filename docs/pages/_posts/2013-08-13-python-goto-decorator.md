---
title: Python Goto Decorator Improved
date: "2013-08-13 16:15:00 -0700"
category: Programming
blog_tags: Programming Python
---
When I found [a <mark>nice hack to get GOTO statements</mark> in Python](https://code.activestate.com/recipes/576944-the-goto-decorator/), I decided to <mark>make my own version</mark> of it. It has been <mark>tested on Python 2.7 but probably also works in Python 3</mark>.

To use it, <mark>import goto from goto</mark> and <mark>use the `@goto` decorator</mark>:

```py
from goto import goto
@goto
def test():
  goto .end
  return False
  label .end
  return True
print test() # should be True
```

But first, you'll need this code:

goto.py

<!--more-->

```py
#!/usr/bin/env python
# Copyright 2013 Victor Zheng
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

   # https://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# This is fast code that gives you GOTO functionality in functions with minimal start-up overhead!

# Adapted from Carl Cerecke's MIT-licensed code:
# https://code.activestate.com/recipes/576944-the-goto-decorator/

# Caveats:
# - With the block stack, you must push blocks for "while", "try"
# For example, to jump inside a while loop, a block must be simulated:
# i = 10
# while True:
#  goto .insideLoop
# i = 1 # dead code
# while i > 0:
#  label .insideLoop
#  print i
# - entering a "for" or "except" block is probably not supported
# - "cannot create code objects in restricted execution mode"

import dis

class MissingLabelError(Exception):
 """'goto' without matching 'label'."""
 def __init__(self, target):
  super(MissingLabelError, self).__init__('Invalid jump to label %s' % (target))

def goto(fn):
 """
 A function decorator to add the goto command for a function.
 Specify commands like so:
 label .foo
 goto .foo
 """

 labels = {}
 gotos = {}
 i = 0
 end = len(fn.func_code.co_code)
 new_code = list(fn.func_code.co_code)

 nop7 = [chr(dis.opmap['NOP'])] * 7
 # scan through the bytecodes to find the labels and gotos
 while i < end:
  op = ord(fn.func_code.co_code[i])
  i += 1
  if op > dis.HAVE_ARGUMENT:
   i += 2
   # foo .bar
   # 0 LOAD_GLOBAL              0 (foo)
   # 3 LOAD_ATTR                1 (bar)
   # 6 POP_TOP
   # = 7 bytes total
   if (i < end - 7 + 3 and
    op == dis.opmap['LOAD_GLOBAL'] and
    ord(fn.func_code.co_code[i]) == dis.opmap['LOAD_ATTR'] and
    ord(fn.func_code.co_code[i + 3]) == dis.opmap['POP_TOP']):
    # check for label/goto
    if fn.func_code.co_names[
     (ord(fn.func_code.co_code[i - 1]) << 8) +
     ord(fn.func_code.co_code[i - 2])
    ] == 'label':
     labels[fn.func_code.co_names[
      (ord(fn.func_code.co_code[i + 2]) << 8) +
      ord(fn.func_code.co_code[i + 1])
     ]] = i - 3
     # nop the code and move up
     new_code[i-3:i-3+7] = nop7
     i += 4
    elif fn.func_code.co_names[
     (ord(fn.func_code.co_code[i - 1]) << 8) +
     ord(fn.func_code.co_code[i - 2])
    ] == 'goto':
     gotos[fn.func_code.co_names[
      (ord(fn.func_code.co_code[i + 2]) << 8) +
      ord(fn.func_code.co_code[i + 1])
     ]] = i - 3
     # move up only (resolve all gotos in the next loop)
     i += 4

 # change gotos to jumps
 for label,index in gotos.items():
  if label not in labels:
   raise MissingLabelError("Missing label: %s"%label)

  target = labels[label] + 7 # skip NOPs
  new_code[index] = chr(dis.opmap['JUMP_ABSOLUTE'])
  new_code[index + 1] = chr(target & 255)
  new_code[index + 2] = chr((target >> 8) & 255)
  # no need to patch the last 4 bytes: they are unreachable

 # create new function from existing function
 newcode = type(fn.func_code)(fn.func_code.co_argcount,
      fn.func_code.co_nlocals,
      fn.func_code.co_stacksize,
      fn.func_code.co_flags,
      ''.join(new_code),
      fn.func_code.co_consts,
      fn.func_code.co_names,
      fn.func_code.co_varnames,
      fn.func_code.co_filename,
      fn.func_code.co_name,
      fn.func_code.co_firstlineno,
      fn.func_code.co_lnotab)
 fn.func_code = newcode
 return fn
```
