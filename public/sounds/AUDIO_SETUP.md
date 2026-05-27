# 音频文件设置说明

## 所需音频文件

游戏需要以下音频文件才能播放真实的动物音效和开心音效。

### 1. 动物音效文件

请将以下音频文件放入 `sounds/animals/` 目录：

- `cat.mp3` - 猫叫声
- `dog.mp3` - 狗叫声  
- `rabbit.mp3` - 兔子叫声
- `panda.mp3` - 熊猫叫声
- `penguin.mp3` - 企鹅叫声
- `fox.mp3` - 狐狸叫声
- `unicorn.mp3` - 独角兽音效（可用魔法音效）

### 2. 开心音效

请将以下音频文件放入 `sounds/` 目录：

- `happy.mp3` - 开心/欢呼音效（当奇数泡泡落地时播放）

## 获取免费音效的网站

1. **Freesound.org** (https://freesound.org/)
   - 需要注册账号
   - 有大量免费音效，包括动物叫声
   - 选择 CC0 或 CC-BY 许可的音效

2. **Zapsplat** (https://www.zapsplat.com/)
   - 免费下载音效
   - 有动物类别
   - 需要在项目中注明来源

3. **Mixkit** (https://mixkit.co/free-sound-effects/)
   - 完全免费
   - 无需注明来源
   - 音效质量高

4. **BBC Sound Effects** (https://sound-effects.bbcrewind.co.uk/)
   - BBC 提供的免费音效库
   - 仅限个人、教育和研究用途

## 推荐音效关键词

搜索时使用这些关键词：

- Cat: "cat meow", "kitten", "cat purr"
- Dog: "dog bark", "puppy", "dog woof"
- Rabbit: "rabbit squeak", "bunny"
- Panda: "panda call", "bear cub"
- Penguin: "penguin call", "penguin chirp"
- Fox: "fox call", "fox bark"
- Unicorn: "magic sparkle", "fairy dust", "magical chime"
- Happy: "cheer", "yay", "success", "tada", "celebration"

## 音频格式要求

- 格式：MP3
- 时长：0.5-2 秒最佳
- 音量：适中（代码中会自动调整到 40-50%）
- 采样率：44.1kHz 或更高

## 如果暂时没有音频文件

游戏会自动降级使用合成音效（Web Audio API），不会报错。但有真实音频文件会大大提升游戏体验！

## 快速开始示例

以下是可以直接使用的简单音效（使用 Web 浏览器的语音合成）：

```javascript
// 这是备用方案，如果你想快速测试
// 可以用这些简单的音调代替真实音效
```

游戏已经包含了音频加载失败时的错误处理，所以即使音频文件不存在，游戏也能正常运行。

