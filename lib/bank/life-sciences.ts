import type { DailyPrompt } from "./types";

export const LIFE_SCIENCES: DailyPrompt[] = [
  {
    id: "bio-01",
    task: "respond",
    topic: "Model organisms in research",
    text: "Summarise the main point of Haddad (2020) in your own words. Then say how far you agree that research on model organisms helps us understand human biology, giving one reason.",
    source: {
      author: "Haddad",
      year: 2020,
      kind: "text",
      text: "Much of what is known about human biology comes from a small number of model organisms, including mice, fruit flies and zebrafish. These species are cheap to keep, breed quickly and are well understood genetically. However, findings in them do not always transfer to humans, so results need to be interpreted with caution.",
    },
  },
  {
    id: "bio-02",
    task: "compare",
    topic: "Laboratory versus field ecology",
    text: "Write a paragraph comparing laboratory experiments and field studies as ways of answering ecological questions. Use Lindqvist (2017) as evidence.",
    source: {
      author: "Lindqvist",
      year: 2017,
      kind: "text",
      text: "Laboratory experiments allow ecologists to control variables precisely and establish cause and effect, but simplified conditions may not reflect natural systems. Field studies capture the complexity of real ecosystems, including weather and interactions between species, although this makes it harder to isolate the influence of any single factor.",
    },
  },
  {
    id: "bio-03",
    task: "position",
    topic: "Gene drives against malaria",
    text: "Should scientists release gene drives (genetic changes designed to spread quickly through a wild population) to reduce the mosquitoes that carry malaria? Write a paragraph giving your position and the main reason for it.",
  },
  {
    id: "bio-04",
    task: "data",
    topic: "Urban lawns and pollinators",
    text: "Describe the findings reported by Castillo (2022) and explain what they suggest about how urban green spaces could be managed.",
    source: {
      author: "Castillo",
      year: 2022,
      kind: "data",
      text: "During one summer, a study of 30 urban gardens in an English city found that areas left unmown recorded an average of 41 pollinator visits per hour, compared with 12 on regularly mown lawns. Unmown areas also supported more bee species: 14 on average, against 5 on mown lawns.",
    },
  },
  {
    id: "bio-05",
    task: "cause",
    topic: "Why invasive species spread",
    text: "Using Adeyemi (2019) as evidence, explain why some species spread rapidly when they are introduced to a new region.",
    source: {
      author: "Adeyemi",
      year: 2019,
      kind: "text",
      text: "Many invasive species spread rapidly after arriving in a new region, partly because they have left behind the predators, parasites and diseases that controlled them in their native range. Disturbed habitats and a lack of native competitors with similar needs may also help them to become established.",
    },
  },
  {
    id: "bio-06",
    task: "define",
    topic: "Homeostasis in physiology",
    text: "Write a paragraph defining the term ‘homeostasis’. Illustrate your definition with one example from human or animal physiology.",
  },
  {
    id: "bio-07",
    task: "apply",
    topic: "Identifying a disease-causing microbe",
    text: "A researcher suspects that a newly discovered bacterium causes a skin disease in frogs. Apply the criteria described by Petrov (2016) to explain how she could test this, and mention one difficulty she might face.",
    source: {
      author: "Petrov",
      year: 2016,
      kind: "text",
      text: "Koch’s postulates set out criteria for showing that a particular microbe causes a disease. The microbe should be found in diseased individuals, be isolated and grown in pure culture, and cause the same disease when introduced into a healthy host. Some pathogens cannot be grown in culture, which limits the postulates’ usefulness.",
    },
  },
  {
    id: "bio-08",
    task: "respond",
    topic: "Citizen science data",
    text: "Summarise the main point of Nguyen (2023) in your own words. Then say whether you think citizen science can produce reliable biological data, giving one reason.",
    source: {
      author: "Nguyen",
      year: 2023,
      kind: "text",
      text: "Citizen science projects, in which members of the public record biological observations, can greatly extend the geographical scale of research. However, the quality of data may vary between volunteers, so successful projects usually depend on careful training, simple recording methods and statistical approaches that account for differences between observers.",
    },
  },
  {
    id: "bio-09",
    task: "counter",
    topic: "Natural selection in humans",
    text: "Some people argue that modern medicine and technology mean natural selection no longer acts on humans. Write a paragraph responding to this view.",
  },
  {
    id: "bio-10",
    task: "data",
    topic: "Antibiotic use and resistance",
    text: "Describe the trends reported by Zhang (2024). Then suggest one explanation for why resistance to antibiotic A increased even though it was prescribed less.",
    source: {
      author: "Zhang",
      year: 2024,
      kind: "data",
      text: "Between 2015 and 2023, the proportion of E. coli samples resistant to antibiotic A at one regional hospital rose from 11% to 19%. Over the same period, prescriptions of antibiotic A fell by about a quarter, while prescriptions of antibiotic B, which belongs to the same chemical class, doubled.",
    },
  },
  {
    id: "bio-11",
    task: "problem",
    topic: "Diversity in genomic research",
    text: "Using Banerjee (2022), identify the problem caused by a lack of diversity in genomic studies. Then propose one solution and evaluate its strengths and limitations.",
    source: {
      author: "Banerjee",
      year: 2022,
      kind: "text",
      text: "Most participants in large genomic studies have been of European ancestry. As a result, genetic risk scores and some diagnostic tools may be less accurate for people from other populations. If this imbalance is not addressed, advances in genomic medicine could widen existing inequalities in health.",
    },
  },
  {
    id: "bio-12",
    task: "position",
    topic: "Animals in basic research",
    text: "Is it justifiable to use animals in biological research that is unlikely to lead to direct medical benefits? Write a paragraph giving your position and the main reason for it.",
  },
];
