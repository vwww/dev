---
title: FizzBuzz Test
date: "2012-03-07 17:26:00 -0700"
category: Programming
blog_tags: Math Programming PHP
---
This is a controversial way to filter out ~~noobs~~ people who can't program. Luckily for me, I did very well at it. So what is this challenge about?

> Write a program that prints the <mark>numbers from 1 to 100</mark>. But for <mark>multiples of three, print "Fizz" instead of the number</mark>, and for the <mark>multiples of five, print "Buzz"</mark>. For numbers which are <mark>multiples of both three and five, print "Fizz-Buzz"</mark>.

Well, isn't that easy... it only took me less than two minutes versus the people who either can't do this or take a long time to.

```php
<?php
// 70 second solution!
for($i=1;$i<;=100;++$i){
	$a = !($i % 3);
	$b = !($i % 5);
	if($a) echo $b ? "Fizz-Buzz": "Fizz";
	elseif($b) echo "Buzz";
	else echo $i;
}
```
