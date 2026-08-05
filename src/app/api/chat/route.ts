import { convertToModelMessages, streamText, stepCountIs, UIMessage } from "ai";
import { auth } from "@/auth";
import { CHAT_MODEL } from "@/lib/ai/model";
import { createGetMilestoneEntriesTool, createSearchJournalEntriesTool } from "@/lib/ai/chatTools";
import { listChildren } from "@/db/queries";

export const maxDuration = 60;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.familyId) {
    return new Response("Unauthorized", { status: 401 });
  }
  const familyId = session.user.familyId;

  const { messages }: { messages: UIMessage[] } = await req.json();

  const kids = await listChildren(familyId);
  const subjectNames = kids.map((child) => child.name).join(", ") || "the family";

  const result = streamText({
    model: CHAT_MODEL,
    system:
      `You are the assistant inside 'Sprout', a private family journal for ${subjectNames} (kids and/or pets). ` +
      "Answer questions about their life using the searchJournalEntries and getMilestoneEntries tools — " +
      "always search the journal before answering anything specific, don't guess from general knowledge. " +
      "Journal entries may be written in Korean or English; answer in whichever language the user asked in. " +
      "Keep answers short and warm.",
    messages: await convertToModelMessages(messages),
    tools: {
      searchJournalEntries: createSearchJournalEntriesTool(familyId),
      getMilestoneEntries: createGetMilestoneEntriesTool(familyId),
    },
    stopWhen: stepCountIs(6),
  });

  return result.toUIMessageStreamResponse();
}
