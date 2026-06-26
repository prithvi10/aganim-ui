import type { BlogArticle } from "./types";

export const seoJapaneseShopifyGuide: BlogArticle = {
  slug: "seo-japanese-shopify-guide",
  publishedAt: "2026-06-26",
  category: "seo",
  readingTime: { en: 12, ja: 14 },
  heroImage: "/blog/seo-japanese-shopify-hero.png",
  ogImage: "/blog/seo-japanese-shopify-hero.png",
  content: {
    en: {
      title: "Shopify SEO for Japanese Cross-Border Stores: The Complete 2026 Guide",
      subtitle: "A practical, no-fluff guide to multilingual SEO for Japanese merchants selling internationally and international merchants selling Japanese products. Covers hreflang, meta tags, structured data, keyword research, and the mistakes that silently kill your organic traffic.",
      metaTitle: "Shopify SEO for Japanese Cross-Border Stores — Complete 2026 Guide | Aganim AI",
      metaDescription: "The definitive guide to multilingual Shopify SEO for Japanese cross-border commerce. Learn hreflang setup, Japanese keyword research, meta tag optimization, structured data, and common mistakes to avoid.",
      heroAlt: "Visual guide showing multilingual SEO optimization for a Japanese Shopify store selling internationally",
      tldr: "Cross-border SEO requires more than translation. You need proper hreflang implementation, locale-specific keyword research, culturally adapted meta tags, and structured data that search engines in each market understand. Most Japanese merchants lose 40-60% of potential organic traffic due to misconfigured international targeting. This guide covers every technical and strategic element you need to fix.",
      sections: [
        {
          type: "heading",
          level: 2,
          content: "Why Multilingual SEO Is Fundamentally Different from Single-Market SEO",
        },
        {
          type: "text",
          content: "If you run a Japanese Shopify store selling domestically, SEO is relatively straightforward: optimize for Google Japan, write in Japanese, target Japanese keywords. But the moment you expand internationally — or if you're an international merchant selling Japanese products — the complexity multiplies. You're no longer optimizing for one search engine in one language. You're managing competing signals across multiple Google instances, each with different ranking factors, user intent patterns, and content expectations.",
        },
        {
          type: "text",
          content: "The core technical challenge is telling Google which version of your page to show to which audience. Without explicit signals, Google makes guesses — and those guesses are frequently wrong. A Japanese merchant selling handmade ceramics (手作り 陶器) might find their Japanese-language product pages ranking in Google US results, while their English pages are invisible. Or worse: Google might see the Japanese and English versions as duplicate content and suppress both.",
        },
        {
          type: "text",
          content: "This isn't a theoretical problem. Based on Search Console data from cross-border Shopify stores, misconfigured international targeting typically causes 40-60% of potential organic traffic to land on the wrong language version or get filtered entirely. The fix requires coordinated work across four areas: hreflang tags, locale-specific metadata, content adaptation, and structured data. We'll cover each in depth.",
        },
        {
          type: "callout",
          content: "Key insight: Google treats google.co.jp and google.com as separate ecosystems with separate indexes. Ranking well in one does not automatically help you rank in the other. Each market requires its own SEO strategy.",
          variant: "info",
        },
        {
          type: "heading",
          level: 2,
          content: "Hreflang: The Foundation of Multilingual SEO (And Where Most Stores Break)",
        },
        {
          type: "text",
          content: "Hreflang tags are HTML annotations that tell search engines which language and regional version of a page exists, and where to find it. They're the single most important technical element for cross-border SEO — and also the most commonly misconfigured. A properly implemented hreflang setup ensures that Japanese users see your Japanese pages in search results, American users see your English pages, and French users see your French pages.",
        },
        {
          type: "text",
          content: "The syntax looks simple: <link rel=\"alternate\" hreflang=\"ja\" href=\"https://yourstore.com/ja/products/ceramic-bowl\" />. But the implementation details are where stores fail. Every page must reference ALL language versions including itself. The URLs must be absolute (not relative). The language codes must follow ISO 639-1 format. And critically — every page referenced in the hreflang set must reciprocate with matching tags. If Page A points to Page B as the English version, Page B must point back to Page A as the Japanese version. A single broken link in this chain can invalidate the entire set.",
        },
        {
          type: "image",
          src: "/blog/seo-guide/hreflang-setup.png",
          alt: "Diagram showing proper hreflang tag configuration between Japanese, English, and French versions of a Shopify product page",
          caption: "Proper hreflang implementation requires bidirectional references between all language versions. Missing or mismatched tags invalidate the entire set.",
          width: "wide",
        },
        {
          type: "heading",
          level: 3,
          content: "How Shopify handles hreflang (and its limitations)",
        },
        {
          type: "text",
          content: "Shopify Markets automatically generates hreflang tags when you configure multiple markets with different languages. If you have a Japan market (Japanese), US market (English), and France market (French), Shopify will inject the appropriate hreflang annotations into your page headers. This is a significant improvement over the pre-Markets era when merchants needed third-party apps or custom Liquid code for hreflang.",
        },
        {
          type: "text",
          content: "However, Shopify's automatic implementation has gaps. It only generates hreflang tags for markets you've explicitly configured — if you sell in English to both the US and UK but haven't created separate markets for each, you won't get region-specific hreflang (en-us vs en-gb). The tags reference your primary domain only, which means stores using separate domains per market (e.g., yourstore.jp and yourstore.com) need custom solutions. And if you unpublish a product from one market but not others, the hreflang chain breaks silently.",
        },
        {
          type: "list",
          style: "numbered",
          items: [
            {
              label: "Verify your hreflang implementation",
              body: "Use Google's Rich Results Test or view page source on a product page. Search for 'hreflang' — you should see one <link> tag for each market/language combination, including the current page's own language. If any are missing, your Markets configuration needs attention.",
            },
            {
              label: "Check for reciprocal tags",
              body: "Pick a product URL in each language and verify the hreflang tags point to each other correctly. The Japanese page must list the English URL and vice versa. Tools like Ahrefs Site Audit or Screaming Frog can automate this check across your entire catalog.",
            },
            {
              label: "Add an x-default fallback",
              body: "Include an x-default hreflang tag pointing to your primary market. This tells Google which version to show users whose language/region doesn't match any of your specific markets. Shopify adds this automatically if configured correctly in Markets settings.",
            },
            {
              label: "Validate after every market change",
              body: "Any time you add/remove a market, change market domains, or unpublish products from specific markets, re-validate your hreflang setup. Broken hreflang is worse than no hreflang at all — it actively confuses search engines.",
            },
          ],
        },
        {
          type: "callout",
          content: "Common mistake: Many Japanese merchants set up Shopify Markets but forget to publish all products to all markets. Unpublished products break hreflang chains. Run 'Products > All products' and filter by market availability to find gaps.",
          variant: "warning",
        },
        {
          type: "heading",
          level: 2,
          content: "Meta Tags That Actually Work Across Languages",
        },
        {
          type: "text",
          content: "Meta titles and descriptions are your store's first impression in search results. For cross-border stores, they need to do double duty: rank for local keywords AND convince local users to click. A direct translation of your Japanese meta title into English almost never accomplishes either goal. The keywords that Japanese users search are structurally different from what English users search, and the persuasion patterns that drive clicks differ by culture.",
        },
        {
          type: "text",
          content: "Consider a Japanese ceramics store. The Japanese meta title might be: '手作り陶器 | 益子焼の茶碗・湯呑み通販 — 窯元直送'. This works perfectly for Japanese searchers — it contains relevant keywords (手作り陶器, 益子焼, 茶碗, 湯呑み, 通販, 窯元直送) and communicates authenticity. But translated directly: 'Handmade Pottery | Mashiko Ware Tea Bowls and Cups Online — Direct from Kiln' — this misses what English-speaking buyers actually search for and value.",
        },
        {
          type: "text",
          content: "An effective English meta title for the same store might be: 'Authentic Japanese Ceramics | Handcrafted Mashiko Pottery — Ships Worldwide'. Notice the differences: 'authentic Japanese' signals origin and quality to Western buyers, 'handcrafted' performs better than 'handmade' in English search volume, and 'ships worldwide' addresses the primary concern of international buyers (can I actually get this?). These aren't translation choices — they're localization choices informed by keyword research.",
        },
        {
          type: "image",
          src: "/blog/seo-guide/meta-tags-example.png",
          alt: "Side-by-side comparison of optimized meta titles and descriptions in Japanese and English for a ceramics Shopify store",
          caption: "Same store, same products — but meta tags crafted for each market's search behavior and buyer psychology rather than translated word-for-word.",
          width: "wide",
        },
        {
          type: "heading",
          level: 3,
          content: "Character limits and display differences",
        },
        {
          type: "text",
          content: "Google's display limits differ by language due to character width. For English, meta titles display approximately 50-60 characters and descriptions 150-160 characters. For Japanese, because characters are wider, titles display approximately 30-35 characters and descriptions 80-120 characters. This means your Japanese meta content must be more concise while still containing target keywords. Many merchants don't realize this and write Japanese meta descriptions that get truncated in search results, losing their call-to-action.",
        },
        {
          type: "list",
          style: "bullet",
          items: [
            {
              label: "English meta title",
              body: "50-60 characters. Include primary keyword near the beginning. End with brand name if space allows.",
            },
            {
              label: "Japanese meta title",
              body: "30-35 characters (full-width). Front-load the most important keyword. Use '|' or '—' as separators sparingly.",
            },
            {
              label: "English meta description",
              body: "150-160 characters. Include a value proposition and call-to-action. Natural keyword inclusion (don't stuff).",
            },
            {
              label: "Japanese meta description",
              body: "80-120 characters (full-width). Be extremely concise. Prioritize the single strongest selling point plus one action trigger.",
            },
          ],
        },
        {
          type: "heading",
          level: 2,
          content: "Keyword Research: Why Bilingual Isn't Enough — You Need Bicultural",
        },
        {
          type: "text",
          content: "Keyword research for cross-border stores is not bilingual keyword research — it's bicultural keyword research. Japanese and English speakers don't just use different words for the same concepts; they search with fundamentally different intent patterns, specificity levels, and category structures. Understanding these differences is what separates stores that rank from stores that don't.",
        },
        {
          type: "text",
          content: "Take the example of a store selling matcha. Japanese searchers use highly specific compound terms: '抹茶 粉末 有機 宇治' (matcha powder organic Uji) — they already know what matcha is and are filtering by origin and quality. English searchers cast wider nets: 'best matcha powder', 'matcha vs green tea', 'how to make matcha latte' — many are still in the education phase. Your Japanese SEO targets buyers; your English SEO must also target learners who may become buyers.",
        },
        {
          type: "text",
          content: "This affects your entire content strategy. For the Japanese market, product pages with detailed specifications and origin information satisfy search intent directly. For English-speaking markets, you likely need supplementary content (blog posts, guides, comparison pages) that captures educational queries and funnels readers toward purchase. The same store needs two fundamentally different content architectures to rank well in both markets.",
        },
        {
          type: "image",
          src: "/blog/seo-guide/keyword-research-comparison.png",
          alt: "Comparison of Japanese vs English keyword search volumes and patterns for handmade ceramics, showing different intent structures",
          caption: "Japanese keywords tend to be specific and purchase-intent; English keywords include more educational and comparison queries that require different content types.",
          width: "wide",
        },
        {
          type: "heading",
          level: 3,
          content: "Tools and methodology for bilingual keyword research",
        },
        {
          type: "text",
          content: "For Japanese keyword research, Google Keyword Planner (set to Japan/Japanese) remains the most reliable free option. Ahrefs and Semrush both support Japanese keyword databases, though their coverage of long-tail Japanese queries is less comprehensive than for English. A uniquely valuable free tool is Google Trends with the region set to Japan — it reveals seasonal patterns that are critical for Japanese commerce (gift-giving seasons like お中元 and お歳暮 drive massive search spikes for specific product categories).",
        },
        {
          type: "text",
          content: "For English keyword research targeting buyers of Japanese products, start with Google Keyword Planner set to your target country (US, UK, Australia). But supplement with Amazon search suggestions — many buyers of Japanese products start their journey on Amazon, so Amazon's autocomplete reveals buyer-intent keywords that Google Keyword Planner might undercount. Tools like Jungle Scout or Helium 10 provide Amazon search volume data that can inform your Shopify SEO strategy.",
        },
        {
          type: "list",
          style: "numbered",
          items: [
            {
              label: "Start with seed keywords in both languages",
              body: "List your core product categories in Japanese and their English equivalents. Don't translate — research independently. '急須' might map to 'Japanese teapot' or 'kyusu' depending on your audience's familiarity.",
            },
            {
              label: "Expand with autocomplete mining",
              body: "Type seed keywords into Google (in the target country's Google instance) and record all autocomplete suggestions. Do the same on Amazon and YouTube. These reveal real user queries.",
            },
            {
              label: "Analyze competitor keywords",
              body: "Find 3-5 stores ranking for your target terms in each market. Use Ahrefs or Semrush to extract their ranking keywords. Pay attention to keywords they rank for that you haven't considered.",
            },
            {
              label: "Map keywords to intent stages",
              body: "Categorize each keyword as informational (learning), commercial (comparing), or transactional (buying). Product pages target transactional. Blog content targets informational. Collection pages often target commercial.",
            },
            {
              label: "Validate with Search Console data",
              body: "If you have existing traffic, Google Search Console shows what queries already bring users. Filter by country to see which keywords work in which market. Often reveals opportunities you missed in research.",
            },
          ],
        },
        {
          type: "heading",
          level: 2,
          content: "Structured Data: Making Rich Results Work Across Markets",
        },
        {
          type: "text",
          content: "Structured data (schema.org markup) helps search engines understand your product information unambiguously — price, availability, reviews, shipping details. For cross-border stores, properly implemented structured data can trigger rich results (star ratings, price display, availability badges) in search results across all your target markets, dramatically improving click-through rates.",
        },
        {
          type: "text",
          content: "Shopify themes automatically generate basic Product schema markup. However, most themes only output structured data for the primary locale. If you're selling a product at ¥5,000 in Japan and $35 in the US, the structured data should reflect the correct currency and price for each market's version of the page. Similarly, shipping availability, review language, and product descriptions in structured data should match the page locale.",
        },
        {
          type: "text",
          content: "The most impactful structured data types for cross-border stores are: Product (with correct localized pricing), BreadcrumbList (with localized category names), FAQPage (targeting featured snippets in each language), and Organization (with locale-appropriate business information). Each requires localization beyond simple translation — currency codes, country-specific availability, locale-matched review aggregates.",
        },
        {
          type: "callout",
          content: "Quick win: Add FAQPage structured data to your top product pages in each language. FAQ-rich results take up significantly more SERP real estate and are easier to earn than other rich result types. Write 3-5 genuine questions buyers ask about your product category.",
          variant: "tip",
        },
        {
          type: "heading",
          level: 2,
          content: "Content Optimization: Beyond Translation",
        },
        {
          type: "text",
          content: "The biggest SEO mistake cross-border stores make is treating translated content as optimized content. Translation ensures your content is understandable in another language. SEO optimization ensures it's discoverable. These are different goals requiring different processes. A perfectly translated product description can be completely invisible to search engines if it doesn't contain the terms that local users actually search for.",
        },
        {
          type: "text",
          content: "Consider alt text for product images — a critical but often overlooked SEO element. A Japanese product image might have alt text: '益子焼 手びねり 茶碗 青釉'. Translated literally to English: 'Mashiko-yaki hand-formed tea bowl blue glaze'. But English searchers don't use 'hand-formed' (they search 'handmade'), don't know 'Mashiko-yaki' (they search 'Japanese pottery'), and might not search 'tea bowl' (they might search 'matcha bowl' or 'rice bowl' depending on the product). Optimized English alt text: 'Handmade Japanese pottery matcha bowl with blue glaze — Mashiko ware'. Same image, different SEO value.",
        },
        {
          type: "text",
          content: "This principle applies to every text element on your pages: collection titles, product titles, URL handles, image file names, heading tags, and body content. Each needs to be independently optimized for the target market's search vocabulary, not simply translated from the source language. This is time-intensive but represents the difference between a store that gets international organic traffic and one that doesn't.",
        },
        {
          type: "heading",
          level: 3,
          content: "URL structure for multilingual Shopify stores",
        },
        {
          type: "text",
          content: "Shopify offers two approaches for multilingual URLs: subfolders (yourstore.com/ja/products/...) and separate domains (yourstore.jp). Subfolders are simpler to manage, keep all SEO authority on a single domain, and work natively with Shopify Markets. Separate domains provide stronger geo-targeting signals and allow for market-specific branding, but split your domain authority and require more complex technical management.",
        },
        {
          type: "text",
          content: "For most cross-border stores, the subfolder approach (yourstore.com/ja/, yourstore.com/en/, etc.) is recommended. It consolidates backlink equity, simplifies hreflang management, and is fully supported by Shopify without custom development. The main scenario where separate domains make sense is when you have established brand presence in a specific market (e.g., you already own and have authority on a .jp domain) or when legal/regulatory requirements mandate local hosting.",
        },
        {
          type: "heading",
          level: 2,
          content: "Google Search Console Setup for International Targeting",
        },
        {
          type: "text",
          content: "Google Search Console (GSC) is your primary diagnostic tool for international SEO. For cross-border stores, proper GSC configuration means you can see performance data segmented by country and language — essential for understanding which markets are working and which need attention. Many merchants set up GSC once and never configure it for international monitoring.",
        },
        {
          type: "image",
          src: "/blog/seo-guide/search-console-international.png",
          alt: "Google Search Console performance report filtered by country, showing separate metrics for Japan, United States, and United Kingdom traffic",
          caption: "Filter GSC performance by country to see which markets drive organic traffic and where you're losing opportunities.",
          width: "wide",
        },
        {
          type: "list",
          style: "numbered",
          items: [
            {
              label: "Verify all URL variants",
              body: "If you use subfolders (yourstore.com/ja/), you only need one property. If you use separate domains, verify each domain separately. Make sure all versions are verified and linked.",
            },
            {
              label: "Check the International Targeting report",
              body: "Navigate to Legacy tools > International Targeting. Verify that Google detects your hreflang tags correctly. This report shows errors in your hreflang implementation that need fixing.",
            },
            {
              label: "Set up country-specific performance filters",
              body: "In Performance > Search Results, create saved filters for each target market (Country: Japan, Country: United States, etc.). Compare impressions, clicks, and average position across markets to identify opportunities.",
            },
            {
              label: "Monitor for hreflang errors",
              body: "The Coverage report will flag hreflang-related issues. Common problems: 'alternate page with proper canonical tag' (usually means your hreflang points to a page that canonicalizes elsewhere) and 'duplicate without user-selected canonical' (Google is confused about which version to index).",
            },
            {
              label: "Use the URL Inspection tool per locale",
              body: "Inspect the same product URL in each language version. Verify Google has crawled and indexed each locale variant separately. If a locale variant shows 'Discovered - currently not indexed', your hreflang or internal linking needs work.",
            },
          ],
        },
        {
          type: "heading",
          level: 2,
          content: "Common SEO Mistakes That Silently Kill International Traffic",
        },
        {
          type: "text",
          content: "After auditing dozens of Japanese cross-border Shopify stores, certain patterns emerge repeatedly. These aren't exotic edge cases — they're systematic issues that affect the majority of stores attempting international SEO. Each one silently suppresses organic traffic without triggering obvious errors.",
        },
        {
          type: "list",
          style: "numbered",
          items: [
            {
              label: "Using Translate & Adapt without SEO review",
              body: "Shopify's built-in translation app produces grammatically correct translations but doesn't optimize for search terms. Translated meta titles and descriptions rarely contain the keywords that users in the target market actually search for. Every translated field should be reviewed against local keyword research.",
            },
            {
              label: "Identical URL handles across languages",
              body: "A product with handle /products/mashiko-yaki-chawan is fine for Japanese markets but means nothing to English searchers. Ideally, create locale-aware handles: /en/products/handmade-japanese-tea-bowl. Shopify Markets supports this via translated handles, but many merchants skip this step.",
            },
            {
              label: "Missing alt text for product images",
              body: "Product images without alt text are invisible to image search — a significant traffic source for visual products like Japanese crafts, fashion, and home goods. When alt text exists only in Japanese, the English versions of those pages lose image SEO entirely.",
            },
            {
              label: "Not configuring separate sitemaps per locale",
              body: "Shopify automatically generates locale-aware sitemaps when Markets is configured, but verify this is working. Check yourstore.com/sitemap.xml — each locale should have its own sitemap index. If you only see one language's pages, Google may not discover your other locale variants.",
            },
            {
              label: "Ignoring page speed for international visitors",
              body: "Images optimized for Japanese broadband (large, uncompressed) can be painfully slow for visitors in markets with different infrastructure. Use Shopify's built-in image CDN and ensure responsive images are properly implemented. Page speed is a direct ranking factor in all markets.",
            },
            {
              label: "No internal linking between locale versions",
              body: "While hreflang tells Google about language versions, internal links within each locale version build authority. Your Japanese blog post about tea ceremony should link to Japanese product pages; your English guide to Japanese pottery should link to English product pages. Cross-locale internal links (Japanese blog linking to English product page) provide less SEO value.",
            },
          ],
        },
        {
          type: "heading",
          level: 2,
          content: "SEO Tools Comparison: What Works for Multilingual Stores",
        },
        {
          type: "table",
          headers: [
            "Tool",
            "Japanese Market Support",
            "Shopify Integration",
            "Best For",
            "Monthly Cost",
          ],
          rows: [
            ["Google Search Console", "Full (set region to Japan)", "Manual URL submission", "Performance monitoring, error detection", "Free"],
            ["Ahrefs", "Good (Japanese keyword DB)", "None (external tool)", "Competitor analysis, backlink auditing, keyword research", "$99–$999"],
            ["Semrush", "Good (Japanese keyword DB)", "None (external tool)", "Keyword tracking, site audit, content gap analysis", "$130–$500"],
            ["Google Keyword Planner", "Full (native Japanese support)", "None (external tool)", "Search volume data, keyword discovery", "Free (with Ads account)"],
            ["Screaming Frog", "Full (crawls any language)", "None (desktop tool)", "Technical SEO auditing, hreflang validation", "Free (500 URLs) / £199/yr"],
            ["Shopify Markets + built-in SEO", "Native support", "Built-in", "Hreflang automation, basic meta tag management", "Included with Shopify plan"],
          ],
          caption: "No single tool covers everything. Most successful cross-border stores combine GSC (free monitoring) + one paid research tool (Ahrefs or Semrush) + Shopify's built-in features.",
        },
        {
          type: "heading",
          level: 2,
          content: "The Shopify SEO App Landscape: What's Available and What's Missing",
        },
        {
          type: "text",
          content: "I've spent months testing and tracking the major Shopify SEO apps, and here's the honest truth: they're all fine for single-language stores. The problems start the moment you sell across borders. Let me walk you through what's out there and where the gaps are — because understanding this saves you from stacking three apps that still don't solve your actual problem.",
        },
        {
          type: "table",
          headers: ["App", "Installs / Rating", "Price", "What It Does Well", "The Cross-Border Gap"],
          rows: [
            ["Avada SEO", "6,300+ reviews, 4.9★", "Free – $99/mo", "Best free tier in the market. Covers image optimization, meta tags, and structured data without paying a cent.", "Template-based meta tags — same formula for every product. Zero multilingual keyword awareness. Your Japanese page and English page get the same meta structure."],
            ["Booster SEO", "4,260+ reviews, 4.8★", "Free – $89/mo", "AutoPilot mode that scans and fixes issues in the background. Great for set-it-and-forget-it stores.", "Auto-generated content is inherently generic. It can't research what's ranking in google.co.jp vs google.com and write accordingly."],
            ["Smart SEO (Sherpas)", "1,200+ reviews, 4.9★", "Free – $29.99/mo", "Best budget option. ChatGPT-4 integration for meta tags. Surprisingly capable for the price.", "Meta generation treats all languages the same — it translates rather than independently optimizes per locale."],
            ["SearchPie", "2,319+ reviews, 4.9★", "Free – $499/mo", "Combines SEO + page speed in one app. Excellent for beginners with plain-language explanations.", "Tries to do everything, goes deep on nothing. Multilingual SEO needs depth, not breadth."],
            ["Lyros Smart SEO", "4,400+ reviews, 4.9★", "Varies", "Vision AI that reads your product images and writes alt text contextually. GPT-5 powered meta generation.", "English-only image analysis. Can't write alt text that targets Japanese search terms for your .co.jp audience."],
            ["TinyIMG", "2,160+ reviews, 5.0★", "Free – $49/mo", "Excellent image compression and lazy loading. Generates LLMs.txt for AI search visibility.", "Image-focused. Great at one thing, doesn't help with the broader multilingual content SEO problem."],
          ],
          caption: "Market data from App Store reviews and a 260K-store study (StoreInspect, June 2026). The top 3 apps control 82.4% of all Shopify SEO installs.",
        },
        {
          type: "text",
          content: "Here's what jumps out from this landscape: every app assumes you're optimizing for ONE Google in ONE language. They'll auto-generate meta titles using the same template whether your page is in Japanese or English. They don't research what's actually ranking in each market. They can't write an alt text that says 'Handmade Japanese pottery matcha bowl' for your English audience and '益子焼 手びねり 抹茶碗 青釉' for your Japanese audience — both targeting the actual search terms people use in each market.",
        },
        {
          type: "callout",
          content: "The 2026 shift to watch: AI search visibility. TinyIMG and SEOAnt now generate LLMs.txt files that ChatGPT, Perplexity, and Gemini parse when surfacing product information. If you're not structured for AI search, you're missing an emerging traffic channel — and most SEO apps haven't caught up yet.",
          variant: "info",
        },
        {
          type: "heading",
          level: 3,
          content: "What's Actually Missing: The Gap No App Fills",
        },
        {
          type: "list",
          style: "bullet",
          items: [
            {
              label: "Locale-specific keyword research built in",
              body: "No existing app researches what's ranking in google.co.jp separately from google.com and generates different meta content for each. They all translate or template.",
            },
            {
              label: "Independent meta generation per market",
              body: "Your English meta title for a ceramic bowl should mention 'Japanese pottery' and 'handmade.' Your Japanese meta should mention '益子焼' and '通販.' These aren't translations of each other — they're separate optimizations.",
            },
            {
              label: "SERP-aware content optimization",
              body: "None of the existing tools study your top 5 competitors in each locale's SERP and optimize against them. They work in a vacuum.",
            },
            {
              label: "Zero script bloat for multilingual stores",
              body: "Running Booster SEO + a translation app + a structured data app means three sets of JavaScript injected into your theme. Each one costs you 0.2-0.5 seconds of load time — which directly hurts rankings.",
            },
            {
              label: "AEO readiness across languages",
              body: "LLMs.txt is English-only on most tools. For Japanese products, you need structured content that LLMs can parse in both languages to recommend your products to Japanese AND English-speaking users.",
            },
          ],
        },
        {
          type: "heading",
          level: 2,
          content: "Decision Framework: Automating Multilingual SEO at Scale",
        },
        {
          type: "text",
          content: "Everything in this guide is actionable manually — and for stores with fewer than 50 products in 2-3 markets, manual optimization is perfectly viable. You can research keywords, write locale-specific meta tags, add alt text, and validate hreflang by hand. The ROI of manual SEO work is excellent because you learn exactly how each element affects your rankings.",
        },
        {
          type: "text",
          content: "The math changes when you scale. A store with 200 products across 5 markets has 1,000 product pages that each need unique meta titles, descriptions, and alt text optimized for local keywords. Manual optimization at 15 minutes per page equals 250 hours — over 6 weeks of full-time work. And it needs updating whenever you add products, enter new markets, or search trends shift. This is where purpose-built tooling like Aganim AI's SEO agent becomes genuinely necessary rather than merely convenient.",
        },
        {
          type: "text",
          content: "Aganim AI approaches multilingual SEO differently from generic translation or bulk-editing tools. Its SEO agent analyzes SERP competitors in each locale — studying what's actually ranking for your target keywords in each market — then generates meta titles, descriptions, and alt text that are optimized for those specific competitive landscapes. The output isn't translated from a source language; it's independently generated for each market based on local search data. Combined with the Brand Soul system for voice consistency and one-click Shopify publishing, it eliminates the workflow overhead that makes manual multilingual SEO impractical at scale.",
        },
        {
          type: "cta",
          title: "Automate Your Multilingual SEO",
          body: "Aganim AI's SEO agent analyzes SERP competitors in each locale and generates optimized meta titles, descriptions, and alt text across all your markets. Free for 10 products.",
          buttonText: "Install Free on Shopify",
          buttonUrl: "https://admin.shopify.com/oauth/install?client_id=315cfaf63c9baf27e4ba9a22b91b168e",
        },
      ],
      faq: [
        {
          question: "How do I check if my Shopify store's hreflang tags are working correctly?",
          answer: "View the page source of any product page and search for 'hreflang'. You should see one <link> tag for each language/market version of that page, including the page itself. Then check a corresponding page in another language — it should have reciprocal tags pointing back. For automated checking across your entire store, use Ahrefs Site Audit or Screaming Frog with the hreflang validation feature enabled. Google Search Console's International Targeting report (under Legacy tools) also flags hreflang errors.",
        },
        {
          question: "Should I use subfolders (/ja/) or separate domains (.jp) for my Japanese store?",
          answer: "For most merchants, subfolders (yourstore.com/ja/) are recommended. They consolidate domain authority from backlinks, are fully supported by Shopify Markets without custom development, and simplify hreflang management. Separate domains (.jp) only make sense if you have existing domain authority on the .jp domain, need completely different branding per market, or face regulatory requirements for local hosting. The SEO performance difference is minimal when hreflang is properly configured.",
        },
        {
          question: "Why is my Japanese content ranking in English-speaking markets instead of the English version?",
          answer: "This typically indicates broken or missing hreflang tags. Google defaults to showing whichever version it indexed first or considers most authoritative. Check three things: (1) hreflang tags exist on both language versions and reference each other correctly, (2) the English version isn't accidentally canonicalized to the Japanese version, and (3) the English version is actually indexed (use URL Inspection in Search Console). Also verify your Shopify Markets settings haven't accidentally restricted the English version's availability.",
        },
        {
          question: "How different should my Japanese and English meta descriptions be for the same product?",
          answer: "Very different. They should not be translations of each other. Each should be independently written targeting the keywords and buyer psychology of that specific market. Japanese meta descriptions are limited to ~80-120 characters due to wider character display, so they must be extremely concise. English descriptions have ~150-160 characters to work with. Research what your ranking competitors use in each market and write accordingly.",
        },
        {
          question: "Do I need to translate my URL slugs/handles for SEO?",
          answer: "Translated handles help but aren't strictly required. Google can rank pages with Japanese-romanized handles (e.g., /products/mashiko-chawan) in English markets if the page content is properly optimized. However, English-keyword handles (/products/handmade-tea-bowl) do provide a small ranking signal and improve click-through rates since users see recognizable words in the URL in search results. Shopify Markets supports locale-specific handles — use them if you have time, but prioritize meta tags and content optimization first.",
        },
      ],
    },
    ja: {
      title: "越境EC×Shopify SEO完全ガイド【2026年版】— 日本のストアが海外で検索上位を獲る方法",
      subtitle: "日本から海外に販売するマーチャント、そして日本商品を扱う海外マーチャントのための実践的な多言語SEOガイド。hreflang設定、メタタグ最適化、構造化データ、キーワードリサーチ、そしてオーガニックトラフィックを無言で殺すミスを網羅。",
      metaTitle: "越境EC Shopify SEO完全ガイド【2026年版】hreflang・多言語対策 | Aganim AI",
      metaDescription: "日本の越境ECストア向けShopify SEO完全ガイド。hreflang設定、日本語キーワードリサーチ、メタタグ最適化、構造化データ、よくあるミスまで徹底解説。多言語SEO対策の決定版。",
      heroAlt: "日本のShopifyストアの多言語SEO最適化を視覚的に示すガイド",
      tldr: "越境ECのSEOは翻訳だけでは不十分。適切なhreflang実装、ロケール別キーワードリサーチ、文化に適応したメタタグ、各市場の検索エンジンが理解する構造化データが必要です。多くの日本のマーチャントは、国際ターゲティングの設定ミスにより潜在的なオーガニックトラフィックの40〜60%を失っています。このガイドでは、修正すべき技術的・戦略的要素をすべてカバーします。",
      sections: [
        {
          type: "heading",
          level: 2,
          content: "多言語SEOが国内SEOと根本的に異なる理由",
        },
        {
          type: "text",
          content: "日本国内のみで販売するShopifyストアであれば、SEOは比較的シンプルです。Google日本向けに最適化し、日本語でコンテンツを書き、日本語キーワードを狙えばよいのです。しかし、海外展開する瞬間——あるいは海外のマーチャントが日本製品を販売する場合——複雑さは何倍にも膨れ上がります。1つの言語で1つの検索エンジンに最適化するのではなく、それぞれ異なるランキング要因、ユーザーインテントのパターン、コンテンツの期待値を持つ複数のGoogle間で競合するシグナルを管理することになります。",
        },
        {
          type: "text",
          content: "技術的な核心は、どのページをどのオーディエンスに表示するかをGoogleに明示的に伝えることです。明示的なシグナルがなければ、Googleは推測します——そしてその推測は頻繁に間違えます。手作り陶器を販売する日本のマーチャントは、日本語の商品ページがGoogle USの検索結果に表示される一方で、英語ページは見えないという状況に直面するかもしれません。さらに悪いケースでは、Googleが日本語版と英語版を重複コンテンツと見なし、両方を抑制してしまうこともあります。",
        },
        {
          type: "text",
          content: "これは理論上の問題ではありません。越境ECのShopifyストアのSearch Consoleデータに基づくと、国際ターゲティングの設定ミスにより、潜在的なオーガニックトラフィックの40〜60%が間違った言語バージョンに誘導されるか、完全にフィルタリングされてしまいます。修正には4つの領域での協調的な作業が必要です：hreflangタグ、ロケール別メタデータ、コンテンツアダプテーション、構造化データ。それぞれを詳しく解説します。",
        },
        {
          type: "callout",
          content: "重要なポイント：Googleはgoogle.co.jpとgoogle.comを別々のエコシステム・別々のインデックスとして扱います。一方で上位表示されても、もう一方では自動的に順位が上がりません。各市場ごとに個別のSEO戦略が必要です。",
          variant: "info",
        },
        {
          type: "heading",
          level: 2,
          content: "hreflang：多言語SEOの基盤（そして大半のストアが壊すポイント）",
        },
        {
          type: "text",
          content: "hreflangタグは、検索エンジンにページの言語・地域バージョンの存在とその場所を伝えるHTMLアノテーションです。越境ECのSEOにおいて最も重要な技術要素であり、同時に最も設定ミスが多い要素でもあります。適切に実装されたhreflangは、日本のユーザーには日本語ページを、アメリカのユーザーには英語ページを、フランスのユーザーにはフランス語ページを検索結果で表示させます。",
        },
        {
          type: "text",
          content: "構文は一見シンプルです：<link rel=\"alternate\" hreflang=\"ja\" href=\"https://yourstore.com/ja/products/ceramic-bowl\" />。しかし実装の詳細でストアは躓きます。すべてのページが自身を含む全言語バージョンを参照する必要があります。URLは絶対パス（相対パスではなく）でなければなりません。言語コードはISO 639-1形式に従う必要があります。そして決定的に重要なのが——hreflangセットで参照されるすべてのページが、一致するタグで相互参照し合う必要があることです。ページAが英語版としてページBを指す場合、ページBは日本語版としてページAを指さなければなりません。このチェーンの1つのリンク切れで、セット全体が無効化される可能性があります。",
        },
        {
          type: "image",
          src: "/blog/seo-guide/hreflang-setup.png",
          alt: "Shopify商品ページの日本語版、英語版、フランス語版間の適切なhreflangタグ設定を示す図",
          caption: "適切なhreflang実装には、すべての言語バージョン間で双方向の参照が必要です。タグの欠落や不一致はセット全体を無効にします。",
          width: "wide",
        },
        {
          type: "heading",
          level: 3,
          content: "Shopifyのhreflang処理とその限界",
        },
        {
          type: "text",
          content: "Shopify Marketsは、異なる言語の複数マーケットを設定すると自動的にhreflangタグを生成します。日本マーケット（日本語）、USマーケット（英語）、フランスマーケット（フランス語）を設定していれば、Shopifyは適切なhreflangアノテーションをページヘッダーに注入します。これはMarkets以前の時代——マーチャントがhreflangのためにサードパーティアプリやカスタムLiquidコードを必要としていた頃——と比べて大きな改善です。",
        },
        {
          type: "text",
          content: "しかし、Shopifyの自動実装にはギャップがあります。明示的に設定したマーケットのhreflangタグしか生成されません——USとUKの両方に英語で販売していても、それぞれ別のマーケットを作成していなければ、地域別hreflang（en-us vs en-gb）は得られません。タグはプライマリドメインのみを参照するため、マーケットごとに別ドメイン（例：yourstore.jpとyourstore.com）を使用するストアにはカスタムソリューションが必要です。また、あるマーケットで商品を非公開にして他のマーケットでは公開したままにすると、hreflangチェーンが静かに壊れます。",
        },
        {
          type: "list",
          style: "numbered",
          items: [
            {
              label: "hreflang実装を確認する",
              body: "Googleのリッチリザルトテストを使用するか、商品ページのソースを表示して'hreflang'を検索します。各マーケット/言語の組み合わせに対して1つの<link>タグが存在し、現在のページ自身の言語も含まれているはずです。欠落がある場合はMarketsの設定を見直す必要があります。",
            },
            {
              label: "相互タグを確認する",
              body: "各言語の商品URLを選び、hreflangタグが正しく相互参照しているか確認します。日本語ページには英語URLが記載され、その逆もまた然りです。AhrefsのSite AuditやScreaming Frogで、カタログ全体に対するこのチェックを自動化できます。",
            },
            {
              label: "x-defaultフォールバックを追加する",
              body: "プライマリマーケットを指すx-default hreflangタグを含めます。これにより、どの特定マーケットの言語/地域にも一致しないユーザーにどのバージョンを表示するかをGoogleに伝えます。Marketsの設定が正しければ、Shopifyが自動的に追加します。",
            },
            {
              label: "マーケット変更のたびに検証する",
              body: "マーケットの追加/削除、マーケットドメインの変更、特定マーケットからの商品非公開の際には、必ずhreflang設定を再検証します。壊れたhreflangはhreflangが無いよりも悪い——積極的に検索エンジンを混乱させます。",
            },
          ],
        },
        {
          type: "callout",
          content: "よくあるミス：多くの日本のマーチャントはShopify Marketsを設定しても、すべての商品をすべてのマーケットに公開し忘れます。非公開の商品はhreflangチェーンを壊します。「商品 > すべての商品」からマーケット公開状況でフィルタリングしてギャップを見つけましょう。",
          variant: "warning",
        },
        {
          type: "heading",
          level: 2,
          content: "多言語で実際に効果を発揮するメタタグ",
        },
        {
          type: "text",
          content: "メタタイトルとディスクリプションは、検索結果におけるストアの第一印象です。越境ECストアにとっては、ローカルキーワードで順位を獲りつつ、ローカルユーザーにクリックしてもらうという二重の役割を果たす必要があります。日本語のメタタイトルを英語に直訳しても、どちらの目標も達成できないケースがほとんどです。日本のユーザーが検索する語句と英語のユーザーが検索する語句は構造的に異なり、クリックを促す説得のパターンも文化によって違うからです。",
        },
        {
          type: "text",
          content: "日本の陶器ストアを例に考えてみましょう。日本語のメタタイトルは「手作り陶器 | 益子焼の茶碗・湯呑み通販 — 窯元直送」かもしれません。日本の検索者には完璧に機能します——関連キーワード（手作り陶器、益子焼、茶碗、湯呑み、通販、窯元直送）を含み、信頼性を伝えます。しかし直訳すると「Handmade Pottery | Mashiko Ware Tea Bowls and Cups Online — Direct from Kiln」——これは英語話者が実際に検索する語句とも、彼らが重視するポイントとも乖離しています。",
        },
        {
          type: "text",
          content: "同じストアの効果的な英語メタタイトルは「Authentic Japanese Ceramics | Handcrafted Mashiko Pottery — Ships Worldwide」のようになるでしょう。違いに注目してください。'authentic Japanese'は西洋のバイヤーに産地と品質を伝え、'handcrafted'は英語の検索ボリュームで'handmade'より高パフォーマンスを発揮し、'ships worldwide'は海外バイヤーの最大の懸念（これ、届くの？）に応えます。これらは翻訳の選択ではありません——キーワードリサーチに基づいたローカライゼーションの選択です。",
        },
        {
          type: "image",
          src: "/blog/seo-guide/meta-tags-example.png",
          alt: "陶器Shopifyストアの最適化された日本語と英語のメタタイトル・ディスクリプションの比較",
          caption: "同じストア、同じ商品——しかし直訳ではなく、各市場の検索行動とバイヤー心理に合わせて設計されたメタタグ。",
          width: "wide",
        },
        {
          type: "heading",
          level: 3,
          content: "文字数制限と表示の違い",
        },
        {
          type: "text",
          content: "Googleの表示制限は文字幅の違いにより言語ごとに異なります。英語ではメタタイトルが約50〜60文字、ディスクリプションが約150〜160文字表示されます。日本語は文字幅が広いため、タイトルは約30〜35文字、ディスクリプションは約80〜120文字です。つまり日本語のメタコンテンツは、ターゲットキーワードを含みながらもより簡潔にまとめる必要があります。多くのマーチャントはこれに気づかず、検索結果で途切れてしまう日本語メタディスクリプションを書いてしまい、CTAが失われています。",
        },
        {
          type: "list",
          style: "bullet",
          items: [
            {
              label: "英語メタタイトル",
              body: "50〜60文字。冒頭付近にプライマリキーワードを配置。スペースが許せば末尾にブランド名を付加。",
            },
            {
              label: "日本語メタタイトル",
              body: "30〜35文字（全角）。最重要キーワードを前方に配置。区切り文字（「|」や「—」）は控えめに。",
            },
            {
              label: "英語メタディスクリプション",
              body: "150〜160文字。バリュープロポジションとCTAを含める。自然なキーワード配置（詰め込まない）。",
            },
            {
              label: "日本語メタディスクリプション",
              body: "80〜120文字（全角）。極めて簡潔に。最も強力なセールスポイント1つ＋行動喚起1つを優先。",
            },
          ],
        },
        {
          type: "heading",
          level: 2,
          content: "キーワードリサーチ：バイリンガルでは不十分、バイカルチャーが必要",
        },
        {
          type: "text",
          content: "越境ECストアのキーワードリサーチは、単なるバイリンガルのキーワードリサーチではありません——バイカルチャーのキーワードリサーチです。日本語と英語の話者は、同じ概念に異なる単語を使うだけでなく、根本的に異なるインテントパターン、具体性のレベル、カテゴリ構造で検索します。この違いを理解することが、上位表示できるストアとできないストアを分ける決定的な差です。",
        },
        {
          type: "text",
          content: "抹茶を販売するストアを例に取りましょう。日本の検索者は非常に具体的な複合語を使います：「抹茶 粉末 有機 宇治」——彼らは抹茶が何かを既に知っており、産地と品質でフィルタリングしています。英語の検索者はより広い網を張ります：'best matcha powder'、'matcha vs green tea'、'how to make matcha latte'——多くはまだ学習段階にあります。日本語SEOは購入者をターゲットにしますが、英語SEOは購入者になりうる学習者もターゲットにする必要があります。",
        },
        {
          type: "text",
          content: "これはコンテンツ戦略全体に影響します。日本市場では、詳細な仕様と産地情報を持つ商品ページが検索インテントを直接満たします。英語圏の市場では、教育的なクエリを捕捉して購入に誘導するための補助コンテンツ（ブログ記事、ガイド、比較ページ）が必要になるでしょう。同じストアが両方の市場で上位表示するためには、根本的に異なる2つのコンテンツアーキテクチャが必要です。",
        },
        {
          type: "image",
          src: "/blog/seo-guide/keyword-research-comparison.png",
          alt: "手作り陶器の日本語と英語のキーワード検索ボリュームとパターンの比較。異なるインテント構造を示す",
          caption: "日本語キーワードは具体的で購入意図が高い傾向。英語キーワードは教育的・比較的なクエリが多く、異なるコンテンツタイプが求められる。",
          width: "wide",
        },
        {
          type: "heading",
          level: 3,
          content: "バイリンガルキーワードリサーチのツールと方法論",
        },
        {
          type: "text",
          content: "日本語のキーワードリサーチには、Googleキーワードプランナー（日本/日本語に設定）が最も信頼性の高い無料オプションです。AhrefsとSemrushは日本語のキーワードデータベースをサポートしていますが、日本語のロングテールクエリのカバレッジは英語ほど包括的ではありません。独自に価値ある無料ツールとして、地域を日本に設定したGoogleトレンドがあります。お中元やお歳暮など、特定商品カテゴリの検索スパイクを生む季節パターンが明らかになります。",
        },
        {
          type: "text",
          content: "日本製品を購入する英語圏のバイヤーをターゲットにした英語キーワードリサーチには、ターゲット国（US、UK、オーストラリア）に設定したGoogleキーワードプランナーから始めましょう。ただしAmazonの検索候補で補完することも重要です——日本製品のバイヤーの多くはAmazonから購入を始めるため、Amazonのオートコンプリートが、Googleキーワードプランナーが過小評価する購入意図のキーワードを明らかにします。Jungle ScoutやHelium 10などのツールはAmazonの検索ボリュームデータを提供し、ShopifyのSEO戦略に活かせます。",
        },
        {
          type: "list",
          style: "numbered",
          items: [
            {
              label: "両言語のシードキーワードから始める",
              body: "コア商品カテゴリを日本語とその英語版でリスト化します。翻訳するのではなく、独立してリサーチします。「急須」は、対象オーディエンスの親しみ度によって'Japanese teapot'にも'kyusu'にもなりえます。",
            },
            {
              label: "オートコンプリートマイニングで拡張する",
              body: "シードキーワードをターゲット国のGoogle（各国のGoogleインスタンス）に入力し、すべてのオートコンプリート候補を記録します。AmazonやYouTubeでも同様に行います。リアルなユーザークエリが明らかになります。",
            },
            {
              label: "競合キーワードを分析する",
              body: "各市場のターゲットキーワードで上位表示されている3〜5ストアを見つけます。AhrefsまたはSemrushでランキングキーワードを抽出します。自分が考慮していなかったキーワードに注目しましょう。",
            },
            {
              label: "キーワードをインテント段階にマッピングする",
              body: "各キーワードを情報収集型（学習）、商業型（比較検討）、取引型（購入）に分類します。商品ページは取引型を狙い、ブログコンテンツは情報収集型を狙います。コレクションページは商業型を狙うことが多いです。",
            },
            {
              label: "Search Consoleデータで検証する",
              body: "既存のトラフィックがある場合、Google Search Consoleはどのクエリがユーザーを導いているか表示します。国でフィルタリングし、どのキーワードがどの市場で機能しているかを確認します。リサーチで見逃した機会が見つかることも多いです。",
            },
          ],
        },
        {
          type: "heading",
          level: 2,
          content: "構造化データ：リッチリザルトを全市場で機能させる",
        },
        {
          type: "text",
          content: "構造化データ（schema.orgマークアップ）は、検索エンジンが商品情報——価格、在庫状況、レビュー、配送詳細——を曖昧さなく理解するのを助けます。越境ECストアにとって、適切に実装された構造化データはリッチリザルト（星評価、価格表示、在庫バッジ）をすべてのターゲット市場の検索結果で表示させ、クリック率を劇的に向上させます。",
        },
        {
          type: "text",
          content: "Shopifyテーマは基本的なProduct schemaマークアップを自動生成します。しかし、ほとんどのテーマはプライマリロケールの構造化データのみを出力します。日本で¥5,000、USで$35の商品を販売している場合、構造化データは各市場のページバージョンに対して正しい通貨と価格を反映すべきです。同様に、構造化データ内の配送可否、レビュー言語、商品説明もページのロケールに一致させる必要があります。",
        },
        {
          type: "text",
          content: "越境ECストアに最もインパクトのある構造化データタイプは：Product（正しいローカライズ価格付き）、BreadcrumbList（ローカライズされたカテゴリ名）、FAQPage（各言語での強調スニペットを狙う）、Organization（ロケールに適したビジネス情報）です。それぞれ単純な翻訳を超えたローカライゼーションが必要です——通貨コード、国別の在庫状況、ロケールに合致したレビュー集計。",
        },
        {
          type: "callout",
          content: "クイックウィン：各言語のトップ商品ページにFAQPage構造化データを追加しましょう。FAQリッチリザルトはSERPで大きなスペースを占め、他のリッチリザルトタイプより獲得が容易です。商品カテゴリについてバイヤーが実際に尋ねる3〜5つの本物の質問を書きましょう。",
          variant: "tip",
        },
        {
          type: "heading",
          level: 2,
          content: "コンテンツ最適化：翻訳を超えて",
        },
        {
          type: "text",
          content: "越境ECストアが犯す最大のSEOミスは、翻訳済みコンテンツを最適化済みコンテンツとして扱うことです。翻訳はコンテンツが他の言語で理解可能であることを保証します。SEO最適化はそのコンテンツが発見可能であることを保証します。これらは異なる目標であり、異なるプロセスを必要とします。完璧に翻訳された商品説明も、ローカルユーザーが実際に検索する語句を含んでいなければ、検索エンジンにとっては完全に見えない存在です。",
        },
        {
          type: "text",
          content: "商品画像のaltテキストを考えてみましょう——重要でありながら見落とされがちなSEO要素です。日本語商品画像のaltテキストは「益子焼 手びねり 茶碗 青釉」かもしれません。英語に直訳すると「Mashiko-yaki hand-formed tea bowl blue glaze」。しかし英語の検索者は'hand-formed'を使わず（'handmade'で検索し）、'Mashiko-yaki'を知らず（'Japanese pottery'で検索し）、'tea bowl'で検索しないかもしれません（商品によって'matcha bowl'や'rice bowl'で検索する）。最適化された英語altテキスト：「Handmade Japanese pottery matcha bowl with blue glaze — Mashiko ware」。同じ画像、異なるSEO価値。",
        },
        {
          type: "text",
          content: "この原則はページ上のすべてのテキスト要素に適用されます：コレクションタイトル、商品タイトル、URLハンドル、画像ファイル名、見出しタグ、本文コンテンツ。それぞれがソース言語から単に翻訳されるのではなく、ターゲット市場の検索ボキャブラリーに対して独立して最適化される必要があります。これは時間がかかりますが、国際的なオーガニックトラフィックを獲得するストアとしないストアの差を生む決定的要因です。",
        },
        {
          type: "heading",
          level: 3,
          content: "多言語Shopifyストアのurl構造",
        },
        {
          type: "text",
          content: "Shopifyは多言語URLに2つのアプローチを提供します：サブフォルダ（yourstore.com/ja/products/...）と別ドメイン（yourstore.jp）。サブフォルダは管理がシンプルで、すべてのSEOオーソリティを1つのドメインに集約し、Shopify Marketsとネイティブに連携します。別ドメインはより強力なジオターゲティングシグナルを提供し、市場別ブランディングを可能にしますが、ドメインオーソリティを分散させ、より複雑な技術管理を要します。",
        },
        {
          type: "text",
          content: "ほとんどの越境ECストアには、サブフォルダアプローチ（yourstore.com/ja/、yourstore.com/en/など）を推奨します。被リンク価値を統合し、hreflang管理を簡素化し、カスタム開発なしでShopifyが完全にサポートします。別ドメインが適する主なシナリオは、特定市場で確立されたブランドプレゼンスがある場合（例：既に.jpドメインにオーソリティがある）、または法的・規制上の要件でローカルホスティングが必要な場合です。",
        },
        {
          type: "heading",
          level: 2,
          content: "Google Search Consoleの国際ターゲティング設定",
        },
        {
          type: "text",
          content: "Google Search Console（GSC）は、国際SEOの主要な診断ツールです。越境ECストアにとって、適切なGSC設定とは、国と言語でセグメント化されたパフォーマンスデータを確認できること——どの市場が機能していて、どこに改善が必要かを理解するために不可欠です。多くのマーチャントはGSCを一度設定して、国際モニタリングの構成を決して行いません。",
        },
        {
          type: "image",
          src: "/blog/seo-guide/search-console-international.png",
          alt: "国別にフィルタリングされたGoogle Search Consoleのパフォーマンスレポート。日本、アメリカ、イギリスのトラフィックの個別指標を表示",
          caption: "GSCパフォーマンスを国別フィルタリングして、どの市場がオーガニックトラフィックを生み、どこで機会を逃しているか確認。",
          width: "wide",
        },
        {
          type: "list",
          style: "numbered",
          items: [
            {
              label: "すべてのURLバリエーションを確認する",
              body: "サブフォルダ（yourstore.com/ja/）を使用する場合は1つのプロパティのみ必要です。別ドメインを使用する場合は各ドメインを個別に確認します。すべてのバージョンが確認済みかつリンクされていることを確認しましょう。",
            },
            {
              label: "International Targetingレポートを確認する",
              body: "レガシーツール > International Targetingに移動します。Googleがhreflangタグを正しく検出しているか確認します。このレポートはhreflang実装の修正が必要なエラーを表示します。",
            },
            {
              label: "国別パフォーマンスフィルタを設定する",
              body: "パフォーマンス > 検索結果で、各ターゲット市場の保存済みフィルタ（国：日本、国：アメリカなど）を作成します。市場間のインプレッション、クリック数、平均掲載順位を比較して機会を特定しましょう。",
            },
            {
              label: "hreflangエラーを監視する",
              body: "カバレッジレポートはhreflang関連の問題をフラグ付けします。よくある問題：「適切な正規タグのある代替ページ」（通常、hreflangが別にcanonicalを設定するページを指している）、「ユーザーが選択した正規URLのない重複」（Googleがどのバージョンをインデックスすべきか混乱）。",
            },
            {
              label: "URL検査ツールをロケール別に使用する",
              body: "同じ商品URLを各言語バージョンで検査します。Googleが各ロケールバリアントを個別にクロール・インデックスしていることを確認しましょう。ロケールバリアントが「検出 - インデックス未登録」と表示される場合、hreflangまたは内部リンクの改善が必要です。",
            },
          ],
        },
        {
          type: "heading",
          level: 2,
          content: "海外トラフィックを静かに殺すよくあるSEOミス",
        },
        {
          type: "text",
          content: "数十の越境EC Shopifyストアを監査した結果、繰り返し現れるパターンがあります。これらは珍しいエッジケースではなく、国際SEOを試みるストアの大多数に影響する体系的な問題です。それぞれが明らかなエラーを起こすことなく、静かにオーガニックトラフィックを抑制しています。",
        },
        {
          type: "list",
          style: "numbered",
          items: [
            {
              label: "Translate & AdaptをSEOレビューなしで使用する",
              body: "Shopifyの組み込み翻訳アプリは文法的に正しい翻訳を生成しますが、検索語句には最適化されていません。翻訳されたメタタイトルやディスクリプションが、ターゲット市場のユーザーが実際に検索するキーワードを含むことは稀です。翻訳されたすべてのフィールドをローカルキーワードリサーチに基づいてレビューすべきです。",
            },
            {
              label: "言語間でURLハンドルが同一",
              body: "/products/mashiko-yaki-chawan というハンドルは日本市場では問題ありませんが、英語圏の検索者には何の意味もありません。理想的にはロケール対応ハンドルを作成します：/en/products/handmade-japanese-tea-bowl。Shopify Marketsは翻訳ハンドルをサポートしていますが、多くのマーチャントがこのステップをスキップしています。",
            },
            {
              label: "商品画像のaltテキストが欠落",
              body: "altテキストなしの商品画像は画像検索では見えません——日本の工芸品、ファッション、インテリア雑貨のようなビジュアル商品にとって重要なトラフィックソースです。altテキストが日本語のみの場合、それらのページの英語バージョンは画像SEOを完全に失います。",
            },
            {
              label: "ロケール別サイトマップの未設定",
              body: "Marketsが設定されていればShopifyは自動的にロケール対応サイトマップを生成しますが、動作を確認しましょう。yourstore.com/sitemap.xmlを確認——各ロケールに独自のサイトマップインデックスがあるはずです。1つの言語のページしか見えない場合、Googleが他のロケールバリアントを発見できない可能性があります。",
            },
            {
              label: "海外訪問者のページ速度を無視",
              body: "日本のブロードバンド向けに最適化された画像（大きく非圧縮）は、インフラが異なる市場の訪問者にとって致命的に遅くなりえます。ShopifyのビルトインイメージCDNを活用し、レスポンシブイメージが適切に実装されていることを確認しましょう。ページ速度はすべての市場で直接的なランキング要因です。",
            },
            {
              label: "ロケールバージョン間の内部リンクがない",
              body: "hreflangはGoogleに言語バージョンを伝えますが、各ロケールバージョン内の内部リンクがオーソリティを構築します。日本語のお茶の記事は日本語の商品ページにリンクすべきで、英語の日本陶器ガイドは英語の商品ページにリンクすべきです。クロスロケールの内部リンク（日本語ブログから英語商品ページへ）はSEO価値が低くなります。",
            },
          ],
        },
        {
          type: "heading",
          level: 2,
          content: "SEOツール比較：多言語ストアに効くもの",
        },
        {
          type: "table",
          headers: [
            "ツール",
            "日本市場サポート",
            "Shopify連携",
            "最適な用途",
            "月額費用",
          ],
          rows: [
            ["Google Search Console", "完全対応（地域を日本に設定）", "手動URL送信", "パフォーマンス監視、エラー検出", "無料"],
            ["Ahrefs", "良好（日本語キーワードDB）", "なし（外部ツール）", "競合分析、被リンク監査、キーワードリサーチ", "$99〜$999"],
            ["Semrush", "良好（日本語キーワードDB）", "なし（外部ツール）", "キーワード追跡、サイト監査、コンテンツギャップ分析", "$130〜$500"],
            ["Googleキーワードプランナー", "完全対応（ネイティブ日本語サポート）", "なし（外部ツール）", "検索ボリュームデータ、キーワード発見", "無料（広告アカウント必要）"],
            ["Screaming Frog", "完全対応（全言語クロール可）", "なし（デスクトップツール）", "テクニカルSEO監査、hreflang検証", "無料（500URL） / £199/年"],
            ["Shopify Markets + 組み込みSEO", "ネイティブサポート", "組み込み", "hreflang自動化、基本メタタグ管理", "Shopifyプランに含む"],
          ],
          caption: "1つのツールですべてをカバーすることはできません。成功している越境ECストアの多くは、GSC（無料監視）＋有料リサーチツール1つ（AhrefsかSemrush）＋Shopifyの組み込み機能を組み合わせています。",
        },
        {
          type: "heading",
          level: 2,
          content: "Shopify SEOアプリの現状：何があって何が足りないのか",
        },
        {
          type: "text",
          content: "数ヶ月かけて主要なShopify SEOアプリをテスト・追跡してきましたが、正直に言います。どれも単一言語ストアには十分です。問題は越境販売を始めた瞬間に発生します。現在何が利用可能で、どこにギャップがあるのかを整理します——これを理解しておけば、3つのアプリを重ねても根本的な問題が解決しない事態を避けられます。",
        },
        {
          type: "table",
          headers: ["アプリ", "インストール / 評価", "価格", "得意分野", "越境ECのギャップ"],
          rows: [
            ["Avada SEO", "6,300件以上のレビュー、4.9★", "無料〜$99/月", "市場最強の無料プラン。画像最適化、メタタグ、構造化データを無料でカバー。", "テンプレート型メタタグ——全商品に同じ公式を適用。多言語キーワード認識はゼロ。日本語ページも英語ページも同じメタ構造になる。"],
            ["Booster SEO", "4,260件以上のレビュー、4.8★", "無料〜$89/月", "バックグラウンドで問題をスキャン・修正するAutoPilotモード。放置型ストアに最適。", "自動生成コンテンツは本質的に汎用的。google.co.jpとgoogle.comで何がランキングしているかをリサーチして書き分けることができない。"],
            ["Smart SEO (Sherpas)", "1,200件以上のレビュー、4.9★", "無料〜$29.99/月", "最良のコスパ。ChatGPT-4連携によるメタタグ生成。価格の割に驚くほど有能。", "メタ生成がすべての言語を同等に扱う——ロケール別に独立して最適化するのではなく翻訳する。"],
            ["SearchPie", "2,319件以上のレビュー、4.9★", "無料〜$499/月", "SEO＋ページ速度を1つのアプリで。平易な言葉での説明が初心者に好評。", "すべてをやろうとして、深くは何もやらない。多言語SEOに必要なのは広さではなく深さ。"],
            ["Lyros Smart SEO", "4,400件以上のレビュー、4.9★", "変動制", "Vision AIが商品画像を読みコンテキストに応じたaltテキストを作成。GPT-5搭載のメタ生成。", "画像分析は英語のみ。.co.jp向けの日本語検索語句をターゲットにしたaltテキストは書けない。"],
            ["TinyIMG", "2,160件以上のレビュー、5.0★", "無料〜$49/月", "優れた画像圧縮と遅延読み込み。AI検索可視性のためのLLMs.txt生成。", "画像特化型。1つのことに優れるが、多言語コンテンツSEOの広範な問題は解決しない。"],
          ],
          caption: "App Storeレビューと26万ストア調査（StoreInspect、2026年6月）に基づく市場データ。上位3アプリがShopify SEOインストール全体の82.4%を占有。",
        },
        {
          type: "text",
          content: "この市場を俯瞰して浮かび上がるのは、すべてのアプリが「1つの言語で1つのGoogle」に最適化する前提で作られていることです。ページが日本語でも英語でも同じテンプレートでメタタイトルを自動生成します。各市場で実際に何がランキングしているかはリサーチしません。英語のオーディエンスには'Handmade Japanese pottery matcha bowl'、日本語のオーディエンスには'益子焼 手びねり 抹茶碗 青釉'というように、各市場で実際に使われる検索語句をターゲットにしたaltテキストを書き分けることができないのです。",
        },
        {
          type: "callout",
          content: "2026年に注目すべき変化：AI検索の可視性。TinyIMGとSEOAntはChatGPT、Perplexity、Geminiが商品情報を表示する際にパースするLLMs.txtファイルを生成するようになりました。AI検索に対応した構造になっていなければ、新たなトラフィックチャネルを逃しています——そしてほとんどのSEOアプリはまだこの変化に追いついていません。",
          variant: "info",
        },
        {
          type: "heading",
          level: 3,
          content: "本当に足りないもの：どのアプリも埋めないギャップ",
        },
        {
          type: "list",
          style: "bullet",
          items: [
            {
              label: "ロケール別キーワードリサーチの内蔵",
              body: "google.co.jpとgoogle.comで何がランキングしているかを別々にリサーチし、それぞれ異なるメタコンテンツを生成する既存アプリは存在しない。すべて翻訳かテンプレートで対応している。",
            },
            {
              label: "市場ごとの独立したメタ生成",
              body: "陶器の英語メタタイトルには'Japanese pottery'と'handmade'を含めるべき。日本語メタには'益子焼'と'通販'を含めるべき。これらは互いの翻訳ではない——別々の最適化です。",
            },
            {
              label: "SERP認識型コンテンツ最適化",
              body: "既存ツールで各ロケールのSERPで上位5競合を研究し、それに対して最適化するものはない。すべて真空の中で作業している。",
            },
            {
              label: "多言語ストアでのスクリプト肥大ゼロ",
              body: "Booster SEO＋翻訳アプリ＋構造化データアプリを同時に使うと、テーマに3セットのJavaScriptが注入される。それぞれ0.2〜0.5秒のロード時間を追加し、順位に直接影響する。",
            },
            {
              label: "多言語でのAEO対応",
              body: "LLMs.txtはほとんどのツールで英語のみ。日本の商品には、LLMが両言語でパースして日本語・英語ユーザーの両方に商品を推薦できる構造化コンテンツが必要。",
            },
          ],
        },
        {
          type: "heading",
          level: 2,
          content: "判断フレームワーク：多言語SEOの大規模自動化",
        },
        {
          type: "text",
          content: "このガイドのすべてはマニュアルで実行可能です——50商品未満で2〜3市場のストアであれば、手動最適化は十分に実用的です。キーワードリサーチ、ロケール別メタタグの作成、altテキストの追加、hreflangの検証を手作業で行えます。手動SEOのROIは優れています。各要素がランキングにどう影響するかを正確に学べるからです。",
        },
        {
          type: "text",
          content: "しかし、スケールすると計算が変わります。200商品を5市場で展開するストアは、1,000の商品ページがあり、それぞれにローカルキーワードに最適化された固有のメタタイトル、ディスクリプション、altテキストが必要です。1ページ15分の手動最適化で250時間——フルタイム作業で6週間以上。そして商品追加、新市場への進出、検索トレンドの変化のたびに更新が必要です。ここでAganim AIのSEOエージェントのような専用ツールが、単に便利というだけでなく本当に必要になります。",
        },
        {
          type: "text",
          content: "Aganim AIは汎用翻訳ツールや一括編集ツールとは異なるアプローチで多言語SEOに取り組みます。そのSEOエージェントは各ロケールのSERP競合を分析し——各市場のターゲットキーワードで実際に何がランキングしているかを研究し——それらの特定の競争環境に最適化されたメタタイトル、ディスクリプション、altテキストを生成します。出力はソース言語から翻訳されたものではなく、ローカル検索データに基づいて各市場に対して独立して生成されます。ブランドボイスの一貫性を保つBrand Soulシステムとワンクリックのshopify公開と組み合わせることで、手動の多言語SEOを大規模に非現実的にするワークフローのオーバーヘッドを排除します。",
        },
        {
          type: "cta",
          title: "多言語SEOを自動化する",
          body: "Aganim AIのSEOエージェントが各ロケールのSERP競合を分析し、すべての市場で最適化されたメタタイトル、ディスクリプション、altテキストを生成します。10商品まで無料。",
          buttonText: "Shopifyに無料インストール",
          buttonUrl: "https://admin.shopify.com/oauth/install?client_id=315cfaf63c9baf27e4ba9a22b91b168e",
        },
      ],
      faq: [
        {
          question: "Shopifyストアのhreflangタグが正しく動作しているか確認する方法は？",
          answer: "任意の商品ページのソースを表示し、'hreflang'を検索します。そのページの各言語/マーケットバージョンに対して1つの<link>タグがあり、ページ自身も含まれているはずです。次に別の言語の対応ページを確認——相互参照するタグがあるはずです。ストア全体の自動チェックには、AhrefsのSite AuditやScreaming Frogのhreflang検証機能を使用できます。Google Search ConsoleのInternational Targetingレポート（レガシーツール配下）もhreflangエラーをフラグ付けします。",
        },
        {
          question: "越境ECストアにサブフォルダ（/ja/）と別ドメイン（.jp）のどちらを使うべき？",
          answer: "ほとんどのマーチャントにはサブフォルダ（yourstore.com/ja/）を推奨します。被リンクからのドメインオーソリティを統合し、カスタム開発なしでShopify Marketsが完全サポートし、hreflang管理を簡素化します。別ドメイン（.jp）は、既に.jpドメインに既存のドメインオーソリティがある場合、市場ごとに完全に異なるブランディングが必要な場合、またはローカルホスティングの法的要件がある場合にのみ意味があります。hreflangが適切に設定されていれば、SEOパフォーマンスの差は最小限です。",
        },
        {
          question: "日本語コンテンツが英語版ではなく英語圏の検索結果に表示されるのはなぜ？",
          answer: "これは通常、hreflangタグの欠落または破損を示しています。Googleは最初にインデックスしたバージョン、または最もオーソリティが高いと判断したバージョンをデフォルトで表示します。3つを確認しましょう：(1) 両言語バージョンにhreflangタグが存在し相互に正しく参照している、(2) 英語バージョンが誤って日本語バージョンにcanonical化されていない、(3) 英語バージョンが実際にインデックスされている（Search ConsoleのURL検査を使用）。また、Shopify Marketsの設定が英語バージョンの公開を制限していないか確認してください。",
        },
        {
          question: "同じ商品の日本語と英語のメタディスクリプションはどのくらい異なるべき？",
          answer: "大幅に異なるべきです。互いの翻訳であってはなりません。各市場のキーワードとバイヤー心理をターゲットにして独立して書く必要があります。日本語メタディスクリプションは全角文字の表示幅のため約80〜120文字に制限されるため、極めて簡潔でなければなりません。英語は約150〜160文字の余地があります。各市場でランキングしている競合の使用している表現をリサーチし、それに合わせて書きましょう。",
        },
        {
          question: "URLスラッグ（ハンドル）はSEOのために翻訳する必要がある？",
          answer: "翻訳ハンドルは有効ですが、厳密には必須ではありません。ページコンテンツが適切に最適化されていれば、日本語ローマ字のハンドル（例：/products/mashiko-chawan）でも英語圏の市場でランキングできます。ただし英語キーワードのハンドル（/products/handmade-tea-bowl）は小さいランキングシグナルを提供し、ユーザーがURLで認識可能な単語を見ることでクリック率も向上します。Shopify Marketsはロケール別ハンドルをサポートしています——時間があれば活用しましょうが、メタタグとコンテンツ最適化を優先してください。",
        },
      ],
    },
  },
};
