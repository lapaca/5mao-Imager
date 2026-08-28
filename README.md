Because I've been generating too many images lately, I built this tool for my own convenience. Feel free to grab it if you need it – it's fully open‑source and ready to run out of the box. No need to learn complex prompts, and no need to set up a local GPU.

How simple is it?
Forget complex prompt engineering, heavy GPU rigs, or expensive monthly Midjourney plans. All you need to do is paste 2 links (an input source and an output destination). 5mao‑Imager handles the rest.

How cheap is it?
We’ve pushed the cost efficiency to the absolute technical limit: generate up to 180 high‑definition images for as low as (under $0.05)! Whether you are batch‑creating wallpapers, social media covers, or e‑commerce product shots, this tool saves you a fortune. Just copy, paste, and run. Three simple steps to explode your productivity!

⚡ Ultra‑simple 2‑Link Setup:

Updates:

Fixed the bug where persisted base64 history caused the page to freeze on refresh.

Added support for text‑to‑image and image‑to‑image (image editing) features.

Added support for more API types. Note that some third‑party APIs do not natively support certain aspect ratios, such as 9:16.

Quick launch on macOS
For local non‑technical users on macOS, the repo root includes:

imager.app: double‑click to launch through Terminal

imager.command: fallback launcher if macOS blocks the app bundle

The launcher installs dependencies if needed, starts the local Vite server, and opens http://127.0.0.1:5173/ automatically.

