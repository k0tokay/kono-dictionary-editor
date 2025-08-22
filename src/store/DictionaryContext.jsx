// src/store/DictionaryContext.jsx
import React, { createContext, useReducer, useContext } from 'react';
import initialData from '../data/konomeno-v5.json';
import { hasPath, createBlankWord, checkIntegrity, hasNoCycle } from '../utils/utils.js';
import { ancestorList, isValidWordTag } from '../utils/utils.js';

const DictionaryStateCtx = createContext();
const DictionaryDispatchCtx = createContext();

const getFirstRootId = (words) => {
    for (let i = 0; i < words.length; i++) {
        if (words[i] && words[i].category === 'カテゴリ') {
            return i;
        }
    }
    return 0;
};

function dictionaryReducer(state, action) {
    switch (action.type) {
        case 'UPDATE_FIELD': {
            return updateField(state, action.payload);
        }
        case "UPDATE_COVERS": {
            return updateCovers(state, action.payload);
        }
        case 'ADD_WORD': {
            return addWord(state, action.payload);
        }
        case 'DELETE_WORD': {
            return deleteWord(state, action.payload);
        }
        case 'TOGGLE_OPEN': {
            const set = new Set(state.openSet);
            // focusがあっている時のみtoggleする
            if (state.focusId !== action.payload) return state;
            if (set.has(action.payload)) set.delete(action.payload);
            else set.add(action.payload);
            return { ...state, openSet: set };
        }
        case 'OPEN_WORD': {
            const id = action.payload;
            const set = new Set(state.openSet);
            ancestorList(state.words, id).forEach(aid => {
                set.add(aid);
            });
            return { ...state, openSet: set };
        }
        case 'SET_FOCUS': {
            return { ...state, focusId: action.payload };
        }
        case 'SET_DICTIONARY': {
            const words = action.payload.words;
            return { ...state, words, openSet: new Set(), focusId: getFirstRootId(words) };
        }
        default:
            throw new Error(`Unknown action: ${action.type}`);
    }
}

export function DictionaryProvider({ children }) {
    let initialWords = initialData.words;
    if (typeof window !== 'undefined') {
        try {
            const stored = localStorage.getItem('dictionary');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed.words) {
                    initialWords = parsed.words;
                }
            }
        } catch {
            // ignore parse error and fall back to bundled data
        }
    }

    const [state, dispatch] = useReducer(dictionaryReducer, {
        words: initialWords,
        openSet: new Set(),
        focusId: getFirstRootId(initialWords),
        editedSet: new Set(),
        // …その他 state…
    });
    return (
        <DictionaryStateCtx.Provider value={state}>
            <DictionaryDispatchCtx.Provider value={dispatch}>
                {children}
            </DictionaryDispatchCtx.Provider>
        </DictionaryStateCtx.Provider>
    );
}

export const useDictState = () => useContext(DictionaryStateCtx);
export const useDictDispatch = () => useContext(DictionaryDispatchCtx);


function updateField(state, { id, field, value }) {
    const word = state.words[id];
    if (!word) return state;

    const newWords = structuredClone(state.words);    // deepcopyしないと更新が反映されない
    newWords[id] = {
        ...word,
        [field]: value
    };

    return { ...state, words: newWords };
}

function updateCovers(state, { id, field, editingIndex }) {
    const word = state.words[id];
    if (!word) return state;

    const tagList = word[field].filter(t => t !== "" && t !== null && isValidWordTag(state.words, t));
    const invField = field === 'upper_covers' ? 'lower_covers' : 'upper_covers';

    const newWords = structuredClone(state.words);
    newWords[id][field] = newWords[id][field].filter(t => t !== "");

    // ここで削除すると不整合になる可能性がある // tmp
    for (const w of newWords) {
        if (!w) continue;
        for (const t of w[invField]) {
            if (t === id && !newWords[id][field].includes(w.id)) {
                // もう片方のリンクを削除
                w[invField] = w[invField].filter(t => t !== id);
            }
        }
    }
    const tag = tagList[editingIndex];
    if (!tag) {
        // 編集中のタグが空の場合は何もしない
        return { ...state, words: newWords };
    }
    const target = state.words[tag];
    target[invField] = [...target[invField], id];
    newWords[tag] = target;
    if (hasNoCycle({ words: newWords })) {
        // もし循環していなければ、更新を反映
        checkIntegrity({ words: newWords });
        return { ...state, words: newWords };
    } else {
        // 循環している場合はそのtagを削除
        newWords[tag][invField] = newWords[tag][invField].filter(t => t !== id);
        newWords[id][field] = newWords[id][field].filter(t => t !== tag);
        return { ...state, words: newWords };
    }
    // return { ...state, words: newWords };
}

function addWord(state, parentId) {
    const parent = state.words[parentId];
    if (!parent) return state;

    const category = parent.category === 'カテゴリ' ? parent.entry : parent.category; // 親のカテゴリを引き継ぐ(親がカテゴリの場合は例外処理)
    const newWord = createBlankWord(parentId, category, state.words.length);
    const words = [...state.words, newWord];
    // 親のlower_coversに新しい単語を追加
    words[parentId] = {
        ...parent,
        lower_covers: [...parent.lower_covers, newWord.id]
    };

    checkIntegrity({ words });
    return { ...state, words, focusId: newWord.id };
}

function deleteWord(state, { id }) {
    const words = state.words.slice();
    const victim = words[id];
    if (!victim) return state;

    // 既存リンク解除 (親 ↔ 子)
    victim.upper_covers.forEach(pid => {
        words[pid] = {
            ...words[pid],
            lower_covers: words[pid].lower_covers.filter(x => x !== id)
        };
    });
    victim.lower_covers.forEach(cid => {
        words[cid] = {
            ...words[cid],
            upper_covers: words[cid].upper_covers.filter(x => x !== id)
        };
    });
    // 子を親に付け替える
    victim.lower_covers.forEach(cid => {
        victim.upper_covers.forEach(pid => {
            if (hasPath(cid, pid, { words })) {
                // 循環になるのでスキップ ← あり得るのか？
                return;
            }
            words[cid].upper_covers.push(pid);
            words[pid].lower_covers.push(cid);
        });
    });

    // 自分を null
    words[id] = null;
    // 新しいフォーカス
    const newFocus = victim.upper_covers[0] ?? 0;

    checkIntegrity({ words });

    return { ...state, words, focusId: newFocus };
}

