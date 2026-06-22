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
      q: "Does it power on and work?",
      key: "working",
      options: ["Yes — fully working", "Mostly — minor issues", "No — parts / dead"],
      onSelect: (val: string) => {
        const working = val.startsWith("Yes");
        updateForm("isWorking", working);
        if (val.startsWith("No")) updateForm("condition", 0);
        else if (val.startsWith("Mostly")) updateForm("condition", 2);
        else updateForm("condition", 4);
      },
    },
    {
      q: "How's the physical condition?",
      key: "cond",
      options: [
        "Powers on perfectly",
        "Powers on but issues",
        "Dead battery / no power",
        "Cracked / water damaged",
        "Parts only",
      ],
      onSelect: (val: string) => {
        const map: Record<string, number> = {
          "Powers on perfectly": 5,
          "Powers on but issues": 3,
          "Dead battery / no power": 1,
          "Cracked / water damaged": 0,
          "Parts only": 0,
        };
        updateForm("condition", map[val] ?? 2);
        if (["Dead battery / no power", "Cracked / water damaged", "Parts only"].includes(val)) {
          updateForm("isWorking", false);
        }
      },
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