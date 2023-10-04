# ⭐ Joker Cloner ⭐

### ✨ A shitty tool to clone Wi-Fi profiles from a PC. ✨

---

- Hello cool Script Kiddie of the internet!
- This shit was developed with the intention of
- impressing your friends and getting some Wi-Fi passwords.

> ⚠️ » Never use it to harm anyone.

---

# How does it work? 🤔:

This is possible thanks to the Windows NetSH API, which allows you to export Wi-Fi network profiles
from your PC.

> ⚠️ » Compatibility notice: This API works fine on Windows 10/11, but I haven't tested it on 7, 8 or
> 8.1. Therefore, check its availability if you intend to use this script on an older system.

### `1 -` 🍜 Updater:

So when you run this script, Updater will try to download the latest files from this repository.

> ⚠️ » if the download takes more than 5 seconds, it will be skipped.

### `2 -` 🎭 Fake logs:

While everything is being copied, fake logs will be displayed to impress and entertain you and your
friends, but it is also possible to do this in a subtle way.

> 💡 » Press ESC to end the process or press S to disable logging.

> ⚠️ » Ending the process will stop all tasks and close the console, even if they are not finished
> yet

### `3 -` 💰🏴‍☠️ The best part:

If everything goes well, your reward will be in the Data folder, go there and be happy

# How to install 🤔

### `1 -` 🛠️ Download this tool to get started:

- If you want to compile Joker, you will need to download [DENO](https://deno.com/) on your computer

> ⚠️ » Recommended version: ^1.37.1

### `2 -` 📁 Download or clone the repository:

```bash
Code > Download ZIP

or

git clone https://github.com/Sunf3r/Joker # Clone this repo
```

### `3 -` 🚀 Getting Started

First of all, open the script folder in the terminal:

```bash
cd path/to/Joker
```

You can compile it to an EXE and copy to a Pen Drive with the other .ts files:

```bash
# In this case, the EXE serves as a runtime to execute the Updater and other files

deno compile -A Main.ts
```

Or you can test on your own machine:

```
deno run -A Updater.ts
```
