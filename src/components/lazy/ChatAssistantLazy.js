'use client';

import dynamic from 'next/dynamic';

const ChatAssistantWidget = dynamic(() => import('@/components/ChatAssistantWidget'), {
  ssr: false,
});

export default function ChatAssistantLazy({ onSignIn }) {
  return <ChatAssistantWidget onSignIn={onSignIn} />;
}
