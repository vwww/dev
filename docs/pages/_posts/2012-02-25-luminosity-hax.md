---
title: Luminosity Hacks
date: "2012-02-25 11:44:00 -0700"
category: Hacks
blog_tags: Hacks Gaming Web
---
I have recently found the site known as *Luminosity* through an online advertisement. It is <mark>a site that measures your brain's health through the use of games</mark>.

This is a picture of my results:

For some reason, they don't provide my percentile ranks. Either I have to pay, or they don't have enough 15 year old males to compare me against. The redaction of half the first username really means nothing to me, so I didn't bother to censor the second one.

<div class="img-center">
<img src="{{assets}}victorz/blog_images/2012/luminosity-legit.png" width="400" alt="" />
<span class="caption">My <mark>mostly-legit score</mark> for Luminosity.</span>
</div>

<mark>My overall (mean average) score is 901.4</mark>, which is rounded down by convention. I attained the following scores for speed, memory, attention, flexibility, problem solving, respectively: 1011, 1137, 813, 916, 630.

Flexibility was my worst (around 480), so I hacked to buff up my score, which means <mark>my real overall score is actually around 814</mark>.

I think these scores are reasonable, since their <mark>"*flexibility*" is the ability to *recall vocabulary*, but I have a somewhat limited vocabulary</mark>.

<div class="img-center">
<img src="{{assets}}victorz/blog_images/2012/luminosity-haxed.png" width="400" alt="" />
<span class="caption">My <mark>hacked scores</mark> on a new account</span>
</div>

<!--more-->

Now for some 1337 hacking.

I <mark>modified some requests</mark> they used (they make POST requests with `POST_DATA=<xml>`). Remember to hack Content-Length!

Sample request body (stupid parsers ruined this data and I'm too lazy to fix/redo it):

```
POST_DATA=
\n  13371337\n  55\n  \n    pala\n    se\n    fbe57bbaa85b2e97a8e3cc9ffd887dd5e7f403d0\n    cru\n    13371337\n    13371337\n    13371337\n  \n
```
