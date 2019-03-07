---
title: Uniformly Distributed Tweets
date: "2014-03-21 19:49:00 -0600"
category: Programming
blog_tags: Math Programming
---
For [my Grammar bot](https://victorz.ca/bots/grammar), I added a new feature: <mark>GPS coordinates are added to the tweets</mark>. This is <mark>just for fun</mark> and serves no practical purpose.

However, I wanted the tweets to be <mark>uniformly distributed over a sphere</mark>. Earth's shape is not a sphere, but the error is under 1%.

$a$ and $b$ are random values uniformly distributed in $[-1,1]$
$$latitude=\theta=\sin^{-1}(u)$$  
$$longitude=\phi=\pi v=(180^{\circ}) v$$

<!--more-->

According to [Wolfram MathWorld](https://mathworld.wolfram.com/SpherePointPicking.html), points are randomly distributed over a sphere if:

$\theta$ represents latitude and $\phi$ longitude.  
$u$ and $v$ are uniformly distributed in $[0,1]$

$$\theta=\cos^{-1}(2u-1)$$  
$$\phi=2\pi v$$

Adjusting $u$ and $v$, now distributed in $[-1,1]$, we get:
$$\theta=\cos^{-1}(u)$$  
$$\phi=\pi (v + 1)$$

However, latitude is to be in -90 to 90 degrees, not 0 to 180 degrees, and longitude is to be in -180 to 180 degrees, not 0 to 360 degrees.
$$\theta=\cos^{-1}(u)-\frac\pi2=-\sin^{-1}u$$  
$$\phi=\pi v$$

By spherical symmetry, the negative sign can be removed from latitude, and the distribution will remain the same.
