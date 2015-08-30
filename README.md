Bubble Painter [![Gittip](http://img.shields.io/gittip/kethinov.png)](https://www.gittip.com/kethinov/)
===

Apple removed the ability to customize the colors of the message bubbles in [Messages.app](http://en.wikipedia.org/wiki/Messages_%28application%29#OS_X_version) in Mac OS X 10.10 Yosemite. This app gives you back that ability.

<a href='https://raw.githubusercontent.com/kethinov/BubblePainter/master/screenshot.png'><img src='https://raw.githubusercontent.com/kethinov/BubblePainter/master/assets/screenshot.png'></a>

How to install
===

First [download latest version](https://github.com/kethinov/BubblePainter/releases/latest) <a href='https://github.com/kethinov/BubblePainter/releases/latest'><img src='https://raw.githubusercontent.com/kethinov/BubblePainter/master/dev/appicon.png' width='52' height='52'></a>

Then if you're running OS X 10.11 El Capitan or a later version of OS X, you will need to disable System Integrity Protection temporarily in order to use Bubble Painter.

Disable System Integrity Protection temporarily
---

On OS X 10.11 El Capitan or later versions of OS X, you must disable System Integrity Protection temporarily to use this app.

*Note: none of this is necessary on OS X 10.10 Yosemite. Only OS X 10.11 El Capitan or later versions of OS X.*

Here's how:

Restart your Mac and hold down <img src='https://raw.githubusercontent.com/kethinov/BubblePainter/master/assets/cmdr.png' width='25%' height='25%' alt='⌘ Command + R'> until the Apple logo appears on your screen.

You should now see this:

<img src='https://raw.githubusercontent.com/kethinov/BubblePainter/master/assets/recoverymode.png'>

Now open the `Utilities` menu and select `Terminal`:

<img src='https://raw.githubusercontent.com/kethinov/BubblePainter/master/assets/terminal1.png'>

In the Terminal window that opens, enter the following command: `csrutil disable`

Then press the return key. Afterward you should see the following message:

<img src='https://raw.githubusercontent.com/kethinov/BubblePainter/master/assets/terminal2.png'>

Then restart your Mac and Bubble Painter should work.

**It is recommended that you reenable System Integrity Protection afterwards.**

To reenable System Integrity Protection, follow the same steps as above, but enter the following terminal command instead: `csrutil enable`

Then simply reboot again.

How to hack this app's source code
===

1. Clone this repo
2. To run the app from source code, open `dev/mac/start.command`
3. To do a build, open `dev/mac/build.command`

.app files will be located in the `build` directory.