import React from 'react';
import { Match, Participant } from '../types';
import PublicScores from './PublicScores';

interface LeaderboardViewProps {
  matches: Match[];
  participants?: Participant[];
}

export default function LeaderboardView({ matches, participants = [] }: LeaderboardViewProps) {
  return (
    <div className="animate-fade-in">
      <PublicScores matches={matches} participants={participants} />
    </div>
  );
}
