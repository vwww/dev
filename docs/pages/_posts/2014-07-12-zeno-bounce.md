---
title: Zeno's Paradox for a Bouncing Ball
date: "2014-07-12 19:42:00 -0600"
category: Math
blog_tags: Math
---
If a ball is thrown up to a height $h$, falls to the ground, and retains a certain fraction $a$ of its energy when it bounces, it will stop bouncing after a certain amount of time. This is paradoxical as it will have bounced an infinite number of times when it stops.

<!--more-->

The fraction of retained kinetic energy is the same as the fraction of retained height:

$$E\_n=aE\_{n-1}$$  
$$mgh\_n=mgh\_{n-1}a$$  
$$h\_n=h\_{n-1}a$$  
$$h\_n=h\_1a^{n-1}$$

The total distance traveled must be finite, as it is a geometric series that converges:
$$d=\displaystyle\sum\_{n=1}^\infty h\_n=\displaystyle\sum\_{n=0}^\infty a^nh\_1=\frac{h\_1}{1-a}$$

The time it takes for a ball to reach a certain height and come back down is:
$$t\_n=\sqrt{\frac{8h\_n}{g}}=(\sqrt{a})^{n-1}\sqrt{\frac{8h\_1}{g}}=t_1\sqrt{a}^{n-1}$$

Time also converges and the total time is also finite:
$$T=\displaystyle\sum\_{n=1}^\infty t\_n=\sqrt{\frac{8h\_1}{g}}\displaystyle\sum\_{n=0}^\infty (\sqrt{a})^n=\sqrt{\frac{8h\_1}{g}}\left(\frac{1}{1-\sqrt{a}}\right)=\frac{t_1}{1-\sqrt{a}}$$

After that amount of time, the ball has bounced an infinite number of times and has stopped bouncing. After each bounce, the ball's distance is smaller, but the time is also smaller, so both the total time and distance converge to a finite value.
