'use client';

import ChatList from '../../components/ChatList';
import { usePathname } from 'next/navigation';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showNoChat = pathname === '/chats';

  return (
    <div className="flex h-screen">
      {/* Sidebar - always visible on desktop, hidden on mobile when chat is open */}
      <aside className={`${!showNoChat ? 'hidden' : 'block'} md:block w-full md:w-1/3 lg:w-1/4 border-r`}>
        <ChatList />
      </aside>

      {/* Main content area */}
      <main className={`flex-1 relative ${showNoChat ? 'hidden md:block' : 'block'}`}>
        {children}
        
        {showNoChat && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center p-6 max-w-md">
              <div className="mx-auto flex justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No chat selected</h3>
              <p className="text-gray-500 dark:text-gray-400">
                {typeof window !== 'undefined' && window.innerWidth < 768 
                  ? "Select a chat to start messaging" 
                  : "Select a chat from the sidebar to start messaging"}
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}