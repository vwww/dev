---
title: How to play backups on a Wii
date: "2009-07-16 12:59:00 -0700"
category: Gaming
blog_tags: Gaming Hacks Nintendo Nintendo-Wii
---
**DISCLAIMER:** I am <mark>not responsible for your bricked Wii</mark>(s). Also, this article is very old now.

I will tell you how to play backups on a Nintendo Wii. For some things, I will provide a link, and for some, I will not, so find it yourself if necessary.

<!--more-->

You need the following:

1. a Wii
2. an <mark>SD card</mark> that holds at least <mark>512 MB</mark>
3. The <mark>files</mark> that I tell you to get

Preparation

1. First of all, <mark>download **bannerbomb**</mark> ([bannerbomb.qoid.us](https://bannerbomb.qoid.us/)).
   **bannerbomb** is an exploit that allows you to boot a *.elf* or a *.dol* from an SD card. Extract the *.zip* and copy to the SD. You can use the **Twilight Hack** if you have Twilight Princess, but I don't recommend it.
2. <mark>Download the **HackMii installer**</mark> ([bootmii.org/download/](https://bootmii.org/download/)), extract the *.zip* and rename `installer.elf` to `boot.elf`
3. <mark>Create a folder called `Apps`</mark> on your SD root
4. <mark>Download **WAD Manager**</mark> 1.5 and put the folder into your `Apps` folder
    * NOTE: It should be something like this: `/SD/Apps/wadmanager/`(boot.dol\[, icon.png\]\[, meta.xml\])
5. Also get <mark>**Anytitle Deleter** (DB</mark>, for noobs)
6. You will probably want to install **cIOScorp**, which is a package of 21 different Custom IOSes
    * You cannot uninstall a cIOS (or your Wii becomes bricked); just overwrite with the original IOS
    * Only use this tool if you know what you're doing (<mark>remove a channel, but not an IOS</mark>)
7. <mark>Create a folder called `wad`</mark> on your SD root
8. <mark>Put your favourite *Backup* **Launcher Channel**</mark> into the `wad` folder
    * A great channel is <mark>**Gecko OS**</mark> if using cIOScorp
      * Channel (*.wad*): I have one; I'll upload soon!
      * *.dol* file: [wiibrew.org/wiki/GeckoOS](https://wiibrew.org/wiki/GeckoOS)
      * I use **Gecko OS** 1.9.1
      * Use **NeoGamma** instead if you do not have cIOScorp.
    * <mark>Without **cIOScorp**, use **NeoGamma**</mark>
      * [Search](https://www.google.com/search?q=NeoGamma) for a download.
      * Use **Gecko OS** instead if you have **cIOScorp**.
    * Put <mark>`Homebrew-Channel-1.0.3-HAXX.wad`</mark> into it if using **cIOScorp**

Installation

1. Now <mark>put the SD in</mark>to the Wii.
2. Goto <mark>Wii &raquo; Data Management &raquo; Channels</mark>
3. A pop-up will ask you if you want to boot the *.elf* or not. <mark>Click yes</mark>.
4. <mark>Press 1</mark> when it tells you to.
5. <mark>Install the **HomeBrew Channel**</mark> (Oh no, it is upside down! Well, we can fix that)
6. Use the **HomeBrew Channel** and <mark>load **WAD Manager**</mark>. <mark>Install the old version (1.0.3)</mark> of the Homebrew Channel
7. Exit and <mark>use **Anytitle Deleter** to delete the newer **Homebrew Channel**</mark>
8. <mark>Reboot the Wii **manually**</mark> because the "*loader*" is now missing
9. <mark>Install the stuff you need</mark> like the **Gecko OS Channel**, **DVDx** in IOS201, and cIOS201.

<mark>Enjoy!</mark>
