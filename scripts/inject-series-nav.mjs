import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join } from "path";

const dir = join(process.cwd(), "public/deep-learning");
const marker = "series-nav.css";
const injection = `<link rel="stylesheet" href="/deep-learning/series-nav.css">
<script src="/deep-learning/series-nav.js" defer></script>
`;

for (const file of readdirSync(dir)) {
  if (!file.endsWith(".html")) continue;

  const path = join(dir, file);
  let html = readFileSync(path, "utf8");

  if (html.includes(marker)) continue;

  if (!html.includes("</head>")) {
    console.warn(`Skipping ${file}: no </head> tag`);
    continue;
  }

  html = html.replace("</head>", `${injection}</head>`);
  writeFileSync(path, html);
  console.log(`Injected series nav into ${file}`);
}
