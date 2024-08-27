interface QuestionData {
    question: string;
    answers: string[];
}

interface PromptData {
    question: string;
}

interface VoteData {
    options: string[];
}
export type { QuestionData, PromptData, VoteData };