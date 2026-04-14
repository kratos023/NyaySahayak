"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import Sidebar from "@/components/Sidebar";
import ChatWindow from "@/components/ChatWindow";
import LocationFinder from "@/components/LocationFinder";
import DocumentPanel from "@/components/DocumentPanel";
import RightsCards from "@/components/RightsCards";
import RTIPanel from "@/components/RTIPanel";
import OCRPanel from "@/components/OCRPanel";
import LegalNews from "@/components/LegalNews";
import GuidedFlow from "@/components/GuidedFlow";
import LawyerFinder from "@/components/LawyerFinder";
import LegalTemplates from "@/components/LegalTemplates";
import CaseTracker from "@/components/CaseTracker";
import FIRPanel from "@/components/FIRPanel";
import { clearContext } from "@/lib/api";
import type { Message } from "@/lib/api";
import GlassMorphCard from "@/components/GlassMorphCard";

export type Panel = "chat" | "location" | "docs" | "rights" | "rti" | "ocr" | "news" | "flow" | "lawyers" | "templates" | "cases" | "fir";

export default function Home() {
  const { user, loading, logout } = useAuth();
  const { t, isHindi } = useLanguage();
  const router = useRouter();

  const [messages, setMessages]             = useState<Message[]>([]);
  const [inputLang, setInputLang]           = useState("English");
  const [outputLang, setOutputLang]         = useState("English");
  const [enableTTS, setEnableTTS]           = useState(false);
  const [panel, setPanel]                   = useState<Panel>("chat");
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen]       = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading]);

  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center relative">
      <GlassMorphCard className="p-8 rounded-xl animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 animate-spin" />
          <div className="text-white/80 font-medium">{t.loading}</div>
        </div>
      </GlassMorphCard>
    </div>
  );

  async function handleNewChat() {
    await clearContext(user!.user_id);
    setMessages([]);
    setPanel("chat");
  }

  function sendToChat(text: string) {
    setPendingMessage(text);
    setPanel("chat");
  }

  const commonProps = { onClose: () => setPanel("chat") };

  return (
    <div className="flex h-screen overflow-hidden relative">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 md:hidden animate-in fade-in duration-300" 
          onClick={() => setSidebarOpen(false)} />
      )}
      <div className={`fixed md:relative inset-y-0 left-0 z-30 transition-transform duration-500 ease-out md:translate-x-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
      <Sidebar
        userId={user.user_id}
        userName={user.name}
        userRole={user.role}
        inputLang={inputLang}
        outputLang={outputLang}
        enableTTS={enableTTS}
        onInputLangChange={setInputLang}
        onOutputLangChange={setOutputLang}
        onTTSChange={setEnableTTS}
        onLoadSession={msgs => { setMessages(msgs); setPanel("chat"); }}
        onNewChat={handleNewChat}
        onOpenLocation={() => setPanel("location")}
        onOpenDocs={()      => setPanel("docs")}
        onOpenRights={()    => setPanel("rights")}
        onOpenRTI={()       => setPanel("rti")}
        onOpenOCR={()       => setPanel("ocr")}
        onOpenNews={()      => setPanel("news")}
        onOpenFlow={()      => setPanel("flow")}
        onOpenLawyers={()   => setPanel("lawyers")}
        onOpenTemplates={() => setPanel("templates")}
        onOpenCases={()    => setPanel("cases")}
        onOpenFIR2={()    => setPanel("fir")}
        onLogout={logout}
        activePanel={panel}
      />
      </div>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Mobile menu button */}
        <GlassMorphCard 
          hover
          onClick={() => setSidebarOpen(true)}
          className="md:hidden absolute top-4 left-4 z-10 p-3 rounded-xl cursor-pointer">
          <span className="text-lg text-white/80">☰</span>
        </GlassMorphCard>
        {panel === "chat" && (
          <ChatWindow
            userId={user.user_id}
            messages={messages}
            inputLang={inputLang}
            outputLang={outputLang}
            enableTTS={enableTTS}
            pendingMessage={pendingMessage}
            onPendingMessageConsumed={() => setPendingMessage(null)}
            onMessagesChange={setMessages}
            onOpenLocation={() => setPanel("location")}
            onOpenFIR={() => setPanel("fir")}
            onOpenReport={() => setPanel("docs")}
            onOpenDocs={() => setPanel("docs")}
          />
        )}
        {panel === "location" && <LocationFinder {...commonProps} />}
        {panel === "docs" && (
          <DocumentPanel {...commonProps}
            onOpenLocation={() => setPanel("location")}
            onOpenFIR={() => setPanel("fir")}
            onOpenReport={() => setPanel("docs")}
            userId={user.user_id}
            onSendToChat={sendToChat}
          />
        )}
        {panel === "rights" && (
          <RightsCards {...commonProps} language={outputLang} onSendToChat={sendToChat} />
        )}
        {panel === "rti"  && <RTIPanel {...commonProps} />}
        {panel === "ocr"  && (
          <OCRPanel {...commonProps} language={outputLang} userId={user.user_id} onSendToChat={sendToChat} />
        )}
        {panel === "news" && (
          <LegalNews {...commonProps} language={outputLang} onSendToChat={sendToChat} />
        )}
        {panel === "flow" && (
          <GuidedFlow {...commonProps} language={outputLang} userId={user.user_id} onSendToChat={sendToChat} />
        )}
        {panel === "lawyers" && (
          <LawyerFinder {...commonProps} language={outputLang} />
        )}
        {panel === "templates" && <LegalTemplates {...commonProps} />}
        {panel === "cases"    && <CaseTracker    {...commonProps} />}
        {panel === "fir"      && <FIRPanel       {...commonProps} />}
      </main>
    </div>
  );
}
