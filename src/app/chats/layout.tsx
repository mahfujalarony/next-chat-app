import ChatList from '../../components/ChatListNew'; 


export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <aside className="hidden md:block md:w-1/3 lg:w-1/4 border-r">
        <ChatList />
      </aside>
      <main className="flex-1">{children}</main>
    </div>
  );
}
