import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  problem: z.string().min(1).max(4000),
  witness: z.string().max(500).optional().nullable(),
});

type ModerationResult = { allow: boolean; reason?: string };

export const moderateReport = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }): Promise<ModerationResult> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) return { allow: true }; // fail open

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "Lovable-API-Key": key,
        },
        body: JSON.stringify({
          model: "openai/gpt-5.5",
          reasoning_effort: "none",
          messages: [
            {
              role: "system",
              content:
                "You are a strict moderator for a school anti-bullying report form. BLOCK the submission if ANY of these apply: (1) fewer than ~15 meaningful characters of description, (2) gibberish, keyboard mash, or repeated characters (asdf, hjhjhj, aaaa), (3) obvious tests/greetings ('hi', 'hello', 'yo', 'test', single emoji), (4) profanity, slurs, or insults with no described incident, (5) advertising, promotional text, external links or URLs, (6) content clearly off-topic (not about student conduct, safety, or school life), (7) accusations against a person or staff with NO described incident or behavior, (8) romanized/non-English gibberish that carries no meaning, (9) copy-pasted lorem ipsum or filler text. ALLOW real reports even if short-ish, emotional, angry, distressing, or poorly written — as long as they describe SOMETHING that happened (who/what/where or a behavior). When in doubt about a plausibly real report, ALLOW. Respond with ONLY compact JSON: {\"allow\": true} or {\"allow\": false, \"reason\": \"short user-friendly reason\"}. No prose.",
            },
            {
              role: "user",
              content: `Problem: ${data.problem}\nWitness: ${data.witness ?? "(none)"}`,
            },
          ],
        }),
      });
      clearTimeout(timer);

      if (!res.ok) return { allow: true }; // fail open on gateway error
      const json = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const raw = json.choices?.[0]?.message?.content?.trim() ?? "";
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) return { allow: true };
      const parsed = JSON.parse(match[0]) as ModerationResult;
      if (parsed.allow === false) {
        return {
          allow: false,
          reason:
            parsed.reason?.slice(0, 200) ||
            "Your submission looks like spam. Please write a real description.",
        };
      }
      return { allow: true };
    } catch {
      clearTimeout(timer);
      return { allow: true };
    }
  });
