# PROD Test Items (Copy/Paste)

Use these as manual test cases in Shopify PROD. Each entry has a **Title** and multiple **Description** variants (short/long/JP/etc.).

---

## Test Case A — Minimal / Easy Japanese (clean structure)

### Title
Yuzu Citrus Hand Soap (300ml)

### Description — Short (EN)
Bright yuzu scent with a gentle, non-stripping lather. Suitable for daily use.

### Description — Long (EN)
Our Yuzu Citrus Hand Soap combines plant-derived cleansers with a refreshing, natural citrus aroma.

- 300ml pump bottle
- Gentle lather for frequent hand washing
- Clean rinse, no sticky residue
- Made with plant-derived surfactants

Ideal for kitchens, offices, guest bathrooms, and gifting.

### Description — Easy Japanese (JP)
ゆずの香りのハンドソープです。やさしい泡で毎日使えます。300mlのポンプ式です。

### Description — Valuable Japanese (JP)
国産ゆず由来の香りをイメージし、毎日の手洗いが楽しみになるように調香しました。泡切れがよく、洗い上がりはさっぱりです。

### Description — Obscured / messy (EN)
Yuzu Soap!! 300ml. good smell. Great for hands. Clean. use everyday. (some typos) y u z u.

---

## Test Case B — Complex Japanese (technical + nuance)

### Title
Kasuri Weave Cushion Cover (45×45cm)

### Description — Short (EN)
Traditional kasuri-inspired weave with a modern, minimal palette. Durable cotton blend.

### Description — Long (EN)
Woven with a kasuri-inspired pattern, this cushion cover balances heritage texture with modern interiors.

- Cotton blend (feel: crisp, textured)
- Hidden zipper closure
- Care: cold wash, line dry; iron low (avoid direct heat on zipper)

### Description — Complex Japanese (JP)
かすり調の表情を現代的に再構成した織り柄で、経糸と緯糸のテンション差が生む微細な凹凸が手触りに奥行きを与えます。染色ロットによって僅かな色差が生じる場合がありますが、素材の個性としてお楽しみください。裏面はファスナー仕様で、クッションの出し入れが容易です。

### Description — Valuable Japanese (JP)
織り工程で生まれる揺らぎ（ムラ）は不良ではなく、テキスタイルに自然な表情を与える重要な要素です。量産品にはない一点ごとの個体差を価値として捉えています。

### Description — Obscured / messy (JP)
かすり？？45*45 ざっくり。色はロットでちがうかも。ファスナーある。洗濯は冷水で。

---

## Test Case C — High-Intent “Japanese Value” (story-heavy)

### Title
Edo-Inspired Teacup Set (2pcs)

### Description — Short (EN)
Two teacups inspired by Edo-era glazing traditions. Balanced weight and a smooth lip.

### Description — Long (EN)
This two-piece teacup set draws inspiration from Edo-era glazing traditions and contemporary studio pottery.

- Smooth lip feel for comfortable sipping
- Balanced weight for stability
- Subtle variation in glaze depth (each piece is unique)

### Description — Complex Japanese (JP)
江戸期の意匠に着想を得つつ、現代の生活導線に馴染む寸法と重量配分に調整しました。釉薬の溜まりや流れは一点ごとに異なり、同じ表情のものは存在しません。器の個性としてお楽しみください。

### Description — Easy Japanese (JP)
江戸時代の雰囲気をイメージした湯のみ2個セットです。口当たりがよく、安定感があります。

### Description — Valuable Japanese (JP)
「同じものが二つとない」釉薬表現は、焼成温度・窯内位置・湿度など複数要因で決まります。偶然性を設計し、日々の一杯に特別感を添えることを目指しました。

### Description — Obscured (EN)
2 cups. Edo vibe. glaze varies. sip comfy. maybe different each time.

---

## Test Case D — Edge Case (HTML + bullets + mixed language)

### Title
Travel Shoe Cleaner Pen

### Description — Short (EN)
Pocket-sized cleaner pen for quick spot-cleaning on the go.

### Description — Long (HTML-heavy EN)
<p><strong>Instant refresh</strong> for sneakers and leather trims.</p>
<ul>
  <li>Twist-to-dispense</li>
  <li>Soft applicator tip</li>
  <li>Works on rubber midsoles</li>
</ul>
<p>Tip: test on a small area first. Do not soak suede.</p>
<p>JP note: 旅行や出張に便利です。</p>

### Description — Easy Japanese (JP)
持ち運びできる靴用クリーナーペンです。汚れをサッと落とせます。まず目立たない場所で試してください。

### Description — Valuable Japanese (JP)
外出先での“身だしなみ”を最短で整えるため、ペン形状に最適化しました。液量と塗布面積のバランスを意識し、ムダなく使える設計です。

### Description — Obscured / messy (HTML + typos)
<p>Shoe pen!!! works fast</p><ul><li>twist</li><li>clean</li></ul><p>dont use on suede ok??</p>

---

## Test Case E — Ambiguous / Obscured (prompt robustness)

### Title
Aurora “Mystery” Room Spray (limited)

### Description — Short (EN)
A limited room spray with a shifting, layered scent profile.

### Description — Long (EN, intentionally vague/obscured)
This fragrance changes depending on the room, the time of day, and what you’ve just cooked.

Notes (maybe):
- Something citrus… or not
- A warm base that feels like wood but isn’t heavy
- A clean finish that disappears quickly

We can’t describe it better than: “soft light after rain.”

### Description — Complex Japanese (JP)
部屋の温度や時間帯、そして前に漂っていた匂いによって、香りの輪郭が静かに変化します。はっきりとしたノート名で固定せず、「雨上がりの光」のような余韻を目指しました。

### Description — Easy Japanese (JP)
限定のルームスプレーです。時間や場所で香りの感じ方が変わります。雨上がりのようなやさしい香りです。

### Description — Valuable Japanese (JP)
香りの“説明可能性”よりも、体験の一貫性を優先しました。強い主張ではなく、空間に溶け込む設計思想です。

