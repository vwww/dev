---
layout: post
title: Petersburg Paradox
date: "2013-11-30 14:32:52 -0700"
category: Math
---
The number of coin tosses in a row that are a specific kind is represented this formula (where r = 1 - random number in [0, 1) = random number in (0, 1])

-floor(lb r)

For this, we will approximate it with -(lb r)

You get $1 for one coin, $2 for two, $4 for three, and so on. This means that you get:
2^(coins - 1) = 2^(-lb r - 1) = 2^(-(lb r + 1)) = 1/2^(lb r + 1) = = 1/2*2^(lb r) = 1/2r

Well, an entry fee also has to be paid! Let's say that it's $20. The profit is
1/2r - 20

As you can see, you have a small chance of making a lot of money, but you're losing 39/40 of the time!

With other entrance fees:

1/2r - f

Solve for r when profit = 0 to get the chance of making a profit
1/2r - f = 0
1/2r = f
1/r = 2f
r = 1/2f
