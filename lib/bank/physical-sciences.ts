import type { DailyPrompt } from "./types";

export const PHYSICAL_SCIENCES: DailyPrompt[] = [
  {
    id: "phys-01",
    task: "respond",
    topic: "Publishing failed experiments",
    text: "Summarise the main point of Andersson (2021) in your own words. Then say whether you agree that failed experiments should be published, giving one reason.",
    source: {
      author: "Andersson",
      year: 2021,
      kind: "text",
      text: "Journals in chemistry and physics have traditionally favoured positive results, so experiments that fail to produce an expected effect are rarely published. This bias may distort the literature, since other researchers cannot learn from unsuccessful approaches and may unknowingly repeat them. Some publishers now offer dedicated outlets for null results.",
    },
  },
  {
    id: "phys-02",
    task: "compare",
    topic: "Computer-assisted mathematical proofs",
    text: "Write a paragraph comparing traditional proofs and computer-assisted proofs in mathematics. Use Ferreira (2019) as evidence for at least one difference between them.",
    source: {
      author: "Ferreira",
      year: 2019,
      kind: "text",
      text: "A traditional proof can, in principle, be checked line by line by a human reader, allowing mathematicians to understand why a result is true. Computer-assisted proofs, such as the 1976 proof of the four colour theorem, can examine vast numbers of cases, but they may offer less insight and are harder to verify independently.",
    },
  },
  {
    id: "phys-03",
    task: "position",
    topic: "Virtual teaching laboratories",
    text: "Should universities replace some first-year laboratory classes in physics and chemistry with virtual simulations? Write a paragraph giving your position and the main reason for it.",
  },
  {
    id: "phys-04",
    task: "data",
    topic: "Temperature and reaction rate",
    text: "Describe the results reported by Nakamura (2022) and explain what they suggest about how temperature affects the rate of a reaction.",
    source: {
      author: "Nakamura",
      year: 2022,
      kind: "data",
      text: "In a teaching laboratory, students timed how long a 2 cm strip of magnesium ribbon took to react completely with dilute hydrochloric acid at different temperatures. The reaction took 120 seconds at 20°C, 62 seconds at 30°C and 29 seconds at 40°C. Acid concentration was kept the same throughout.",
    },
  },
  {
    id: "phys-05",
    task: "cause",
    topic: "Helium supply shortages",
    text: "Using Rahman (2023) as evidence, explain the main causes of helium shortages and one effect they may have on scientific research.",
    source: {
      author: "Rahman",
      year: 2023,
      kind: "text",
      text: "Helium is obtained mainly as a by-product of natural gas extraction, and once released into the atmosphere it is light enough to escape into space. Because supply depends on a small number of gas fields, demand from MRI scanners, semiconductor manufacturing and low-temperature physics laboratories has repeatedly exceeded availability.",
    },
  },
  {
    id: "phys-06",
    task: "define",
    topic: "Mathematical models",
    text: "Write a paragraph defining the term ‘mathematical model’. Illustrate your definition with one example, such as a model of cooling, population growth or the spread of a disease.",
  },
  {
    id: "phys-07",
    task: "apply",
    topic: "Equilibrium in the Haber process",
    text: "In the Haber process, nitrogen and hydrogen react to form ammonia (N₂ + 3H₂ ⇌ 2NH₃). Apply the principle described by Dubois (2018) to explain what happens to the yield of ammonia when the pressure is increased.",
    source: {
      author: "Dubois",
      year: 2018,
      kind: "text",
      text: "Le Chatelier’s principle states that when a system at equilibrium is disturbed, the position of equilibrium shifts in the direction that tends to counteract the change. The principle predicts the direction of the shift, but not its size or how quickly the new equilibrium is reached.",
    },
  },
  {
    id: "phys-08",
    task: "respond",
    topic: "Preprints and peer review",
    text: "Summarise the main point of Kowalczyk (2024) in your own words. Then say whether you think the benefits of preprints outweigh the risks, giving one reason.",
    source: {
      author: "Kowalczyk",
      year: 2024,
      kind: "text",
      text: "In physics and mathematics, many researchers post preprints on open servers before their work has been peer reviewed. This allows results to circulate rapidly and free of charge. However, it also means that journalists and the public may encounter claims that have not yet been checked by independent experts.",
    },
  },
  {
    id: "phys-09",
    task: "counter",
    topic: "The value of pure mathematics",
    text: "Some people argue that pure mathematics does not deserve public funding because it rarely has immediate practical uses. Write a paragraph responding to this view.",
  },
  {
    id: "phys-10",
    task: "data",
    topic: "Radioactive decay measurements",
    text: "Describe the pattern in the measurements reported by Osei (2020) and explain what they suggest about the half-life of the sample.",
    source: {
      author: "Osei",
      year: 2020,
      kind: "data",
      text: "Students measured the count rate from a radioactive sample every six hours, after subtracting background radiation. The rate fell from 798 counts per minute at the start to 405 after six hours, 196 after twelve hours and 102 after eighteen hours. All readings used the same detector at a fixed distance.",
    },
  },
  {
    id: "phys-11",
    task: "problem",
    topic: "Satellites and astronomy",
    text: "Using Mwangi (2025), identify the problem that large satellite networks create for astronomers. Then choose one possible solution and evaluate how well it would work.",
    source: {
      author: "Mwangi",
      year: 2025,
      kind: "text",
      text: "The rapid growth of large satellite constellations in low Earth orbit is leaving bright streaks across astronomical images, and wide-field surveys from the ground are particularly affected. Possible responses include darker satellite coatings, software that removes streaks and international agreements on orbits, although none of these fully solves the problem.",
    },
  },
  {
    id: "phys-12",
    task: "position",
    topic: "Publishing dual-use chemistry",
    text: "Should chemists avoid publishing full details of research that could be misused, for example to make dangerous substances? Write a paragraph giving your position and the main reason for it.",
  },
];
