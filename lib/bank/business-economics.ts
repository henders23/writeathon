import type { DailyPrompt } from "./types";

export const BUSINESS_ECONOMICS: DailyPrompt[] = [
  {
    id: "bus-01",
    task: "respond",
    topic: "Shareholders or stakeholders?",
    text: "Write a paragraph that summarises the main point of Achterberg (2019) in your own words and then responds to it, giving a reason for your view.",
    source: {
      author: "Achterberg",
      year: 2019,
      kind: "text",
      text: "The view that a company’s only responsibility is to maximise returns for its shareholders has been increasingly questioned. Critics argue that firms which neglect employees, suppliers or the environment may face reputational and regulatory risks that eventually reduce their long-term value, even if short-term profits rise.",
    },
  },
  {
    id: "bus-02",
    task: "compare",
    topic: "Debt versus equity finance",
    text: "Write a paragraph comparing debt and equity as ways for a small technology start-up to raise money. Use the source as evidence.",
    source: {
      author: "Osei",
      year: 2021,
      kind: "text",
      text: "Debt finance allows owners to keep full control of a business, but interest must be paid whatever its performance, which increases risk when revenue is uncertain. Equity finance carries no obligation to repay, yet it dilutes ownership and may give investors considerable influence over strategic decisions.",
    },
  },
  {
    id: "bus-03",
    task: "position",
    topic: "Dynamic pricing for tickets",
    text: "Is it fair for companies to raise ticket prices for concerts or sports events when demand is high? Write a paragraph that takes a clear position and justifies it.",
  },
  {
    id: "bus-04",
    task: "data",
    topic: "The rise of online retail",
    text: "Write a paragraph that describes the changes shown in the figures and suggests what they mean for traditional high-street shops. Refer to Fernández (2025).",
    source: {
      author: "Fernández",
      year: 2025,
      kind: "data",
      text: "In one European economy, online sales made up 7% of all retail sales in 2012 and 19% in 2019. During the 2020–21 lockdowns, the share peaked at 36%, before falling back and stabilising at around 26% by 2024.",
    },
  },
  {
    id: "bus-05",
    task: "cause",
    topic: "Effects of interest rate rises",
    text: "Write a paragraph explaining the effects of a rise in interest rates on households and businesses. Use Iyer (2023) as evidence.",
    source: {
      author: "Iyer",
      year: 2023,
      kind: "text",
      text: "When a central bank raises interest rates, borrowing becomes more expensive for households and firms, which tends to reduce consumer spending and business investment. Lower demand is then expected to ease inflation, although economists generally agree that the full effects of a rate change take a year or more to appear.",
    },
  },
  {
    id: "bus-06",
    task: "define",
    topic: "Economies of scale",
    text: "Write a paragraph that defines economies of scale and illustrates the concept with an example of a real or imagined business.",
  },
  {
    id: "bus-07",
    task: "apply",
    topic: "Loss aversion and subscriptions",
    text: "Write a paragraph applying the idea in the source to explain why streaming and software companies offer free trials that automatically become paid subscriptions. Refer to Petrov (2018).",
    source: {
      author: "Petrov",
      year: 2018,
      kind: "text",
      text: "Behavioural economists have observed that people tend to feel losses more strongly than equivalent gains, a tendency known as loss aversion. One consequence is that consumers are often reluctant to give up something they already have, even when they would not have chosen to pay for it in the first place.",
    },
  },
  {
    id: "bus-08",
    task: "respond",
    topic: "Judgement in financial reporting",
    text: "Write a paragraph that summarises the main point of the source in your own words and then responds to it: do you agree, partly agree or disagree? Give a reason.",
    source: {
      author: "Mwangi",
      year: 2016,
      kind: "text",
      text: "Financial statements are sometimes viewed as objective records of company performance. In practice, preparing them involves considerable judgement, for example in estimating how long assets will remain useful or what unsold inventory is worth. This is one reason why independent audit is widely regarded as essential to investor confidence.",
    },
  },
  {
    id: "bus-09",
    task: "counter",
    topic: "Minimum wage and jobs",
    text: "Some people argue that raising the minimum wage always leads to higher unemployment. Write a paragraph that responds to this argument and explains why the reality may be more complicated.",
  },
  {
    id: "bus-10",
    task: "data",
    topic: "Generative AI in small firms",
    text: "Write a paragraph that describes the figures in the source and interprets what they suggest about the business value of generative AI. Refer to Larsen (2024).",
    source: {
      author: "Larsen",
      year: 2024,
      kind: "data",
      text: "A 2024 survey of 500 UK small and medium-sized firms found that 41% had used generative AI tools in the previous year, up from 16% in a similar survey in 2022. Among users, 63% reported time savings, but only 22% reported a measurable increase in revenue.",
    },
  },
  {
    id: "bus-11",
    task: "problem",
    topic: "Staff turnover in hospitality",
    text: "A hotel chain is losing many staff each year. Write a paragraph that explains why this is a problem and proposes one solution, using Yilmaz (2022) as evidence.",
    source: {
      author: "Yilmaz",
      year: 2022,
      kind: "text",
      text: "High staff turnover imposes considerable costs on firms, including recruitment, training and lost productivity while new employees gain experience. Management research suggests that turnover is often linked less to pay alone than to limited opportunities for progression and poor relationships with line managers.",
    },
  },
  {
    id: "bus-12",
    task: "position",
    topic: "Breaking up big tech",
    text: "Should governments break up very large technology companies to increase competition? Write a paragraph that takes a clear position and supports it with economic reasons.",
  },
];
