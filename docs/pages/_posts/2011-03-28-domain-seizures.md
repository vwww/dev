---
title: Domain Seizures
date: "2011-03-28 11:27:00 -0700"
category: Programming
blog_tags: DNS Domains Programming Web
---
I have noticed that <mark>seized domains all have one thing in common; their nameservers</mark> are:

<mark>ns1.seizedservers.com (74.81.170.109)</mark>

<mark>ns2.seizedservers.com (74.81.170.108)</mark>

and result in an A record to <mark>[74.81.170.110](http://74.81.170.110)</mark>.

---

Just for fun, I have set up a record pointing to their seizure server on one of my subdomains.

NOTE: **Neither my *sub-domain* nor my *domain* has been seized**.

[seizure.victorz.ca](http://seizure.victorz.ca) &rarr; A: 74.81.170.110

If I want the <mark>entire subdomain</mark> allocated (seizure AND \*.seizure), I could <mark>use NS records</mark> instead.
