---
title: Hacking a Flash Payload Crypter with 1 line of code
date: "2013-07-23 10:08:00 -0700"
category: Hacks
blog_tags: ActionScript ActionScript-3 Assembly Flash Hacks Security Web
---
If the flash file puts everything into a binary section and encrypts it, is there any way to decrypt it? If <mark>they cut off the header, you won't be able to memory-dump it</mark>, but would you give up there? Of course not!

Somewhere, <mark>they have the decrypted data so that they can load it</mark>. Just compile some code to <mark>intercept it</mark>, and inject it:

```as3
(new FileReference()).save(_loc_2, "dumped.swf");
```

In RABCDAsm (AS3), it looks like this:

```nasm
findpropstrict      QName(PackageNamespace("flash.net"), "FileReference")
constructprop       QName(PackageNamespace("flash.net"), "FileReference"), 0
getlocal2
pushstring          "dumped.swf"
callpropvoid        QName(PackageNamespace(""), "save"), 2
```

So just <mark>put that in the code before it is loaded (call to `loadBytes`) and replace `getlocal2`</mark> with whatever will put the decrypted data onto the stack. <mark>Once the decrypted data is about to be loaded, you can save it to a file</mark>.

In <mark>AS2, you'd have to create a server script to echo the file back with FileReference</mark>, since it only accepts URL downloads. It's <mark>still feasible</mark> though, but <mark>writing to a SharedObject and extracting from that</mark> might be easier.

In retrospection, I realized that <mark>I can also write a fake header</mark> if I manage to locate the flash data.
