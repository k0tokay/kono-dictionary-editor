// src/store/DictionaryContext.jsx
import React, { createContext, useReducer, useContext } from 'react';
import initialData from '../data/konomeno-v5.json';
import { hasPath, createBlankWord, checkIntegrity, hasNoCycle } from '../utils/utils.js';
import { ancestorList } from '../utils/utils.js';

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
        default:
            throw new Error(`Unknown action: ${action.type}`);
    }
}

export function DictionaryProvider({ children }) {
    const [state, dispatch] = useReducer(dictionaryReducer, {
        words: initialData.words,
        openSet: new Set(),
        focusId: 6, // alkono // getFirstRootId(initialData.words)
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

    const isValidWordTag = (wordId) => {
        const num = Number(wordId);
        return Number.isInteger(num) && num >= 0 && state.words[num];
    }

    const tagList = word[field].filter(t => t !== "" && t !== null && isValidWordTag(t));
    const invField = field === 'upper_covers' ? 'lower_covers' : 'upper_covers';

    const newWords = structuredClone(state.words);
    newWords[id][field] = newWords[id][field].filter(t => t !== "");
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

