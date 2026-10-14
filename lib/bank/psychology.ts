import type { DailyPrompt } from "./types";

export const PSYCHOLOGY: DailyPrompt[] = [
  {
    id: "psy-01",
    task: "respond",
    topic: "Language and thought",
    text: "Write a paragraph that summarises the main point of Ruiz (2019) in your own words and then says whether you agree, with a reason. You may draw on your experience of using more than one language.",
    source: {
      author: "Ruiz",
      year: 2019,
      kind: "text",
      text: "Most researchers now reject the strong claim that language determines thought. There is, however, reasonable evidence for a weaker version: the language a person speaks may influence aspects of perception and memory, such as how readily speakers notice certain colour distinctions or describe spatial directions.",
    },
  },
  {
    id: "psy-02",
    task: "compare",
    topic: "Laboratory versus field methods",
    text: "Write a paragraph comparing laboratory experiments and naturalistic observation as ways of studying aggressive behaviour in young children. Use the source as evidence.",
    source: {
      author: "Kovač",
      year: 2017,
      kind: "text",
      text: "Laboratory experiments allow researchers to control extraneous variables and so draw conclusions about cause and effect with some confidence. Naturalistic observation, by contrast, records behaviour in everyday settings. This usually increases ecological validity, but it makes it harder to rule out alternative explanations for what is observed.",
    },
  },
  {
    id: "psy-03",
    task: "position",
    topic: "Deception in research",
    text: "Is it acceptable for psychologists to mislead participants about the true aim of a study? Write a paragraph that takes a clear position and justifies it.",
  },
  {
    id: "psy-04",
    task: "data",
    topic: "Smartphones and memory",
    text: "Write a paragraph that describes the main pattern in the figures and suggests what it might mean for students who study with a phone nearby. Refer to Nakamura (2023).",
    source: {
      author: "Nakamura",
      year: 2023,
      kind: "data",
      text: "In a 2022 study, 240 undergraduates completed a 20-word recall test. Students whose phone was placed face down on the desk recalled an average of 10.8 words, compared with 12.1 for those whose phone was in a bag and 13.4 for those who left it in another room.",
    },
  },
  {
    id: "psy-05",
    task: "cause",
    topic: "Sleep and learning",
    text: "Write a paragraph explaining how regularly getting too little sleep can affect university students’ learning. Use Okafor (2020) as evidence.",
    source: {
      author: "Okafor",
      year: 2020,
      kind: "text",
      text: "Sleep appears to play an important role in memory consolidation, the process by which newly learned information becomes more stable. Students who regularly sacrifice sleep to study late may therefore retain less of what they have learned, and short sleep is also associated with reduced attention the following day.",
    },
  },
  {
    id: "psy-06",
    task: "define",
    topic: "Cognitive dissonance",
    text: "Write a paragraph that defines cognitive dissonance and illustrates it with one clear example, either from everyday life or from research.",
  },
  {
    id: "psy-07",
    task: "apply",
    topic: "Reinforcement and social media",
    text: "Write a paragraph applying the principle described by Lindqvist (2018) to explain why many people check social media apps so often.",
    source: {
      author: "Lindqvist",
      year: 2018,
      kind: "text",
      text: "In operant conditioning, behaviour rewarded on a variable-ratio schedule, where reinforcement follows an unpredictable number of responses, tends to occur at a high and steady rate. Such behaviour is also unusually resistant to extinction. Slot machines are often cited as a classic illustration of this principle.",
    },
  },
  {
    id: "psy-08",
    task: "respond",
    topic: "Reliability of eyewitness testimony",
    text: "Write a paragraph that summarises the main point of the source in your own words and then responds to it: do you agree, partly agree or disagree? Give a reason.",
    source: {
      author: "Al-Rashid",
      year: 2016,
      kind: "text",
      text: "Eyewitness memory is better understood as a reconstruction than as a recording, and it can be altered by information encountered after an event, such as leading questions from police officers. For this reason, many psychologists argue that eyewitness testimony alone should rarely be enough to convict a suspect.",
    },
  },
  {
    id: "psy-09",
    task: "counter",
    topic: "Can personality change?",
    text: "A common view is that personality is fixed by early adulthood and that people do not really change after that. Write a paragraph that responds to this view and explains why it may be too simple.",
  },
  {
    id: "psy-10",
    task: "data",
    topic: "Bystanders and helping",
    text: "Write a paragraph that describes the figures in the source and offers one psychological explanation for the pattern. Refer to Brennan (2024).",
    source: {
      author: "Brennan",
      year: 2024,
      kind: "data",
      text: "In a 2023 field study on a UK campus, a researcher dropped a pile of papers near passers-by. When only one person was nearby, 72% stopped to help. This fell to 48% when two or three people were present, and to 26% when six or more were present.",
    },
  },
  {
    id: "psy-11",
    task: "problem",
    topic: "Publication bias and replication",
    text: "Write a paragraph that explains the problem described by Haddad (2021) and evaluates pre-registration as a solution. Does it solve the problem fully?",
    source: {
      author: "Haddad",
      year: 2021,
      kind: "text",
      text: "Journals have traditionally favoured studies reporting statistically significant results, which may have encouraged selective reporting and contributed to failures to replicate published findings. Pre-registration, in which researchers publicly record their hypotheses and analysis plan before collecting data, has been proposed as one way of reducing this problem.",
    },
  },
  {
    id: "psy-12",
    task: "position",
    topic: "Young children and screens",
    text: "Should parents strictly limit the time young children spend on screens? Write a paragraph that takes a position and supports it with reasons from developmental psychology.",
  },
];
