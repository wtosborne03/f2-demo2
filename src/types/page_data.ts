import type { settings } from "../types/settings";

interface QuestionData {
    question: string;
    answers: string[];
}

interface PromptData {
    question: string;
}

interface InstructionData {
    instruction: string;
}

interface VoteData {
    options: string[];
}

interface adminStartData {
    settings: settings;
}

export type { QuestionData, PromptData, VoteData, InstructionData, adminStartData };