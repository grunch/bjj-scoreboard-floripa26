import { useSeoMeta } from '@unhead/react';
import HomeScreen from './HomeScreen';

const Index = () => {
  useSeoMeta({
    title: 'BJJ Live Scoreboard',
    description: 'A modern decentralized BJJ match scoreboard powered by Nostr. Watch live match scores in real time.',
  });

  return <HomeScreen />;
};

export default Index;
