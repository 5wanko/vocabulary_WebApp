import type { VocabDeck, VocabItem } from './types';

const DB_NAME = 'VocabCustomQuizDB';
const DB_VERSION = 1;
const STORE_NAME = 'decks';

// Default 100 verbs for initial load
export const DEFAULT_VOCAB: VocabItem[] = [
  { id: 'd1', word: 'include', meaning: 'を含む', incorrectCount: 0 },
  { id: 'd2', word: 'associate', meaning: 'を関連づける', incorrectCount: 0 },
  { id: 'd3', word: 'concern', meaning: 'を心配させる', incorrectCount: 0 },
  { id: 'd4', word: 'improve', meaning: 'を向上させる', incorrectCount: 0 },
  { id: 'd5', word: 'provide', meaning: 'を提供する', incorrectCount: 0 },
  { id: 'd6', word: 'develop', meaning: 'を開発する', incorrectCount: 0 },
  { id: 'd7', word: 'increase', meaning: 'を増やす', incorrectCount: 0 },
  { id: 'd8', word: 'decrease', meaning: 'を減らす', incorrectCount: 0 },
  { id: 'd9', word: 'achieve', meaning: 'を達成する', incorrectCount: 0 },
  { id: 'd10', word: 'require', meaning: 'を必要とする', incorrectCount: 0 },
  { id: 'd11', word: 'produce', meaning: 'を生産する', incorrectCount: 0 },
  { id: 'd12', word: 'prevent', meaning: 'を妨げる', incorrectCount: 0 },
  { id: 'd13', word: 'determine', meaning: 'を決定する', incorrectCount: 0 },
  { id: 'd14', word: 'encourage', meaning: 'を励ます', incorrectCount: 0 },
  { id: 'd15', word: 'establish', meaning: 'を設立する', incorrectCount: 0 },
  { id: 'd16', word: 'identify', meaning: 'を特定する', incorrectCount: 0 },
  { id: 'd17', word: 'prepare', meaning: 'を準備する', incorrectCount: 0 },
  { id: 'd18', word: 'reduce', meaning: 'を減らす', incorrectCount: 0 },
  { id: 'd19', word: 'support', meaning: 'を支持する', incorrectCount: 0 },
  { id: 'd20', word: 'maintain', meaning: 'を維持する', incorrectCount: 0 },
  { id: 'd21', word: 'expect', meaning: 'を期待する', incorrectCount: 0 },
  { id: 'd22', word: 'propose', meaning: 'を提案する', incorrectCount: 0 },
  { id: 'd23', word: 'consider', meaning: 'をよく考える', incorrectCount: 0 },
  { id: 'd24', word: 'recognize', meaning: 'を認める', incorrectCount: 0 },
  { id: 'd25', word: 'suggest', meaning: 'を提案する', incorrectCount: 0 },
  { id: 'd26', word: 'allow', meaning: 'を許す', incorrectCount: 0 },
  { id: 'd27', word: 'remain', meaning: 'ままでいる', incorrectCount: 0 },
  { id: 'd28', word: 'contain', meaning: 'を含む', incorrectCount: 0 },
  { id: 'd29', word: 'perform', meaning: 'を行う', incorrectCount: 0 },
  { id: 'd30', word: 'replace', meaning: 'に取って代わる', incorrectCount: 0 },
  { id: 'd31', word: 'realize', meaning: 'を悟る', incorrectCount: 0 },
  { id: 'd32', word: 'discover', meaning: 'を発見する', incorrectCount: 0 },
  { id: 'd33', word: 'protect', meaning: 'を保護する', incorrectCount: 0 },
  { id: 'd34', word: 'destroy', meaning: 'を破壊する', incorrectCount: 0 },
  { id: 'd35', word: 'observe', meaning: 'を観察する', incorrectCount: 0 },
  { id: 'd36', word: 'mention', meaning: 'に言及する', incorrectCount: 0 },
  { id: 'd37', word: 'compare', meaning: 'を比較する', incorrectCount: 0 },
  { id: 'd38', word: 'describe', meaning: 'を描写する', incorrectCount: 0 },
  { id: 'd39', word: 'explain', meaning: 'を説明する', incorrectCount: 0 },
  { id: 'd40', word: 'discuss', meaning: 'について話し合う', incorrectCount: 0 },
  { id: 'd41', word: 'focus', meaning: 'を集中させる', incorrectCount: 0 },
  { id: 'd42', word: 'express', meaning: 'を表現する', incorrectCount: 0 },
  { id: 'd43', word: 'publish', meaning: 'を出版する', incorrectCount: 0 },
  { id: 'd44', word: 'behave', meaning: '振る舞う', incorrectCount: 0 },
  { id: 'd45', word: 'attend', meaning: 'に出席する', incorrectCount: 0 },
  { id: 'd46', word: 'survive', meaning: '生き残る', incorrectCount: 0 },
  { id: 'd47', word: 'respond', meaning: '反応する', incorrectCount: 0 },
  { id: 'd48', word: 'argue', meaning: 'と主張する', incorrectCount: 0 },
  { id: 'd49', word: 'refuse', meaning: 'を拒む', incorrectCount: 0 },
  { id: 'd50', word: 'admit', meaning: 'を認める', incorrectCount: 0 },
  { id: 'd51', word: 'deny', meaning: 'を否定する', incorrectCount: 0 },
  { id: 'd52', word: 'prefer', meaning: 'を好む', incorrectCount: 0 },
  { id: 'd53', word: 'demand', meaning: 'を要求する', incorrectCount: 0 },
  { id: 'd54', word: 'request', meaning: 'を要請する', incorrectCount: 0 },
  { id: 'd55', word: 'receive', meaning: 'を受け取る', incorrectCount: 0 },
  { id: 'd56', word: 'accept', meaning: 'を受け入れる', incorrectCount: 0 },
  { id: 'd57', word: 'obtain', meaning: 'を手に入れる', incorrectCount: 0 },
  { id: 'd58', word: 'create', meaning: 'を創造する', incorrectCount: 0 },
  { id: 'd59', word: 'design', meaning: 'を設計する', incorrectCount: 0 },
  { id: 'd60', word: 'invent', meaning: 'を発明する', incorrectCount: 0 },
  { id: 'd61', word: 'experience', meaning: 'を経験する', incorrectCount: 0 },
  { id: 'd62', word: 'believe', meaning: 'を信じる', incorrectCount: 0 },
  { id: 'd63', word: 'know', meaning: 'を知っている', incorrectCount: 0 },
  { id: 'd64', word: 'remember', meaning: 'を覚えている', incorrectCount: 0 },
  { id: 'd65', word: 'forget', meaning: 'を忘れる', incorrectCount: 0 },
  { id: 'd66', word: 'understand', meaning: 'を理解する', incorrectCount: 0 },
  { id: 'd67', word: 'learn', meaning: 'を学ぶ', incorrectCount: 0 },
  { id: 'd68', word: 'teach', meaning: 'を教える', incorrectCount: 0 },
  { id: 'd69', word: 'practice', meaning: 'を練習する', incorrectCount: 0 },
  { id: 'd70', word: 'repeat', meaning: 'を繰り返す', incorrectCount: 0 },
  { id: 'd71', word: 'translate', meaning: 'を翻訳する', incorrectCount: 0 },
  { id: 'd72', word: 'speak', meaning: 'を話す', incorrectCount: 0 },
  { id: 'd73', word: 'read', meaning: 'を読む', incorrectCount: 0 },
  { id: 'd74', word: 'write', meaning: 'を書く', incorrectCount: 0 },
  { id: 'd75', word: 'listen', meaning: 'を聴く', incorrectCount: 0 },
  { id: 'd76', word: 'hear', meaning: 'が聞こえる', incorrectCount: 0 },
  { id: 'd77', word: 'see', meaning: 'が見える', incorrectCount: 0 },
  { id: 'd78', word: 'look', meaning: 'を見る', incorrectCount: 0 },
  { id: 'd79', word: 'watch', meaning: 'を見守る', incorrectCount: 0 },
  { id: 'd80', word: 'notice', meaning: 'に気づく', incorrectCount: 0 },
  { id: 'd81', word: 'feel', meaning: 'を感じる', incorrectCount: 0 },
  { id: 'd82', word: 'think', meaning: 'と思う', incorrectCount: 0 },
  { id: 'd83', word: 'decide', meaning: 'を決心する', incorrectCount: 0 },
  { id: 'd84', word: 'choose', meaning: 'を選ぶ', incorrectCount: 0 },
  { id: 'd85', word: 'select', meaning: 'を精選する', incorrectCount: 0 },
  { id: 'd86', word: 'elect', meaning: 'を選挙する', incorrectCount: 0 },
  { id: 'd87', word: 'like', meaning: 'を好む', incorrectCount: 0 },
  { id: 'd88', word: 'love', meaning: 'を愛する', incorrectCount: 0 },
  { id: 'd89', word: 'hate', meaning: 'を憎む', incorrectCount: 0 },
  { id: 'd90', word: 'fear', meaning: 'を恐れる', incorrectCount: 0 },
  { id: 'd91', word: 'worry', meaning: 'を心配する', incorrectCount: 0 },
  { id: 'd92', word: 'mind', meaning: 'を気にする', incorrectCount: 0 },
  { id: 'd93', word: 'care', meaning: 'を気にかける', incorrectCount: 0 },
  { id: 'd94', word: 'wish', meaning: 'を望む', incorrectCount: 0 },
  { id: 'd95', word: 'hope', meaning: 'を望む', incorrectCount: 0 },
  { id: 'd96', word: 'want', meaning: 'を欲する', incorrectCount: 0 }
];

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

export async function loadDecksFromDB(): Promise<VocabDeck[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = async () => {
      let decks = request.result as VocabDeck[];
      if (decks.length === 0) {
        // Initial load: create sample deck
        const defaultDeck: VocabDeck = {
          id: 'default-deck-id-100',
          name: 'デフォルト単語帳 (100語)',
          vocabList: DEFAULT_VOCAB
        };
        await saveDeckToDB(defaultDeck);
        decks = [defaultDeck];
      }
      resolve(decks);
    };
  });
}

export async function saveDeckToDB(deck: VocabDeck): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(deck);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function deleteDeckFromDB(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}
