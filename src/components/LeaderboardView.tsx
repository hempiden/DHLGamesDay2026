import React from 'react';
import { Match, Participant } from '../types';
import PublicScores from './PublicScores';

interface LeaderboardViewProps {
  matches: Match[];
  participants?: Participant[];
  currentLanguage?: 'kh' | 'en';
  translations?: Record<string, { kh: string; en: string }>;
}

export default function LeaderboardView({ matches, participants = [] , currentLanguage = 'kh', translations }: LeaderboardViewProps) {
  return (
    <div className="animate-fade-in">
      <PublicScores matches={matches} participants={participants} currentLanguage={currentLanguage} translations={translations} />
    </div>
  );
}
