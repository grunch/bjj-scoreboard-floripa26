import { useSeoMeta } from '@unhead/react';

// FIXME: Update this page (the content is just a fallback if you fail to update the page)

import HomeScreen from './HomeScreen';

const Index = () => {
  useSeoMeta({
    title: 'Welcome to Your Blank App',
    description: 'A modern Nostr client application built with React, TailwindCSS, and Nostrify.',
  });

  return <HomeScreen />;
};

export default Index;
