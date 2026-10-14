import type { DailyPrompt } from "./types";

export const VETERINARY: DailyPrompt[] = [
  {
    id: "vet-01",
    task: "respond",
    topic: "Flat-faced dog breeds",
    text: "Write a paragraph that summarises the main point of Ivanova (2020) in your own words, then agrees with, qualifies or challenges it. Give at least one reason for your view.",
    source: {
      author: "Ivanova",
      year: 2020,
      kind: "text",
      text: "The popularity of flat-faced dog breeds, such as French bulldogs and pugs, raises serious welfare concerns. Their shortened skulls are associated with breathing difficulties, eye problems and heat intolerance, yet demand appears to be driven largely by appearance and social media rather than by owners’ awareness of these risks.",
    },
  },
  {
    id: "vet-02",
    task: "compare",
    topic: "Housing systems for laying hens",
    text: "Write a paragraph comparing free-range and indoor housing for laying hens from a welfare point of view. Use Tanaka (2018) as evidence.",
    source: {
      author: "Tanaka",
      year: 2018,
      kind: "text",
      text: "Free-range systems allow hens to perform natural behaviours such as foraging and dust-bathing, which is generally considered positive for welfare. Outdoor access can also increase exposure to predators, parasites and diseases such as avian influenza, however, so no single housing system is clearly best in every respect.",
    },
  },
  {
    id: "vet-03",
    task: "position",
    topic: "Keeping cats indoors",
    text: "Some people believe that pet cats should be kept indoors to protect wildlife and keep the cats safe. Write a paragraph taking a position on this question and justifying it with two reasons.",
  },
  {
    id: "vet-04",
    task: "data",
    topic: "Antibiotic sales for farm animals",
    text: "Write a paragraph describing the trends in Mwangi (2023) and explaining what they might suggest about antibiotic use in farming.",
    source: {
      author: "Mwangi",
      year: 2023,
      kind: "data",
      text: "In one European country, sales of antibiotics for food-producing animals fell by 55% between 2014 and 2022. Over the same period, sales of the antibiotics considered most critically important for human medicine fell by 80%, while the number of reported disease outbreaks in livestock remained broadly stable.",
    },
  },
  {
    id: "vet-05",
    task: "cause",
    topic: "Drivers of emerging zoonoses",
    text: "Write a paragraph explaining why new zoonotic diseases may be emerging. Use Chaudhry (2021) to support your explanation.",
    source: {
      author: "Chaudhry",
      year: 2021,
      kind: "text",
      text: "Most emerging infectious diseases in humans are thought to be zoonotic, meaning that they originate in animals. Their emergence appears to be linked to human activities such as deforestation, intensive livestock production and the wildlife trade, which bring people, domestic animals and wildlife into closer contact.",
    },
  },
  {
    id: "vet-06",
    task: "define",
    topic: "The One Health approach",
    text: "Write a paragraph defining the term ‘One Health’ and illustrating it with one example of a health problem that links animals, people and the environment.",
  },
  {
    id: "vet-07",
    task: "apply",
    topic: "Welfare of pet rabbits",
    text: "Write a paragraph applying the Five Freedoms described by Silva (2017) to this case: a pet rabbit kept alone in a small hutch in a garden. Explain which freedoms may not be met.",
    source: {
      author: "Silva",
      year: 2017,
      kind: "text",
      text: "The Five Freedoms describe what animals in human care should have: freedom from hunger and thirst, from discomfort, from pain, injury or disease, and from fear and distress, plus freedom to express normal behaviour. They remain a common starting point for welfare assessment, although newer models also emphasise positive experiences.",
    },
  },
  {
    id: "vet-08",
    task: "respond",
    topic: "The cost of veterinary care",
    text: "Write a paragraph that summarises Brennan (2025) in your own words and responds to it. Should vets routinely offer cheaper treatment options? Give a reason for your view.",
    source: {
      author: "Brennan",
      year: 2025,
      kind: "text",
      text: "Rising costs of veterinary care may create a welfare problem when owners delay or decline treatment they cannot afford. Some authors therefore argue that vets should routinely discuss a range of treatment options at different prices, rather than presenting only the most advanced ‘gold standard’ approach.",
    },
  },
  {
    id: "vet-09",
    task: "counter",
    topic: "Welfare and farm productivity",
    text: "A common view is that farm animal welfare is purely an ethical issue with no connection to productivity or profit. Write a paragraph answering this view, using an example from a type of farming you know.",
  },
  {
    id: "vet-10",
    task: "data",
    topic: "Owner perceptions of dog weight",
    text: "Write a paragraph describing the figures in Petrović (2024) and interpreting the difference between owners’ and vets’ judgements.",
    source: {
      author: "Petrović",
      year: 2024,
      kind: "data",
      text: "When 540 UK dog owners were surveyed in 2024, 82% described their dog as a healthy weight. However, when vets assessed the same dogs, only 47% were judged to be a healthy weight, while 41% were classed as overweight and 12% as obese.",
    },
  },
  {
    id: "vet-11",
    task: "problem",
    topic: "Shortage of farm vets",
    text: "Write a paragraph identifying the problem described by Andersen (2022) and proposing one solution. Evaluate how practical your solution would be.",
    source: {
      author: "Andersen",
      year: 2022,
      kind: "text",
      text: "Many rural areas report difficulty recruiting and retaining farm animal vets. Long hours, out-of-hours work and professional isolation are commonly cited reasons, and fewer graduates appear to choose farm practice than in the past. This shortage may weaken disease surveillance and affect animal welfare on farms.",
    },
  },
  {
    id: "vet-12",
    task: "position",
    topic: "Routine neutering of pet dogs",
    text: "Should vets recommend neutering for all pet dogs that are not intended for breeding? Write a paragraph taking a clear position and justifying it with reasons.",
  },
];
