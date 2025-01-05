---
title: Partially Protecting Password Data in Transit
date: "2013-09-27 19:39:00 -0700"
category: Security
blog_tags: Security Web
---
<mark>**HTTP does not encrypt** any traffic</mark>. Any of the <mark>**internet routers** can see and log your traffic</mark>, and your passwords might be compromised if the server does nothing to alleviate this.

On my arcade, my login form requires JavaScript to be more secure, but it is not perfectly secure.

<div class="img-left">
<img src="{{assets}}victorz/blog_images/2013/PasswordMessageHash1.png" width="400" alt="" />
<span class="caption">A diagram of the first transmission, <mark><strong>unprotected</strong> from interception</mark></span>
</div>

The <mark>**first transmission of the password might be intercepted, which is a vulnerability** of this method</mark>.

<!--more-->

However, this is the only time when the password is at risk of interception. Also, the passwords cannot be protected at rest, since the password cannot be salted by the server. Comparing against salted hashes requires the original password to be transmitted. The hashing mere acts as a compression function, so <mark>it is **as if the server stored its passwords in plaintext**</mark>.

<div class="img-right">
<img src="{{assets}}victorz/blog_images/2013/PasswordMessageHash2.png" width="400" alt="" />
<span class="caption"><mark><strong>Protecting</strong> passwords <strong>in transit</strong></mark> by using a <strong>pre-shared secret</strong>.</span>
</div>

During authentication, instead of repeating the first, only <mark>**a hash**</mark> of \[the password (for compression to make it easier to store at the server), fixed data, and a bunch of random data and timestamps\] <mark>is sent, **from which the original password is not easily derived**</mark>. This <mark>prevents **replay attacks**</mark> as the timestamp must be recent (or exceed the last timestamp used, at risk of locking out), but users need to wait 1 second between logins, which is not an issue. Also, <mark>the request can also be denied if the **random data matches the previous**</mark> data, at the risk of a collision. The random data helps to <mark>add more entropy and to **make reversing of the hash** more difficult</mark>. Also, <mark>when the hash can be fully reversed, the **hash algorithm can be changed at any time to increase security, but the passwords must also be changed**</mark>.

This hash can be <mark>rebuilt at and compared against</mark> by the server, since the timestamps and random parts are transmitted in the clear, but the password is not. Basically, <mark>**this is a custom HMAC** that is used to sign a timestamp and a random number</mark> that must not be the one previously used.
