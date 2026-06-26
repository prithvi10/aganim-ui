import type { BlogArticle } from "./types";

export const crossBorderPricingStrategy: BlogArticle = {
  slug: "cross-border-pricing-strategy",
  publishedAt: "2026-06-27",
  category: "pricing",
  readingTime: { en: 11, ja: 13 },
  heroImage: "/blog/pricing-strategy-hero.png",
  ogImage: "/blog/pricing-strategy-hero.png",
  content: {
    en: {
      title:
        "Cross-Border Pricing Strategy for Shopify: How to Price Japanese Products for Global Markets",
      subtitle:
        "Currency conversion is just the beginning. Learn how to set prices that actually convert across cultures — from psychological pricing differences to duty inclusion strategies.",
      metaTitle:
        "Cross-Border Pricing Strategy for Shopify — Japanese Products for Global Markets | Aganim AI",
      metaDescription:
        "A practical guide to pricing Japanese products for international markets. Covers currency rounding, cultural pricing psychology, duty inclusion, competitor monitoring, and Shopify Markets configuration.",
      heroAlt:
        "Price tags showing the same product priced differently across USD, EUR, KRW, and JPY markets",
      tldr: "Simply converting JPY to foreign currencies produces awkward prices that hurt conversions. Effective cross-border pricing requires understanding cultural expectations (tax-included vs. excluded), psychological price points per market, strategic rounding, and competitor awareness. Shopify Markets handles basic conversion but leaves optimization gaps. This guide covers the complete pricing workflow from cost-plus calculation to market-specific adjustments.",
      sections: [
        {
          type: "heading",
          level: 2,
          content: "The Problem: Why Currency Conversion Isn't Pricing Strategy",
        },
        {
          type: "text",
          content:
            "You sell a handmade ceramic bowl for \u00a55,500 in Japan. You enable Shopify Markets and suddenly it's listed at $36.78 in the US, \u20ac33.92 in Germany, and \u20a950,247 in Korea. These are mathematically correct conversions — and terrible prices. $36.78 feels arbitrary and untrustworthy. \u20ac33.92 suggests you didn't think about the European customer at all. \u20a950,247 is a number that Korean shoppers have no intuitive frame for in this product category.",
        },
        {
          type: "text",
          content:
            "The gap between currency conversion and pricing strategy is where most Japanese merchants lose international sales. You've invested in beautiful products, professional photography, and localized descriptions — but if the price looks wrong, none of that matters. A customer who sees $36.78 for a ceramic bowl unconsciously categorizes it as cheap (odd number, below $40 threshold) while the same customer would perceive $42.00 as premium craftsmanship. You've accidentally positioned a premium product as a budget item through careless pricing.",
        },
        {
          type: "text",
          content:
            "This guide covers the complete cross-border pricing workflow: cost-plus fundamentals, market-based adjustments, cultural pricing psychology, Shopify's built-in tools (and their limitations), and how to monitor competitors across markets. We'll use concrete examples throughout — following that \u00a55,500 ceramic bowl across multiple markets.",
        },
        {
          type: "callout",
          content:
            "Key insight: In cross-border commerce, price is a signal — not just a number. The same objective value can be communicated as premium, fair, or cheap depending on how you format and present the price in each market.",
          variant: "info",
        },
        {
          type: "heading",
          level: 2,
          content: "Step 1: Establish Your True Cost Floor",
        },
        {
          type: "text",
          content:
            "Before applying any market strategy, you need to know the minimum price that makes selling internationally worthwhile. Many Japanese merchants underestimate cross-border costs and end up losing money on international orders that look profitable on the surface.",
        },
        {
          type: "heading",
          level: 3,
          content: "The cross-border cost stack",
        },
        {
          type: "text",
          content:
            "For our \u00a55,500 ceramic bowl, here's what a typical cost floor calculation looks like when selling to the US market:",
        },
        {
          type: "table",
          headers: ["Cost Component", "Amount (JPY)", "Notes"],
          rows: [
            ["Product cost (COGS)", "\u00a52,200", "Materials + labor"],
            ["Domestic packaging", "\u00a5300", "Gift-quality wrapping expected for Japanese ceramics"],
            ["International shipping (EMS/DHL)", "\u00a51,800", "For a 500g item to US West Coast"],
            ["Shopify transaction fees (2.9% + \u00a530)", "\u00a5190", "On the JPY-equivalent sale price"],
            ["Currency conversion spread", "\u00a5110", "Shopify takes ~1.5% on conversion"],
            ["Breakage/loss reserve (3%)", "\u00a5165", "Ceramics have higher damage rates internationally"],
            ["Returns handling (est. 5% of orders)", "\u00a5275", "International returns are expensive"],
            ["Total cost floor", "\u00a55,040", "Minimum to break even"],
          ],
          caption:
            "At \u00a55,500 domestic price, international margins are razor-thin before any pricing strategy is applied. Most merchants need to price 20-40% above domestic for international markets.",
        },
        {
          type: "text",
          content:
            "This reveals the first uncomfortable truth: your domestic JPY price often can't be directly converted for international markets. The \u00a55,500 bowl has only \u00a5460 margin (\u00a55,500 - \u00a55,040 = \u00a5460, or 8.4%) when sold internationally at cost-equivalent pricing. That's not viable — one return wipes out profit from 5+ orders. You need to price higher internationally, which means your pricing strategy must justify a premium.",
        },
        {
          type: "callout",
          content:
            "Rule of thumb: Add 20-40% to your domestic price as the starting point for international pricing. Japanese products already carry a \"craft premium\" perception in Western markets — use it.",
          variant: "tip",
        },
        {
          type: "heading",
          level: 2,
          content: "Step 2: Market-Based Price Anchoring",
        },
        {
          type: "text",
          content:
            "Cost-plus pricing tells you the floor. Market-based pricing tells you the ceiling. The gap between them is your strategic pricing zone. For Japanese products selling internationally, this gap is often surprisingly wide because of the \"Japan premium\" — international customers frequently expect to pay more for authentic Japanese goods.",
        },
        {
          type: "heading",
          level: 3,
          content: "Research competitor pricing in each target market",
        },
        {
          type: "text",
          content:
            "For our ceramic bowl, here's what competitor research reveals across markets:",
        },
        {
          type: "table",
          headers: ["Market", "Comparable products range", "Sweet spot", "Your target price"],
          rows: [
            ["US (Amazon/Etsy)", "$28\u2013$65 for handmade ceramics", "$38\u2013$48", "$44.00"],
            ["EU (Etsy EU/local shops)", "\u20ac30\u2013\u20ac58 for artisan bowls", "\u20ac35\u2013\u20ac45", "\u20ac39.00"],
            ["Korea (Coupang/Naver)", "\u20a935,000\u2013\u20a975,000 for Japanese ceramics", "\u20a945,000\u2013\u20a955,000", "\u20a949,000"],
            ["Australia (Etsy AU)", "A$42\u2013A$72 for handmade imports", "A$48\u2013A$58", "A$52.00"],
            ["UK (Etsy/Not On The High Street)", "\u00a328\u2013\u00a352 for artisan ceramics", "\u00a332\u2013\u00a342", "\u00a336.00"],
          ],
          caption:
            "Competitor research for a handmade Japanese ceramic bowl (\u00a55,500 domestic). Target prices set within the market sweet spot rather than from currency conversion.",
        },
        {
          type: "text",
          content:
            "Notice that the target prices don't map to a single exchange rate. $44.00 at today's rate (~\u00a5150/$) equals \u00a56,600 — a 20% premium over domestic. \u20ac39.00 at ~\u00a5163/\u20ac equals \u00a56,357 — a 16% premium. \u20a949,000 at ~\u00a50.115/\u20a9 equals \u00a55,635 — only 2% above domestic. Each market has its own competitive landscape that determines what customers will pay, independent of the exchange rate.",
        },
        {
          type: "text",
          content:
            "This is the fundamental shift in thinking: you're not converting a price — you're setting a price for each market based on what that market will bear. The exchange rate is just one input, not the answer.",
        },
        {
          type: "image",
          src: "/blog/pricing-guide/competitor-pricing-table.png",
          alt: "Spreadsheet showing competitor prices across US, EU, Korea, and Australia markets for similar Japanese ceramic products",
          caption:
            "Competitive price analysis across markets. The 'right' price varies by 20%+ depending on local competition, not exchange rates.",
          width: "wide",
        },
        {
          type: "heading",
          level: 2,
          content: "Step 3: Cultural Pricing Psychology — What Looks 'Right' Varies by Country",
        },
        {
          type: "text",
          content:
            "Pricing psychology isn't universal. The number that feels trustworthy, premium, or fair changes dramatically across cultures. Getting this wrong makes your product feel foreign in a bad way — like something that wasn't meant for this market.",
        },
        {
          type: "heading",
          level: 3,
          content: "United States: The .99 and .00 divide",
        },
        {
          type: "text",
          content:
            "US consumers have deeply ingrained responses to price endings. $39.99 signals \"deal\" or \"mass market.\" $40.00 signals \"round, honest, premium.\" $44.00 signals \"carefully considered, artisan.\" For Japanese craft products targeting the premium-casual segment, prices ending in .00 or .50 outperform .99 endings. Avoid $43.99 — it screams discount retail, which contradicts your brand positioning. Go with $44.00 or even $45.00.",
        },
        {
          type: "heading",
          level: 3,
          content: "European Union: Tax-included and round numbers",
        },
        {
          type: "text",
          content:
            "EU consumers expect tax-included prices (it's legally required in B2C). They're accustomed to round numbers: \u20ac39, \u20ac45, \u20ac49. The .99 convention exists but carries a stronger \"cheap\" signal than in the US. For artisan Japanese products, round euro prices (\u20ac39.00, \u20ac42.00) communicate quality. Important: VAT (19-25% depending on country) must be included in the displayed price. If your cost floor requires \u20ac35 and VAT is 19%, your displayed price must be at least \u20ac41.65 — round up to \u20ac42 or \u20ac45.",
        },
        {
          type: "heading",
          level: 3,
          content: "South Korea: The 000 ending and prestige pricing",
        },
        {
          type: "text",
          content:
            "Korean won prices always end in ,000. Never \u20a949,500 — it looks like a system error. Always \u20a949,000 or \u20a950,000. Korean consumers are highly brand-conscious and \"Japan premium\" is well-established for ceramics, kitchenware, and beauty products. Pricing slightly above Korean domestic alternatives (by 10-20%) actually signals authenticity rather than hurting sales. A Korean-made ceramic bowl at \u20a940,000 makes a Japanese import at \u20a949,000 feel appropriately premium.",
        },
        {
          type: "heading",
          level: 3,
          content: "Japan (domestic reference): Tax-included is mandatory",
        },
        {
          type: "text",
          content:
            "Since 2021, Japan requires all B2C prices to include consumption tax (10%). Your \u00a55,500 price already includes \u00a5500 tax. Japanese consumers are trained to treat the displayed price as the final price. This expectation travels — Japanese tourists shopping on your English site will be confused if tax is added at checkout. Consider noting \"tax included\" prominently on all market pages.",
        },
        {
          type: "image",
          src: "/blog/pricing-guide/psychological-pricing.png",
          alt: "Visual comparison of how the same product appears at different psychological price points across US, EU, Korea, and Japan",
          caption:
            "The same \u00a55,500 bowl positioned with culturally appropriate price endings. Small formatting differences significantly impact purchase confidence.",
          width: "wide",
        },
        {
          type: "callout",
          content:
            "Cultural pricing summary: US \u2192 .00/.50 for premium, .99 for value | EU \u2192 round numbers, tax-included mandatory | Korea \u2192 always end in ,000, slight premium signals authenticity | Japan \u2192 tax-included, \u00a5X,XX0 endings",
          variant: "stat",
        },
        {
          type: "heading",
          level: 2,
          content: "Step 4: Handling Duties, Taxes, and Shipping in Your Price",
        },
        {
          type: "text",
          content:
            "The biggest source of cart abandonment in cross-border commerce is unexpected costs at checkout or delivery. A customer sees $44.00, adds to cart, and then discovers $12 shipping + $8 duty at checkout = $64 total. That's a 45% price increase from what they expected. Most will abandon immediately.",
        },
        {
          type: "heading",
          level: 3,
          content: "Three approaches to duty/tax handling",
        },
        {
          type: "list",
          style: "numbered",
          items: [
            {
              label: "DDP (Delivered Duty Paid) — All-inclusive pricing",
              body: "You absorb duties and taxes into the product price. Customer pays exactly what they see. Best for: premium products where the total price is still reasonable, and where surprise costs would destroy the brand experience. Your \u00a55,500 bowl becomes $52.00 \"delivered\" in the US (includes estimated duty). Higher sticker price but zero friction at delivery.",
            },
            {
              label: "DAP (Delivered At Place) — Customer pays duties on delivery",
              body: "You ship the product; the customer pays import duties/taxes when it arrives. Best for: markets with low/no duty thresholds (US has $800 de minimis, so most individual items enter duty-free). Risky for markets like the EU where any item above \u20ac0 now incurs VAT. Warning: customers in some markets refuse delivery and you eat the return cost.",
            },
            {
              label: "Hybrid — Include tax, exclude duty",
              body: "You collect VAT/GST at checkout (required in EU, UK, Australia for items under certain thresholds) but let the customer handle duties above threshold. This is what most Shopify merchants end up doing because Shopify's tax system supports it natively. Works well for items under duty thresholds.",
            },
          ],
        },
        {
          type: "text",
          content:
            "For Japanese merchants selling ceramics, food items, or cosmetics to the US: good news. The US de minimis threshold is $800, meaning individual orders under $800 enter without duties or taxes. Your $44 bowl ships duty-free. However, this threshold doesn't exist in the EU (VAT applies from \u20ac0), UK (\u00a30), or Australia (A$0 for GST). For these markets, you must either include VAT in pricing or collect it at checkout through Shopify's tax system.",
        },
        {
          type: "callout",
          content:
            "De minimis thresholds (2026): US = $800, Canada = C$20, EU = \u20ac0 (IOSS), UK = \u00a30, Australia = A$0 (GST), Korea = \u20a9150,000 (~$112), Japan = \u00a510,000 (for reference). These change — verify current thresholds before setting pricing.",
          variant: "warning",
        },
        {
          type: "heading",
          level: 2,
          content: "Step 5: Configuring Shopify Markets — What It Can and Can't Do",
        },
        {
          type: "text",
          content:
            "Shopify Markets is the platform's built-in international selling feature. It handles currency conversion, basic price rounding, and market-specific adjustments. Understanding its capabilities and limitations is essential before layering additional tools on top.",
        },
        {
          type: "heading",
          level: 3,
          content: "What Shopify Markets does well",
        },
        {
          type: "list",
          style: "bullet",
          items: [
            {
              label: "Automatic currency conversion",
              body: "Converts your base currency (JPY) to local currencies using Shopify's exchange rate (which includes a ~1.5% spread for their conversion fee).",
            },
            {
              label: "Price rounding rules",
              body: "You can set rounding rules per market (e.g., round to .99, round to .00, round to nearest 1000). This partially addresses psychological pricing, though the rules are basic.",
            },
            {
              label: "Market-specific price adjustments",
              body: "Apply a percentage increase or decrease per market (e.g., +15% for US market, +10% for EU). This is the bluntest tool but useful as a starting point.",
            },
            {
              label: "Fixed prices per product per market",
              body: "Override the automatic conversion for specific products. Set your bowl to exactly $44.00 in the US regardless of exchange rate fluctuations. This is the most powerful feature but requires manual management.",
            },
            {
              label: "Duties and import tax estimation",
              body: "Shopify can estimate and collect duties at checkout (with Shopify Markets Pro or certain plans). Reduces delivery surprises.",
            },
          ],
        },
        {
          type: "image",
          src: "/blog/pricing-guide/shopify-markets-pricing.png",
          alt: "Shopify Markets pricing settings showing currency conversion rules and market-specific adjustments",
          caption:
            "Shopify Markets pricing configuration. Percentage adjustments and rounding rules handle basic optimization, but per-product pricing requires manual override for each market.",
          width: "wide",
        },
        {
          type: "heading",
          level: 3,
          content: "What Shopify Markets cannot do",
        },
        {
          type: "list",
          style: "bullet",
          items: [
            {
              label: "No competitor-aware pricing",
              body: "Markets has no visibility into what competitors charge. It can't tell you that your bowl is 30% more expensive than alternatives on Amazon DE.",
            },
            {
              label: "No demand-based adjustment",
              body: "If your product is trending in Korea but stagnant in the US, Markets won't suggest raising Korean prices or lowering US prices.",
            },
            {
              label: "Limited rounding intelligence",
              body: "Rounding rules are global per market — you can't round differently for a $15 item vs. a $150 item in the same market. A round-to-nearest-dollar rule works for the bowl but might underprice a larger set.",
            },
            {
              label: "No exchange rate lock or hedging",
              body: "Prices fluctuate with exchange rates (updated daily). Your carefully set $44.00 price can drift to $43.21 or $44.87 as JPY/USD moves. Fixed prices solve this but require manual updates if rates shift dramatically.",
            },
            {
              label: "No cultural pricing guidance",
              body: "Markets won't tell you that \u20a949,500 is wrong for Korea or that .99 endings hurt premium positioning. You need to know this yourself.",
            },
          ],
        },
        {
          type: "text",
          content:
            "The honest assessment: Shopify Markets gets you 60% of the way to good international pricing. It handles the mechanics (conversion, tax collection, basic rounding) but leaves the strategy (competitive positioning, cultural optimization, dynamic adjustment) to you. For stores with 10-20 products, manual fixed prices per market work fine. For larger catalogs, the manual overhead becomes unsustainable.",
        },
        {
          type: "heading",
          level: 2,
          content: "Step 6: Currency Rounding That Preserves Brand Positioning",
        },
        {
          type: "text",
          content:
            "Let's make this concrete. Your \u00a55,500 bowl converts to these raw amounts at current rates (June 2026):",
        },
        {
          type: "table",
          headers: ["Market", "Raw conversion", "Bad rounding", "Good rounding", "Reasoning"],
          rows: [
            ["US ($)", "$36.78", "$36.99", "$38.00 or $44.00", "Move to nearest premium anchor ($38 for value, $44 for premium positioning)"],
            ["EU (\u20ac)", "\u20ac33.92", "\u20ac33.99", "\u20ac35.00 or \u20ac39.00", "Round to clean euro, EU buyers expect tax-included round numbers"],
            ["Korea (\u20a9)", "\u20a950,247", "\u20a950,200", "\u20a949,000 or \u20a952,000", "Must end in ,000 \u2014 choose based on competitor research"],
            ["UK (\u00a3)", "\u00a329.14", "\u00a329.99", "\u00a332.00 or \u00a336.00", "Round up to clean number, premium positioning"],
            ["Australia (A$)", "A$56.42", "A$56.99", "A$55.00 or A$59.00", "Round to nearest $5 increment for premium feel"],
          ],
          caption:
            "Raw conversion vs. strategically rounded prices. 'Bad rounding' (nearest .99) undermines premium positioning. 'Good rounding' accounts for cultural expectations and competitive landscape.",
        },
        {
          type: "image",
          src: "/blog/pricing-guide/currency-conversion-example.png",
          alt: "Visual showing the same Japanese ceramic bowl with price tags in USD, EUR, KRW, GBP, and AUD after strategic rounding",
          caption:
            "Strategic rounding transforms raw currency conversions into prices that feel intentional and trustworthy in each market.",
          width: "full",
        },
        {
          type: "text",
          content:
            "The key principle: round in the direction of your positioning strategy, not toward the nearest mathematical number. If you're positioning as premium (which most Japanese craft products should), round UP to the next psychologically clean number. If you're competing on value (e.g., Japanese snacks vs. local alternatives), round DOWN to the next clean number below competitors.",
        },
        {
          type: "heading",
          level: 2,
          content: "Step 7: When and How to Adjust Prices Over Time",
        },
        {
          type: "text",
          content:
            "Cross-border pricing isn't set-and-forget. Three forces require ongoing attention:",
        },
        {
          type: "list",
          style: "numbered",
          items: [
            {
              label: "Exchange rate drift",
              body: "JPY/USD has moved between \u00a5130-\u00a5160 per dollar in recent years. A 10% shift in exchange rate means your margins move 10%. If you set fixed prices at \u00a5150/$, a move to \u00a5135/$ means you're earning 10% less per sale in JPY terms. Review exchange rate alignment quarterly and adjust fixed prices if drift exceeds 5-8%.",
            },
            {
              label: "Competitor price movements",
              body: "When competitors in your target markets raise or lower prices, your relative positioning shifts. A new Korean competitor selling similar ceramics at \u20a935,000 makes your \u20a949,000 pricing suddenly 40% premium rather than 15%. You need visibility into competitor movements to react appropriately.",
            },
            {
              label: "Seasonal demand shifts",
              body: "Japanese products see predictable demand spikes: cherry blossom season (Feb-Apr) for homeware, gift seasons (Dec, Valentine's in Japan), and cultural event periods. Consider 5-10% price increases during peak demand periods in specific markets where you have pricing power.",
            },
          ],
        },
        {
          type: "text",
          content:
            "The practical challenge for most Shopify merchants: monitoring all of this manually across 5+ markets is a part-time job. Many merchants set prices once and never revisit them, leaving money on the table or slowly losing competitiveness as markets shift. This is where automation becomes not just convenient but necessary for stores above ~50 products.",
        },
        {
          type: "heading",
          level: 2,
          content: "The Cross-Border Pricing Tool Landscape: A Reality Check",
        },
        {
          type: "text",
          content:
            "Here's an uncomfortable truth about pricing tools for Shopify merchants: the market is bifurcated. You've got enterprise solutions that cost more than most merchants' monthly revenue, and free tools that stop at currency conversion. If you're a Japanese brand doing $10K-$100K/month internationally, you're in a dead zone that nobody has properly served. Let me break down what exists.",
        },
        {
          type: "table",
          headers: ["Tool", "Price", "What It Actually Does", "The Reality Check"],
          rows: [
            ["Shopify Markets (built-in)", "Free", "Currency conversion with ~1.5% spread. Basic rounding rules. Percentage adjustments per market. Fixed price overrides for individual products.", "Gets you 60% there. Handles mechanics but has zero market intelligence. Can't tell you that your bowl is 30% above the competition in Korea."],
            ["Prisync", "From $99/mo (100 products)", "Tracks competitor prices daily. Dynamic repricing rules. SKU-level overlap analysis with competitors. Historical price charts.", "Legitimate tool, but $99/mo for 100 products is steep when you're testing international markets. Also: 83% accuracy on Amazon according to independent benchmarks. Not great for niche Japanese product categories."],
            ["Competera", "Custom ($50K+/year)", "Enterprise ML pricing optimization. Demand elasticity modeling. Cross-channel pricing. Full automation.", "If you're reading this blog, this isn't for you. 3-6 month implementation. Requires a dedicated pricing team. Built for retailers with 10,000+ SKUs."],
            ["Price2Spy", "From $39.95/mo", "Budget competitor monitoring. Price history. Some Shopify integration.", "Limited to basic price tracking. No cultural pricing intelligence. No understanding of why \u20a949,500 is wrong for Korea."],
            ["Minderest", "From \u20ac59/mo", "Multi-country European support. MAP enforcement. Market analysis.", "EU-focused. Not useful for Japan\u2192US or Japan\u2192Korea corridors that Japanese merchants actually need."],
            ["Google Sheets (DIY)", "Free", "GOOGLEFINANCE for live rates. Custom rounding formulas. Manual competitor tracking.", "Honestly? This works for under 50 products. Takes 2-3 hours to build but gives full visibility. The problem: it doesn't scale and requires discipline to maintain."],
          ],
          caption:
            "Pricing data verified June 2026. The gap is clear: nothing affordable exists between 'free and basic' (Shopify Markets) and '$99/mo and still limited' (Prisync).",
        },
        {
          type: "heading",
          level: 3,
          content: "The Gap Nobody Has Filled",
        },
        {
          type: "text",
          content:
            "Look at that table and notice the missing price point. Between free (Shopify Markets doing basic conversion) and $99/month (Prisync doing competitor tracking), there's... nothing. No tool under $50/month gives a Shopify merchant: competitive price awareness across multiple international markets, cultural pricing guidance (why round to ,000 in Korea), automatic tracking of exchange rate drift against your fixed prices, and bundled intelligence with your content and SEO workflow.",
        },
        {
          type: "text",
          content:
            "This is exactly why we built Price Scout into Aganim AI. Not as a Prisync replacement \u2014 if you have 500 products and a dedicated pricing analyst, Prisync is the right tool. But for a Japanese ceramics brand with 80 products selling into 4 markets who can't justify $99/month on pricing alone? That's who Price Scout is for.",
        },
        {
          type: "callout",
          content:
            "Honest positioning: Price Scout is monitoring infrastructure bundled with Aganim's content and localization tools \u2014 it's not a standalone pricing platform. If competitor price monitoring is your ONLY need, Prisync or Price2Spy are more feature-rich. But if you're already using Aganim for content and localization, Price Scout eliminates one more separate subscription.",
          variant: "info",
        },
        {
          type: "heading",
          level: 2,
          content: "Putting It All Together: Your Cross-Border Pricing Workflow",
        },
        {
          type: "text",
          content:
            "Here's the complete workflow for pricing Japanese products across international markets:",
        },
        {
          type: "list",
          style: "numbered",
          items: [
            {
              label: "Calculate your cost floor per market",
              body: "Factor in shipping, duties, platform fees, returns, and currency conversion costs. This is your non-negotiable minimum.",
            },
            {
              label: "Research competitors in each target market",
              body: "Find 3-5 comparable products per market. Identify the price range and sweet spot. Use this as your ceiling reference.",
            },
            {
              label: "Apply cultural pricing psychology",
              body: "Round to market-appropriate numbers. Use .00 for US premium, round euros for EU, always ,000 for Korea. Match local expectations.",
            },
            {
              label: "Decide on duty/tax handling",
              body: "DDP for premium products, DAP for US (under $800), hybrid for other markets. Configure Shopify tax collection accordingly.",
            },
            {
              label: "Configure Shopify Markets",
              body: "Set market-specific adjustments, rounding rules, and fixed prices for key products. Start with percentage adjustments, migrate to fixed prices for top sellers.",
            },
            {
              label: "Set up ongoing monitoring",
              body: "Whether manual (monthly spreadsheet review) or automated (Price Scout), ensure you're tracking competitor movements and exchange rate drift.",
            },
            {
              label: "Review and adjust quarterly",
              body: "Reassess positioning, update prices where needed, and test new price points on underperforming markets.",
            },
          ],
        },
        {
          type: "text",
          content:
            "This workflow sounds intensive, and it is — for the initial setup. Once established, ongoing maintenance is manageable: 1-2 hours monthly for manual monitoring, or minimal time with automated monitoring alerting you only when action is needed.",
        },
        {
          type: "cta",
          title: "Monitor Competitor Prices Automatically",
          body: "Aganim AI's Price Scout agent tracks competitor pricing across your target markets and alerts you to opportunities. See how your products compare \u2014 free for 10 products.",
          buttonText: "Install Free on Shopify",
          buttonUrl:
            "https://admin.shopify.com/oauth/install?client_id=315cfaf63c9baf27e4ba9a22b91b168e",
        },
      ],
      faq: [
        {
          question:
            "Should I use the same price in all markets or set different prices per country?",
          answer:
            "Different prices per market almost always outperform uniform pricing. Each market has its own competitive landscape, cost structure (shipping/duties), and psychological price points. A \u00a55,500 bowl should be $44 in the US but \u20a949,000 in Korea \u2014 these aren't equivalent amounts, but they're both optimal for their respective markets. Shopify Markets supports per-market pricing through fixed prices or percentage adjustments.",
        },
        {
          question:
            "How often should I adjust my international prices?",
          answer:
            "Review quarterly at minimum. Adjust immediately if: exchange rates shift more than 8%, a major competitor changes prices significantly, or you notice conversion rate drops in specific markets. Don't adjust too frequently \u2014 constant price changes erode customer trust, especially for repeat buyers who notice fluctuations. Small exchange rate movements (under 5%) can usually be absorbed.",
        },
        {
          question:
            "Should I include shipping in the product price for international orders?",
          answer:
            "For products under $50/\u20ac45/\u00a340: strongly consider free shipping built into the price. Cart abandonment data consistently shows that unexpected shipping costs are the #1 reason for abandonment. For your \u00a55,500 ceramic bowl, pricing at $52 with free shipping converts better than $44 + $8 shipping, even though the total is the same. For higher-value items ($100+), separate shipping is more acceptable.",
        },
        {
          question:
            "How do I handle price changes when the yen weakens or strengthens significantly?",
          answer:
            "If yen weakens (good for you \u2014 each foreign sale earns more JPY): resist the temptation to lower international prices. Your margins improve, which buffers against future yen strengthening. If yen strengthens (bad \u2014 each sale earns less JPY): don't immediately raise prices. First absorb for 1-2 months to see if it's temporary. If sustained, raise prices gradually (5-8% at a time) rather than a sudden jump. Always communicate price changes as improvements (\"new premium packaging\" or seasonal adjustments) rather than currency-driven increases.",
        },
        {
          question:
            "Do I need to charge VAT/GST on international orders from Japan?",
          answer:
            "For EU: Yes, if you sell over \u20ac10,000/year to EU consumers (all countries combined). Register for IOSS (Import One-Stop Shop) and collect VAT at checkout. Shopify supports this natively. For UK: Yes, for items under \u00a3135 \u2014 you must register for UK VAT and collect at checkout. For Australia: Yes, if annual sales to Australia exceed A$75,000 \u2014 register for GST. For US: No federal VAT/GST. State sales tax only applies if you have nexus. For Korea: Generally handled by the customer on import for items above \u20a9150,000. Below that threshold, usually duty/tax free.",
        },
      ],
    },
    ja: {
      title:
        "Shopify越境EC価格戦略：日本の商品をグローバル市場に最適な価格で販売する方法",
      subtitle:
        "通貨換算は出発点に過ぎない。心理的価格設定の文化差から関税込み戦略まで、各市場で実際にコンバージョンする価格の設定方法を解説。",
      metaTitle:
        "Shopify越境EC価格戦略 — 日本商品のグローバル価格設定ガイド | Aganim AI",
      metaDescription:
        "日本の商品を海外市場に販売する際の実践的価格設定ガイド。通貨端数処理、文化別価格心理、関税込み戦略、競合モニタリング、Shopify Markets設定を網羅。",
      heroAlt:
        "同じ商品がUSD、EUR、KRW、JPYの各市場で異なる価格タグを持つ様子",
      tldr: "JPYを外貨に単純換算すると、不自然な価格になりコンバージョンを下げる。効果的な越境EC価格設定には、文化的期待（税込vs税抜）、市場ごとの心理的価格帯、戦略的端数処理、競合把握が必要。Shopify Marketsは基本変換を処理するが最適化のギャップが残る。コストプラス計算から市場別調整まで、完全な価格設定ワークフローを解説。",
      sections: [
        {
          type: "heading",
          level: 2,
          content: "問題の本質：通貨換算は価格戦略ではない",
        },
        {
          type: "text",
          content:
            "手作りの陶器ボウルを日本で¥5,500で販売しているとします。Shopify Marketsを有効にすると、米国で$36.78、ドイツで€33.92、韓国で₩50,247と表示されます。数学的には正確な換算ですが、価格としては最悪です。$36.78は恣意的で信頼感がない。€33.92はヨーロッパの顧客のことを全く考えていない印象。₩50,247はこの商品カテゴリで韓国の買い物客が直感的に判断できない数字です。",
        },
        {
          type: "text",
          content:
            "通貨換算と価格戦略のギャップこそが、多くの日本のマーチャントが海外売上を逃す場所です。美しい商品、プロの写真撮影、ローカライズされた説明文に投資しても、価格が「おかしい」と見えれば全て無意味です。$36.78を見た顧客は無意識に「安物」と分類します（端数あり、$40以下）。同じ顧客が$42.00を見れば「プレミアムな工芸品」と感じる。雑な価格設定で、プレミアム商品をバジェット品に位置づけてしまったのです。",
        },
        {
          type: "text",
          content:
            "このガイドでは越境EC価格設定の完全なワークフローを解説します：コストプラスの基礎、市場ベースの調整、文化的な価格心理、Shopifyの組み込みツール（とその限界）、そして市場横断での競合モニタリング。全体を通じて具体例を使います — あの¥5,500の陶器ボウルを複数市場で追跡します。",
        },
        {
          type: "callout",
          content:
            "重要な洞察：越境ECにおいて、価格はシグナルであり、単なる数字ではない。同じ客観的価値も、各市場での表示・フォーマットの仕方によって「プレミアム」「適正」「安い」と伝わり方が変わる。",
          variant: "info",
        },
        {
          type: "heading",
          level: 2,
          content: "ステップ1：真のコストフロアを確立する",
        },
        {
          type: "text",
          content:
            "市場戦略を適用する前に、海外販売が割に合う最低価格を把握する必要があります。多くの日本のマーチャントは越境コストを過小評価し、表面上は利益が出ているように見える海外注文で実は赤字になっています。",
        },
        {
          type: "heading",
          level: 3,
          content: "越境ECのコスト構造",
        },
        {
          type: "text",
          content:
            "¥5,500の陶器ボウルを米国市場に販売する場合の典型的なコストフロア計算：",
        },
        {
          type: "table",
          headers: ["コスト項目", "金額（円）", "備考"],
          rows: [
            ["商品原価（COGS）", "¥2,200", "材料費＋人件費"],
            ["国内梱包", "¥300", "日本の陶器に期待されるギフト品質の包装"],
            ["国際送料（EMS/DHL）", "¥1,800", "500gの商品を米国西海岸へ"],
            ["Shopify決済手数料（2.9%＋¥30）", "¥190", "JPY換算の販売価格に対して"],
            ["通貨変換スプレッド", "¥110", "Shopifyの変換手数料約1.5%"],
            ["破損・紛失リザーブ（3%）", "¥165", "陶器は国際輸送で破損率が高い"],
            ["返品対応（注文の推定5%）", "¥275", "国際返品は高コスト"],
            ["コストフロア合計", "¥5,040", "損益分岐点の最低額"],
          ],
          caption:
            "国内価格¥5,500の場合、価格戦略を適用する前の海外マージンは極めて薄い。ほとんどのマーチャントは海外向けに国内価格の20-40%増が必要。",
        },
        {
          type: "text",
          content:
            "ここで最初の不都合な事実が明らかに：国内のJPY価格を海外市場にそのまま換算することはできない場合が多い。¥5,500のボウルは等価換算で海外販売すると¥460のマージン（¥5,500 - ¥5,040 = ¥460、利益率8.4%）しかない。これでは成立しません — 返品1件で5件以上の利益が吹き飛ぶ。海外向けにはより高い価格設定が必要で、つまり価格戦略がプレミアムを正当化できなければならないのです。",
        },
        {
          type: "callout",
          content:
            "目安：国内価格に20-40%を上乗せした額を海外価格の出発点にする。日本製品は欧米市場で「クラフトプレミアム」の認知をすでに持っている — それを活用すべき。",
          variant: "tip",
        },
        {
          type: "heading",
          level: 2,
          content: "ステップ2：市場ベースの価格アンカリング",
        },
        {
          type: "text",
          content:
            "コストプラスがフロアを教え、市場ベース価格がシーリングを教えます。その間が戦略的価格ゾーンです。海外販売する日本製品の場合、「ジャパンプレミアム」のおかげでこのギャップは驚くほど広い — 海外の顧客は本物の日本製品にはより多く支払うことを期待していることが多いのです。",
        },
        {
          type: "heading",
          level: 3,
          content: "各ターゲット市場での競合価格をリサーチ",
        },
        {
          type: "text",
          content:
            "陶器ボウルについて、各市場での競合リサーチ結果：",
        },
        {
          type: "table",
          headers: ["市場", "類似商品の価格帯", "スイートスポット", "ターゲット価格"],
          rows: [
            ["米国（Amazon/Etsy）", "$28〜$65（ハンドメイド陶器）", "$38〜$48", "$44.00"],
            ["EU（Etsy EU/現地ショップ）", "€30〜€58（アルチザンボウル）", "€35〜€45", "€39.00"],
            ["韓国（Coupang/Naver）", "₩35,000〜₩75,000（日本製陶器）", "₩45,000〜₩55,000", "₩49,000"],
            ["オーストラリア（Etsy AU）", "A$42〜A$72（ハンドメイド輸入品）", "A$48〜A$58", "A$52.00"],
            ["英国（Etsy/Not On The High Street）", "£28〜£52（アルチザン陶器）", "£32〜£42", "£36.00"],
          ],
          caption:
            "手作り日本製陶器ボウル（国内¥5,500）の競合リサーチ。ターゲット価格は通貨換算ではなく市場のスイートスポット内で設定。",
        },
        {
          type: "text",
          content:
            "注目すべきは、ターゲット価格が単一の為替レートにマッピングされないこと。$44.00を現在のレート（約¥150/$）で換算すると¥6,600 — 国内比20%プレミアム。€39.00は約¥163/€で¥6,357 — 16%プレミアム。₩49,000は約¥0.115/₩で¥5,635 — 国内比わずか2%増。各市場にはそれぞれの競争環境があり、為替レートとは独立して顧客が支払う金額が決まります。",
        },
        {
          type: "text",
          content:
            "これが思考の根本的な転換です：価格を「換算」しているのではなく、各市場がいくら支払えるかに基づいて価格を「設定」している。為替レートは一つのインプットに過ぎず、答えではありません。",
        },
        {
          type: "image",
          src: "/blog/pricing-guide/competitor-pricing-table.png",
          alt: "米国、EU、韓国、オーストラリア市場での類似日本陶器製品の競合価格を示すスプレッドシート",
          caption:
            "市場横断の競合価格分析。「正しい」価格は為替レートではなく現地の競合状況により20%以上変動する。",
          width: "wide",
        },
        {
          type: "heading",
          level: 2,
          content: "ステップ3：文化的な価格心理 — 「正しく見える」価格は国によって異なる",
        },
        {
          type: "text",
          content:
            "価格心理は普遍的ではありません。信頼できる、プレミアム、あるいは適正に感じる数字は文化によって劇的に変わります。これを間違えると、商品が「この市場向けではない」という悪い意味での外国製品に見えてしまいます。",
        },
        {
          type: "heading",
          level: 3,
          content: "米国：.99と.00の分水嶺",
        },
        {
          type: "text",
          content:
            "米国の消費者は価格末尾に深く刷り込まれた反応を持っています。$39.99は「お得」「量産品」のシグナル。$40.00は「端数なし、正直、プレミアム」。$44.00は「慎重に考えられた、アルチザン」。プレミアムカジュアルセグメントを狙う日本のクラフト製品には、.00または.50で終わる価格が.99より効果的。$43.99は避ける — ディスカウント小売を連想させ、ブランドポジショニングと矛盾します。$44.00か$45.00を選びましょう。",
        },
        {
          type: "heading",
          level: 3,
          content: "EU：税込みとラウンドナンバー",
        },
        {
          type: "text",
          content:
            "EU消費者は税込価格を期待します（B2Cでは法的に義務）。きりの良い数字に慣れています：€39、€45、€49。.99の慣習はありますが、米国より強い「安い」シグナルを持ちます。アルチザン日本製品には、ラウンドなユーロ価格（€39.00、€42.00）が品質を伝えます。重要：VAT（国により19-25%）は表示価格に含める必要があります。コストフロアが€35でVATが19%なら、表示価格は最低€41.65 — €42か€45に切り上げましょう。",
        },
        {
          type: "heading",
          level: 3,
          content: "韓国：000で終わる価格とプレステージ価格設定",
        },
        {
          type: "text",
          content:
            "韓国ウォンの価格は必ず,000で終わります。₩49,500は絶対NG — システムエラーのように見える。常に₩49,000か₩50,000。韓国の消費者はブランド意識が非常に高く、陶器、キッチンウェア、美容製品で「ジャパンプレミアム」は確立されています。韓国国産品より10-20%高い価格設定は、売上を傷つけるのではなく、むしろ本物感をシグナルします。韓国製の陶器ボウルが₩40,000なら、日本製輸入品₩49,000は適切にプレミアムに感じます。",
        },
        {
          type: "heading",
          level: 3,
          content: "日本（国内基準）：税込表示は義務",
        },
        {
          type: "text",
          content:
            "2021年以降、日本ではすべてのB2C価格に消費税（10%）を含めることが義務化されています。¥5,500の価格には¥500の税金がすでに含まれています。日本の消費者は表示価格を最終価格として扱う訓練を受けています。この期待は旅行にも持ち出される — 日本人観光客が英語サイトで買い物する際、チェックアウトで税が加算されると困惑します。すべての市場ページで「税込」を目立つように表記することを検討してください。",
        },
        {
          type: "image",
          src: "/blog/pricing-guide/psychological-pricing.png",
          alt: "同じ商品が米国、EU、韓国、日本で文化に適した心理的価格帯で表示される比較",
          caption:
            "同じ¥5,500のボウルを文化的に適切な価格末尾で配置。小さなフォーマットの違いが購入確信度に大きく影響する。",
          width: "wide",
        },
        {
          type: "callout",
          content:
            "文化別価格設定まとめ：米国 → プレミアムは.00/.50、バリューは.99 | EU → ラウンドナンバー、税込義務 | 韓国 → 必ず,000で終了、若干のプレミアムが本物感を示す | 日本 → 税込、¥X,XX0末尾",
          variant: "stat",
        },
        {
          type: "heading",
          level: 2,
          content: "ステップ4：関税・税金・送料を価格に組み込む",
        },
        {
          type: "text",
          content:
            "越境ECでカート離脱の最大の原因は、チェックアウトまたは配達時の予期せぬコストです。顧客は$44.00を見てカートに追加し、チェックアウトで送料$12＋関税$8を発見 = 合計$64。予想より45%の価格上昇。ほとんどの顧客は即座に離脱します。",
        },
        {
          type: "heading",
          level: 3,
          content: "関税・税金対応の3つのアプローチ",
        },
        {
          type: "list",
          style: "numbered",
          items: [
            {
              label: "DDP（関税込み配送）— オールインクルーシブ価格",
              body: "関税と税金を商品価格に吸収。顧客は見たままの金額を支払う。最適：総額がまだ合理的で、サプライズコストがブランド体験を壊すプレミアム商品。¥5,500のボウルは米国で$52.00「配送込み」（推定関税含む）。表示価格は高いが配送時の摩擦ゼロ。",
            },
            {
              label: "DAP（仕向地渡し）— 顧客が配達時に関税を支払う",
              body: "商品を発送し、顧客が到着時に輸入関税・税金を支払う。最適：関税免税閾値が高い市場（米国はde minimis $800なので、ほとんどの単品は無関税で入国）。リスク：EUのように€0以上で全品にVATがかかる市場。警告：一部市場では受取拒否が発生し、返送コストを負担することに。",
            },
            {
              label: "ハイブリッド — 税は含め、関税は除外",
              body: "チェックアウトでVAT/GSTを徴収（EU、英国、オーストラリアの一定閾値以下は義務）するが、閾値以上の関税は顧客に任せる。Shopifyの税システムがネイティブにサポートするため、ほとんどのマーチャントがこの方式に落ち着く。関税閾値以下の商品に効果的。",
            },
          ],
        },
        {
          type: "text",
          content:
            "日本のマーチャントが陶器、食品、化粧品を米国に販売する場合：朗報です。米国のde minimis閾値は$800で、$800未満の個別注文は関税・税金なしで入国できます。$44のボウルは無関税で発送可能。ただしこの閾値はEU（€0からVAT）、英国（£0）、オーストラリア（A$0でGST）には存在しません。これらの市場では、価格にVATを含めるか、ShopifyのTaxシステムでチェックアウト時に徴収する必要があります。",
        },
        {
          type: "callout",
          content:
            "De minimis閾値（2026年）：米国 = $800、カナダ = C$20、EU = €0（IOSS）、英国 = £0、オーストラリア = A$0（GST）、韓国 = ₩150,000（〜$112）、日本 = ¥10,000（参考）。変更されることがある — 価格設定前に最新閾値を確認すること。",
          variant: "warning",
        },
        {
          type: "heading",
          level: 2,
          content: "ステップ5：Shopify Marketsの設定 — できることとできないこと",
        },
        {
          type: "text",
          content:
            "Shopify Marketsはプラットフォーム組み込みの国際販売機能です。通貨変換、基本的な価格端数処理、市場固有の調整を処理します。追加ツールをその上に重ねる前に、その機能と限界を理解することが不可欠です。",
        },
        {
          type: "heading",
          level: 3,
          content: "Shopify Marketsの得意分野",
        },
        {
          type: "list",
          style: "bullet",
          items: [
            {
              label: "自動通貨変換",
              body: "ベース通貨（JPY）をShopifyの為替レート（約1.5%のスプレッドを含む変換手数料）を使用して現地通貨に変換。",
            },
            {
              label: "価格端数処理ルール",
              body: "市場ごとに端数処理ルールを設定可能（例：.99に丸める、.00に丸める、1000の位に丸める）。心理的価格設定に部分的に対応するが、ルールは基本的。",
            },
            {
              label: "市場固有の価格調整",
              body: "市場ごとにパーセンテージ増減を適用（例：米国市場+15%、EU市場+10%）。最も大まかなツールだが出発点として有用。",
            },
            {
              label: "商品ごと・市場ごとの固定価格",
              body: "特定商品の自動変換をオーバーライド。為替変動に関係なくボウルを米国で正確に$44.00に設定。最も強力な機能だが手動管理が必要。",
            },
            {
              label: "関税・輸入税の見積もり",
              body: "Shopifyはチェックアウト時に関税を見積もり・徴収可能（Shopify Markets Proまたは特定プラン）。配達時のサプライズを軽減。",
            },
          ],
        },
        {
          type: "image",
          src: "/blog/pricing-guide/shopify-markets-pricing.png",
          alt: "Shopify Marketsの価格設定画面 — 通貨変換ルールと市場固有の調整",
          caption:
            "Shopify Marketsの価格設定。パーセンテージ調整と端数処理ルールで基本的な最適化に対応するが、商品別価格は市場ごとに手動オーバーライドが必要。",
          width: "wide",
        },
        {
          type: "heading",
          level: 3,
          content: "Shopify Marketsにできないこと",
        },
        {
          type: "list",
          style: "bullet",
          items: [
            {
              label: "競合を意識した価格設定なし",
              body: "Marketsは競合がいくらで販売しているか見えない。あなたのボウルがAmazon DEの代替品より30%高いことを教えてくれない。",
            },
            {
              label: "需要ベースの調整なし",
              body: "商品が韓国でトレンドだが米国では停滞している場合、Marketsは韓国の価格引き上げや米国の価格引き下げを提案しない。",
            },
            {
              label: "限定的な端数処理インテリジェンス",
              body: "端数処理ルールは市場ごとにグローバル — 同一市場内で$15の商品と$150の商品で異なる端数処理はできない。ドル単位の丸めルールはボウルには効くが、大きなセットには不適切かもしれない。",
            },
            {
              label: "為替レートロックやヘッジなし",
              body: "価格は為替レート（毎日更新）とともに変動。慎重に設定した$44.00がJPY/USDの動きで$43.21や$44.87にドリフトすることがある。固定価格で解決可能だが、レートが大幅に変動した場合は手動更新が必要。",
            },
            {
              label: "文化的な価格設定ガイダンスなし",
              body: "Marketsは₩49,500が韓国では不適切であることや、.99の末尾がプレミアムポジショニングを傷つけることを教えてくれない。自分で知っている必要がある。",
            },
          ],
        },
        {
          type: "text",
          content:
            "正直な評価：Shopify Marketsは良い国際価格設定の60%まで対応します。メカニクス（変換、税徴収、基本端数処理）は処理しますが、戦略（競合ポジショニング、文化的最適化、動的調整）はあなたに委ねられます。10-20商品のストアなら市場ごとの手動固定価格で十分。大規模カタログでは手動のオーバーヘッドが持続不可能になります。",
        },
        {
          type: "heading",
          level: 2,
          content: "ステップ6：ブランドポジショニングを維持する通貨端数処理",
        },
        {
          type: "text",
          content:
            "具体的に見てみましょう。¥5,500のボウルは現在のレート（2026年6月）で以下の生の金額に換算されます：",
        },
        {
          type: "table",
          headers: ["市場", "生の換算", "悪い端数処理", "良い端数処理", "理由"],
          rows: [
            ["米国（$）", "$36.78", "$36.99", "$38.00 or $44.00", "最寄りのプレミアムアンカーに移動（$38がバリュー、$44がプレミアムポジショニング）"],
            ["EU（€）", "€33.92", "€33.99", "€35.00 or €39.00", "きりの良いユーロに丸める。EU消費者は税込のラウンドナンバーを期待"],
            ["韓国（₩）", "₩50,247", "₩50,200", "₩49,000 or ₩52,000", "必ず,000で終わる — 競合リサーチに基づいて選択"],
            ["英国（£）", "£29.14", "£29.99", "£32.00 or £36.00", "きりの良い数字に切り上げ、プレミアムポジショニング"],
            ["オーストラリア（A$）", "A$56.42", "A$56.99", "A$55.00 or A$59.00", "$5刻みに丸めてプレミアム感を演出"],
          ],
          caption:
            "生の換算 vs 戦略的に丸めた価格。「悪い端数処理」（最寄りの.99）はプレミアムポジショニングを損なう。「良い端数処理」は文化的期待と競争環境を考慮。",
        },
        {
          type: "image",
          src: "/blog/pricing-guide/currency-conversion-example.png",
          alt: "戦略的端数処理後の日本製陶器ボウルにUSD、EUR、KRW、GBP、AUDの価格タグが付いたビジュアル",
          caption:
            "戦略的な端数処理が生の通貨換算を、各市場で意図的で信頼感のある価格に変える。",
          width: "full",
        },
        {
          type: "text",
          content:
            "主要原則：数学的に最も近い数字ではなく、ポジショニング戦略の方向に丸める。プレミアムとしてポジショニングするなら（ほとんどの日本クラフト製品はそうすべき）、次の心理的にきりの良い数字に切り上げ。バリューで競争するなら（例：日本のスナックvs現地品）、競合価格より下の次のきりの良い数字に切り下げ。",
        },
        {
          type: "heading",
          level: 2,
          content: "ステップ7：いつ、どのように価格を調整するか",
        },
        {
          type: "text",
          content:
            "越境ECの価格設定は「設定して放置」ではありません。3つの力に継続的な注意が必要です：",
        },
        {
          type: "list",
          style: "numbered",
          items: [
            {
              label: "為替レートのドリフト",
              body: "JPY/USDは近年¥130〜¥160/ドルの間で変動。為替レートの10%シフトはマージンも10%動くことを意味する。固定価格を¥150/$で設定して¥135/$に動くと、1売上あたりJPYベースで10%少なく稼ぐことに。四半期ごとに為替レートの整合性を確認し、ドリフトが5-8%を超えたら固定価格を調整。",
            },
            {
              label: "競合の価格変動",
              body: "ターゲット市場の競合が値上げ・値下げすると、相対的なポジショニングがずれる。韓国で類似陶器を₩35,000で売る新規競合が現れると、あなたの₩49,000が15%プレミアムではなく40%プレミアムに急変。競合の動きに適切に対応するため可視性が必要。",
            },
            {
              label: "季節的な需要シフト",
              body: "日本製品は予測可能な需要スパイクがある：桜のシーズン（2-4月）の食器類、ギフトシーズン（12月、日本のバレンタイン）、文化イベント期間。価格決定力がある特定市場では、ピーク需要期に5-10%の値上げを検討。",
            },
          ],
        },
        {
          type: "text",
          content:
            "ほとんどのShopifyマーチャントにとっての実務的な課題：5以上の市場でこれらすべてを手動で監視するのはパートタイムの仕事です。多くのマーチャントは価格を一度設定して再訪せず、機会損失をするか、市場が変化する中で徐々に競争力を失います。約50商品以上のストアにとって、ここで自動化が便利なだけでなく必要になります。",
        },
        {
          type: "heading",
          level: 2,
          content: "越境EC価格ツールの現状：率直な整理",
        },
        {
          type: "text",
          content:
            "Shopifyマーチャント向けの価格設定ツールについて、不都合な真実を言います。市場は二極化しています。ほとんどのマーチャントの月商より高いエンタープライズソリューションか、通貨換算で止まる無料ツールか。海外売上月商100万〜1000万円規模の日本ブランドにとって、誰もまともにカバーしていない空白地帯がある。何が存在するか整理しましょう。",
        },
        {
          type: "table",
          headers: ["ツール", "価格", "実際の機能", "現実的な評価"],
          rows: [
            ["Shopify Markets（組み込み）", "無料", "約1.5%スプレッドでの通貨換算。基本的な端数処理ルール。市場ごとのパーセンテージ調整。個別商品の固定価格オーバーライド。", "60%までは対応。メカニクスは処理するが市場インテリジェンスはゼロ。あなたのボウルが韓国で競合より30%高いことを教えてくれない。"],
            ["Prisync", "$99/月〜（100商品）", "競合価格を毎日追跡。ダイナミックリプライシングルール。SKUレベルの競合オーバーラップ分析。価格履歴チャート。", "正当なツールだが、100商品で$99/月は海外市場をテスト中の段階では割高。また、独立ベンチマークによるとAmazonでの精度は83%。ニッチな日本製品カテゴリには不向き。"],
            ["Competera", "カスタム（$50K+/年）", "エンタープライズML価格最適化。需要弾力性モデリング。クロスチャネル価格設定。完全自動化。", "このブログを読んでいる方には向かない。導入に3-6ヶ月。専任の価格設定チームが必要。10,000+SKUの小売業向け。"],
            ["Price2Spy", "$39.95/月〜", "低価格の競合モニタリング。価格履歴。Shopifyとの一部連携。", "基本的な価格追跡に限定。文化的価格インテリジェンスなし。₩49,500が韓国でなぜ間違いかを理解しない。"],
            ["Minderest", "€59/月〜", "欧州複数国対応。MAPエンフォースメント。市場分析。", "EU特化。日本のマーチャントが実際に必要とする日本→米国、日本→韓国のルートには使えない。"],
            ["Googleスプレッドシート（DIY）", "無料", "GOOGLEFINANCEでライブレート取得。カスタム端数処理式。手動競合追跡。", "正直なところ、50商品未満ならこれで十分。構築に2-3時間かかるが完全な可視性が得られる。問題：スケールしないし維持に規律が必要。"],
          ],
          caption:
            "価格データは2026年6月確認済。ギャップは明白：「無料で基本的」（Shopify Markets）と「$99/月でも限定的」（Prisync）の間に、手頃なツールが存在しない。",
        },
        {
          type: "heading",
          level: 3,
          content: "誰も埋めていないギャップ",
        },
        {
          type: "text",
          content:
            "上の表を見て、欠けている価格帯に気づいてほしい。無料（Shopify Marketsの基本換算）と$99/月（Prisyncの競合追跡）の間に…何もない。$50/月未満でShopifyマーチャントに提供できるツールは存在しない：複数海外市場での競合価格認識、文化的価格設定ガイダンス（韓国でなぜ,000に丸めるか）、固定価格に対する為替ドリフトの自動追跡、コンテンツとSEOワークフローに統合されたインテリジェンス。",
        },
        {
          type: "text",
          content:
            "これがまさにAganim AIにPrice Scoutを組み込んだ理由です。Prisyncの代替としてではなく — 500商品と専任の価格分析担当がいるならPrisyncが正しい選択。でも80商品を4市場に展開する日本の陶器ブランドが、価格設定だけのために$99/月を正当化できない？そういう方のためにPrice Scoutがあります。",
        },
        {
          type: "callout",
          content:
            "率直なポジショニング：Price ScoutはAganimのコンテンツ・ローカライゼーションツールにバンドルされたモニタリングインフラであり、単独の価格設定プラットフォームではない。競合価格モニタリングだけが唯一のニーズなら、PrisyncやPrice2Spyの方が機能豊富。だがすでにAganimをコンテンツとローカライゼーションに使っているなら、Price Scoutは別のサブスクリプションを一つ減らせる。",
          variant: "info",
        },
        {
          type: "heading",
          level: 2,
          content: "すべてをまとめる：越境EC価格設定ワークフロー",
        },
        {
          type: "text",
          content:
            "日本製品を海外市場に価格設定する完全なワークフロー：",
        },
        {
          type: "list",
          style: "numbered",
          items: [
            {
              label: "市場ごとのコストフロアを計算",
              body: "送料、関税、プラットフォーム手数料、返品、通貨変換コストを考慮。これが交渉不可能な最低価格。",
            },
            {
              label: "各ターゲット市場で競合をリサーチ",
              body: "市場ごとに3-5つの類似商品を見つける。価格帯とスイートスポットを特定。シーリングの参考に。",
            },
            {
              label: "文化的な価格心理を適用",
              body: "市場に適切な数字に丸める。米国プレミアムは.00、EUはラウンドなユーロ、韓国は必ず,000。現地の期待に合わせる。",
            },
            {
              label: "関税・税金の取り扱いを決定",
              body: "プレミアム商品にはDDP、米国（$800以下）にはDAP、他の市場にはハイブリッド。Shopifyの税徴収を適切に設定。",
            },
            {
              label: "Shopify Marketsを設定",
              body: "市場固有の調整、端数処理ルール、主要商品の固定価格を設定。パーセンテージ調整から始め、トップセラーは固定価格に移行。",
            },
            {
              label: "継続的なモニタリングを設定",
              body: "手動（月次スプレッドシートレビュー）でも自動（Price Scout）でも、競合の動きと為替レートドリフトを追跡する体制を確保。",
            },
            {
              label: "四半期ごとにレビュー・調整",
              body: "ポジショニングを再評価し、必要に応じて価格を更新し、パフォーマンスが低い市場で新しい価格帯をテスト。",
            },
          ],
        },
        {
          type: "text",
          content:
            "このワークフローは重厚に聞こえますが、初期セットアップの話です。一度確立すれば継続的なメンテナンスは管理可能：手動モニタリングで月1-2時間、または自動モニタリングでアクションが必要な時だけアラートが来る最小限の時間。",
        },
        {
          type: "cta",
          title: "競合価格を自動モニタリング",
          body: "Aganim AIのPrice Scoutエージェントがターゲット市場全体の競合価格を追跡し、チャンスをアラート。あなたの商品の市場ポジションを確認 — 10商品まで無料。",
          buttonText: "Shopifyに無料インストール",
          buttonUrl:
            "https://admin.shopify.com/oauth/install?client_id=315cfaf63c9baf27e4ba9a22b91b168e",
        },
      ],
      faq: [
        {
          question:
            "すべての市場で同じ価格を使うべきですか、国別に異なる価格を設定すべきですか？",
          answer:
            "市場ごとに異なる価格の方がほぼ常にパフォーマンスが良い。各市場には独自の競争環境、コスト構造（送料・関税）、心理的価格帯があります。¥5,500のボウルは米国で$44、韓国で₩49,000にすべき — これらは等価ではありませんが、それぞれの市場では最適です。Shopify Marketsは固定価格またはパーセンテージ調整で市場別価格設定をサポートしています。",
        },
        {
          question:
            "海外価格はどのくらいの頻度で調整すべきですか？",
          answer:
            "最低でも四半期ごとにレビュー。即座に調整すべき場合：為替レートが8%以上変動した時、主要競合が大幅に価格変更した時、特定市場でコンバージョン率の低下に気づいた時。頻繁すぎる調整は避ける — 常に価格が変わると顧客の信頼を損なう。特に価格変動に気づくリピート購入者に影響。小さな為替変動（5%未満）は通常吸収可能。",
        },
        {
          question:
            "海外注文の商品価格に送料を含めるべきですか？",
          answer:
            "$50/€45/£40未満の商品：送料込み（無料配送）を強く推奨。カート離脱データは一貫して、予期せぬ送料が離脱理由の第1位であることを示す。¥5,500の陶器ボウルなら、$52送料無料の方が$44+送料$8より良いコンバージョンになる（合計は同じでも）。高額商品（$100以上）では別立て送料もより受け入れられる。",
        },
        {
          question:
            "円が大幅に安くなったり高くなったりした時、価格変更をどう対応すべきですか？",
          answer:
            "円安（有利 — 海外売上1件あたりのJPY収入増）：海外価格を下げる誘惑に抵抗。マージンが改善し、将来の円高に対するバッファーになる。円高（不利 — 売上あたりのJPY収入減）：すぐに値上げしない。まず1-2ヶ月様子を見て一時的かどうか確認。持続的なら段階的に値上げ（一度に5-8%）、急な跳ね上げは避ける。価格変更は通貨要因ではなく改善（「新プレミアムパッケージ」や季節調整）として伝える。",
        },
        {
          question:
            "日本から海外への注文にVAT/GSTを課す必要がありますか？",
          answer:
            "EU：はい、EU消費者への年間売上が€10,000（全加盟国合計）を超える場合。IOSS（Import One-Stop Shop）に登録しチェックアウトで徴収。Shopifyがネイティブサポート。英国：はい、£135未満の商品 — 英国VAT登録してチェックアウトで徴収。オーストラリア：はい、豪州への年間売上がA$75,000を超える場合 — GST登録。米国：連邦のVAT/GSTなし。州の売上税はネクサスがある場合のみ。韓国：一般的に₩150,000以上の輸入品は顧客が対応。その閾値以下は通常免税。",
        },
      ],
    },
  },
};
