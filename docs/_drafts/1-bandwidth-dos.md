---
layout: post
title: Bandwidth-based Denial-of-Service Attacks
date: "2013-07-19 18:03:00 -0700"
category: Hacks
tags: Web
---
One type of denial-of-service is to starve a resource of its bandwidth. Common methods include a UDP flood, which wastes the available bandwidth, and a TCP (SYN) flood, which occupies all the available connections. These attacks can be distributed (DDoS), or just done by one host (plain DoS).

Those common methods require a host, or a group of hosts, to have enough upstream bandwidth to overpower the downstream bandwidth of the victim.

(picture)

Another method, a reflected attack, reduces the amount of upstream bandwidth required because it is multiplied. However, this reflected attack works better when IP source address is available.

(picture - reflect self)

(picture - reflect others)
