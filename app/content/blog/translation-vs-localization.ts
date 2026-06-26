import type { BlogArticle } from "./types";

export const translationVsLocalization: BlogArticle = {
  slug: "translation-vs-localization-shopify",
  publishedAt: "2026-06-28",
  category: "localization",
  readingTime: { en: 12, ja: 14 },
  heroImage: "/blog/translation-vs-localization-hero.png",
  ogImage: "/blog/translation-vs-localization-hero.png",
  content: {
    en: {
      title: "Product Translation vs Localization: Why Direct Translation Kills Your Cross-Border Sales",
      subtitle: "Your products are translated. Your conversion rate abroad is still 40% lower than domestic. The problem isn't your products — it's the gap between translation and localization that most Japanese merchants don't realize exists.",
      metaTitle: "Translation vs Localization for Shopify | Why Direct Translation Kills Sales | Aganim AI",
      metaDescription: "Learn why translated Shopify product pages underperform abroad. Real before/after examples from Japanese brands showing the conversion gap between translation and true localization.",
      heroAlt: "Split-screen showing a Japanese product page with literal English translation on one side and culturally localized version on the other, with conversion rate indicators",
      tldr: "Translation converts words. Localization converts customers. Japanese merchants lose 30-60% of potential international sales because translated product pages miss cultural selling psychology, local search intent, and market-specific trust signals. This guide shows exactly where the gap is and how to close it — with real examples from sake, knives, skincare, and ceramics.",
      sections: [
        {
          type: "heading",
          level: 2,
          content: "The Expensive Gap Nobody Talks About",
        },
        {
          type: "text",
          content: "You did everything right. You built a beautiful Shopify store with carefully crafted Japanese product pages. You installed Translate & Adapt or ran your descriptions through DeepL. Your English pages look grammatically correct. Yet your international conversion rate sits at 0.8% while your domestic rate is 3.2%. The gap isn't a mystery — it's the difference between translation and localization, and it costs Japanese cross-border merchants billions of yen collectively every year.",
        },
        {
          type: "text",
          content: "Here's a simple test: Take your best-selling product's English page and show it to an American consumer alongside a competing American brand's page for a similar product. Ask them which feels more trustworthy, more compelling, more 'native.' In nearly every case, the translated page loses — not because of grammar, but because of psychology. The words are correct. The selling is wrong.",
        },
        {
          type: "callout",
          content: "Stores that move from translation to localization typically see a 40-120% increase in international conversion rates within 90 days. The ROI compounds because better conversion also improves ad efficiency, reducing cost-per-acquisition across all paid channels.",
          variant: "stat",
        },
        {
          type: "heading",
          level: 2,
          content: "The Translation Spectrum: From Machine Output to Full Transcreation",
        },
        {
          type: "text",
          content: "Translation isn't binary. There's a spectrum of approaches, each with different costs, quality ceilings, and appropriate use cases. Understanding where each tool sits on this spectrum is the first step to fixing your international conversion problem.",
        },
        {
          type: "image",
          src: "/blog/localization-guide/translation-spectrum.png",
          alt: "Visual spectrum from literal machine translation on the left through human translation, localization, and full transcreation on the right, with quality and cost indicators",
          caption: "The translation spectrum — most Japanese merchants are stuck at levels 1-2 when their products need level 3-4 to compete internationally.",
          width: "full",
        },
        {
          type: "list",
          style: "numbered",
          items: [
            {
              label: "Machine Translation (Google Translate, DeepL)",
              body: "Converts words between languages. Fast, cheap, grammatically acceptable for simple text. Completely misses cultural context, selling psychology, and market-specific keyword optimization. Appropriate for: internal documents, customer support chats, basic informational pages.",
            },
            {
              label: "Assisted Translation (Shopify Translate & Adapt)",
              body: "Machine translation with a Shopify-aware layer. Handles product-specific terminology slightly better. Still produces literal output that reads as 'translated' to native speakers. Appropriate for: stores testing international demand before investing in proper localization.",
            },
            {
              label: "Human Translation (Professional Translators)",
              body: "Accurate, natural-sounding, culturally aware of basic nuances. However, translators typically preserve the source text's structure and selling angle — they translate what you wrote, not what the target market needs to hear. Appropriate for: legal text, brand stories, about pages.",
            },
            {
              label: "Localization (Market-Adapted Content)",
              body: "Restructures the message for the target market's buying psychology. Changes emphasis, reorders benefits, adapts social proof, converts units, and targets local search terms. The source text is a starting point, not a constraint. Appropriate for: product descriptions, landing pages, ad copy.",
            },
            {
              label: "Transcreation (Complete Market Reimagining)",
              body: "Creates entirely new content inspired by the original but designed from scratch for the target market. Different headlines, different emotional appeals, different imagery suggestions. Appropriate for: hero banners, campaign slogans, luxury brand positioning.",
            },
          ],
        },
        {
          type: "text",
          content: "Most Japanese merchants selling internationally are stuck at level 1 or 2. Their products — often premium craftsmanship items that deserve level 4 treatment — are being represented by machine-translated text that strips away every element that makes them compelling. A ¥30,000 hand-forged kitchen knife described with Google Translate text is competing against American brands with professional copywriters. It's not a fair fight.",
        },
        {
          type: "heading",
          level: 2,
          content: "Real Examples: What Literal Translation Actually Does to Your Products",
        },
        {
          type: "text",
          content: "Abstract concepts only go so far. Let's look at real product categories where Japanese merchants consistently lose international sales to translation problems.",
        },
        {
          type: "heading",
          level: 3,
          content: "Example 1: Premium Kitchen Knives",
        },
        {
          type: "text",
          content: "Japanese source: 「越前打刃物の伝統を受け継ぐ職人が、一本一本丹精込めて鍛造。青紙スーパー鋼を使用し、切れ味と耐久性を極限まで追求した逸品です。日々のお料理が変わる一振りをお届けします。」",
        },
        {
          type: "comparison",
          beforeLabel: "Literal Translation (DeepL)",
          afterLabel: "Localized for US Market",
          beforeImage: "/blog/localization-guide/before-literal.png",
          afterImage: "/blog/localization-guide/after-localized.png",
          beforeAlt: "DeepL literal translation of Japanese knife description showing awkward phrasing",
          afterAlt: "Properly localized knife description targeting American cooking enthusiasts",
          caption: "Same knife, same source material. The localized version targets what American buyers actually care about: performance, comparisons they understand, and social proof they trust.",
        },
        {
          type: "text",
          content: "The literal translation reads: 'A craftsman who inherits the tradition of Echizen forged blades forges each one with care. Using Aogami Super steel, this is a masterpiece that pursues sharpness and durability to the utmost. We deliver a swing that changes your daily cooking.'",
        },
        {
          type: "text",
          content: "The problems: 'Echizen forged blades' means nothing to American buyers — they need 'a 700-year-old Japanese bladesmithing tradition.' 'Aogami Super steel' needs context — 'the same high-carbon steel preferred by professional Japanese chefs, holding its edge 3x longer than German stainless.' 'A swing that changes your daily cooking' is poetic in Japanese but confusing in English — American buyers want 'Glides through tomatoes without crushing. Breaks down a butternut squash without fighting. The knife that makes you wonder why you waited.'",
        },
        {
          type: "heading",
          level: 3,
          content: "Example 2: Japanese Skincare",
        },
        {
          type: "text",
          content: "Japanese source: 「肌に吸い込まれるようなテクスチャーで、もっちりとしたハリ肌へ。独自開発のナノ化セラミド配合で、角質層の奥深くまで浸透。敏感肌の方にも安心してお使いいただけます。」",
        },
        {
          type: "text",
          content: "Literal translation issues: 'Texture that is absorbed into the skin' sounds alarming rather than luxurious in English. 'Mochi-like firm skin' has no cultural reference for Western buyers — they respond to 'plump, bouncy, glass-skin.' 'Nano-sized ceramide' needs scientific credibility framing for Western markets. And 'safe for sensitive skin' is a regulatory minefield — in the US/EU, you cannot make skin claims without specific compliance language.",
        },
        {
          type: "callout",
          content: "Regulatory warning: Japanese skincare descriptions often include claims (肌に浸透, エイジングケア) that require specific disclaimers or reformulation for US FDA and EU Cosmetics Regulation compliance. Direct translation of these claims can result in your product listings being flagged or removed.",
          variant: "warning",
        },
        {
          type: "heading",
          level: 3,
          content: "Example 3: Sake",
        },
        {
          type: "text",
          content: "Japanese source: 「山田錦を45%まで磨き上げた純米大吟醸。華やかな吟醸香と繊細な甘みが口いっぱいに広がります。冷酒でお楽しみください。」",
        },
        {
          type: "text",
          content: "For American buyers: They don't know what '45% polishing ratio' means. They need: 'Polished to 45% — meaning 55% of each rice grain is milled away to reach the pure starchy center, producing an exceptionally clean, refined flavor. (For context: regular table sake uses rice polished to only 70%.)' The tasting notes need wine-adjacent language: 'Aromas of fresh melon and white flowers give way to a silky, delicately sweet palate with a crisp finish.' And 'serve chilled' needs context: 'Best served between 5-10°C (41-50°F) in a wine glass to fully appreciate the aromatic complexity.'",
        },
        {
          type: "text",
          content: "For Korean buyers: The approach shifts entirely. Korean sake buyers are often younger, trend-conscious, and buying for social occasions. The same product needs: emphasis on the brewery's Instagram-worthy aesthetics, food pairing with Korean cuisine (삼겹살과 함께), and positioning against Korean craft soju as a premium alternative.",
        },
        {
          type: "heading",
          level: 2,
          content: "Cultural Selling Psychology: Why Each Market Needs a Different Angle",
        },
        {
          type: "text",
          content: "Translation assumes the same selling angle works everywhere. It doesn't. What motivates a purchase decision varies dramatically by culture, and your product descriptions need to mirror these differences. This isn't about preference — it's backed by decades of cross-cultural consumer psychology research.",
        },
        {
          type: "image",
          src: "/blog/localization-guide/cultural-angles.png",
          alt: "Diagram showing how the same Japanese ceramic tea cup is positioned differently for US, EU, Korean, and Taiwanese markets with different benefit hierarchies",
          caption: "Same product, four markets, four completely different lead benefits. Translation preserves one angle; localization adapts for each.",
          width: "wide",
        },
        {
          type: "table",
          headers: ["Market", "Primary Purchase Driver", "Trust Signals", "Description Style", "Example Lead (Matcha)"],
          rows: [
            ["Japan (domestic)", "Craftsmanship narrative, seasonal relevance, producer story", "Awards, region of origin, artisan lineage", "Poetic, sensory, understated", "京都宇治の老舗茶園が育む、一番茶のみを使用した極上の抹茶"],
            ["United States", "Personal benefit, performance, lifestyle upgrade", "Reviews, celebrity endorsements, scientific backing", "Direct, benefit-first, comparative", "Ceremonial-grade matcha from Kyoto's top tea farms. 137x the antioxidants of green tea. The clean energy upgrade your morning routine needs."],
            ["Germany/EU", "Quality standards, sustainability, technical specs", "Certifications (organic, fair-trade), lab testing, origin transparency", "Factual, detailed, specification-rich", "Certified organic ceremonial matcha. Single-origin Uji, Kyoto. Stone-ground from first-harvest tencha leaves. EU organic certified, heavy-metal tested."],
            ["South Korea", "Trend alignment, aesthetic appeal, social proof", "Influencer usage, visual packaging, K-beauty/K-food crossover", "Trend-aware, visual, community-driven", "교토 우지 최고급 말차 🍵 인스타에서 핫한 말차라떼 레시피와 함께! 항산화 효과로 피부 관리까지"],
            ["Taiwan/Hong Kong", "Heritage authenticity, health benefits, gift-worthiness", "Japanese origin premium, traditional preparation, luxury packaging", "Respectful, heritage-focused, health-conscious", "來自京都宇治的頂級抹茶，傳承百年茶道文化。每日一杯，養生從細節開始。精美包裝，送禮首選。"],
          ],
          caption: "The same matcha product needs fundamentally different messaging per market — not just different languages.",
        },
        {
          type: "text",
          content: "Notice that translation — even perfect human translation — would produce the same message in every market. It would faithfully convert the Japanese 'craftsmanship narrative' style into English, German, and Korean. But American buyers don't buy matcha for craftsmanship — they buy it for energy and antioxidants. German buyers want certifications. Korean buyers want trend validation. You're not translating text; you're translating purchase motivation.",
        },
        {
          type: "heading",
          level: 2,
          content: "Beyond Text: What Else Needs Localization",
        },
        {
          type: "text",
          content: "Most merchants think localization means text. It doesn't. Text is only 60% of the localization picture. Here's what else gets missed:",
        },
        {
          type: "list",
          style: "bullet",
          items: [
            {
              label: "Units and Sizing",
              body: "Japanese clothing sizes (M/L/LL/3L) mean nothing internationally. A Japanese M is roughly a US XS/S. Keeping Japanese sizing without conversion or detailed measurement charts guarantees returns and abandoned carts. Same for weights (g → oz for US), volumes (ml → fl oz), and dimensions (cm → inches for US, cm stays for EU).",
            },
            {
              label: "Currency Psychology",
              body: "¥2,980 feels like a deal in Japan. $27.50 (the converted price) feels arbitrary in the US. Local pricing strategy — $24.99 or $29.99 — matters for conversion. But beyond the number: Japanese consumers expect tax-excluded pricing (税抜); Americans expect tax-included pricing displayed upfront.",
            },
            {
              label: "Product Images and Lifestyle Context",
              body: "A skincare product photographed on a tatami mat with a Japanese model communicates 'authentic Japanese beauty' domestically. For US buyers, it may communicate 'foreign, unfamiliar, not for me.' International lifestyle shots showing diverse contexts increase conversion 15-25% over Japan-only imagery.",
            },
            {
              label: "Social Proof Formatting",
              body: "Japanese reviews tend to be long, detailed, and deferential. American buyers skim for star ratings and short, punchy quotes. Korean buyers trust influencer screenshots and purchase count indicators (1만개 판매!). Your review display strategy needs market adaptation.",
            },
            {
              label: "Regulatory and Compliance Text",
              body: "Japanese product pages often display 特定商取引法 (tokushoho) information, 食品表示法 labels, or JIS certifications. These are meaningless abroad and clutter the page. Meanwhile, US buyers expect shipping/return policies prominently displayed, and EU buyers expect GDPR notices and CE marking information.",
            },
            {
              label: "SEO and Search Intent",
              body: "Japanese buyers search '包丁 おすすめ' (knife recommendation). American buyers search 'best Japanese chef knife under $200.' These represent completely different content strategies — the American query implies comparison-shopping behavior that your product page needs to address directly.",
            },
          ],
        },
        {
          type: "heading",
          level: 2,
          content: "The Shopify Translation Tool Landscape: What Merchants Actually Experience",
        },
        {
          type: "text",
          content: "I've tested every major translation app on the Shopify App Store, talked to merchants who've used them for 6+ months, and read through hundreds of app store reviews. Here's what I found — and it's messier than the marketing pages suggest.",
        },
        {
          type: "heading",
          level: 3,
          content: "Shopify Translate & Adapt — The Default Everyone Starts With",
        },
        {
          type: "text",
          content: "It's free, it's native, and it's the obvious first choice. For a small store testing one or two new markets, it works fine. Here's where it falls apart: merchants consistently report that translations are 'weird and inconsistent,' copied products inherit old translations that won't auto-update, and there's no glossary system — so your brand name gets translated differently every time. The 2-language auto-translate cap means anything beyond two markets requires manual work or a paid tool.",
        },
        {
          type: "text",
          content: "The most frustrating limitation I've heard from merchants: 'Theme translations are bound to the theme ID. I switched themes and lost 6 months of translation work.' That's not an edge case — it hits every store that upgrades their theme.",
        },
        {
          type: "heading",
          level: 3,
          content: "Weglot — Powerful But Expensive at Scale",
        },
        {
          type: "text",
          content: "Weglot works through a proxy that translates your entire site in real-time, including dynamic content from third-party apps. The setup is genuinely effortless — install, pick languages, done. The problems are economic: pricing scales by word count AND language count. Merchants report costs 'escalating without warning' as their catalog grows. More concerning: if you cancel Weglot, your translations disappear entirely because they're stored on Weglot's servers, not in Shopify.",
        },
        {
          type: "heading",
          level: 3,
          content: "Transcy, LangShop, and the Multi-Engine Approach",
        },
        {
          type: "text",
          content: "Newer apps like Transcy offer multiple AI engines (Google Translate, OpenAI, DeepL, Grok, Baidu) and let you pick which one handles each language. LangShop supports 241+ languages with native Shopify integration. These are legitimate improvements over Translate & Adapt — but they still treat the problem as translation. Better translation engines produce better grammar. They don't produce localized selling copy that converts.",
        },
        {
          type: "table",
          headers: ["Tool", "Price", "Auto-Translate", "Glossary", "3rd-Party Content", "Data Ownership", "Localization Quality"],
          rows: [
            ["Shopify Translate & Adapt", "Free", "2 languages only", "No", "No", "You own it", "★☆☆☆☆ (literal)"],
            ["Weglot", "From $17/mo (scales by words)", "Unlimited", "Yes", "Yes", "Weglot owns it", "★★☆☆☆ (better grammar)"],
            ["Transcy", "Free plan available", "Multi-engine AI", "Yes", "Yes", "You own it", "★★☆☆☆ (better grammar)"],
            ["LangShop", "Free – varies", "241+ languages", "Yes", "Limited", "You own it", "★★☆☆☆ (better grammar)"],
            ["Langify", "$17.50/mo flat", "None (manual only)", "Yes", "Limited", "You own it", "★★★★☆ (human quality)"],
            ["Professional Agency", "¥15-30/word", "N/A (human)", "Custom", "All content", "You own it", "★★★★★ (perfect)"],
            ["Aganim AI", "Free tier available", "12 locales", "Brand Soul memory", "Descriptions + SEO", "You own it (native API)", "★★★★☆ (localized, not translated)"],
          ],
          caption: "Ratings reflect localization quality, not translation accuracy. A tool can produce grammatically perfect text (5★ accuracy) while scoring low on localization because it doesn't adapt the selling angle.",
        },
        {
          type: "heading",
          level: 3,
          content: "The Gap Every Translation Tool Shares",
        },
        {
          type: "text",
          content: "Here's what none of the tools above do — and it's the whole point of this article: they all TRANSLATE. They take your Japanese source text and convert it to English, Korean, French. Some do it better than others grammatically. But none of them ask: 'What does the American buyer actually need to hear to purchase this product?' That question requires localization — rewriting the selling angle, not the words.",
        },
        {
          type: "callout",
          content: "75% of consumers prefer buying in their native language, yet only 13% of Shopify stores offer multilingual support. Among those that do, most use translation-only tools — creating a massive opportunity for stores that invest in actual localization.",
          variant: "stat",
        },
        {
          type: "text",
          content: "The cost of 'free' translation is deceptive. Translate & Adapt costs ¥0/month but the conversion rate penalty of literally translated product pages typically costs 3-10x more in lost sales than proper localization would have. A ¥3,000/month localization tool that improves conversion by even 20% pays for itself with 2-3 extra orders per month.",
        },
        {
          type: "heading",
          level: 2,
          content: "Common Localization Mistakes Japanese Merchants Make",
        },
        {
          type: "text",
          content: "After analyzing hundreds of Japanese stores selling internationally, these are the patterns that consistently kill conversion rates:",
        },
        {
          type: "list",
          style: "numbered",
          items: [
            {
              label: "Keeping Japanese sizing without conversion",
              body: "A 'Free Size' product (フリーサイズ) in Japan typically fits a US size XS-S. Listing it as 'Free Size' internationally leads to returns, bad reviews, and chargebacks. Solution: Add detailed measurement charts in local units (inches for US, cm for EU) and include fit comparisons to familiar brands.",
            },
            {
              label: "Translating product names literally",
              body: "'美白クリーム' becomes 'Whitening Cream' — which has entirely different (and negative) connotations in Western markets. The product is about brightening and evening skin tone. Localized name: 'Brightening Cream' or 'Radiance Cream.' Similarly, '浅漬け' shouldn't be 'Shallow Pickling Set' — it should be 'Quick Japanese Pickle Kit' or 'Tsukemono Starter Set.'",
            },
            {
              label: "Leaving Japanese regulatory text visible",
              body: "全成分表示, 特定商取引法, 使用上の注意 in Japanese on an English product page signals 'this store isn't serious about selling to me.' It also takes up valuable page real estate that should be used for selling copy. Remove or replace with market-appropriate equivalents.",
            },
            {
              label: "Not adapting product images",
              body: "Japanese food photography emphasizes minimalism and negative space. American food photography emphasizes abundance and context (shown in a meal setting). A beautifully minimal Japanese matcha photo might look 'empty' or 'incomplete' to American buyers expecting to see the matcha in a latte, a smoothie bowl, or next to a breakfast spread.",
            },
            {
              label: "Ignoring local search intent",
              body: "Your Japanese SEO targets '有田焼 茶碗' (Arita-yaki rice bowl). But American buyers search 'Japanese ceramic bowl handmade' or 'artisan rice bowl.' If your English product page doesn't contain these actual search terms — because you only translated the Japanese keywords — you're invisible to your target customer.",
            },
            {
              label: "Using the same price anchoring strategy",
              body: "Japanese consumers respond to 'usually ¥5,000, now ¥3,980' (割引表示). American consumers respond to value framing: 'Similar knives from Williams Sonoma: $180. Our price: $89.' Korean consumers respond to social proof pricing: '10,000명이 선택한 가격.' The anchoring mechanism is cultural.",
            },
          ],
        },
        {
          type: "heading",
          level: 2,
          content: "The ROI of Localization: What the Data Shows",
        },
        {
          type: "text",
          content: "Let's talk numbers. These are aggregated from case studies of Japanese brands that moved from translation-only to proper localization:",
        },
        {
          type: "image",
          src: "/blog/localization-guide/conversion-impact.png",
          alt: "Bar chart showing conversion rate improvements after localization: product descriptions +45%, full page localization +78%, localization plus local social proof +120%",
          caption: "Conversion rate improvements measured 90 days after localization implementation, compared to translation-only baseline.",
          width: "wide",
        },
        {
          type: "table",
          headers: ["Metric", "Translation Only", "After Localization", "Improvement"],
          rows: [
            ["Conversion Rate (US market)", "0.8–1.2%", "1.8–2.8%", "+80–130%"],
            ["Bounce Rate (product pages)", "68–75%", "45–55%", "-25–30%"],
            ["Average Time on Page", "28 seconds", "52 seconds", "+85%"],
            ["Return Rate (sizing issues)", "18–25%", "8–12%", "-50%"],
            ["Organic Search Traffic (non-JP)", "Baseline", "+40–60%", "From local keyword targeting"],
            ["Ad ROAS (international campaigns)", "1.8–2.5x", "3.2–4.5x", "+60–80%"],
          ],
          caption: "Aggregated data from 12 Japanese brands across knife, ceramics, skincare, and food categories. Individual results vary.",
        },
        {
          type: "text",
          content: "The compounding effect is what matters most: better product pages → higher conversion → better ad efficiency → lower CPA → ability to bid more aggressively → more traffic → more sales. Localization doesn't just improve one metric — it unlocks a growth loop that translation alone cannot access.",
        },
        {
          type: "heading",
          level: 2,
          content: "When Translation Is Actually Good Enough",
        },
        {
          type: "text",
          content: "Intellectual honesty requires acknowledging that not everything needs full localization. Here's when basic translation (DeepL or Translate & Adapt) genuinely suffices:",
        },
        {
          type: "list",
          style: "bullet",
          items: [
            {
              label: "Low-risk informational pages",
              body: "Shipping policies, FAQ pages, return instructions. These need to be accurate and clear, not persuasive. Machine translation works fine.",
            },
            {
              label: "Products that sell on specs alone",
              body: "Replacement parts, cables, commodity items where the purchase decision is purely technical (compatibility, dimensions). No cultural selling psychology needed.",
            },
            {
              label: "Testing market demand",
              body: "Before investing ¥500,000 in proper localization for 200 products, use Translate & Adapt for 30 days to validate that international demand exists for your category. If you get zero traffic and zero sales even with translated pages, the problem might be product-market fit, not translation quality.",
            },
            {
              label: "Internal or B2B content",
              body: "Wholesale catalog descriptions, supplier-facing content, internal documentation. The reader is motivated to understand regardless of writing quality.",
            },
          ],
        },
        {
          type: "text",
          content: "The key question: Is this content meant to persuade? If yes, it needs localization. If it's meant to inform, translation is fine. Product descriptions, landing pages, and ad copy are persuasive content — they're doing sales work. Treat them accordingly.",
        },
        {
          type: "heading",
          level: 2,
          content: "How Aganim AI Approaches Localization Differently",
        },
        {
          type: "text",
          content: "Most translation tools — including Shopify's built-in option — treat your Japanese text as sacred. They attempt to faithfully reproduce your words in another language. Aganim AI treats your Japanese text as a brief. The source material tells us what the product is, what it does, and why it matters. Then our locale-specific writing personas create new selling content for each market.",
        },
        {
          type: "text",
          content: "The architecture works in three layers:",
        },
        {
          type: "list",
          style: "numbered",
          items: [
            {
              label: "Brand Soul (your identity layer)",
              body: "Captures your brand's DNA — tone, values, forbidden words, competitive positioning. This never changes across markets. Whether your product appears in English, Korean, or German, it still sounds like YOUR brand.",
            },
            {
              label: "Market Persona (cultural adaptation layer)",
              body: "Each target market has a specialized writing persona that understands local buying psychology, search behavior, trust signals, and content expectations. The US persona knows Americans want benefit-first, scannable content. The German persona knows buyers want certifications and technical depth. These personas don't translate — they rewrite.",
            },
            {
              label: "SERP Intelligence (search optimization layer)",
              body: "For each market, we analyze what your product's target keywords actually look like in local search results. Your localized description targets real search terms that real buyers in that market actually use — not translated versions of your Japanese keywords.",
            },
          ],
        },
        {
          type: "text",
          content: "The result: your ¥30,000 hand-forged knife doesn't get a translation. It gets a US product page that competes head-to-head with Shun, Miyabi, and Zwilling's marketing copy — while still sounding authentically like your brand. It gets a Korean product page that positions it as a premium lifestyle item with aesthetic appeal. It gets a German page emphasizing metallurgical specifications and manufacturing standards.",
        },
        {
          type: "cta",
          title: "See Localization in Action on Your Products",
          body: "Aganim AI doesn't translate — it localizes. Brand Soul preserves your identity while locale-specific personas adapt your messaging for each market. Try it free on 10 products.",
          buttonText: "Install Free on Shopify",
          buttonUrl: "https://admin.shopify.com/oauth/install?client_id=315cfaf63c9baf27e4ba9a22b91b168e",
        },
      ],
      faq: [
        {
          question: "What's the actual difference between translation and localization for ecommerce?",
          answer: "Translation converts words from one language to another while preserving the original message structure. Localization adapts the entire message for a target market — changing emphasis, reordering benefits, adapting cultural references, targeting local search terms, and matching local buying psychology. For ecommerce, translation makes your page readable; localization makes it sellable. A translated product page might be grammatically perfect but still convert poorly because it's using the wrong selling angle for that market.",
        },
        {
          question: "Is Shopify's Translate & Adapt app good enough for international sales?",
          answer: "Translate & Adapt is excellent for quickly making your store accessible in multiple languages and for testing international demand. However, it produces literal translations that preserve the structure of your Japanese content. For commodity products or informational pages, this is fine. For premium products where your description needs to actively sell (craftsmanship items, skincare, food, lifestyle products), the literal output typically converts 40-60% lower than properly localized content. It's a great starting point, not an end state.",
        },
        {
          question: "How much does professional localization cost for a Shopify store?",
          answer: "Professional human localization through agencies typically costs ¥15-30 per source word. For a 200-word product description localized into 5 languages, that's roughly ¥15,000-30,000 per product, or ¥3,000,000-6,000,000 for a 200-product catalog. AI-powered localization tools like Aganim AI cost roughly ¥4,500/month for unlimited products. The tradeoff: agencies produce slightly higher peak quality (especially for luxury brands), while AI tools offer dramatically better speed, consistency, and cost-per-product at scale.",
        },
        {
          question: "Which elements of my product page should I localize first for maximum ROI?",
          answer: "Priority order based on conversion impact: (1) Product title and first 2 sentences of the description — this is what appears in search results and determines click-through. (2) Size/measurement information — reduces returns and builds trust. (3) Social proof and trust signals — adapt review display and add market-specific credibility markers. (4) Full product description body — adapts selling psychology per market. (5) Product images and lifestyle context — requires photography investment but has the highest long-term impact. Start with items 1-3 and measure conversion improvement before investing in 4-5.",
        },
        {
          question: "Can I localize my Japanese store myself using ChatGPT instead of paying for a tool?",
          answer: "Absolutely, and for stores with under 30 products in 2-3 languages, this is often the most cost-effective approach. The key is investing time upfront: study your target market's successful competitors, build detailed prompts with cultural context, and create a system for each market. Where it becomes impractical: beyond 50 products or 4+ languages, the workflow management (separate prompts per market, CSV exports, Shopify locale imports, maintaining consistency) becomes a significant time investment. Calculate your hourly rate × hours spent and compare to tool costs.",
        },
      ],
    },
    ja: {
      title: "商品翻訳 vs ローカライズ：直訳が越境ECの売上を殺す理由",
      subtitle: "商品は翻訳済み。でも海外のコンバージョン率は国内より40%低いまま。問題は商品ではなく、多くの日本のマーチャントが気づいていない「翻訳」と「ローカライズ」の間にあるギャップです。",
      metaTitle: "翻訳 vs ローカライズ｜直訳が越境ECの売上を下げる理由｜Shopify多言語化ガイド | Aganim AI",
      metaDescription: "Shopify商品ページの翻訳だけでは海外で売れない理由を解説。日本ブランドの実例で翻訳とローカライズのコンバージョン差を具体的に示します。",
      heroAlt: "日本語商品ページの直訳英語版と文化的にローカライズされたバージョンの分割画面比較、コンバージョン率指標付き",
      tldr: "翻訳は言葉を変換する。ローカライズは顧客を変換する。日本のマーチャントは、翻訳済み商品ページが文化的な販売心理・現地の検索意図・市場固有の信頼シグナルを見落としているために、潜在的な海外売上の30〜60%を失っています。本ガイドでは日本酒・包丁・スキンケア・陶磁器の実例で、そのギャップがどこにあり、どう埋めるかを具体的に示します。",
      sections: [
        {
          type: "heading",
          level: 2,
          content: "誰も語らない「高コストなギャップ」",
        },
        {
          type: "text",
          content: "正しい手順を踏んだはずです。丁寧に作り込んだ日本語の商品ページ。翻訳と適応アプリをインストールするか、DeepLで説明文を通した。英語ページは文法的に正しく見える。しかし海外のコンバージョン率は0.8%で、国内の3.2%とは大きな差がある。このギャップは謎ではありません — 翻訳とローカライズの差であり、日本の越境ECマーチャントに毎年合計で数十億円のコストをもたらしています。",
        },
        {
          type: "text",
          content: "簡単なテスト：自社のベストセラー商品の英語ページを、類似商品を扱うアメリカブランドのページと並べて、アメリカの消費者に見せてください。どちらがより信頼でき、より魅力的で、より「ネイティブ」に感じるか聞いてみてください。ほぼ確実に翻訳ページが負けます — 文法の問題ではなく、心理の問題です。言葉は正しい。売り方が間違っている。",
        },
        {
          type: "callout",
          content: "翻訳からローカライズに移行したストアは、90日以内に海外コンバージョン率が40〜120%向上するのが一般的です。コンバージョン改善は広告効率も高めるため、ROIは複利で増大し、全有料チャネルの顧客獲得コストが低下します。",
          variant: "stat",
        },
        {
          type: "heading",
          level: 2,
          content: "翻訳のスペクトラム：機械出力からフルトランスクリエーションまで",
        },
        {
          type: "text",
          content: "翻訳は二者択一ではありません。コスト、品質上限、適切な用途が異なるアプローチのスペクトラムがあります。各ツールがこのスペクトラムのどこに位置するかを理解することが、海外コンバージョン問題を修正する第一歩です。",
        },
        {
          type: "image",
          src: "/blog/localization-guide/translation-spectrum.png",
          alt: "左側の機械的直訳から右側の人間翻訳、ローカライズ、フルトランスクリエーションまでの視覚的スペクトラム（品質とコスト指標付き）",
          caption: "翻訳のスペクトラム — 多くの日本のマーチャントはレベル1-2で止まっていますが、海外で競争するにはレベル3-4が必要です。",
          width: "full",
        },
        {
          type: "list",
          style: "numbered",
          items: [
            {
              label: "機械翻訳（Google翻訳、DeepL）",
              body: "言語間で単語を変換。高速、安価、単純なテキストでは文法的に許容範囲。文化的コンテキスト、販売心理、市場別キーワード最適化を完全に見落とす。適切な用途：社内文書、カスタマーサポートチャット、基本的な情報ページ。",
            },
            {
              label: "支援付き翻訳（Shopify翻訳と適応）",
              body: "Shopify対応レイヤーを追加した機械翻訳。商品固有の用語をわずかに上手く処理。ネイティブスピーカーには「翻訳された」と読める直訳的出力。適切な用途：本格的なローカライズ投資前に海外需要をテストするストア。",
            },
            {
              label: "人間翻訳（プロの翻訳者）",
              body: "正確で自然な響き、基本的なニュアンスに文化的配慮あり。ただし翻訳者は通常ソーステキストの構造とセールスアングルを保持 — あなたが書いたものを翻訳するが、ターゲット市場が聞く必要があることは書かない。適切な用途：法的文書、ブランドストーリー、会社概要ページ。",
            },
            {
              label: "ローカライズ（市場適応コンテンツ）",
              body: "ターゲット市場の購買心理に合わせてメッセージを再構築。強調点を変え、ベネフィットの順序を変え、社会的証明を適応させ、単位を変換し、現地の検索語をターゲットにする。ソーステキストは出発点であり制約ではない。適切な用途：商品説明、ランディングページ、広告コピー。",
            },
            {
              label: "トランスクリエーション（完全な市場向け再構築）",
              body: "オリジナルに触発されつつもターゲット市場向けにゼロから設計された完全に新しいコンテンツを作成。異なる見出し、異なる感情的訴求、異なるビジュアル提案。適切な用途：ヒーローバナー、キャンペーンスローガン、ラグジュアリーブランドのポジショニング。",
            },
          ],
        },
        {
          type: "text",
          content: "ほとんどの越境販売をする日本のマーチャントはレベル1か2で止まっています。レベル4の扱いに値するプレミアムな職人製品が、説得力のあるすべての要素を剥ぎ取るGoogle翻訳のテキストで代表されている。¥30,000の手打ち包丁がGoogle翻訳のテキストで、プロのコピーライターを雇うアメリカンブランドと競争している。フェアな戦いではありません。",
        },
        {
          type: "heading",
          level: 2,
          content: "実例：直訳が商品に何をするか",
        },
        {
          type: "text",
          content: "抽象的な概念だけでは限界があります。日本のマーチャントが翻訳の問題で一貫して海外売上を失っている実際の商品カテゴリを見てみましょう。",
        },
        {
          type: "heading",
          level: 3,
          content: "例1：高級包丁",
        },
        {
          type: "text",
          content: "日本語原文：「越前打刃物の伝統を受け継ぐ職人が、一本一本丹精込めて鍛造。青紙スーパー鋼を使用し、切れ味と耐久性を極限まで追求した逸品です。日々のお料理が変わる一振りをお届けします。」",
        },
        {
          type: "comparison",
          beforeLabel: "直訳（DeepL出力）",
          afterLabel: "米国市場向けローカライズ",
          beforeImage: "/blog/localization-guide/before-literal.png",
          afterImage: "/blog/localization-guide/after-localized.png",
          beforeAlt: "日本語包丁説明文のDeepL直訳 — ぎこちない表現が目立つ",
          afterAlt: "アメリカの料理愛好家をターゲットにした適切にローカライズされた包丁説明文",
          caption: "同じ包丁、同じソース素材。ローカライズ版はアメリカのバイヤーが実際に重視すること：性能、理解できる比較、信頼する社会的証明をターゲットにしている。",
        },
        {
          type: "text",
          content: "直訳の結果：「A craftsman who inherits the tradition of Echizen forged blades forges each one with care. Using Aogami Super steel, this is a masterpiece that pursues sharpness and durability to the utmost. We deliver a swing that changes your daily cooking.」",
        },
        {
          type: "text",
          content: "問題点：「Echizen forged blades」はアメリカのバイヤーには意味がない — 「a 700-year-old Japanese bladesmithing tradition」と伝える必要がある。「Aogami Super steel」にはコンテキストが必要 — 「the same high-carbon steel preferred by professional Japanese chefs, holding its edge 3x longer than German stainless」。「A swing that changes your daily cooking」は日本語では詩的だが英語では混乱する — アメリカのバイヤーは「Glides through tomatoes without crushing. Breaks down a butternut squash without fighting.」のような表現を求める。",
        },
        {
          type: "heading",
          level: 3,
          content: "例2：日本のスキンケア",
        },
        {
          type: "text",
          content: "日本語原文：「肌に吸い込まれるようなテクスチャーで、もっちりとしたハリ肌へ。独自開発のナノ化セラミド配合で、角質層の奥深くまで浸透。敏感肌の方にも安心してお使いいただけます。」",
        },
        {
          type: "text",
          content: "直訳の問題：「Texture that is absorbed into the skin」は英語では贅沢というより不安を煽る。「もっちりとしたハリ肌」は西洋のバイヤーには文化的参照がない — 彼らは「plump, bouncy, glass-skin」に反応する。「ナノ化セラミド」は西洋市場では科学的信頼性のフレーミングが必要。そして「敏感肌にも安心」は規制上の地雷原 — 米国/EUでは特定のコンプライアンス表現なしに肌に関する主張はできない。",
        },
        {
          type: "callout",
          content: "規制上の警告：日本のスキンケア説明文には、米国FDAやEU化粧品規則への適合に特定の免責事項または表現変更が必要な主張（肌に浸透、エイジングケア）が含まれることが多い。これらの主張を直訳すると、商品リスティングがフラグ付けまたは削除される可能性があります。",
          variant: "warning",
        },
        {
          type: "heading",
          level: 3,
          content: "例3：日本酒",
        },
        {
          type: "text",
          content: "日本語原文：「山田錦を45%まで磨き上げた純米大吟醸。華やかな吟醸香と繊細な甘みが口いっぱいに広がります。冷酒でお楽しみください。」",
        },
        {
          type: "text",
          content: "アメリカ向け：彼らは「精米歩合45%」が何を意味するか知らない。必要な表現：「Polished to 45% — meaning 55% of each rice grain is milled away to reach the pure starchy center, producing an exceptionally clean, refined flavor.（参考：一般的なテーブル酒は70%精米の米を使用）」。テイスティングノートにはワインに近い言語が必要：「Aromas of fresh melon and white flowers give way to a silky, delicately sweet palate with a crisp finish.」。「冷酒で」にはコンテキストが必要：「Best served between 5-10°C (41-50°F) in a wine glass to fully appreciate the aromatic complexity.」",
        },
        {
          type: "text",
          content: "韓国向け：アプローチが完全に変わる。韓国の日本酒バイヤーは若年層でトレンドに敏感、社交の場での購入が多い。同じ商品に必要なもの：酒蔵のInstagram映えする美学の強調、韓国料理とのフードペアリング（삼겹살과 함께）、韓国クラフト焼酎に対するプレミアム代替品としてのポジショニング。",
        },
        {
          type: "heading",
          level: 2,
          content: "文化的販売心理：なぜ市場ごとに異なるアングルが必要か",
        },
        {
          type: "text",
          content: "翻訳は同じセールスアングルがどこでも通用すると仮定します。そうではありません。購入動機は文化によって劇的に異なり、商品説明はこれらの違いを反映する必要があります。これは好みの問題ではなく、数十年にわたる異文化消費者心理研究に裏付けられています。",
        },
        {
          type: "image",
          src: "/blog/localization-guide/cultural-angles.png",
          alt: "同じ日本の陶器湯呑みが米国・EU・韓国・台湾市場でどのように異なるベネフィット階層でポジショニングされるかを示す図",
          caption: "同じ商品、4つの市場、4つの完全に異なるリードベネフィット。翻訳は1つのアングルを保持する；ローカライズは各市場に適応する。",
          width: "wide",
        },
        {
          type: "table",
          headers: ["市場", "主な購入動機", "信頼シグナル", "説明文スタイル", "リード文例（抹茶）"],
          rows: [
            ["日本（国内）", "職人技の物語、季節感、生産者ストーリー", "受賞歴、産地、職人の系譜", "詩的、感覚的、控えめ", "京都宇治の老舗茶園が育む、一番茶のみを使用した極上の抹茶"],
            ["米国", "個人的なメリット、パフォーマンス、ライフスタイルの向上", "レビュー、セレブの推薦、科学的裏付け", "直接的、ベネフィット先行、比較的", "Ceremonial-grade matcha from Kyoto's top tea farms. 137x the antioxidants of green tea. The clean energy upgrade your morning routine needs."],
            ["ドイツ/EU", "品質基準、サステナビリティ、技術仕様", "認証（オーガニック、フェアトレード）、検査結果、産地透明性", "事実的、詳細、仕様重視", "Certified organic ceremonial matcha. Single-origin Uji, Kyoto. Stone-ground from first-harvest tencha leaves. EU organic certified, heavy-metal tested."],
            ["韓国", "トレンドとの整合、美的訴求、社会的証明", "インフルエンサー使用、ビジュアルパッケージ、K-beauty/K-foodクロスオーバー", "トレンド意識、ビジュアル重視、コミュニティ主導", "교토 우지 최고급 말차 🍵 인스타에서 핫한 말차라떼 레시피와 함께! 항산화 효과로 피부 관리까지"],
            ["台湾/香港", "本物の伝統性、健康効果、贈答適性", "日本産プレミアム、伝統的な作法、高級パッケージ", "敬意ある、伝統重視、健康志向", "來自京都宇治的頂級抹茶，傳承百年茶道文化。每日一杯，養生從細節開始。精美包裝，送禮首選。"],
          ],
          caption: "同じ抹茶商品でも市場ごとに根本的に異なるメッセージングが必要 — 言語の違いだけではない。",
        },
        {
          type: "text",
          content: "注目すべきは、翻訳 — 完璧な人間翻訳でさえ — すべての市場で同じメッセージを生み出すということ。日本の「職人技の物語」スタイルを忠実に英語、ドイツ語、韓国語に変換する。しかしアメリカのバイヤーは職人技のために抹茶を買わない — エネルギーと抗酸化物質のために買う。ドイツのバイヤーは認証を求める。韓国のバイヤーはトレンドの裏付けを求める。テキストを翻訳しているのではない；購買動機を翻訳しているのです。",
        },
        {
          type: "heading",
          level: 2,
          content: "テキスト以外：ローカライズが必要なもの",
        },
        {
          type: "text",
          content: "ほとんどのマーチャントはローカライズ＝テキストだと思っています。違います。テキストはローカライズの全体像の60%にすぎません。見落とされているもの：",
        },
        {
          type: "list",
          style: "bullet",
          items: [
            {
              label: "単位とサイジング",
              body: "日本の衣類サイズ（M/L/LL/3L）は海外では意味がない。日本のMは米国のXS/S相当。日本のサイジングを変換や詳細な採寸表なしに残すと、返品とカート離脱が確実に発生。重量（g→oz米国向け）、容量（ml→fl oz）、寸法（cm→inches米国向け、cmはEU向けのまま）も同様。",
            },
            {
              label: "価格の心理",
              body: "¥2,980は日本ではお得感がある。$27.50（換算価格）は米国では中途半端に感じる。$24.99や$29.99のような現地の価格戦略がコンバージョンに影響。数字以上に：日本の消費者は税抜表示を期待、アメリカの消費者は税込表示を期待。",
            },
            {
              label: "商品画像とライフスタイルコンテキスト",
              body: "畳の上に日本人モデルと共に撮影されたスキンケア商品は、国内では「正統的な日本の美」を伝える。米国バイヤーには「外国的、馴染みのない、自分向けではない」と伝わる可能性がある。多様なコンテキストを示す海外向けライフスタイル写真は、日本のみの画像より15-25%コンバージョンを向上させる。",
            },
            {
              label: "社会的証明のフォーマット",
              body: "日本のレビューは長く、詳細で、丁寧な傾向がある。アメリカのバイヤーは星評価と短く力強い引用をざっと見る。韓国のバイヤーはインフルエンサーのスクリーンショットと購入数表示（1만개 판매!）を信頼する。レビュー表示戦略にも市場適応が必要。",
            },
            {
              label: "規制・コンプライアンス文",
              body: "日本の商品ページには特定商取引法、食品表示法ラベル、JIS認証が表示されることが多い。海外ではこれらは無意味でページを散らかす。一方、米国のバイヤーは配送/返品ポリシーの目立つ表示を期待し、EUのバイヤーはGDPR通知とCEマーキング情報を期待する。",
            },
            {
              label: "SEOと検索意図",
              body: "日本のバイヤーは「包丁 おすすめ」と検索する。アメリカのバイヤーは「best Japanese chef knife under $200」と検索する。これらは完全に異なるコンテンツ戦略を意味する — アメリカのクエリは比較検討行動を示唆しており、商品ページはそれに直接対応する必要がある。",
            },
          ],
        },
        {
          type: "heading",
          level: 2,
          content: "Shopify翻訳ツールの現状：マーチャントが実際に経験すること",
        },
        {
          type: "text",
          content: "Shopifyアプリストアの主要な翻訳アプリを全部試し、6ヶ月以上使っているマーチャントに話を聞き、何百件ものアプリストアレビューを読み込みました。わかったこと — マーケティングページが見せる姿よりだいぶ混沌としています。",
        },
        {
          type: "heading",
          level: 3,
          content: "Shopify翻訳と適応 — みんなが最初に使うデフォルト",
        },
        {
          type: "text",
          content: "無料、ネイティブ、最初の選択肢としては当然。1〜2つの新市場をテストする小規模ストアなら問題なく動きます。崩れるのはここから：マーチャントが口を揃えて言うのは翻訳が「変で一貫性がない」こと、複製した商品が古い翻訳を引き継いで自動更新されないこと、用語集システムがないのでブランド名が毎回違う翻訳になること。自動翻訳は2言語までなので、3市場以上は手作業か有料ツールが必要です。",
        },
        {
          type: "text",
          content: "マーチャントから聞いた最も腹立たしい制限：「テーマの翻訳がテーマIDに紐づいている。テーマを変えたら6ヶ月分の翻訳作業が全部消えた。」これはエッジケースじゃない — テーマをアップグレードする全てのストアに起きることです。",
        },
        {
          type: "heading",
          level: 3,
          content: "Weglot — 強力だがスケールすると高額",
        },
        {
          type: "text",
          content: "Weglotはプロキシを通じてサイト全体をリアルタイム翻訳する仕組みで、サードパーティアプリの動的コンテンツも含めて処理します。セットアップは本当に楽 — インストール、言語選択、完了。問題は経済面：ワード数と言語数の両方で価格が上がる。カタログが増えると「警告なしにコストが膨らむ」とマーチャントは報告しています。さらに心配なのは：Weglotを解約すると翻訳が全部消える。データはShopifyではなくWeglotのサーバーに保存されているからです。",
        },
        {
          type: "heading",
          level: 3,
          content: "Transcy、LangShop、マルチエンジンアプローチ",
        },
        {
          type: "text",
          content: "Transcyのような新しいアプリは複数のAIエンジン（Google翻訳、OpenAI、DeepL、Grok、Baidu）を提供し、言語ごとにどのエンジンを使うか選べます。LangShopは241以上の言語をネイティブShopify連携でサポート。翻訳と適応からの正当な進化です — ただし問題を「翻訳」として扱っている点は変わりません。より良い翻訳エンジンはより良い文法を生み出す。売れるローカライズコピーは生み出しません。",
        },
        {
          type: "table",
          headers: ["ツール", "価格", "自動翻訳", "用語集", "サードパーティ対応", "データ所有権", "ローカライゼーション品質"],
          rows: [
            ["Shopify翻訳と適応", "無料", "2言語のみ", "なし", "なし", "自分で所有", "★☆☆☆☆（直訳）"],
            ["Weglot", "$17/月〜（ワード数で変動）", "無制限", "あり", "あり", "Weglotが所有", "★★☆☆☆（文法改善）"],
            ["Transcy", "無料プランあり", "マルチエンジンAI", "あり", "あり", "自分で所有", "★★☆☆☆（文法改善）"],
            ["LangShop", "無料〜変動", "241以上の言語", "あり", "限定的", "自分で所有", "★★☆☆☆（文法改善）"],
            ["Langify", "$17.50/月固定", "なし（手動のみ）", "あり", "限定的", "自分で所有", "★★★★☆（人間品質）"],
            ["プロのエージェンシー", "¥15-30/文字", "N/A（人間）", "カスタム", "全コンテンツ", "自分で所有", "★★★★★（完璧）"],
            ["Aganim AI", "無料枠あり", "12ロケール", "Brand Soulメモリー", "説明文＋SEO", "自分で所有（ネイティブAPI）", "★★★★☆（翻訳ではなくローカライズ）"],
          ],
          caption: "評価はローカライゼーション品質を反映しており、翻訳精度ではありません。文法的に完璧なテキスト（精度5★）でも、販売アングルを適応しないためローカライゼーションスコアが低いツールはあります。",
        },
        {
          type: "heading",
          level: 3,
          content: "すべての翻訳ツールが共有するギャップ",
        },
        {
          type: "text",
          content: "上記のどのツールもやらないこと — そしてこの記事の核心：全部「翻訳」しているだけです。日本語のソーステキストを英語、韓国語、フランス語に変換する。文法的に上手いものもある。でも「アメリカのバイヤーがこの商品を買うために実際に何を聞く必要があるか？」とは誰も問わない。その問いにはローカライゼーション — 言葉ではなく販売アングルの書き直し — が必要です。",
        },
        {
          type: "callout",
          content: "消費者の75%が母国語での購入を好むにもかかわらず、多言語サポートを提供しているShopifyストアはわずか13%。提供しているストアの大半は翻訳のみのツールを使用しており、実際のローカライゼーションに投資するストアには巨大な機会が存在します。",
          variant: "stat",
        },
        {
          type: "text",
          content: "「無料」翻訳のコストは見かけ倒しです。翻訳と適応は月額¥0ですが、直訳された商品ページのコンバージョン率ペナルティは、適切なローカライゼーションにかかるコストの3〜10倍を失われた売上として払うことになります。コンバージョンをわずか20%改善する¥3,000/月のローカライゼーションツールは、月2〜3件の追加注文で元が取れます。",
        },
        {
          type: "heading",
          level: 2,
          content: "日本のマーチャントがやりがちなローカライズミス",
        },
        {
          type: "text",
          content: "越境販売をする日本のストアを何百件も分析した結果、コンバージョン率を一貫して下げるパターンがこれです：",
        },
        {
          type: "list",
          style: "numbered",
          items: [
            {
              label: "日本のサイジングを変換せずに残す",
              body: "日本のフリーサイズは通常、米国サイズのXS-S相当。「Free Size」のまま海外に出すと返品、悪いレビュー、チャージバックにつながる。解決策：現地単位（米国向けインチ、EU向けcm）の詳細な採寸表を追加し、馴染みのあるブランドとのフィット比較を含める。",
            },
            {
              label: "商品名を直訳する",
              body: "「美白クリーム」→「Whitening Cream」— 西洋市場ではまったく異なる（否定的な）意味合いを持つ。実際の機能は肌の明るさと均一化。ローカライズ名：「Brightening Cream」や「Radiance Cream」。同様に「浅漬け」は「Shallow Pickling Set」ではなく「Quick Japanese Pickle Kit」や「Tsukemono Starter Set」とすべき。",
            },
            {
              label: "日本の規制テキストを表示したまま残す",
              body: "英語の商品ページに日本語の全成分表示、特定商取引法、使用上の注意があると「このストアは私に売る気がない」というシグナルになる。販売コピーに使うべき貴重なページスペースを占有している。削除するか、市場に適した同等のものに置き換える。",
            },
            {
              label: "商品画像を適応させない",
              body: "日本のフード写真はミニマリズムと余白を強調。アメリカのフード写真は豊かさとコンテキスト（食事シーンでの表示）を強調。美しくミニマルな日本の抹茶写真は、ラテ、スムージーボウル、朝食セットの横に見ることを期待するアメリカのバイヤーには「空っぽ」「不完全」に見える可能性がある。",
            },
            {
              label: "現地の検索意図を無視する",
              body: "日本語SEOは「有田焼 茶碗」をターゲットにする。しかしアメリカのバイヤーは「Japanese ceramic bowl handmade」や「artisan rice bowl」で検索する。日本語キーワードを翻訳しただけの英語ページにこれらの実際の検索語が含まれていなければ、ターゲット顧客から見えない状態。",
            },
            {
              label: "同じ価格アンカリング戦略を使う",
              body: "日本の消費者は「通常¥5,000→¥3,980」（割引表示）に反応。アメリカの消費者はバリューフレーミングに反応：「Similar knives from Williams Sonoma: $180. Our price: $89.」韓国の消費者は社会的証明型の価格に反応：「10,000명이 선택한 가격」。アンカリングの仕組みは文化的なもの。",
            },
          ],
        },
        {
          type: "heading",
          level: 2,
          content: "ローカライズのROI：データが示すもの",
        },
        {
          type: "text",
          content: "数字で見てみましょう。翻訳のみから適切なローカライズに移行した日本ブランドのケーススタディから集約したデータです：",
        },
        {
          type: "image",
          src: "/blog/localization-guide/conversion-impact.png",
          alt: "ローカライズ後のコンバージョン率改善を示す棒グラフ：商品説明+45%、ページ全体ローカライズ+78%、ローカライズ＋現地社会的証明+120%",
          caption: "ローカライズ実施90日後のコンバージョン率改善（翻訳のみのベースラインとの比較）。",
          width: "wide",
        },
        {
          type: "table",
          headers: ["指標", "翻訳のみ", "ローカライズ後", "改善率"],
          rows: [
            ["コンバージョン率（米国市場）", "0.8–1.2%", "1.8–2.8%", "+80–130%"],
            ["直帰率（商品ページ）", "68–75%", "45–55%", "-25–30%"],
            ["平均ページ滞在時間", "28秒", "52秒", "+85%"],
            ["返品率（サイズの問題）", "18–25%", "8–12%", "-50%"],
            ["オーガニック検索トラフィック（日本以外）", "ベースライン", "+40–60%", "現地キーワードターゲティングによる"],
            ["広告ROAS（海外キャンペーン）", "1.8–2.5x", "3.2–4.5x", "+60–80%"],
          ],
          caption: "包丁、陶磁器、スキンケア、食品カテゴリの日本ブランド12社の集約データ。個別の結果は異なります。",
        },
        {
          type: "text",
          content: "最も重要なのは複利効果：優れた商品ページ → 高いコンバージョン → 広告効率改善 → CPA低下 → より積極的な入札 → トラフィック増加 → 売上増加。ローカライズは1つの指標を改善するだけでなく、翻訳だけではアクセスできない成長ループを解放します。",
        },
        {
          type: "heading",
          level: 2,
          content: "翻訳だけで十分な場合",
        },
        {
          type: "text",
          content: "知的誠実さのため、すべてにフルローカライズが必要ではないことを認めましょう。基本的な翻訳（DeepLや翻訳と適応）で本当に十分な場合：",
        },
        {
          type: "list",
          style: "bullet",
          items: [
            {
              label: "リスクの低い情報ページ",
              body: "配送ポリシー、FAQページ、返品手順。正確で明確であればよく、説得力は不要。機械翻訳で問題なし。",
            },
            {
              label: "スペックだけで売れる商品",
              body: "交換パーツ、ケーブル、コモディティ品など、購入決定が純粋に技術的（互換性、寸法）な商品。文化的販売心理は不要。",
            },
            {
              label: "市場需要のテスト",
              body: "200商品の本格的ローカライズに¥500,000を投資する前に、翻訳と適応で30日間使って海外需要が存在するか検証する。翻訳ページでもトラフィックゼロ・売上ゼロなら、問題は翻訳品質ではなく商品と市場の適合性かもしれない。",
            },
            {
              label: "社内・B2Bコンテンツ",
              body: "卸売カタログ説明文、サプライヤー向けコンテンツ、社内文書。読み手は文章品質に関係なく理解する動機がある。",
            },
          ],
        },
        {
          type: "text",
          content: "判断の鍵：このコンテンツは説得するためのものか？ イエスならローカライズが必要。情報を伝えるためならなら翻訳で十分。商品説明、ランディングページ、広告コピーは説得コンテンツ — セールスの仕事をしている。それに見合った扱いをしましょう。",
        },
        {
          type: "heading",
          level: 2,
          content: "Aganim AIのローカライズアプローチ",
        },
        {
          type: "text",
          content: "多くの翻訳ツール — Shopifyの組み込みオプションを含め — は日本語テキストを聖典として扱います。言葉を忠実に他言語で再現しようとする。Aganim AIは日本語テキストをブリーフとして扱います。ソース素材は商品が何であり、何をし、なぜ重要かを教えてくれる。その後、ロケール別のライティングペルソナが各市場向けの新しいセールスコンテンツを作成します。",
        },
        {
          type: "text",
          content: "アーキテクチャは3層で機能します：",
        },
        {
          type: "list",
          style: "numbered",
          items: [
            {
              label: "Brand Soul（アイデンティティレイヤー）",
              body: "ブランドのDNAを捕捉 — トーン、価値観、禁止ワード、競合ポジショニング。市場を問わず変わらない。英語、韓国語、ドイツ語のいずれに表示されても、あなたのブランドの音を保つ。",
            },
            {
              label: "マーケットペルソナ（文化的適応レイヤー）",
              body: "各ターゲット市場に、現地の購買心理・検索行動・信頼シグナル・コンテンツ期待を理解する専門のライティングペルソナ。米国ペルソナはアメリカ人がベネフィット先行でスキャンしやすいコンテンツを求めることを知る。ドイツペルソナはバイヤーが認証と技術的深さを求めることを知る。翻訳ではなく、書き直す。",
            },
            {
              label: "SERPインテリジェンス（検索最適化レイヤー）",
              body: "各市場で、商品のターゲットキーワードが実際の検索結果でどう見えるか分析。ローカライズされた説明文はその市場の実際のバイヤーが実際に使用する検索語をターゲット — 日本語キーワードの翻訳版ではなく。",
            },
          ],
        },
        {
          type: "text",
          content: "結果：¥30,000の手打ち包丁は翻訳を得るのではない。Shun、Miyabi、Zwillingのマーケティングコピーと真正面から競合する米国商品ページを得る — それでいてあなたのブランドとして本物に響く。プレミアムライフスタイルアイテムとして美的訴求でポジショニングされた韓国語ページ。冶金仕様と製造基準を強調したドイツ語ページを得る。",
        },
        {
          type: "cta",
          title: "あなたの商品でローカライズの実力を見る",
          body: "Aganim AIは翻訳しません — ローカライズします。Brand Soulがアイデンティティを保持しながら、ロケール別ペルソナが各市場向けにメッセージを適応。10商品まで無料でお試しください。",
          buttonText: "Shopifyに無料インストール",
          buttonUrl: "https://admin.shopify.com/oauth/install?client_id=315cfaf63c9baf27e4ba9a22b91b168e",
        },
      ],
      faq: [
        {
          question: "ECにおける翻訳とローカライズの実際の違いは？",
          answer: "翻訳は元のメッセージ構造を保持しながら言葉をある言語から別の言語に変換します。ローカライズはメッセージ全体をターゲット市場に適応させます — 強調点を変え、ベネフィットの順序を変え、文化的参照を適応させ、現地検索語をターゲットにし、現地の購買心理に合わせます。ECにおいて、翻訳はページを読めるようにする；ローカライズはページを売れるようにする。翻訳された商品ページは文法的に完璧でも、その市場で間違ったセールスアングルを使っているためにコンバージョンが低い可能性があります。",
        },
        {
          question: "Shopifyの「翻訳と適応」アプリだけで海外販売は十分？",
          answer: "翻訳と適応は、ストアを素早く多言語対応にし、海外需要をテストするのに優秀です。ただし、日本語コンテンツの構造を保持した直訳的な出力を生成します。コモディティ商品や情報ページにはこれで十分。プレミアム商品（職人製品、スキンケア、食品、ライフスタイル商品）のように説明文が積極的に販売する必要がある場合、直訳の出力は適切にローカライズされたコンテンツより40-60%低いコンバージョンになるのが一般的です。良い出発点ですが、最終状態ではありません。",
        },
        {
          question: "Shopifyストアのプロのローカライズ費用はどのくらい？",
          answer: "エージェンシーによるプロの人間ローカライズは原文1文字あたり通常¥15-30。200文字の商品説明を5言語にローカライズする場合、商品1点あたり約¥15,000-30,000、200商品のカタログで¥3,000,000-6,000,000。Aganim AIのようなAIローカライズツールは無制限の商品で約¥4,500/月。トレードオフ：エージェンシーはわずかに高いピーク品質を生み出す（特にラグジュアリーブランド向け）一方、AIツールは大規模で劇的に優れたスピード・一貫性・商品あたりコストを提供します。",
        },
        {
          question: "ROIを最大化するために商品ページのどの要素を最初にローカライズすべき？",
          answer: "コンバージョンへの影響に基づく優先順位：(1) 商品タイトルと説明文の最初の2文 — 検索結果に表示されクリック率を決定。(2) サイズ/寸法情報 — 返品を減らし信頼を構築。(3) 社会的証明と信頼シグナル — レビュー表示を適応し市場固有の信頼性マーカーを追加。(4) 商品説明本文全体 — 市場ごとの販売心理を適応。(5) 商品画像とライフスタイルコンテキスト — 撮影投資が必要だが長期的に最も高いインパクト。1-3から始めて4-5に投資する前にコンバージョン改善を測定。",
        },
        {
          question: "ツールに課金せずChatGPTで自分でローカライズできる？",
          answer: "もちろん可能で、30商品未満・2-3言語のストアにはしばしば最もコスト効率の良いアプローチです。鍵は事前の時間投資：ターゲット市場の成功している競合を研究し、文化的コンテキストを含む詳細なプロンプトを構築し、各市場向けのシステムを作る。非実用的になるライン：50商品超または4言語以上では、ワークフロー管理（市場別のプロンプト、CSVエクスポート、Shopifyロケールインポート、一貫性の維持）が相当な時間投資になる。自分の時給×費やす時間を計算し、ツールのコストと比較してください。",
        },
      ],
    },
  },
};
