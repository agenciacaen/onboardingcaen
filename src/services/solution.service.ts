import { supabase } from './supabase';
import { createSolutionEngine } from './solution.engine';

/** Engine de Soluções vinculado ao client da aplicação. */
export const SolutionService = createSolutionEngine(supabase);