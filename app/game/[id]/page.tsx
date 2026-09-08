'use client';

import { useParams } from 'next/navigation';
import { GameDetailView } from '@/components/GameDetailView';

export default function GamePage() {
  const params = useParams<{ id: string }>();
  return <GameDetailView key={String(params.id)} appId={String(params.id)} />;
}
