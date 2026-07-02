import React, { useState, useEffect, useRef } from 'react';
import { 
  FolderPlus, 
  Trash2, 
  ChevronRight, 
  ArrowLeft, 
  Settings, 
  Pencil, 
  X, 
  Volume2, 
  Check, 
  AlertTriangle, 
  PlusCircle, 
  Download, 
  Upload,
  RefreshCw,
  Search
} from 'lucide-react';
import Papa from 'papaparse';
import type { 
  VocabDeck, 
  VocabItem, 
  QuizMode, 
  RangeMode, 
  QuizAnswer, 
  Option, 
  AppScreen,
  OptionStatus,
  ByNumberSubMode
} from './types';
import { 
  loadDecksFromDB, 
  saveDeckToDB, 
  deleteDeckFromDB 
} from './db';
import { 
  playCorrectSound, 
  playIncorrectSound, 
  speakEnglish 
} from './audio';

export default function App() {
  // Screen and Decks Navigation
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('deckList');
  const [decks, setDecks] = useState<VocabDeck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  
  // Configurations State
  const [quizMode, setQuizMode] = useState<QuizMode>('multipleChoice');
  const [rangeMode, setRangeMode] = useState<RangeMode>('byNumber');
  const [byNumberSubMode, setByNumberSubMode] = useState<ByNumberSubMode>('range');
  const [rangeStart, setRangeStart] = useState<number | ''>(1);
  const [rangeEnd, setRangeEnd] = useState<number | ''>(20);
  const [randomQuestionCount, setRandomQuestionCount] = useState<number | ''>(20);
  const [isShuffle, setIsShuffle] = useState<boolean>(true);
  const [isTimerEnabled, setIsTimerEnabled] = useState<boolean>(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);
  
  // Word Management State
  const [searchText, setSearchText] = useState<string>('');
  const [visibleWordCount, setVisibleWordCount] = useState<number>(50);
  const [newWord, setNewWord] = useState<string>('');
  const [newMeaning, setNewMeaning] = useState<string>('');
  const [isShowingWeakWordsSheet, setIsShowingWeakWordsSheet] = useState<boolean>(false);
  
  // Create/Rename Deck Dialogs
  const [showCreateDeckAlert, setShowCreateDeckAlert] = useState<boolean>(false);
  const [showRenameDeckAlert, setShowRenameDeckAlert] = useState<boolean>(false);
  const [newDeckName, setNewDeckName] = useState<string>('');
  const [editingDeckId, setEditingDeckId] = useState<string | null>(null);
  
  // Active Quiz State
  const [activeQuizList, setActiveQuizList] = useState<VocabItem[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswer[]>([]);
  
  // Current Option Generation (4択)
  const [currentOptions, setCurrentOptions] = useState<Option[]>([]);
  const [hasAnsweredCurrentQuestion, setHasAnsweredCurrentQuestion] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(1.0); // 1.0 down to 0.0
  const questionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const questionStartTimeRef = useRef<number>(0);
  
  // Flashcard Flip State
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  
  // Audio state
  useEffect(() => {
    // Load initial decks
    loadDecks();
  }, []);

  const loadDecks = async () => {
    try {
      const dbDecks = await loadDecksFromDB();
      setDecks(dbDecks);
      if (dbDecks.length > 0 && !selectedDeckId) {
        setSelectedDeckId(dbDecks[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const selectedDeck = decks.find(d => d.id === selectedDeckId) || null;
  const totalFailed = selectedDeck?.vocabList.filter(w => w.incorrectCount > 0).length || 0;
  const isStartDisabled = rangeMode === 'incorrectOnly' && totalFailed === 0;

  // Sync Range bounds when selected deck changes
  useEffect(() => {
    if (selectedDeck) {
      setRangeStart(1);
      setRangeEnd(Math.max(1, Math.min(20, selectedDeck.vocabList.length)));
      setRandomQuestionCount(Math.max(1, Math.min(20, selectedDeck.vocabList.length)));
    }
  }, [selectedDeckId]);

  // Navigate Screen helper
  const navigateTo = (screen: AppScreen) => {
    setCurrentScreen(screen);
  };

  // ==============================================
  // DECK ACTIONS
  // ==============================================
  const handleCreateDeck = async () => {
    const name = newDeckName.trim() || '新規単語帳';
    const newDeck: VocabDeck = {
      id: Math.random().toString(36).substring(2, 9),
      name,
      vocabList: []
    };
    
    await saveDeckToDB(newDeck);
    setNewDeckName('');
    setShowCreateDeckAlert(false);
    setSelectedDeckId(newDeck.id);
    await loadDecks();
    navigateTo('setup');
  };

  const handleRenameDeck = async () => {
    if (!editingDeckId) return;
    const name = newDeckName.trim();
    if (!name) return;
    
    const deck = decks.find(d => d.id === editingDeckId);
    if (deck) {
      const updated = { ...deck, name };
      await saveDeckToDB(updated);
      setNewDeckName('');
      setShowRenameDeckAlert(false);
      setEditingDeckId(null);
      await loadDecks();
    }
  };

  const handleDeleteDeck = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('この単語帳を削除しますか？登録されている単語もすべて削除されます。')) return;
    
    await deleteDeckFromDB(id);
    if (selectedDeckId === id) {
      setSelectedDeckId(null);
    }
    await loadDecks();
  };

  // ==============================================
  // WORD EDITING ACTIONS
  // ==============================================
  const handleAddWord = async () => {
    if (!selectedDeck) return;
    const word = newWord.trim();
    const meaning = newMeaning.trim();
    if (!word || !meaning) return;

    const newItem: VocabItem = {
      id: Math.random().toString(36).substring(2, 9),
      word,
      meaning,
      incorrectCount: 0
    };

    const updatedDeck = {
      ...selectedDeck,
      vocabList: [...selectedDeck.vocabList, newItem]
    };

    await saveDeckToDB(updatedDeck);
    setNewWord('');
    setNewMeaning('');
    setRangeEnd(updatedDeck.vocabList.length);
    setRandomQuestionCount(updatedDeck.vocabList.length);
    await loadDecks();
  };

  const handleDeleteWord = async (wordId: string) => {
    if (!selectedDeck) return;
    
    const updatedList = selectedDeck.vocabList.filter(w => w.id !== wordId);
    const updatedDeck = {
      ...selectedDeck,
      vocabList: updatedList
    };

    await saveDeckToDB(updatedDeck);
    setRangeStart(typeof rangeStart === 'number' ? Math.max(1, Math.min(rangeStart, updatedList.length)) : '');
    setRangeEnd(typeof rangeEnd === 'number' ? Math.max(1, Math.min(rangeEnd, updatedList.length)) : '');
    await loadDecks();
  };

  const resetAllIncorrectCounts = async () => {
    if (!selectedDeck) return;
    if (!confirm('フォルダ内すべての単語の間違え履歴をリセットしますか？')) return;
    
    const updatedList = selectedDeck.vocabList.map(w => ({ ...w, incorrectCount: 0 }));
    const updatedDeck = {
      ...selectedDeck,
      vocabList: updatedList
    };

    await saveDeckToDB(updatedDeck);
    await loadDecks();
  };

  const resetIncorrectCountForWord = async (wordId: string) => {
    if (!selectedDeck) return;
    
    const updatedList = selectedDeck.vocabList.map(w => {
      if (w.id === wordId) {
        return { ...w, incorrectCount: 0 };
      }
      return w;
    });
    
    const updatedDeck = {
      ...selectedDeck,
      vocabList: updatedList
    };

    await saveDeckToDB(updatedDeck);
    await loadDecks();
  };

  // ==============================================
  // CSV UPLOAD & TEMPLATE DOWNLOAD
  // ==============================================
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCSVUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedDeck) return;

    const isHeaderRow = (row: string[]) => {
      if (row.length < 2) return false;
      const col1 = (row[0] || '').toLowerCase().trim();
      const col2 = (row[1] || '').toLowerCase().trim();
      
      const headerKeysCol1 = ['word', '単語', 'vocab', 'term', 'english', '英語', 'english word'];
      const headerKeysCol2 = ['meaning', '意味', 'definition', 'translation', 'japanese', '日本語'];
      
      return headerKeysCol1.includes(col1) || headerKeysCol2.includes(col2);
    };

    Papa.parse(file, {
      header: false,
      skipEmptyLines: 'greedy',
      complete: async (results) => {
        const rawRows = results.data as string[][];
        if (rawRows.length === 0) {
          alert('CSVファイルの中にデータが見つかりませんでした。');
          return;
        }

        let startIndex = 0;
        // Check if the first row is a header row
        if (rawRows.length > 0 && isHeaderRow(rawRows[0])) {
          startIndex = 1;
        }

        const newItems: VocabItem[] = [];
        for (let i = startIndex; i < rawRows.length; i++) {
          const row = rawRows[i];
          if (!row || row.length < 2) continue;

          const word = (row[0] || '').trim();
          const meaning = (row[1] || '').trim();
          if (!word || !meaning) continue;

          newItems.push({
            id: Math.random().toString(36).substring(2, 9),
            word,
            meaning,
            distractor1: (row[2] || '').trim() || undefined,
            distractor2: (row[3] || '').trim() || undefined,
            distractor3: (row[4] || '').trim() || undefined,
            incorrectCount: 0
          });
        }

        if (newItems.length === 0) {
          alert('CSVファイルから有効な単語が検出されませんでした。1列目に単語、2列目に意味が記載されていることを確認してください。');
          return;
        }

        const updatedDeck = {
          ...selectedDeck,
          vocabList: [...selectedDeck.vocabList, ...newItems]
        };

        await saveDeckToDB(updatedDeck);
        setRangeStart(1);
        setRangeEnd(updatedDeck.vocabList.length);
        setRandomQuestionCount(updatedDeck.vocabList.length);
        await loadDecks();
        alert(`${newItems.length}語の単語を追加インポートしました！`);
      },
      error: (error) => {
        alert('CSVファイルの解析中にエラーが発生しました: ' + error.message);
      }
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const downloadCSVTemplate = () => {
    const templateData = [
      { word: 'include', meaning: 'を含める', distractor1: 'を除外する', distractor2: 'を分割する', distractor3: 'を関連づける' },
      { word: 'improve', meaning: 'を向上させる', distractor1: 'を低下させる', distractor2: 'を準備する', distractor3: 'を保護する' },
      { word: 'prevent', meaning: 'を妨げる', distractor1: 'を促す', distractor2: 'を受け取る', distractor3: 'を説明する' }
    ];
    const csv = Papa.unparse(templateData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'vocab_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ==============================================
  // QUIZ ENGINE LOGIC
  // ==============================================
  const startQuiz = () => {
    if (!selectedDeck) return;
    
    let sliced: VocabItem[] = [];
    if (rangeMode === 'byNumber') {
      if (byNumberSubMode === 'range') {
        const start = typeof rangeStart === 'number' ? rangeStart : 1;
        const end = typeof rangeEnd === 'number' ? rangeEnd : selectedDeck.vocabList.length;
        const startIdx = Math.max(0, start - 1);
        const endIdx = Math.min(selectedDeck.vocabList.length, end);
        if (startIdx >= endIdx) return;
        sliced = selectedDeck.vocabList.slice(startIdx, endIdx);
        if (isShuffle) {
          sliced = [...sliced].sort(() => Math.random() - 0.5);
        }
      } else {
        const countValue = typeof randomQuestionCount === 'number' ? randomQuestionCount : 20;
        const count = Math.min(selectedDeck.vocabList.length, Math.max(1, countValue));
        sliced = [...selectedDeck.vocabList].sort(() => Math.random() - 0.5).slice(0, count);
      }
    } else { // incorrectOnly
      const failedWords = selectedDeck.vocabList.filter(w => w.incorrectCount > 0);
      sliced = [...failedWords];
      if (isShuffle) {
        sliced = [...sliced].sort(() => Math.random() - 0.5);
      }
    }

    if (sliced.length === 0) return;

    setActiveQuizList(sliced);
    setCurrentQuestionIndex(0);
    setScore(0);
    setQuizAnswers([]);
    setIsFlipped(false);
    
    navigateTo('quiz');
    loadQuestion(sliced, 0);
  };

  const loadQuestion = (quizList: VocabItem[], index: number) => {
    if (index >= quizList.length) return;
    const currentItem = quizList[index];
    
    // TTS automatic speech
    speakEnglish(currentItem.word, isAudioEnabled);

    // Option generation for 4択
    if (quizMode === 'multipleChoice') {
      setHasAnsweredCurrentQuestion(false);
      let choices = [currentItem.meaning];
      
      if (currentItem.distractor1 && currentItem.distractor2 && currentItem.distractor3) {
        choices.push(currentItem.distractor1, currentItem.distractor2, currentItem.distractor3);
      } else if (selectedDeck) {
        // Dynamic distractors selection
        const otherMeanings = selectedDeck.vocabList
          .filter(w => w.meaning !== currentItem.meaning)
          .map(w => w.meaning);
        
        const shuffledOthers = [...otherMeanings].sort(() => Math.random() - 0.5);
        const selectedDistractors = shuffledOthers.slice(0, 3);
        
        while (selectedDistractors.length < 3) {
          selectedDistractors.push('（選択肢）');
        }
        choices.push(...selectedDistractors);
      }

      const options: Option[] = choices.map((text, idx) => ({
        id: Math.random().toString(),
        text,
        isCorrect: idx === 0,
        status: 'normal' as OptionStatus
      })).sort(() => Math.random() - 0.5);

      setCurrentOptions(options);
      
      // Timer setup
      setTimeLeft(1.0);
      questionStartTimeRef.current = Date.now();

      if (questionTimerRef.current) clearInterval(questionTimerRef.current);
      
      if (isTimerEnabled) {
        const duration = 10.0; // 10s limit
        const interval = 50; // 50ms steps
        let elapsed = 0;
        
        questionTimerRef.current = setInterval(() => {
          elapsed += interval;
          const remaining = Math.max(0.0, 1.0 - (elapsed / (duration * 1000)));
          setTimeLeft(remaining);

          if (remaining <= 0) {
            if (questionTimerRef.current) clearInterval(questionTimerRef.current);
            resolveAnswer(null, quizList, index); // Timeout
          }
        }, interval);
      }
    } else {
      // Flashcard Mode Timer-less
      setIsFlipped(false);
      questionStartTimeRef.current = Date.now();
    }
  };

  const selectOption = (optionId: string) => {
    if (hasAnsweredCurrentQuestion) return;
    const option = currentOptions.find(o => o.id === optionId) || null;
    resolveAnswer(option, activeQuizList, currentQuestionIndex);
  };

  const selectDontKnow = () => {
    if (hasAnsweredCurrentQuestion) return;
    resolveAnswer(null, activeQuizList, currentQuestionIndex);
  };

  const incrementIncorrectInDB = async (itemId: string) => {
    if (!selectedDeck) return;
    const list = selectedDeck.vocabList.map(w => {
      if (w.id === itemId) {
        return { ...w, incorrectCount: w.incorrectCount + 1 };
      }
      return w;
    });
    const updated = { ...selectedDeck, vocabList: list };
    await saveDeckToDB(updated);
    // Silent update list
    setDecks(prev => prev.map(d => d.id === updated.id ? updated : d));
  };

  const resolveAnswer = (selectedOption: Option | null, quizList: VocabItem[], index: number) => {
    if (questionTimerRef.current) clearInterval(questionTimerRef.current);
    setHasAnsweredCurrentQuestion(true);

    const currentItem = quizList[index];
    const timeSpent = (Date.now() - questionStartTimeRef.current) / 1000;
    
    let isCorrect = false;
    let chosenText = 'わからない';

    if (selectedOption) {
      chosenText = selectedOption.text;
      isCorrect = selectedOption.isCorrect;
    } else {
      chosenText = timeLeft <= 0 ? '(時間切れ)' : 'わからない';
    }

    if (isCorrect) {
      setScore(s => s + 1);
      playCorrectSound(isAudioEnabled);
    } else {
      incrementIncorrectInDB(currentItem.id);
      playIncorrectSound(isAudioEnabled);
    }

    // Update Option Colors
    setCurrentOptions(prev => prev.map(o => {
      if (o.isCorrect) {
        return { ...o, status: 'correct' };
      } else if (selectedOption && o.id === selectedOption.id && !selectedOption.isCorrect) {
        return { ...o, status: 'incorrect' };
      }
      return { ...o, status: 'faded' };
    }));

    const answer: QuizAnswer = {
      id: Math.random().toString(),
      word: currentItem.word,
      meaning: currentItem.meaning,
      chosen: chosenText,
      isCorrect,
      timeSpent
    };

    setQuizAnswers(prev => [...prev, answer]);

    // Go to next question after 1.2s
    setTimeout(() => {
      const nextIdx = index + 1;
      if (nextIdx < quizList.length) {
        setCurrentQuestionIndex(nextIdx);
        loadQuestion(quizList, nextIdx);
      } else {
        navigateTo('results');
      }
    }, 1200);
  };

  const resolveFlashcardAnswer = (isCorrect: boolean) => {
    const currentItem = activeQuizList[currentQuestionIndex];
    const timeSpent = (Date.now() - questionStartTimeRef.current) / 1000;
    const chosenText = isCorrect ? '覚えている' : '覚えていない';

    if (isCorrect) {
      setScore(s => s + 1);
      playCorrectSound(isAudioEnabled);
    } else {
      incrementIncorrectInDB(currentItem.id);
      playIncorrectSound(isAudioEnabled);
    }

    const answer: QuizAnswer = {
      id: Math.random().toString(),
      word: currentItem.word,
      meaning: currentItem.meaning,
      chosen: chosenText,
      isCorrect,
      timeSpent
    };

    setQuizAnswers(prev => [...prev, answer]);

    // Go to next card after 0.3s
    setTimeout(() => {
      const nextIdx = currentQuestionIndex + 1;
      if (nextIdx < activeQuizList.length) {
        setCurrentQuestionIndex(nextIdx);
        loadQuestion(activeQuizList, nextIdx);
      } else {
        navigateTo('results');
      }
    }, 300);
  };

  const retryIncorrectOnly = () => {
    const failedAnswers = quizAnswers.filter(a => !a.isCorrect);
    const sliced = failedAnswers.map(ans => {
      // Find matching item in deck to preserve distractors if any
      const match = selectedDeck?.vocabList.find(w => w.word === ans.word) || null;
      return match || {
        id: Math.random().toString(),
        word: ans.word,
        meaning: ans.meaning,
        incorrectCount: 0
      };
    });

    if (sliced.length === 0) return;

    if (isShuffle) {
      sliced.sort(() => Math.random() - 0.5);
    }

    setActiveQuizList(sliced);
    setCurrentQuestionIndex(0);
    setScore(0);
    setQuizAnswers([]);
    setIsFlipped(false);
    
    navigateTo('quiz');
    loadQuestion(sliced, 0);
  };

  const stopQuiz = () => {
    if (questionTimerRef.current) clearInterval(questionTimerRef.current);
    window.speechSynthesis.cancel();
    navigateTo('setup');
  };

  // Helper Stats Calcs
  const getAccuracyPercent = () => {
    if (activeQuizList.length === 0) return 0;
    return Math.round((score / activeQuizList.length) * 100);
  };

  const getAverageTime = () => {
    if (quizAnswers.length === 0) return 0;
    const sum = quizAnswers.reduce((acc, curr) => acc + curr.timeSpent, 0);
    return Math.round((sum / quizAnswers.length) * 10) / 10;
  };

  // ==============================================
  // UI COLOR CONSTANTS (Tailwind equivalents)
  // ==============================================
  // bg-[#F9F5EB] is beige cream background
  // bg-[#FAF6EE] is lighter card background
  // bg-[#00A2E8] is sky blue
  // bg-[#B08E72] is golden brown
  // border-[#E5E0D5] is soft border
  // text-[#2C1F15] is warm dark charcoal

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#F9F5EB] text-[#2C1F15] relative flex flex-col font-sans select-none antialiased">
      
      {/* SCREEN 0: DECK LIST */}
      {currentScreen === 'deckList' && (
        <div className="flex flex-col flex-1 pb-20">
          <div className="bg-[#00A2E8] p-5 pb-6 text-white shadow-md">
            <h1 className="text-2xl font-black tracking-tight">単語帳 改</h1>
            <p className="text-xs font-bold opacity-85 mt-1">単語帳のフォルダー管理</p>
          </div>
          
          <div className="p-4 flex-1 overflow-y-auto space-y-4">
            {decks.map(deck => (
              <div 
                key={deck.id} 
                onClick={() => {
                  setSelectedDeckId(deck.id);
                  navigateTo('setup');
                }}
                className="bg-[#FAF6EE] border border-[#E5E0D5] rounded-2xl p-4 flex items-center justify-between shadow-sm active:scale-98 transition duration-200 cursor-pointer"
              >
                <div className="flex-1 min-w-0 pr-4">
                  <h3 className="font-bold text-base truncate">{deck.name}</h3>
                  <p className="text-xs font-bold text-gray-400 mt-1">{deck.vocabList.length} 語の単語</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setNewDeckName(deck.name);
                      setEditingDeckId(deck.id);
                      setShowRenameDeckAlert(true);
                    }}
                    className="p-2 hover:bg-[#E5E0D5] rounded-full text-gray-500 transition"
                  >
                    <Pencil size={15} />
                  </button>
                  <button 
                    onClick={(e) => handleDeleteDeck(deck.id, e)}
                    className="p-2 hover:bg-red-50 text-red-400 rounded-full transition"
                  >
                    <Trash2 size={16} />
                  </button>
                  <ChevronRight className="text-gray-400" size={20} />
                </div>
              </div>
            ))}

            {decks.length === 0 && (
              <div className="text-center py-12 text-gray-400 text-sm">
                単語帳がありません。下のボタンから作成してください。
              </div>
            )}
          </div>

          <div className="absolute bottom-4 left-4 right-4">
            <button 
              onClick={() => {
                setNewDeckName('');
                setShowCreateDeckAlert(true);
              }}
              className="w-full h-12 bg-[#00A2E8] hover:bg-sky-500 text-white rounded-full font-bold shadow-lg flex items-center justify-center gap-2 active:scale-98 transition"
            >
              <FolderPlus size={18} />
              新しい単語帳を作成する
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 1: SETUP SCREEN */}
      {currentScreen === 'setup' && selectedDeck && (
        <div className="flex flex-col flex-1 relative overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-[#F9F5EB] border-b border-[#E5E0D5] shrink-0 z-10">
            <button 
              onClick={() => navigateTo('deckList')}
              className="p-1 hover:bg-[#E5E0D5] rounded-full text-[#2C1F15]/60 transition"
            >
              <ArrowLeft size={20} />
            </button>
            <h2 className="font-extrabold text-base truncate max-w-[180px]">{selectedDeck.name}</h2>
            <button 
              disabled={isStartDisabled}
              onClick={startQuiz}
              className={`font-black text-sm px-3.5 py-1.5 rounded-full transition ${isStartDisabled ? 'text-gray-400 cursor-not-allowed' : 'text-[#00A2E8] hover:bg-[#00A2E8]/10'}`}
            >
              開始
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 pb-28 space-y-4">
            {/* Setup Options Card */}
            <div className="bg-[#FAF6EE] border border-[#E5E0D5] rounded-2xl p-4 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 border-b border-[#E5E0D5] pb-2">
                <Settings size={16} className="text-gray-500" />
                <span className="font-bold text-sm">テスト設定</span>
              </div>

              {/* Quiz Mode Selector */}
              <div className="flex bg-[#E5E0D5]/50 p-1 rounded-xl">
                <button 
                  onClick={() => setQuizMode('multipleChoice')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${quizMode === 'multipleChoice' ? 'bg-[#00A2E8] text-white shadow' : 'text-[#2C1F15]/60'}`}
                >
                  4択クイズ
                </button>
                <button 
                  onClick={() => setQuizMode('flashcard')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${quizMode === 'flashcard' ? 'bg-[#00A2E8] text-white shadow' : 'text-[#2C1F15]/60'}`}
                >
                  単語帳
                </button>
              </div>

              {/* Range Mode Picker */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span>出題範囲</span>
                  <span className="bg-[#00A2E8] text-white px-2 py-0.5 rounded-full text-[10px]">
                    {selectedDeck.vocabList.length}語ロード済み
                  </span>
                </div>

                <div className="flex bg-[#E5E0D5]/50 p-1 rounded-xl">
                  <button 
                    onClick={() => setRangeMode('byNumber')}
                    className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition ${rangeMode === 'byNumber' ? 'bg-[#FAF6EE] text-[#2C1F15] shadow-sm' : 'text-[#2C1F15]/60'}`}
                  >
                    番号で指定
                  </button>
                  <button 
                    onClick={() => setRangeMode('incorrectOnly')}
                    className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition ${rangeMode === 'incorrectOnly' ? 'bg-[#FAF6EE] text-[#2C1F15] shadow-sm' : 'text-[#2C1F15]/60'}`}
                  >
                    苦手な単語のみ
                  </button>
                </div>

                {/* Range inputs details */}
                {rangeMode === 'byNumber' && (
                  <div className="space-y-3 pt-2 bg-white rounded-xl p-3 border border-[#E5E0D5]">
                    {/* Sub Mode Toggle */}
                    <div className="flex gap-4 border-b border-[#E5E0D5] pb-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name="byNumberMode"
                          className="accent-[#00A2E8] w-4 h-4"
                          checked={byNumberSubMode === 'range'}
                          onChange={() => setByNumberSubMode('range')}
                        />
                        <span className="text-xs font-bold">範囲で指定</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name="byNumberMode"
                          className="accent-[#00A2E8] w-4 h-4"
                          checked={byNumberSubMode === 'random'}
                          onChange={() => setByNumberSubMode('random')}
                        />
                        <span className="text-xs font-bold">問題数でランダム</span>
                      </label>
                    </div>

                    {byNumberSubMode === 'range' && (
                      <>
                        <div className="flex items-center gap-2 justify-center pt-1">
                          <input 
                            type="number" 
                            value={rangeStart}
                            onChange={(e) => {
                              const val = e.target.value;
                              setRangeStart(val === '' ? '' : Math.max(1, parseInt(val)));
                            }}
                            className="w-16 h-9 text-center bg-gray-50 border border-[#E5E0D5] rounded-lg font-bold text-xs focus:outline-none focus:border-[#00A2E8] focus:ring-1 focus:ring-[#00A2E8]" 
                          />
                          <span className="text-xs text-gray-400">番 から</span>
                          <span className="font-bold text-gray-400 mx-2">〜</span>
                          <input 
                            type="number" 
                            value={rangeEnd}
                            onChange={(e) => {
                              const val = e.target.value;
                              setRangeEnd(val === '' ? '' : Math.max(1, parseInt(val)));
                            }}
                            className="w-16 h-9 text-center bg-gray-50 border border-[#E5E0D5] rounded-lg font-bold text-xs focus:outline-none focus:border-[#00A2E8] focus:ring-1 focus:ring-[#00A2E8]" 
                          />
                          <span className="text-xs text-gray-400">番 まで</span>
                        </div>

                        <div className="flex justify-center gap-1.5">
                          <button 
                            onClick={() => { setRangeStart(1); setRangeEnd(Math.min(20, selectedDeck.vocabList.length)); }}
                            className="bg-white border border-[#E5E0D5] hover:bg-gray-50 text-[10px] font-bold px-3 py-1 rounded-md"
                          >
                            1-20
                          </button>
                          <button 
                            onClick={() => { setRangeStart(Math.min(21, selectedDeck.vocabList.length)); setRangeEnd(Math.min(40, selectedDeck.vocabList.length)); }}
                            className="bg-white border border-[#E5E0D5] hover:bg-gray-50 text-[10px] font-bold px-3 py-1 rounded-md"
                          >
                            21-40
                          </button>
                          <button 
                            onClick={() => { setRangeStart(1); setRangeEnd(selectedDeck.vocabList.length); }}
                            className="bg-white border border-[#E5E0D5] hover:bg-gray-50 text-[10px] font-bold px-3 py-1 rounded-md"
                          >
                            すべて ({selectedDeck.vocabList.length})
                          </button>
                        </div>
                      </>
                    )}

                    {byNumberSubMode === 'random' && (
                      <div className="flex items-center gap-2 justify-center pt-2 pb-1">
                        <span className="text-xs font-bold text-gray-500">全体からランダムに</span>
                        <input 
                          type="number" 
                          value={randomQuestionCount}
                          onChange={(e) => {
                            const val = e.target.value;
                            setRandomQuestionCount(val === '' ? '' : Math.max(1, parseInt(val)));
                          }}
                          className="w-16 h-9 text-center bg-gray-50 border border-[#E5E0D5] rounded-lg font-bold text-xs focus:outline-none focus:border-[#00A2E8] focus:ring-1 focus:ring-[#00A2E8]" 
                        />
                        <span className="text-xs font-bold text-gray-500">問を出題</span>
                      </div>
                    )}
                  </div>
                )}

                {rangeMode === 'incorrectOnly' && (
                  <div className="pt-2">
                    {(() => {
                      const totalFailed = selectedDeck.vocabList.filter(w => w.incorrectCount > 0).length;
                      return (
                        <div className="bg-white/50 border border-[#E5E0D5] p-3 rounded-xl space-y-2">
                          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                            <AlertTriangle size={14} className={totalFailed > 0 ? 'text-red-400' : 'text-gray-400'} />
                            <span>過去に間違えたことのある単語を出題します</span>
                          </div>
                          {totalFailed > 0 ? (
                            <div className="text-xs font-bold">
                              対象単語数: <span className="text-red-400 text-sm font-black">{totalFailed}</span> 語
                            </div>
                          ) : (
                            <div className="text-[10px] font-bold text-red-400">
                              ※このフォルダには間違えた履歴のある単語がありません。
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              <div className="border-t border-[#E5E0D5] pt-3 space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs font-bold">シャッフル出題</span>
                  <input 
                    type="checkbox" 
                    checked={isShuffle}
                    onChange={(e) => setIsShuffle(e.target.checked)}
                    className="accent-[#00A2E8] w-4 h-4 cursor-pointer" 
                  />
                </label>

                {quizMode === 'multipleChoice' && (
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs font-bold">時間制限 (10秒)</span>
                    <input 
                      type="checkbox" 
                      checked={isTimerEnabled}
                      onChange={(e) => setIsTimerEnabled(e.target.checked)}
                      className="accent-[#00A2E8] w-4 h-4 cursor-pointer" 
                    />
                  </label>
                )}

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs font-bold">効果音・音声再生</span>
                  <input 
                    type="checkbox" 
                    checked={isAudioEnabled}
                    onChange={(e) => setIsAudioEnabled(e.target.checked)}
                    className="accent-[#00A2E8] w-4 h-4 cursor-pointer" 
                  />
                </label>
              </div>
            </div>

            {/* Word list & Management Card */}
            <div className="bg-[#FAF6EE] border border-[#E5E0D5] rounded-2xl p-4 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#E5E0D5] pb-2">
                <span className="font-bold text-sm">登録単語の編集 ({selectedDeck.vocabList.length}語)</span>
                <button 
                  onClick={() => setIsShowingWeakWordsSheet(true)}
                  className="bg-red-400 hover:bg-red-500 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition shadow-sm"
                >
                  <AlertTriangle size={12} />
                  苦手確認
                </button>
              </div>

              {/* Add Word Form */}
              <div className="bg-white/50 p-3 rounded-xl border border-[#E5E0D5] space-y-2">
                <div className="text-[10px] font-bold text-gray-400">単語の手動追加</div>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="単語 (例: run)"
                    value={newWord}
                    onChange={(e) => setNewWord(e.target.value)}
                    className="flex-1 min-w-0 h-8 px-2 bg-white border border-[#E5E0D5] rounded-md text-xs font-bold" 
                  />
                  <input 
                    type="text" 
                    placeholder="意味 (例: 走る)"
                    value={newMeaning}
                    onChange={(e) => setNewMeaning(e.target.value)}
                    className="flex-1 min-w-0 h-8 px-2 bg-white border border-[#E5E0D5] rounded-md text-xs" 
                  />
                  <button 
                    disabled={!newWord.trim() || !newMeaning.trim()}
                    onClick={handleAddWord}
                    className="shrink-0 text-[#4CD964] disabled:opacity-40"
                  >
                    <PlusCircle size={24} />
                  </button>
                </div>
              </div>

              {/* CSV controls */}
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={handleCSVUploadClick}
                  className="h-9 bg-white border border-[#E5E0D5] hover:bg-gray-50 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition"
                >
                  <Upload size={14} />
                  CSVをインポート
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleCSVUpload}
                  accept=".csv" 
                  className="hidden" 
                />
                
                <button 
                  onClick={downloadCSVTemplate}
                  className="h-9 bg-white border border-[#E5E0D5] hover:bg-gray-50 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition"
                >
                  <Download size={14} />
                  テンプレートCSV
                </button>
              </div>

              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Search size={14} />
                </span>
                <input 
                  type="text"
                  placeholder="単語や意味で検索..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 bg-white border border-[#E5E0D5] rounded-lg text-xs"
                />
              </div>

              {/* Words Table */}
              <div className="space-y-1">
                {(() => {
                  const filtered = selectedDeck.vocabList.filter(item => 
                    searchText.trim() === '' ||
                    item.word.toLowerCase().includes(searchText.toLowerCase()) ||
                    item.meaning.toLowerCase().includes(searchText.toLowerCase())
                  );

                  if (filtered.length === 0) {
                    return (
                      <div className="text-center py-6 text-xs text-gray-400 font-bold">
                        該当する単語がありません
                      </div>
                    );
                  }

                  return (
                    <>
                      {filtered.slice(0, visibleWordCount).map((item, index) => (
                        <div key={item.id} className="flex items-center justify-between border-b border-[#E5E0D5]/60 py-2 text-xs">
                          <span className="w-8 font-bold text-gray-400">{index + 1}</span>
                          <span className="flex-1 font-bold truncate pr-2">{item.word}</span>
                          <span className="flex-1 truncate pr-2">{item.meaning}</span>
                          <button 
                            onClick={() => handleDeleteWord(item.id)}
                            className="text-red-400 hover:text-red-500 p-1"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}

                      {filtered.length > visibleWordCount && (
                        <button 
                          onClick={() => setVisibleWordCount(prev => prev + 50)}
                          className="w-full py-2.5 text-xs font-bold text-[#00A2E8] hover:text-sky-500 bg-white/40 hover:bg-white/70 border border-dashed border-[#E5E0D5] rounded-xl mt-2 transition"
                        >
                          さらに表示
                        </button>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Fixed bottom start button */}
          <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 bg-[#F9F5EB] border-t border-[#E5E0D5] z-20">
            <button 
              disabled={isStartDisabled}
              onClick={startQuiz}
              className={`w-full h-14 rounded-2xl font-black text-base shadow-lg flex items-center justify-center gap-2 active:scale-98 transition ${isStartDisabled ? 'bg-gray-400 text-gray-200 cursor-not-allowed shadow-none' : 'bg-[#00A2E8] hover:bg-sky-500 text-white'}`}
            >
              テスト開始
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 2: QUIZ SCREEN */}
      {currentScreen === 'quiz' && activeQuizList.length > 0 && (
        <div className="flex flex-col flex-1 pb-16 bg-[#F9F5EB]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-[#F9F5EB]">
            <button 
              onClick={stopQuiz}
              className="p-1 hover:bg-[#E5E0D5] rounded-full text-[#2C1F15]/60 transition"
            >
              <X size={20} />
            </button>
            <span className="text-sm font-bold text-[#2C1F15]/60">
              {Math.min(currentQuestionIndex + 1, activeQuizList.length)} of {activeQuizList.length}
            </span>
            <div className="w-8"></div> {/* Spacer */}
          </div>

          {/* Progress bar line */}
          {quizMode === 'multipleChoice' && isTimerEnabled && (
            <div className="px-4 pb-4">
              <div className="h-1 bg-[#E5E0D5] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#B08E72] transition-all ease-linear"
                  style={{ width: `${timeLeft * 100}%`, transitionDuration: '50ms' }}
                />
              </div>
            </div>
          )}

          {/* Question Display Card */}
          <div className="flex-1 px-4 flex flex-col justify-center">
            {currentQuestionIndex < activeQuizList.length && (
              <>
                {quizMode === 'multipleChoice' ? (
                  /* 4択クイズモード */
                  <div className="space-y-6">
                    {/* English Word Card */}
                    <div className="bg-[#FAF6EE] border border-[#E5E0D5] rounded-3xl p-8 py-12 text-center shadow-md relative min-h-[160px] flex items-center justify-center">
                      <span className="text-3xl font-black">{activeQuizList[currentQuestionIndex].word}</span>
                      <button 
                        onClick={() => speakEnglish(activeQuizList[currentQuestionIndex].word, isAudioEnabled)}
                        className="absolute right-4 bottom-4 p-2.5 bg-[#FAF6EE] hover:bg-[#E5E0D5] border border-[#E5E0D5] rounded-full text-gray-500 shadow-sm transition"
                      >
                        <Volume2 size={16} />
                      </button>
                    </div>

                    {/* Options list */}
                    <div className="space-y-3">
                      {currentOptions.map(opt => {
                        let btnStyle = 'bg-white border-[#E5E0D5] text-[#2C1F15] active:scale-98';
                        if (opt.status === 'correct') {
                          btnStyle = 'bg-[#4CD964] border-[#4CD964] text-white font-extrabold';
                        } else if (opt.status === 'incorrect') {
                          btnStyle = 'bg-[#FF3B30] border-[#FF3B30] text-white font-extrabold';
                        } else if (opt.status === 'faded') {
                          btnStyle = 'bg-white/40 border-[#E5E0D5]/50 text-[#2C1F15]/40';
                        }

                        return (
                          <button 
                            key={opt.id}
                            disabled={hasAnsweredCurrentQuestion}
                            onClick={() => selectOption(opt.id)}
                            className={`w-full py-3.5 px-4 text-xs font-bold border rounded-2xl flex items-center justify-between shadow-sm transition duration-200 ${btnStyle}`}
                          >
                            <span>{opt.text}</span>
                            {opt.status === 'correct' && <Check size={16} />}
                            {opt.status === 'incorrect' && <X size={16} />}
                          </button>
                        );
                      })}
                    </div>

                    {/* Don't Know Button */}
                    <button 
                      disabled={hasAnsweredCurrentQuestion}
                      onClick={selectDontKnow}
                      className="w-full py-3 text-xs font-bold border border-[#E5E0D5] hover:bg-gray-50 text-[#2C1F15]/60 rounded-xl transition disabled:opacity-40"
                    >
                      わからない
                    </button>
                  </div>
                ) : (
                  /* 単語帳モード */
                  <div className="space-y-12">
                    {/* 3D Flippable card */}
                    <div className="perspective-1000 w-full h-[280px]">
                      <div 
                        onClick={() => setIsFlipped(!isFlipped)}
                        className={`w-full h-full duration-500 preserve-3d relative rounded-3xl border border-[#E5E0D5] shadow-md bg-[#FAF6EE] cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}
                      >
                        {/* Front Face (English) */}
                        <div className="absolute inset-0 backface-hidden flex flex-col items-center justify-center p-6 text-center">
                          <span className="text-3xl font-black">{activeQuizList[currentQuestionIndex].word}</span>
                          <span className="text-[10px] text-gray-400 font-bold mt-8 bg-gray-100 px-3 py-1 rounded-full">
                            タップして意味を表示
                          </span>
                        </div>

                        {/* Back Face (Japanese) */}
                        <div className="absolute inset-0 backface-hidden rotate-y-180 flex flex-col items-center justify-center p-6 text-center">
                          <span className="text-2xl font-bold">{activeQuizList[currentQuestionIndex].meaning}</span>
                          
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              speakEnglish(activeQuizList[currentQuestionIndex].word, isAudioEnabled);
                            }}
                            className="mt-6 p-2 bg-[#FAF6EE] border border-[#E5E0D5] hover:bg-[#E5E0D5] rounded-full text-gray-500 shadow-sm transition"
                          >
                            <Volume2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Assessment Slide-in Buttons */}
                    <div className="h-16 flex items-center justify-center">
                      {isFlipped && (
                        <div className="flex gap-4 w-full animate-fade-in">
                          <button 
                            onClick={() => resolveFlashcardAnswer(false)}
                            className="flex-1 h-12 bg-[#FF3B30] hover:bg-red-500 text-white rounded-full font-bold shadow-md flex items-center justify-center gap-1.5 active:scale-98 transition"
                          >
                            <X size={16} />
                            覚えていない
                          </button>

                          <button 
                            onClick={() => resolveFlashcardAnswer(true)}
                            className="flex-1 h-12 bg-[#4CD964] hover:bg-emerald-500 text-white rounded-full font-bold shadow-md flex items-center justify-center gap-1.5 active:scale-98 transition"
                          >
                            <Check size={16} />
                            覚えている
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* SCREEN 3: RESULTS SCREEN */}
      {currentScreen === 'results' && (
        <div className="flex flex-col flex-1 relative overflow-hidden bg-[#F9F5EB]">
          {/* Header */}
          <div className="text-center p-4 pt-6 shrink-0 border-b border-[#E5E0D5]/40">
            <h2 className="text-xl font-black">テスト結果</h2>
            <p className="text-[10px] font-bold text-gray-400 mt-1">
              {rangeMode === 'byNumber' && byNumberSubMode === 'range' && `出題範囲: No. ${rangeStart} 〜 ${rangeEnd}`}
              {rangeMode === 'byNumber' && byNumberSubMode === 'random' && `出題範囲: ランダム ${activeQuizList.length}問`}
              {rangeMode === 'incorrectOnly' && `出題範囲: 苦手単語のみ ${activeQuizList.length}問`}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-44 pt-4 space-y-6">
            {/* Accuracy Circular Meter & Stats */}
            <div className="bg-[#FAF6EE] border border-[#E5E0D5] rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center space-y-4">
              
              {/* SVG Circular Progress */}
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle 
                    cx="64" cy="64" r="54" 
                    className="stroke-[#E5E0D5]" 
                    strokeWidth="8" fill="transparent" 
                  />
                  <circle 
                    cx="64" cy="64" r="54" 
                    className="stroke-[#B08E72]" 
                    strokeWidth="8" fill="transparent" 
                    strokeDasharray={2 * Math.PI * 54}
                    strokeDashoffset={2 * Math.PI * 54 * (1 - getAccuracyPercent() / 100)}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-2xl font-black">{getAccuracyPercent()}%</span>
                  <span className="text-[9px] font-bold text-gray-400">正解率</span>
                </div>
              </div>

              {/* Stats Labels */}
              <div className="grid grid-cols-2 gap-8 text-center w-full max-w-[280px] pt-2 border-t border-[#E5E0D5]/60">
                <div>
                  <div className="text-xs font-bold text-gray-400">解答数</div>
                  <div className="text-lg font-black mt-0.5">{score} / {activeQuizList.length}</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-400">平均時間</div>
                  <div className="text-lg font-black mt-0.5">{getAverageTime()} 秒</div>
                </div>
              </div>
            </div>

            {/* Answer Logs Table */}
            <div className="bg-[#FAF6EE] border border-[#E5E0D5] rounded-3xl p-4 shadow-sm space-y-2.5">
              <span className="font-bold text-xs border-b border-[#E5E0D5] pb-1.5 block">解答履歴</span>
              <div className="space-y-2">
                {quizAnswers.map(ans => (
                  <div key={ans.id} className="flex items-center justify-between border-b border-[#E5E0D5]/40 pb-2 text-xs">
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold truncate">{ans.word}</span>
                        <span className="text-[10px] text-gray-400">({ans.meaning})</span>
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5 truncate">
                        選択: <span className="font-bold">{ans.chosen}</span> ({ans.timeSpent.toFixed(1)}秒)
                      </div>
                    </div>
                    <div>
                      {ans.isCorrect ? (
                        <span className="text-emerald-500 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          正解
                        </span>
                      ) : (
                        <span className="text-red-500 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          不正解
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action buttons fixed bottom */}
          <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 bg-[#F9F5EB] border-t border-[#E5E0D5] space-y-2 z-20">
            {quizAnswers.some(a => !a.isCorrect) && (
              <button 
                onClick={retryIncorrectOnly}
                className="w-full h-11 bg-white hover:bg-gray-50 border border-[#E5E0D5] text-[#2C1F15] font-bold text-xs rounded-full shadow-sm active:scale-98 transition"
              >
                誤答のみ再テスト
              </button>
            )}

            <div className="flex gap-2">
              <button 
                onClick={startQuiz}
                className="flex-1 h-12 bg-white hover:bg-gray-50 border border-[#E5E0D5] text-[#2C1F15] font-bold text-xs rounded-full shadow-sm active:scale-98 transition"
              >
                もう一度挑戦
              </button>
              <button 
                onClick={() => navigateTo('setup')}
                className="flex-1 h-12 bg-[#00A2E8] hover:bg-sky-500 text-white font-bold text-xs rounded-full shadow-md active:scale-98 transition"
              >
                設定に戻る
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================
          POPOVER SHEET: WEAK WORDS LIST
      // ============================================== */}
      {isShowingWeakWordsSheet && selectedDeck && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-end justify-center z-50 animate-fade-in">
          <div className="bg-[#F9F5EB] w-full max-w-md rounded-t-3xl h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-slide-up">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-[#E5E0D5] flex items-center justify-between bg-[#F9F5EB]">
              <button 
                disabled={!selectedDeck.vocabList.some(w => w.incorrectCount > 0)}
                onClick={resetAllIncorrectCounts}
                className="text-xs font-bold text-red-500 disabled:opacity-40"
              >
                すべてリセット
              </button>
              <h3 className="font-extrabold text-sm text-[#2C1F15]">苦手単語（間違えた履歴）</h3>
              <button 
                onClick={() => setIsShowingWeakWordsSheet(false)}
                className="text-xs font-bold text-[#2C1F15]"
              >
                閉じる
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {(() => {
                const weakWords = selectedDeck.vocabList
                  .filter(w => w.incorrectCount > 0)
                  .sort((a, b) => b.incorrectCount - a.incorrectCount);

                if (weakWords.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
                      <span className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-500">
                        <Check size={24} />
                      </span>
                      <h4 className="font-bold text-sm">間違えた単語はありません！</h4>
                      <p className="text-xs text-gray-400 max-w-[260px]">
                        クイズや単語帳モードで間違えた単語がここにミス回数の多い順で表示されます。
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-2">
                    {weakWords.map(item => (
                      <div 
                        key={item.id} 
                        className="bg-[#FAF6EE] border border-[#E5E0D5] rounded-xl p-3 flex items-center justify-between shadow-xs"
                      >
                        <div className="min-w-0 pr-4">
                          <h4 className="font-bold text-sm truncate">{item.word}</h4>
                          <p className="text-xs text-gray-400 truncate">{item.meaning}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-bold text-white bg-red-400 px-2 py-0.5 rounded-md">
                            {item.incorrectCount}回ミス
                          </span>
                          <button 
                            onClick={() => resetIncorrectCountForWord(item.id)}
                            className="p-1 text-gray-400 hover:text-gray-600 transition"
                          >
                            <RefreshCw size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ==============================================
          ALERT PROMPTS: CREATE & RENAME DECK
      // ============================================== */}
      
      {/* Create Deck Alert */}
      {showCreateDeckAlert && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-6 z-50 animate-fade-in">
          <div className="bg-[#F9F5EB] rounded-2xl border border-[#E5E0D5] p-5 w-full max-w-xs shadow-xl space-y-4">
            <h4 className="font-extrabold text-sm text-center">新しい単語帳を作成</h4>
            <input 
              type="text" 
              placeholder="単語帳の名前を入力"
              value={newDeckName}
              onChange={(e) => setNewDeckName(e.target.value)}
              className="w-full h-10 px-3 bg-white border border-[#E5E0D5] rounded-lg text-xs font-bold"
              autoFocus
            />
            <div className="flex gap-2">
              <button 
                onClick={() => setShowCreateDeckAlert(false)}
                className="flex-1 h-9 bg-white border border-[#E5E0D5] text-xs font-bold rounded-lg"
              >
                キャンセル
              </button>
              <button 
                onClick={handleCreateDeck}
                className="flex-1 h-9 bg-[#00A2E8] text-white text-xs font-bold rounded-lg"
              >
                作成
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Deck Alert */}
      {showRenameDeckAlert && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-6 z-50 animate-fade-in">
          <div className="bg-[#F9F5EB] rounded-2xl border border-[#E5E0D5] p-5 w-full max-w-xs shadow-xl space-y-4">
            <h4 className="font-extrabold text-sm text-center">単語帳の名前を変更</h4>
            <input 
              type="text" 
              value={newDeckName}
              onChange={(e) => setNewDeckName(e.target.value)}
              className="w-full h-10 px-3 bg-white border border-[#E5E0D5] rounded-lg text-xs font-bold"
              autoFocus
            />
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  setShowRenameDeckAlert(false);
                  setEditingDeckId(null);
                }}
                className="flex-1 h-9 bg-white border border-[#E5E0D5] text-xs font-bold rounded-lg"
              >
                キャンセル
              </button>
              <button 
                onClick={handleRenameDeck}
                className="flex-1 h-9 bg-[#00A2E8] text-white text-xs font-bold rounded-lg"
              >
                変更
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
