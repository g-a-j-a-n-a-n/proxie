import { clerkClient } from "@clerk/express";
import { changeState, emptyState, readState, type Source, type State } from "./study-store";
import { randomUUID } from "node:crypto";

// example.com is reserved for documentation; the address is marked reserved and never used for email sign-in.
const demoEmail = "proxie-judge@example.com";
export let judgeUserId: string | undefined;

export async function ensureJudgeDemo() {
  if (process.env.NODE_ENV !== "development") return;
  const matches = await clerkClient.users.getUserList({ emailAddress: [demoEmail], limit: 2 });
  const existing = matches.data.find(u => u.emailAddresses.some(e => e.emailAddress === demoEmail));
  if (existing && existing.publicMetadata.isProxieJudge !== true) {
    throw new Error("The reserved Proxie judge email is already used by a non-demo account.");
  }
  const judge = existing || await clerkClient.users.createUser({
    emailAddress: [demoEmail],
    emailAddressIdentificationStatus: ["reserved"],
    firstName: "Proxie",
    lastName: "Judge demo",
    publicMetadata: { isProxieJudge: true },
    skipPasswordRequirement: true,
  });
  judgeUserId = judge.id;
  const workspace = await readState(judge.id);
  if (!workspace.notebooks.length && !workspace.courses.length && !workspace.runs.length && !workspace.questions.length) {
    await seedJudgeWorkspace(judge.id);
  }
}

export function createSampleState(): State {
  const pages = [
    { locator: "Slide 1", text: "Photosynthesis is the process by which plants turn light energy into stored chemical energy." },
    { locator: "Slide 2", text: "Chloroplasts capture sunlight. Chlorophyll gives many leaves their green color." },
    { locator: "Slide 3", text: "Roots absorb water from soil, and xylem carries it toward stems and leaves." },
    { locator: "Slide 4", text: "Stomata let carbon dioxide enter leaves and allow oxygen and water vapor to exit." },
  ];
  const source: Source = { id: randomUUID(), name: "How plants use light · sample lesson", type: "transcript", pages };
  const cite = (i: number) => ({ sourceId: source.id, locator: pages[i]!.locator, quote: pages[i]!.text });
  const section1 = {
    id: randomUUID(), title: "A plant’s solar workshop",
    summary: { text: pages[0]!.text, citation: cite(0) },
    points: [{ text: pages[1]!.text, citation: cite(1) }],
    terms: [
      { term: "Photosynthesis", definition: "The process by which plants turn light energy into stored chemical energy.", example: pages[0]!.text, citation: cite(0) },
      { term: "Chlorophyll", definition: "The pigment that gives many leaves their green color.", example: pages[1]!.text, citation: cite(1) },
    ],
    diagram: [
      { text: "Sunlight reaches the chloroplasts.", citation: cite(1) },
      { text: "Plants turn light energy into stored chemical energy.", citation: cite(0) },
    ],
    status: "AI summary · source quotes matched",
  };
  const section2 = {
    id: randomUUID(), title: "A two-way doorway",
    summary: { text: "Stomata let carbon dioxide enter leaves and allow oxygen and water vapor to exit.", citation: cite(3) },
    points: [{ text: pages[2]!.text, citation: cite(2) }, { text: pages[3]!.text, citation: cite(3) }],
    terms: [{ term: "Xylem", definition: "The material that carries water toward stems and leaves.", example: pages[2]!.text, citation: cite(2) }],
    diagram: [],
    status: "AI summary · source quotes matched",
  };
  const courseId = randomUUID(), runId = randomUUID(), notebookId = randomUUID();
  const topic1 = { id: randomUUID(), name: "Photosynthesis", position: 0, level: "Unlocked" as const, citation: cite(0), prerequisites: [], correctSessions: 0, lastReviewedAt: null };
  const topic2 = { id: randomUUID(), name: "Plant structures", position: 1, level: "Locked" as const, citation: cite(1), prerequisites: [topic1.id], correctSessions: 0, lastReviewedAt: null };
  const topic3 = { id: randomUUID(), name: "Water and gas movement", position: 2, level: "Locked" as const, citation: cite(3), prerequisites: [topic2.id], correctSessions: 0, lastReviewedAt: null };
  const course = { id: courseId, name: "Botany · example course", color: "sage", topics: [topic1, topic2, topic3], answerCount: 0, xp: 0, placementDone: false, sources: [source], runId };
  const questions = [
    { id: randomUUID(), courseId, topicId: topic1.id, text: "Which energy source do chloroplasts capture?", options: ["Sunlight", "Moonlight", "Sound waves", "Soil heat"], correctOption: 0, explanation: "The source says chloroplasts capture sunlight.", difficulty: 1, citation: cite(1) },
    { id: randomUUID(), courseId, topicId: topic2.id, text: "According to the source, what carries water toward the leaves?", options: ["Xylem", "Stomata", "Chlorophyll", "Petals"], correctOption: 0, explanation: "The source says xylem carries water toward stems and leaves.", difficulty: 2, citation: cite(2) },
    { id: randomUUID(), courseId, topicId: topic3.id, text: "Which gas do the stomata let enter leaves?", options: ["Carbon dioxide", "Oxygen", "Water vapor", "Nitrogen"], correctOption: 0, explanation: "The source says carbon dioxide enters while oxygen and water vapor exit.", difficulty: 2, citation: cite(3) },
  ];
  const notebook = {
    id: notebookId, title: "How plants use light · sample lesson", courseId,
    createdAt: new Date().toISOString(), sections: [section1, section2], sources: [source],
    flags: [{ id: randomUUID(), sectionId: section1.id, highlightedText: "Chlorophyll", citation: cite(1), note: "Try the edit and resolve flow.", status: "open" }],
    runId,
    disclaimer: "Fictional example material, not a real student record or an official grade. Citations point to the sample source. The recorded sample build is illustrative, not a live AI run.",
  };
  const run = {
    id: runId, status: "complete" as const, notebookId,
    events: [
      ["Page", "Loaded the fictional sample lesson", "ok"],
      ["Server", "Validated demo source material", "ok"],
      ["Text extraction", "Read 4 sample transcript segments", "ok"],
      ["AI summary", "Prepared 2 sample notebook sections", "ok"],
      ["Citation check", "Matched sample citations to original fictional source lines", "ok"],
      ["Database", "Prepared the fictional example workspace", "ok"],
      ["Render", "Sample notebook ready", "ok"],
    ].map(([step, result, status]) => ({ step: step!, result: result!, status: status as "ok", startedAt: new Date().toISOString(), durationMs: 80 })),
  };
  return {
    ...emptyState(), notebooks: [notebook], courses: [course], runs: [run], questions,
  };
}

export async function seedJudgeWorkspace(userId: string) {
  await changeState(userId, state => Object.assign(state, createSampleState()));
}
