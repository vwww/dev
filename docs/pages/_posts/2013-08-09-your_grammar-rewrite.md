---
title: Rewriting the Grammar Bot
date: "2013-08-08 11:53:00 -0700"
category: Programming
blog_tags: English Grammar Programming Python Web
---
I have rewritten [my Grammar bot](https://victorz.ca/bots/grammar). Previously, it had used <mark>regular expressions</mark> to find errors, which means that it must check every character against the rules. In addition, <mark>Python 2.7 doesn't support variable-length lookbehinds</mark>, which <mark>adds extra regular expression checks</mark> for some rules. Also, <mark>it cannot provide good quotes if there is an overlap</mark> between two matches.

<!--more-->

The new system works by <mark>splitting the text into words</mark>. Punctuation is included with the spacers. After that, the words are, in a loop, checked against the rules.

> Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

This would be parsed as

> \[**Lorem**, ( ), **ipsum**, ( ), **dolor**, ( ), **sit**, ( ), **amet**, (, ), **consectetur**, ( ), **adipisicing**, ( ), **elit**, (, ), **sed**, ( ), **do**, ( ), **eiusmod**, ( ), **tempor**, ( ), **incididunt**, ( ), **ut**, ( ), **labore**, ( ), **et**, ( ), **dolore**, ( ), **magna**, ( ), **aliqua**, (.), *(empty word)*\]

and then the words/spaces would be converted to objects so that flags can be set.

Each rule will check <mark>if the current word is a specific word, or in a small list</mark>, so it can skip rules quickly. <mark>If a rule is matched</mark>, it will <mark>mark the word as "modified" and some nearby words as "automatic stop words", and the reason will be flagged</mark>. Some rules will <mark>request a rerun</mark> on specific other rules, which will result in another iteration over the rules list, but <mark>only some rules will be run the next time</mark>.

<mark>If at least one reason has been flagged</mark>, it will proceed to <mark>build the correction list</mark>. It will look at each correction and check a few nearby unflagged words and mark them as "stop words" and one "near word", right beside the last stop word. If there is a <mark>one-word gap between two corrections, that gap will then be flagged</mark>. Then it will build a list of corrections, which includes the <mark>continuous chains of flagged words and spaces in between</mark> them.

The last step is to <mark>randomly generate a message for the user, and include an *english-join*ed version</mark> of the correction list.

Although I must admit that <mark>the new method is not as good as before performance-wise, it delivers more accurate results</mark>, so the performance loss can be considered a trade-off for a more accurate algorithm. And the new method has an advantage over the previous method. For example, this text would have been reported improperly:

> \*Their is you're own. (The\[re\] is you\[r\] own.)

The old system would issue a correction for *"is \[your\] own" and "\[there\] is you're"*. But the problem is that <mark>the quotes are done with the order of the rules, rather than the order in which they appear</mark> in the text and that the <mark>overlap is not merged</mark>. The new system would be able to issue a quote for *"\[there\] is \[your\] own"*.

In addition, this text would not be fully corrected until now:

> \*Your you're own. (You\['re\] you\[r\] own.)

The old system would detect that the user should have said *"Your \[your\] own"* instead. However, <mark>the new system can do a second pass</mark> and report *"\[you're your\] own"*.
