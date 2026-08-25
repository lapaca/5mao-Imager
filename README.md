因为最近生图太多给自己写个工具更方便，有需要自取，全开源即开即用。
不需要懂复杂的 Prompt 提示词，不需要配置本地显卡



🇬🇧 English
Say goodbye to overpriced AI image subscriptions! 5mao-Imager is here to disrupt the market. It is the ultimate, hyper-budget, and ultra-simplified automated batch image generation tool designed for independent developers, content creators, and e-commerce hustlers.

How simple is it?
Forget complex prompt engineering, heavy GPU rigs, or expensive monthly Midjourney plans. All you need to do is paste 2 links (an input source and an output destination). 5mao-Imager handles the rest.

How cheap is it?
We’ve pushed the cost efficiency to the absolute technical limit: generate up to 180 high-definition images for as low as ¥0.5 (under $0.1)! Whether you are batch-creating wallpapers, social media covers, or e-commerce product shots, this tool saves you a fortune. Just copy, paste, and run. Three simple steps to explode your productivity!

⚡ 极简双链操作 (2-Link Setup): 

更新：
 base64 历史被持久化导致刷新卡住bug解决
 支持文生图和图生图（图片修改）功能
 支持更多api类型，注意部分三方api原生不支持某些格式如9:16

## Quick launch on macOS

For local non-technical users on macOS, the repo root includes:

- `生图imager.app`: double-click to launch through Terminal
- `生图imager.command`: fallback launcher if macOS blocks the app bundle

The launcher installs dependencies if needed, starts the local Vite server, and opens `http://127.0.0.1:5173/` automatically.
