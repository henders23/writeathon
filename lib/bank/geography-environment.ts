import type { DailyPrompt } from "./types";

export const GEOGRAPHY_ENVIRONMENT: DailyPrompt[] = [
  {
    id: "geo-01",
    task: "respond",
    topic: "The 15-minute city",
    text: "Write a paragraph that summarises Okafor’s (2022) main point in your own words and then responds to it. Say whether you agree, want to qualify the idea, or disagree, and give a reason.",
    source: {
      author: "Okafor",
      year: 2022,
      kind: "text",
      text: "The ‘15-minute city’ model proposes that residents should be able to reach work, shops, schools and green space within a short walk or cycle from home. Supporters argue that this could reduce car dependence and emissions. Critics, however, note that it may be difficult to apply in low-density suburbs, where services are widely spread.",
    },
  },
  {
    id: "geo-02",
    task: "compare",
    topic: "Hard and soft flood defences",
    text: "Write a paragraph comparing hard and soft approaches to managing river flooding. Use Lindqvist (2019) as evidence for the similarities or differences you identify.",
    source: {
      author: "Lindqvist",
      year: 2019,
      kind: "text",
      text: "Hard engineering approaches to flooding, such as concrete walls and embankments, can offer immediate and predictable protection for towns. Soft approaches, including restoring wetlands and planting trees upstream, tend to be cheaper to maintain and also support wildlife, although their benefits usually take longer to appear and can be harder to measure.",
    },
  },
  {
    id: "geo-03",
    task: "position",
    topic: "Building on the green belt",
    text: "Should the UK allow more new housing to be built on green belt land (protected countryside around cities)? Write a paragraph that takes a clear position and justifies it with at least one reason and an example.",
  },
  {
    id: "geo-04",
    task: "data",
    topic: "Tree cover and urban heat",
    text: "Write a paragraph that describes the main pattern in Moreau’s (2023) figures and suggests what it might mean for city planning.",
    source: {
      author: "Moreau",
      year: 2023,
      kind: "data",
      text: "A 2023 study of one European city compared average summer afternoon air temperatures across neighbourhoods. Areas with about 40% tree cover averaged 27°C, and those with about 20% averaged 28.5°C. Neighbourhoods with less than 5% tree cover, mostly older high-density housing, averaged 30°C.",
    },
  },
  {
    id: "geo-05",
    task: "cause",
    topic: "Falling insect numbers",
    text: "Write a paragraph explaining the main causes of falling insect numbers. Use Nowak (2022) as evidence, and you may add one possible effect on people or ecosystems.",
    source: {
      author: "Nowak",
      year: 2022,
      kind: "text",
      text: "Many studies across Europe and North America report declines in insect populations over recent decades. The causes appear to be multiple and interconnected. Habitat loss from intensive agriculture and urban expansion is widely considered the most important factor, while pesticide use and climate change are also thought to contribute.",
    },
  },
  {
    id: "geo-06",
    task: "define",
    topic: "Gentrification in cities",
    text: "Write a paragraph that defines ‘gentrification’ in your own words and illustrates it with one example of a neighbourhood or type of change you know about.",
  },
  {
    id: "geo-07",
    task: "apply",
    topic: "Tragedy of the commons",
    text: "Write a paragraph applying the idea of the ‘tragedy of the commons’ in Ferreira (2018) to one real case, such as fishing, groundwater or city traffic. Explain how the concept helps us understand the case.",
    source: {
      author: "Ferreira",
      year: 2018,
      kind: "text",
      text: "The ‘tragedy of the commons’ describes how a shared resource may be overused when each individual gains from using more of it, while the costs are spread across everyone. Without agreed rules or collective management, the resource can become depleted, even though this eventually harms all users.",
    },
  },
  {
    id: "geo-08",
    task: "respond",
    topic: "Personal carbon footprints",
    text: "Write a paragraph that summarises the main point of Takahashi (2024) in your own words and responds to it. Explain whether you agree, partly agree or disagree, and why.",
    source: {
      author: "Takahashi",
      year: 2024,
      kind: "text",
      text: "Public campaigns often encourage individuals to reduce their carbon footprint by recycling, flying less or changing their diet. While personal choices matter, some researchers argue that this focus can distract from larger structural changes, such as energy policy and transport infrastructure, which shape the options available to individuals in the first place.",
    },
  },
  {
    id: "geo-09",
    task: "counter",
    topic: "Small countries and climate",
    text: "‘A small country’s efforts to cut carbon emissions make little difference, because its share of global emissions is so small.’ Write a paragraph that responds to this view: acknowledge what is reasonable about it, then explain why it may be incomplete or mistaken.",
  },
  {
    id: "geo-10",
    task: "data",
    topic: "Global urbanisation",
    text: "Write a paragraph describing the trend in Banerjee’s (2021) figures and suggesting one challenge or opportunity it may create.",
    source: {
      author: "Banerjee",
      year: 2021,
      kind: "data",
      text: "Global estimates suggest that around 30% of the world’s population lived in urban areas in 1950. By 2018 this figure had risen to 55%, and it is projected to reach about 68% by 2050. Most of this future urban growth is expected to take place in Asia and Africa.",
    },
  },
  {
    id: "geo-11",
    task: "problem",
    topic: "Fast fashion and textile waste",
    text: "Write a paragraph that identifies the problem described by Mendoza (2023) and proposes one solution. Briefly evaluate how effective your solution might be.",
    source: {
      author: "Mendoza",
      year: 2023,
      kind: "text",
      text: "The fashion industry produces large volumes of clothing that are often worn only a few times before being discarded. Much of this textile waste ends up in landfill or is exported to lower-income countries, where second-hand markets may be unable to absorb it. Recycling old fibres into new clothing remains technically difficult.",
    },
  },
  {
    id: "geo-12",
    task: "position",
    topic: "Taxing frequent flyers",
    text: "Should governments tax people who fly frequently more heavily than people who fly once a year or less? Write a paragraph that takes a clear position and justifies it, briefly recognising one opposing argument.",
  },
];
