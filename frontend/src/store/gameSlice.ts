import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Team, Question, Game } from '@/types/game';

interface GameState {
  currentTeam: number;
  gameId: string | null;
  totalTeams: number;
  isGameActive: boolean;
  isLoaded: boolean;
  game: Game | null;
  teams: Team[];
  doublePerkActiveTeamId: number | null;
  doublePerkUsed: Record<number, boolean>;
  rerollPerkUsed: Record<number, boolean>;
  choicesPerkUsed: Record<number, boolean>;
  perksLocked: boolean;
  rerollBuffer: Record<number, number | null>; // teamId -> queued question id
  backupQuestions: Question[];
  questions: Question[];
  playedQuestions: number[];
  loading: boolean;
  error: string | null;
}

const initialState: GameState = {
  currentTeam: 1,
  gameId: null,
  totalTeams: 2,
  isGameActive: false,
  isLoaded: false,
  game: null,
  teams: [],
  doublePerkActiveTeamId: null,
  doublePerkUsed: {},
  rerollPerkUsed: {},
  choicesPerkUsed: {},
  perksLocked: false,
  rerollBuffer: {},
  backupQuestions: [],
  questions: [],
  playedQuestions: [],
  loading: false,
  error: null,
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
     setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  
    switchToNextTeam: (state) => {
      if (state.isGameActive && state.totalTeams > 0) {
        state.currentTeam = (state.currentTeam % state.totalTeams) + 1;
      }
    },
   
    setTeams: (state, action: PayloadAction<Team[]>) => {
      state.teams = action.payload.map((team) => ({ ...team, score: team.score ?? 0 }));
      state.totalTeams = action.payload.length || state.totalTeams;
      for (const team of action.payload) {
        if (state.doublePerkUsed[team.id] === undefined) {
          state.doublePerkUsed[team.id] = false;
        }
        if (state.rerollPerkUsed[team.id] === undefined) {
          state.rerollPerkUsed[team.id] = false;
        }
        if (state.choicesPerkUsed[team.id] === undefined) {
          state.choicesPerkUsed[team.id] = false;
        }
        if (state.rerollBuffer[team.id] === undefined) {
          state.rerollBuffer[team.id] = null;
        }
      }
    },
    awardPoints: (state, action: PayloadAction<{ teamId: number; delta: number }>) => {
      const { teamId, delta } = action.payload;
      const team = state.teams.find((t) => t.id === teamId);
      if (team) {
        const nextScore = (team.score ?? 0) + delta;
        team.score = Math.max(0, nextScore);
      }
    },
  
  
    endGame: (state) => {
      state.isGameActive = false;
      state.gameId = null;
      state.currentTeam = 1;
      state.totalTeams = 2;
      state.doublePerkActiveTeamId = null;
      // Clear backup questions when game ends
      state.backupQuestions = [];
      state.playedQuestions = [];
    },
    activateDoublePerk: (state, action: PayloadAction<{ teamId: number }>) => {
      const { teamId } = action.payload;
      const currentIndex = Math.max(0, state.currentTeam - 1);
      const currentTurnTeamId = state.teams[currentIndex]?.id;
      const isTeamsTurn = currentTurnTeamId === teamId;
      if (isTeamsTurn && !state.doublePerkUsed[teamId] && state.doublePerkActiveTeamId === null) {
        state.doublePerkActiveTeamId = teamId;
        state.doublePerkUsed[teamId] = true;
      }
    },
    clearActivePerk: (state) => {
      state.doublePerkActiveTeamId = null;
    },
  
    activateRerollPerk: (state, action: PayloadAction<{ teamId: number }>) => {
      const { teamId } = action.payload;
      const currentIndex = Math.max(0, state.currentTeam - 1);
      const currentTurnTeamId = state.teams[currentIndex]?.id;
      const isTeamsTurn = currentTurnTeamId === teamId;
      if (!state.perksLocked && isTeamsTurn && !state.rerollPerkUsed[teamId]) {
        state.rerollPerkUsed[teamId] = true;
      }
    },
    activateChoicesPerk: (state, action: PayloadAction<{ teamId: number }>) => {
      const { teamId } = action.payload;
      const currentIndex = Math.max(0, state.currentTeam - 1);
      const currentTurnTeamId = state.teams[currentIndex]?.id;
      const isTeamsTurn = currentTurnTeamId === teamId;
      if (!state.perksLocked && isTeamsTurn && !state.choicesPerkUsed[teamId]) {
        state.choicesPerkUsed[teamId] = true;
      }
    },
    lockPerks: (state) => {
      state.perksLocked = true;
    },
    unlockPerks: (state) => {
      state.perksLocked = false;
    },
    setGameQuestions: (state, action: PayloadAction<Question[]>) => {
      state.questions = action.payload;
      state.playedQuestions = [];
      // Clear backup questions when setting new game questions
      state.backupQuestions = [];
      // clear buffers when new question set received
      for (const teamId of Object.keys(state.rerollBuffer)) {
        state.rerollBuffer[Number(teamId)] = null;
      }
    },
    hydrateFullGameState: (
      state,
      action: PayloadAction<{ game: Game; available_questions: Question[]; outside_board_questions: Question[] }>
    ) => {
      const { game, available_questions, outside_board_questions } = action.payload;

      state.game = game;
      state.gameId = game.id ? String(game.id) : state.gameId;
      state.totalTeams = game.teams?.length ?? state.totalTeams;
      state.isGameActive = true;
      state.isLoaded = true;

      // Normalize teams and ensure scores exist
      const teams = game.teams || [];
      state.teams = teams.map((team) => ({ ...team, score: team.score ?? 0 }));

      // Reset perk state for new game context
      state.doublePerkActiveTeamId = null;
      state.doublePerkUsed = {};
      state.rerollPerkUsed = {};
      state.choicesPerkUsed = {};
      state.perksLocked = false;
      state.rerollBuffer = {};

      state.questions = available_questions || [];
      state.backupQuestions = outside_board_questions || [];
      state.playedQuestions = [];
    },
    swapQuestion: (state, action: PayloadAction<{ oldQuestionId: number }>) => {
      if (!state.backupQuestions.length) return;
      const nextQuestion = state.backupQuestions[0];
      const index = state.questions.findIndex((q) => q.id === action.payload.oldQuestionId);
      if (index === -1) return;

      // Replace the old question with the next backup
      state.questions[index] = nextQuestion;
      // Remove the used backup question from the queue
      state.backupQuestions = state.backupQuestions.slice(1);
    },
    // New: backup questions buffer explicitly for reroll perk
    setBackupQuestions: (state, action: PayloadAction<Question[]>) => {
      state.backupQuestions = action.payload;
    },
    pushBackupQuestions: (state, action: PayloadAction<Question[]>) => {
      state.backupQuestions = [...state.backupQuestions, ...action.payload];
    },
    consumeBackupQuestion: (state) => {
      if (state.backupQuestions.length > 0) {
        state.backupQuestions.shift();
      }
    },
    setRerollBuffer: (state, action: PayloadAction<{ entries: Array<{ teamId: number; questionId: number | null }> }>) => {
      for (const { teamId, questionId } of action.payload.entries) {
        state.rerollBuffer[teamId] = questionId;
      }
    },
    consumeRerollBuffer: (state, action: PayloadAction<{ teamId: number }>) => {
      const { teamId } = action.payload;
      state.rerollBuffer[teamId] = null;
    },
    markQuestionPlayed: (state, action: PayloadAction<number>) => {
      const questionId = action.payload;
      if (!state.playedQuestions.includes(questionId)) {
        state.playedQuestions.push(questionId);
      }
    },
    resetGame: (state) => {
      state.currentTeam = 1;
      state.gameId = null;
      state.totalTeams = 2;
      state.isGameActive = false;
      state.teams = [];
      state.doublePerkActiveTeamId = null;
      state.doublePerkUsed = {};
      state.rerollPerkUsed = {};
      state.choicesPerkUsed = {};
      state.perksLocked = false;
      state.questions = [];
      state.playedQuestions = [];
      state.rerollBuffer = {};
      state.backupQuestions = [];
      state.game = null;
      state.isLoaded = false;
    },
  },
});

export const {
 
  switchToNextTeam,
 
  setTeams,
  awardPoints,
 
  endGame,
  activateDoublePerk,
  clearActivePerk,
 
  activateRerollPerk,
  activateChoicesPerk,
  lockPerks,
  unlockPerks,
  setRerollBuffer,
  consumeRerollBuffer,
  setGameQuestions,
  hydrateFullGameState,
  swapQuestion,
  setBackupQuestions,
  pushBackupQuestions,
  consumeBackupQuestion,
  markQuestionPlayed,
  resetGame,
} = gameSlice.actions;

export default gameSlice.reducer;
