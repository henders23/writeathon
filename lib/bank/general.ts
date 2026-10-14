import type { DailyPrompt } from "./types";

export const GENERAL: DailyPrompt[] = [
  {
    id: "gen-01",
    task: "respond",
    topic: "Handwritten versus typed notes",
    text: "Write a paragraph that summarises Kaur’s (2019) main point in your own words and then responds to it. Say whether you agree, want to qualify the idea, or disagree, and give a reason.",
    source: {
      author: "Kaur",
      year: 2019,
      kind: "text",
      text: "Some research suggests that students who take notes by hand may remember lecture content better than those who type. One explanation is that handwriting is slower, so students must select and summarise ideas rather than record every word. However, findings are mixed, and how notes are used afterwards may matter more.",
    },
  },
  {
    id: "gen-02",
    task: "compare",
    topic: "Home and office working",
    text: "Write a paragraph comparing working from home with working in an office. Use Haugen (2022) as evidence for your comparison.",
    source: {
      author: "Haugen",
      year: 2022,
      kind: "text",
      text: "Working from home can reduce commuting time and give employees more control over their day, which many report improves their wellbeing. Office-based work, by contrast, tends to make informal learning easier, as newer staff can observe colleagues and ask quick questions. Many organisations now combine both in hybrid arrangements.",
    },
  },
  {
    id: "gen-03",
    task: "position",
    topic: "Compulsory lecture attendance",
    text: "Should attendance at university lectures be compulsory? Write a paragraph that takes a clear position and justifies it with at least one reason and an example.",
  },
  {
    id: "gen-04",
    task: "data",
    topic: "Students and generative AI",
    text: "Write a paragraph that describes the main findings of Ibrahim’s (2024) survey and suggests what they might show about how students use AI.",
    source: {
      author: "Ibrahim",
      year: 2024,
      kind: "data",
      text: "In a 2024 survey of 450 first-year students at one UK university, 72% said they used generative AI tools for their studies at least once a week. Of these students, 61% used them mainly to explain difficult ideas, while only 18% said they used them to write parts of assignments.",
    },
  },
  {
    id: "gen-05",
    task: "cause",
    topic: "Why misinformation spreads",
    text: "Write a paragraph explaining why false information spreads easily online. Use Santos (2021) as evidence for the causes you describe.",
    source: {
      author: "Santos",
      year: 2021,
      kind: "text",
      text: "False information can spread quickly on social media. Platforms often promote content that attracts strong reactions, and surprising or emotional claims tend to be shared more than careful, accurate ones. In addition, people appear more likely to accept information that fits their existing beliefs, especially when it comes from friends.",
    },
  },
  {
    id: "gen-06",
    task: "define",
    topic: "Critical thinking",
    text: "Write a paragraph that defines ‘critical thinking’ in your own words and illustrates it with one example from university study or everyday life.",
  },
  {
    id: "gen-07",
    task: "apply",
    topic: "The spacing effect",
    text: "Write a paragraph applying the spacing effect described by Petrov (2017) to a concrete case, such as preparing for an exam or learning vocabulary in a new language. Explain what a student should do and why.",
    source: {
      author: "Petrov",
      year: 2017,
      kind: "text",
      text: "The ‘spacing effect’ refers to the finding that information is usually remembered better when study is spread over several sessions rather than concentrated into one long session. Reviewing material after a gap appears to strengthen memory, even though it may feel more difficult than reading the same material repeatedly at once.",
    },
  },
  {
    id: "gen-08",
    task: "respond",
    topic: "Machine translation and languages",
    text: "Write a paragraph that summarises the main point of Nakamura (2023) in your own words and responds to it. Explain whether you agree, partly agree or disagree, and why.",
    source: {
      author: "Nakamura",
      year: 2023,
      kind: "text",
      text: "Rapid improvements in machine translation have led some commentators to question whether learning foreign languages will remain necessary. Yet language learning involves more than exchanging information. It can also develop cultural understanding and help people build relationships, which translation tools may not be able to replace fully.",
    },
  },
  {
    id: "gen-09",
    task: "counter",
    topic: "Cities and the environment",
    text: "‘People who care about the environment should live in the countryside, not in big cities.’ Write a paragraph that responds to this view: acknowledge what is reasonable about it, then explain why it may be incomplete or mistaken.",
  },
  {
    id: "gen-10",
    task: "data",
    topic: "The four-day working week",
    text: "Write a paragraph that describes the results reported by Mwangi (2023) and interprets what they might suggest about a four-day working week.",
    source: {
      author: "Mwangi",
      year: 2023,
      kind: "data",
      text: "In a six-month trial of a four-day working week involving 60 companies, 56 chose to continue the policy after the trial ended. The proportion of staff reporting burnout fell from 46% at the start to 29% at the end, while average company revenue remained broadly stable.",
    },
  },
  {
    id: "gen-11",
    task: "problem",
    topic: "Loneliness at university",
    text: "Write a paragraph that identifies the problem described by Rossi (2022) and proposes one practical solution a university could introduce. Briefly evaluate its strengths or limitations.",
    source: {
      author: "Rossi",
      year: 2022,
      kind: "text",
      text: "Many students experience loneliness, particularly in their first year, when they leave established friendships and support networks. International students may face additional barriers, such as unfamiliar social customs or studying in a second language. Loneliness has been associated with lower wellbeing and, in some cases, with students leaving their course early.",
    },
  },
  {
    id: "gen-12",
    task: "position",
    topic: "Social media under 16",
    text: "Should governments ban children under 16 from using social media? Write a paragraph that takes a clear position and justifies it, briefly recognising one opposing argument.",
  },
];
