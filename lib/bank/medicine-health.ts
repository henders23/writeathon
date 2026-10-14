import type { DailyPrompt } from "./types";

export const MEDICINE_HEALTH: DailyPrompt[] = [
  {
    id: "med-01",
    task: "respond",
    topic: "Shared decision-making in consultations",
    text: "Write a paragraph that summarises the main point of Okafor (2021) in your own words, then agrees with, qualifies or challenges it. Give at least one reason for your view.",
    source: {
      author: "Okafor",
      year: 2021,
      kind: "text",
      text: "Shared decision-making is increasingly presented as the ideal model for clinical consultations, in which clinicians and patients weigh the options together. However, its success appears to depend on health literacy, the time available and the patient’s wish to take part, and some patients may prefer the clinician to lead.",
    },
  },
  {
    id: "med-02",
    task: "compare",
    topic: "Remote versus face-to-face consultations",
    text: "Write a paragraph comparing remote and face-to-face consultations in primary care. Use Lindqvist (2022) as evidence for at least one similarity or difference.",
    source: {
      author: "Lindqvist",
      year: 2022,
      kind: "text",
      text: "In primary care, consultations by telephone or video expanded rapidly after 2020. They can improve access and save travel time, particularly for routine follow-up. Face-to-face appointments, however, allow physical examination and may make it easier to notice non-verbal cues, which matters most when symptoms are unclear.",
    },
  },
  {
    id: "med-03",
    task: "position",
    topic: "Fees for missed appointments",
    text: "Some people argue that patients who miss GP or hospital appointments without warning should pay a small fee. Write a paragraph stating whether you agree and justifying your position with two reasons.",
  },
  {
    id: "med-04",
    task: "data",
    topic: "Health app use by age",
    text: "Write a paragraph describing the main pattern in the figures from Haddad (2023) and suggesting what it might mean for fair access to healthcare.",
    source: {
      author: "Haddad",
      year: 2023,
      kind: "data",
      text: "A 2023 survey of 1,200 adults in England asked whether they had used a health app to book appointments or order repeat prescriptions in the past year. Use was reported by 71% of those aged 18–34 and 64% of those aged 35–54, but by only 29% of those aged 75 and over.",
    },
  },
  {
    id: "med-05",
    task: "cause",
    topic: "Loneliness and health in ageing",
    text: "Write a paragraph explaining how loneliness might affect the health of older people. Use Hosseini (2020) to support your explanation.",
    source: {
      author: "Hosseini",
      year: 2020,
      kind: "text",
      text: "Social isolation and loneliness are increasingly recognised as risks to health in later life. They are associated with higher rates of cardiovascular disease, depression and cognitive decline, possibly through long-term stress responses and reduced physical activity, although the direction of cause and effect is not always clear.",
    },
  },
  {
    id: "med-06",
    task: "define",
    topic: "Health inequalities",
    text: "Write a paragraph defining the term ‘health inequalities’ and illustrating it with one example from a country you know.",
  },
  {
    id: "med-07",
    task: "apply",
    topic: "Patient safety and system error",
    text: "Write a paragraph applying the model described by Moreau (2018) to this case: a patient on a busy hospital ward is given the wrong medicine at night. Suggest which layers of protection might have failed.",
    source: {
      author: "Moreau",
      year: 2018,
      kind: "text",
      text: "The ‘Swiss cheese’ model suggests that patient harm rarely results from a single person’s mistake. Instead, each layer of protection in a system, such as checklists, staffing levels and technology, has weaknesses, and harm occurs when these weaknesses line up and allow an error to pass through.",
    },
  },
  {
    id: "med-08",
    task: "respond",
    topic: "Water fluoridation and dental health",
    text: "Write a paragraph that summarises Kowalski (2024) in your own words and responds to it. Do the public health benefits outweigh the concern about individual choice? Give a reason.",
    source: {
      author: "Kowalski",
      year: 2024,
      kind: "text",
      text: "Community water fluoridation is widely regarded as an effective way to reduce tooth decay, particularly among children in disadvantaged areas. Critics argue, however, that adding fluoride to public water supplies removes individual choice, and that fluoride toothpaste may now provide much of the same benefit.",
    },
  },
  {
    id: "med-09",
    task: "counter",
    topic: "Nursing as a graduate profession",
    text: "A common view is that nurses do not need a university degree, because caring for patients is best learned on the job. Write a paragraph answering this view, with at least one reason and an example.",
  },
  {
    id: "med-10",
    task: "data",
    topic: "Community pharmacy consultations",
    text: "Write a paragraph describing the changes shown in Osei (2024) and suggesting one possible explanation for them.",
    source: {
      author: "Osei",
      year: 2024,
      kind: "data",
      text: "Across a sample of 150 community pharmacies, minor-illness consultations rose from about 40,000 a year in 2019 to 95,000 in 2024. Over the same period, the proportion of these patients who were then referred on to a GP fell slightly, from 18% to 15%.",
    },
  },
  {
    id: "med-11",
    task: "problem",
    topic: "Falling childhood vaccination rates",
    text: "Write a paragraph identifying one reason why childhood vaccination rates are falling and proposing a solution. Use Fernández (2022) to support your proposal and say how well it might work.",
    source: {
      author: "Fernández",
      year: 2022,
      kind: "text",
      text: "Falls in childhood vaccination rates in several high-income countries have been linked partly to declining confidence in vaccines. Research suggests, though, that practical barriers such as inconvenient appointment times may be as important as misinformation, and that conversations with trusted health professionals can influence parents’ decisions.",
    },
  },
  {
    id: "med-12",
    task: "position",
    topic: "Disclosing AI in patient care",
    text: "Should patients always be told when artificial intelligence has helped to make decisions about their diagnosis or care? Write a paragraph taking a clear position and justifying it.",
  },
];
