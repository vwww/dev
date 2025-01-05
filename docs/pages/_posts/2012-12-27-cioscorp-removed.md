---
title: cIOSCORP Removal Progress
date: "2012-12-27 18:34:00 -0700"
category: Nintendo-Wii
blog_tags: Nintendo Nintendo-Wii
---
This is a <mark>big list</mark>...

<!--more-->

I've <mark>deleted these</mark> IOSes:

* IOS40
* IOS41
* IOS43
* IOS45
* IOS46
* IOS52

Next, I used <mark>NUSD</mark> to download and package these IOSes:

* IOS9 v1034 (0x40A)
* IOS11 v256 (0x100)
* IOS13 v1032 (0x408)
* IOS14 v1032 (0x408)
* IOS15 v1032 (0x408)
* IOS17 v1032 (0x408)
* IOS20 v256 (0x100)
* IOS21 v1039 (0x40F)
* IOS22 v1294 (0x50E)
* IOS28 v1807 (0x70F)
* IOS30 v2816 (0xB00)
* IOS31 v3608 (0xE18)
* IOS33 v3608 (0xE18)
* IOS34 v3608 (0xE18)
* IOS36 v3608 (0xE18)
* IOS37 v5663 (0x161F)
* IOS38 v4124 (0x101C)
* IOS53 v5663 (0x161F)
* IOS55 v5663 (0x161F)
* IOS56 v5662 (0x161E)
* IOS60 v6400 (0x1900)
* IOS70 v6912 (0x1B00)

Then, I added the <mark>Trucha Bug, ES\_Identify (ES\_DiVerify), and NAND Permissions patches to my IOS36</mark>, just in case I need it later.

I'm <mark>feeling nervous</mark> for the next part...

The next step is to restore IOS50 to v4889 (0x1319), but v5120 (0x1400) is a stub.

~~In addition, I should also <mark>remove all the old stub IOSes</mark>...~~

I have just <mark>decided to update to 4.3U</mark>. I was smart, so I <mark>installed cIOS249 into cIOS 239 so that it wouldn't be overwritten</mark>. After that, <mark>I restored cIOS249, and deleted cIOS239</mark>. I <mark>didn't bother to remove the stubs</mark>.

I also <mark>installed the stub into IOS50</mark>, since I won't need it anymore, but that was sort of risky.
