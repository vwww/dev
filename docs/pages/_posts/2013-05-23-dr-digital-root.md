---
title: Digital Roots
date: "2013-05-23 17:56:00 -0700"
categories: Math Programming
blog_tags: Math Programming PHP Python
---
What <mark>happens to the digital root</mark> as the numbers increase?

| n   | dr(n) |
| --- | ----- |
|  0  | 0     |
|  1  | 1     |
|  2  | 2     |
|  3  | 3     |
|  9  | 9     |
| 10  | 1     |
| 11  | 2     |
| 12  | 3     |
| 18  | 9     |
| 19  | 1     |

```
 n | dr(n)
---+------
 0 | 0
 1 | 1
 2 | 2
 3 | 3
 9 | 9
10 | 1
11 | 2
12 | 3
18 | 9
19 | 1
```

It looks like it is really just <mark>a cycle that goes from 1-9 over and over again</mark> (except 0). This can be represented using <mark>modulus</mark>.

$$dr(x) = 1 + (x - 1) \bmod 9$$

What happens if n < 0? Well, <mark>I've decided to just use the absolute value</mark> of it. That means that `dr(-1) = 1`.

Here is some PHP code:

```php
<?php
for($i = -11; $i <= 20; ++$i)
	echo "dr($i) = ".(1 + (abs($i) - 1) % 9);
```

See that? There is <mark>no need for looping and recursion (nor iteration)</mark> to calculate the digital root. Why take O(&#8811; 1) time when you can take O(1) time?

Many languages handle negative modulus with truncation, but a special case must be created for some languages that use floored division:

```python
# Python
def dr(i):
  if i:
    return 1 + (abs(i) - 1) % 9
  return 0

for i in range(-11, 20 + 1):
  print "dr(%d) = %d" % (i, dr(i))
```
