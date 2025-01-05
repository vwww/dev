---
title: Wii Backup Problems -- Mario Kart
date: "2009-11-20 14:17:00 -0700"
category: Gaming
blog_tags: Gaming Nintendo Nintendo-Wii
---
I just tried to play Mario Kart but it would not work. I got the `An error has occurred, please eject the disc...` message but it is <mark>not Error #002</mark>.

> cIOScorp 3.5 has cIOS36 as IOS36 v3094 with <mark>rev1**3** DIP + ES\_**Identify**</mark> Patch + NAND Permissions Patch

> cIOScorp 3.4 has cIOS36 as IOS36 v3094 with <mark>rev1**2** DIP + ES\_**DiVerify**</mark> Patch + NAND Permissions Patch

As you can see, <mark>the difference is the DIP and the patch</mark>. Mario Kart needs ES\_DiVerify (Disc Verify) to function, but I do not know what ES\_Identify does, except allow you to identify as the Super User or something

I wish cIOScorp 3.6 will have both patches, the ES\_Identify and ES\_DiVerify.
