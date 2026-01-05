// Main API exports - now organized and clean!
export { authAPI } from './auth';
export { categoriesAPI } from './categories';
export { gamesAPI } from './games';
export { questionsAPI } from './questions';
export { userCategoriesAPI } from './user-categories';
export { api as default, API_BASE_URL } from './base';

// Backward compatibility: Re-export legacy gameAPI that combines all modules
// This allows existing code to continue working while we migrate to the new structure
import { categoriesAPI } from './categories';
import { gamesAPI } from './games';
import { questionsAPI } from './questions';
import { userCategoriesAPI } from './user-categories';

export const gameAPI = {
  // Categories
  ...categoriesAPI,
  
  // Games
  ...gamesAPI,
  
  // Questions
  ...questionsAPI,
  
  // User Categories
  ...userCategoriesAPI,
};