import type { BubbleQuestion, PawnForm } from "./types";

export function createBubbleQuestions(
  updateForm: <K extends keyof PawnForm>(key: K, val: PawnForm[K]) => void
): BubbleQuestion[] {
  return [
    {
      q: "What are you selling?",
      key: "cat",
      options: [
        "Smartphones",
        "Laptops",
        "Tablets & E-Readers",
        "Headphones & Audio",
        "Wearables",
        "Handheld Gaming",
        "Cameras & Photo",
        "Other",
      ],
      onSelect: (val: string) => updateForm("category", val === "Other" ? "Other" : val),
    },
    {
      q: "Roughly how heavy is it?",
      key: "wt",
      options: ["<1 lb", "1-3 lbs", "3-6 lbs", "6-10 lbs", "10-14.9 lbs"],
      onSelect: (val: string) => {
        const wMap: Record<string, string> = {
          "<1 lb": "0.9",
          "1-3 lbs": "2.2",
          "3-6 lbs": "4.5",
          "6-10 lbs": "7.8",
          "10-14.9 lbs": "12.4",
        };
        updateForm("weightLbs", wMap[val] || "3.0");
      },
    },
  ];
}