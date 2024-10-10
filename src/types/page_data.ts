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
interface photoPickerData {
    photo_amount: number;
    photo_index: number;
}

interface ListPromptData {
    list_prompt: string,
}
interface BallData {
    color: string,
}
interface BusData {
    drinking: boolean,
}
interface ProductPromptData {
    category: string,
}

interface matchPerson {
    name: string,
    age: number,
    job: string,
    description: string,
    sketch: string,
}

interface matchData {
    matches: { [player: string]: { match: matchPerson, likes: number } },
}

interface photoVoteData {
    photos: { [player: string]: string }
}

interface DrinkingPrompt {
    prompt: string,
}


export type { matchData, DrinkingPrompt, photoVoteData, matchPerson, ProductPromptData, BusData, QuestionData, BallData, PromptData, VoteData, InstructionData, adminStartData, photoPickerData, ListPromptData };