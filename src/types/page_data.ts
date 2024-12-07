import type { settings } from "../types/settings";

interface QuestionData {
    question: string;
    answers: string[];
}

interface PromptData {
    question: string;
}

interface DilemmaData {
    points: number;
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
    photos: any
}

interface DrinkingPrompt {
    prompt: string,
}

interface RouletteData {
    drinking: boolean,
    players: string[],
    player_colors: string[],
    options: any,
}

interface SpyVoteData {
    option_by: string[];
    options: string[];
}

interface BombData {
    has_bomb: boolean;
}

interface CharadesData {
    prompt: string;
}

interface CharadesResultsData {
    guess: string;
    comment: string;
    score: number;
}



export type { matchData, CharadesResultsData, CharadesData, DilemmaData, BombData, RouletteData, SpyVoteData, DrinkingPrompt, photoVoteData, matchPerson, ProductPromptData, BusData, QuestionData, BallData, PromptData, VoteData, InstructionData, adminStartData, photoPickerData, ListPromptData };