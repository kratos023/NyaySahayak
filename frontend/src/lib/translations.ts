// Language translation system for NyayShakti
export type Language = 'en' | 'hi';

export interface Translations {
  // Navigation & UI
  newConversation: string;
  tools: string;
  history: string;
  settings: string;
  emergency: string;
  logout: string;
  inputLanguage: string;
  outputLanguage: string;
  voiceOutput: string;
  readRepliesAloud: string;
  
  // Tools
  findNearestHelp: string;
  analyzeDocument: string;
  knowYourRights: string;
  rtiApplication: string;
  scanDocument: string;
  legalNews: string;
  guidedLegalHelp: string;
  findLawyer: string;
  legalTemplates: string;
  caseStatusTracker: string;
  fileFirDraft: string;
  
  // Chat Interface
  typeYourMessage: string;
  pressEnterToSend: string;
  askAnything: string;
  legalQuestion: string;
  voiceInput: string;
  
  // Legal Templates
  downloadTemplate: string;
  fillRequiredFields: string;
  hindiMode: string;
  switchToEnglish: string;
  attachEvidence: string;
  addPhotos: string;
  
  // FIR Panel
  firDraft: string;
  officialFormat: string;
  policeStation: string;
  yourDetails: string;
  incidentEvidence: string;
  download: string;
  
  // Common Actions
  continue: string;
  back: string;
  close: string;
  save: string;
  upload: string;
  delete: string;
  edit: string;
  cancel: string;
  confirm: string;
  generate: string;
  
  // Form Fields
  fullName: string;
  age: string;
  gender: string;
  contact: string;
  email: string;
  address: string;
  city: string;
  state: string;
  district: string;
  pincode: string;
  
  // Status Messages
  loading: string;
  success: string;
  error: string;
  tryAgain: string;
  noData: string;
  
  // Legal specific
  section: string;
  act: string;
  court: string;
  lawyer: string;
  case: string;
  petition: string;
  evidence: string;
  witness: string;
  complaint: string;
  
  // App branding
  appName: string;
  tagline: string;
  legalAI: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    // Navigation & UI
    newConversation: "New Conversation",
    tools: "Tools",
    history: "History",
    settings: "Settings", 
    emergency: "Emergency",
    logout: "Logout",
    inputLanguage: "Input Language",
    outputLanguage: "Output Language",
    voiceOutput: "Voice Output",
    readRepliesAloud: "Read AI replies aloud",
    
    // Tools
    findNearestHelp: "Find Nearest Help",
    analyzeDocument: "Analyze Document",
    knowYourRights: "Know Your Rights",
    rtiApplication: "RTI Application",
    scanDocument: "Scan Document",
    legalNews: "Legal News",
    guidedLegalHelp: "Guided Legal Help",
    findLawyer: "Find a Lawyer",
    legalTemplates: "Legal Templates",
    caseStatusTracker: "Case Status Tracker",
    fileFirDraft: "File FIR Draft",
    
    // Chat Interface
    typeYourMessage: "Type your legal question...",
    pressEnterToSend: "Press Enter to send",
    askAnything: "Ask anything about Indian law",
    legalQuestion: "Legal Question",
    voiceInput: "Voice Input",
    
    // Legal Templates
    downloadTemplate: "Download Template",
    fillRequiredFields: "Fill in all required (*) fields to download",
    hindiMode: "Hindi Mode",
    switchToEnglish: "Switch to English",
    attachEvidence: "Attach Evidence / Proof Images",
    addPhotos: "Add photos / screenshots",
    
    // FIR Panel
    firDraft: "FIR Draft",
    officialFormat: "Official Format · Form 24.1",
    policeStation: "Police Station",
    yourDetails: "Your Details",
    incidentEvidence: "Incident + Evidence",
    download: "Download",
    
    // Common Actions
    continue: "Continue",
    back: "Back",
    close: "Close",
    save: "Save",
    upload: "Upload",
    delete: "Delete",
    edit: "Edit", 
    cancel: "Cancel",
    confirm: "Confirm",
    generate: "Generate",
    
    // Form Fields
    fullName: "Full Name",
    age: "Age",
    gender: "Gender",
    contact: "Contact",
    email: "Email",
    address: "Address",
    city: "City",
    state: "State",
    district: "District",
    pincode: "Pincode",
    
    // Status Messages
    loading: "Loading...",
    success: "Success",
    error: "Error",
    tryAgain: "Try Again",
    noData: "No data available",
    
    // Legal specific
    section: "Section",
    act: "Act",
    court: "Court",
    lawyer: "Lawyer",
    case: "Case",
    petition: "Petition",
    evidence: "Evidence",
    witness: "Witness",
    complaint: "Complaint",
    
    // App branding
    appName: "Nyay-Sahayak",
    tagline: "AI-powered legal assistant for India",
    legalAI: "Legal AI"
  },
  
  hi: {
    // Navigation & UI
    newConversation: "नई बातचीत",
    tools: "उपकरण",
    history: "इतिहास",
    settings: "सेटिंग्स",
    emergency: "आपातकाल",
    logout: "लॉग आउट",
    inputLanguage: "इनपुट भाषा",
    outputLanguage: "आउटपुट भाषा", 
    voiceOutput: "ध्वनि आउटपुट",
    readRepliesAloud: "AI उत्तर बोलकर सुनाएं",
    
    // Tools
    findNearestHelp: "निकटतम सहायता खोजें",
    analyzeDocument: "दस्तावेज़ का विश्लेषण",
    knowYourRights: "अपने अधिकार जानें",
    rtiApplication: "आरटीआई आवेदन",
    scanDocument: "दस्तावेज़ स्कैन करें",
    legalNews: "कानूनी समाचार",
    guidedLegalHelp: "मार्गदर्शित कानूनी सहायता",
    findLawyer: "वकील खोजें",
    legalTemplates: "कानूनी टेम्प्लेट",
    caseStatusTracker: "केस स्थिति ट्रैकर",
    fileFirDraft: "FIR ड्राफ्ट दर्ज करें",
    
    // Chat Interface
    typeYourMessage: "अपना कानूनी सवाल लिखें...",
    pressEnterToSend: "भेजने के लिए Enter दबाएं",
    askAnything: "भारतीय कानून के बारे में कुछ भी पूछें",
    legalQuestion: "कानूनी सवाल",
    voiceInput: "आवाज़ इनपुट",
    
    // Legal Templates
    downloadTemplate: "टेम्प्लेट डाउनलोड करें",
    fillRequiredFields: "डाउनलोड के लिए सभी आवश्यक (*) फ़ील्ड भरें",
    hindiMode: "हिंदी मोड",
    switchToEnglish: "अंग्रेजी में स्विच करें",
    attachEvidence: "साक्ष्य / प्रमाण चित्र संलग्न करें",
    addPhotos: "फ़ोटो / स्क्रीनशॉट जोड़ें",
    
    // FIR Panel
    firDraft: "FIR ड्राफ्ट",
    officialFormat: "आधिकारिक प्रारूप · फॉर्म 24.1",
    policeStation: "पुलिस थाना",
    yourDetails: "आपका विवरण",
    incidentEvidence: "घटना + साक्ष्य",
    download: "डाउनलोड",
    
    // Common Actions
    continue: "जारी रखें",
    back: "वापस",
    close: "बंद करें",
    save: "सेव करें",
    upload: "अपलोड करें",
    delete: "मिटाएं",
    edit: "संपादित करें",
    cancel: "रद्द करें",
    confirm: "पुष्टि करें",
    generate: "बनाएं",
    
    // Form Fields
    fullName: "पूरा नाम",
    age: "आयु",
    gender: "लिंग",
    contact: "संपर्क",
    email: "ईमेल",
    address: "पता",
    city: "शहर",
    state: "राज्य",
    district: "जिला",
    pincode: "पिनकोड",
    
    // Status Messages
    loading: "लोड हो रहा है...",
    success: "सफल",
    error: "त्रुटि",
    tryAgain: "फिर से कोशिश करें",
    noData: "कोई डेटा उपलब्ध नहीं",
    
    // Legal specific
    section: "धारा",
    act: "अधिनियम",
    court: "न्यायालय",
    lawyer: "वकील",
    case: "मामला",
    petition: "याचिका",
    evidence: "साक्ष्य",
    witness: "गवाह",
    complaint: "शिकायत",
    
    // App branding
    appName: "न्याय-सहायक",
    tagline: "भारत के लिए AI-संचालित कानूनी सहायक",
    legalAI: "कानूनी AI"
  }
};

export function useTranslation(language: Language) {
  return translations[language];
}
