import { convertToModelMessages, streamText, stepCountIs, UIMessage } from "ai";
import { auth } from "@/auth";
import { CHAT_MODEL } from "@/lib/ai/model";
import { searchJournalEntries, getMilestoneEntries } from "@/lib/ai/chatTools";

export const maxDuration = 60;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: CHAT_MODEL,
    system:
      "You are the assistant inside 'Sprout', a private family journal for Roun (이로운). " +
      "Answer questions about his life using the searchJournalEntries and getMilestoneEntries tools — " +
      "always search the journal before answering anything specific, don't guess from general knowledge. " +
      "Journal entries may be written in Korean or English; answer in whichever language the user asked in. " +
      "Keep answers short and warm.",
    messages: await convertToModelMessages(messages),
    tools: { searchJournalEntries, getMilestoneEntries },
    stopWhen: stepCountIs(6),
  });

  return result.toUIMessageStreamResponse();
}
