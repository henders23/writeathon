import type { DailyPrompt } from "./types";

export const ENGINEERING: DailyPrompt[] = [
  {
    id: "eng-01",
    task: "respond",
    topic: "Timber in mid-rise buildings",
    text: "Write a paragraph that briefly summarises Lindqvist’s (2022) main point in your own words, then say whether you agree, partly agree or disagree that engineered timber should replace concrete in mid-rise buildings, giving a reason.",
    source: {
      author: "Lindqvist",
      year: 2022,
      kind: "text",
      text: "Engineered timber products such as cross-laminated timber are increasingly proposed as lower-carbon alternatives to concrete and steel in mid-rise buildings. However, their environmental benefit depends heavily on how the forests are managed and on whether the timber is reused, burned or sent to landfill at the end of the building’s life.",
    },
  },
  {
    id: "eng-02",
    task: "compare",
    topic: "Sodium-ion versus lithium-ion batteries",
    text: "Write a paragraph comparing sodium-ion and lithium-ion batteries, and explain which seems more suitable for grid storage and which for electric vehicles. Use Okafor (2024) as evidence.",
    source: {
      author: "Okafor",
      year: 2024,
      kind: "text",
      text: "Sodium-ion batteries are attracting interest for stationary grid storage because sodium is far more abundant and cheaper to obtain than lithium. Their main limitation is lower energy density, which matters less in a fixed installation than in an electric vehicle, where the weight and volume of the battery are critical.",
    },
  },
  {
    id: "eng-03",
    task: "position",
    topic: "Designing products for repair",
    text: "Should engineers design consumer products, such as phones and washing machines, to be easy to repair, even if this makes them heavier or more expensive? Write a paragraph stating your position and justifying it with reasons.",
  },
  {
    id: "eng-04",
    task: "data",
    topic: "Growth in offshore turbine size",
    text: "Write a paragraph describing the main trend in Jansen’s (2025) figures and suggesting what it might mean for the cost of building and maintaining offshore wind farms.",
    source: {
      author: "Jansen",
      year: 2025,
      kind: "data",
      text: "Between 2014 and 2024, the average rated capacity of new offshore wind turbines installed in European waters rose from about 4 megawatts to around 11 megawatts. Over the same period, the number of turbines needed for a wind farm of a given output fell by more than half.",
    },
  },
  {
    id: "eng-05",
    task: "cause",
    topic: "Corrosion in concrete bridges",
    text: "Using Tanaka (2019) as evidence, write a paragraph explaining how reinforcement corrosion develops in concrete bridges and why the damage tends to speed up over time.",
    source: {
      author: "Tanaka",
      year: 2019,
      kind: "text",
      text: "Corrosion of steel reinforcement is one of the most common causes of deterioration in concrete bridges. Chlorides from de-icing salts or seawater can gradually penetrate the concrete cover; once they reach the steel, the expanding corrosion products crack the concrete, which allows more water and salt to enter.",
    },
  },
  {
    id: "eng-06",
    task: "define",
    topic: "Factor of safety",
    text: "Write a paragraph defining the term ‘factor of safety’ and explaining why engineers use it. Illustrate your definition with an example from a structure, machine or product.",
  },
  {
    id: "eng-07",
    task: "apply",
    topic: "Fail-safe design",
    text: "Apply the principle of fail-safe design described by Mukherjee (2017) to another system, such as a lift, a level crossing or a gas boiler. Explain what could fail and how the design could make the result safe.",
    source: {
      author: "Mukherjee",
      year: 2017,
      kind: "text",
      text: "A fail-safe design is one in which a failure causes the system to move into a safe state rather than a dangerous one. A well-known example is the railway air brake, which applies automatically if air pressure is lost, for instance when carriages accidentally become separated.",
    },
  },
  {
    id: "eng-08",
    task: "respond",
    topic: "Generative design software",
    text: "Write a paragraph that summarises Haddad’s (2023) point in your own words and then responds to it: will engineering judgement remain essential as these tools improve? Give a reason.",
    source: {
      author: "Haddad",
      year: 2023,
      kind: "text",
      text: "Generative design software can produce thousands of structural options that satisfy given loads and constraints, often using less material than conventional designs. Yet many of the resulting forms are difficult or costly to manufacture, so the judgement of experienced engineers remains essential in selecting a practical solution.",
    },
  },
  {
    id: "eng-09",
    task: "counter",
    topic: "Why engineering projects fail",
    text: "Many people believe that major engineering failures are mainly caused by errors in calculations. Write a paragraph responding to this view, considering what other factors, such as communication, management or maintenance, might be involved.",
  },
  {
    id: "eng-10",
    task: "data",
    topic: "3D printing in manufacturing",
    text: "Write a paragraph describing Kowalski’s (2022) figures and suggesting possible reasons why additive manufacturing is used much less for final products than for prototypes.",
    source: {
      author: "Kowalski",
      year: 2022,
      kind: "data",
      text: "A 2022 survey of 40 UK manufacturing firms found that 85% used additive manufacturing (3D printing) for prototyping. However, only 38% used it to make tools and fixtures, and just 14% used it to produce final parts for sale, mainly for low-volume or highly customised products.",
    },
  },
  {
    id: "eng-11",
    task: "problem",
    topic: "Urban flooding and drainage",
    text: "Write a paragraph identifying the problem described by Mendes (2021) and evaluating one of the solutions it mentions for a city you know. Consider both its benefits and its limitations.",
    source: {
      author: "Mendes",
      year: 2021,
      kind: "text",
      text: "In many cities, roads, roofs and car parks prevent rainwater from soaking into the ground, so heavy rainfall can quickly overwhelm drainage systems. Sustainable drainage approaches, such as permeable paving, green roofs and retention ponds, slow the flow of water, although they require space and regular maintenance.",
    },
  },
  {
    id: "eng-12",
    task: "position",
    topic: "Driverless cars on public roads",
    text: "Should fully driverless cars be allowed on public roads before there is clear evidence that they are safer than human drivers? Write a paragraph stating your position and supporting it with reasons.",
  },
];
