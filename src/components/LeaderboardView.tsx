import React from 'react';
import { Match, Participant } from '../types';
import PublicScores from './PublicScores';

interface LeaderboardViewProps {
  matches: Match[];
  participants?: Participant[];
  currentLanguage?: 'kh' | 'en';
}

export default function LeaderboardView({ matches, participants = [] , currentLanguage = 'kh' }: LeaderboardViewProps) {
  return (
    <div className="animate-fade-in">
      <PublicScores matches={matches} participants={participants} currentLanguage={currentLanguage} />
    </div>
  );
}
