import { retrieve } from "./retrieval.js";
import { client } from "./connectDB.js";

const questions = [
  "When was the ShED Forum established?",
  "Which was the first university unit?",
  "About how many students are in the Jamia unit?",
  "Why was International Women's Day chosen as Foundation Day?",
  "How can I contact the Forum?",
  "What is the admission fee?",          // should NOT be answerable
  "Who won the cricket world cup?",      // off-topic
];

for (const q of questions) {
  const results = await retrieve(q);
  console.log(`\n=== ${q}`);
  results.forEach((r) =>
    console.log(`  ${r.score.toFixed(3)}  p.${r.pageOrUrl}  ${r.text.slice(0, 90).replace(/\n/g, " ")}`)
  );
}
await client.close();