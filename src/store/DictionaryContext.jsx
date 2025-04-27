// src/store/DictionaryContext.jsx
import React, { createContext, useReducer, useContext } from 'react';
import initialData from '../data/konomeno-v5.json';
import { reconcileCovers } from '../utils/utils.js';

const DictionaryStateCtx = createContext();
const DictionaryDispatchCtx = createContext();

function dictionaryReducer(state, action) {
    switch (action.type) {
        case 'UPDATE_FIELD': {
            const { id, field, value } = action.payload;
            const word = { ...state.words[id], [field]: value };
            // 整合性チェック
            if (field === 'upper_covers' || field === 'lower_covers') {
                const ok = reconcileCovers(word, { ...state, words: [...state.words.slice(0, id), word, ...state.words.slice(id + 1)] });
                if (!ok) return state;  // 変更を破棄
            }
            const words = state.words.slice();
            words[id] = word;
            return { ...state, words };
        }
        case 'ADD_WORD': {
            const parentId = action.payload;
            const newWord = { /* as defined before */ };
            const words = [...state.words, newWord];
            // 親の lower_covers に追加
            words[parentId] = {
                ...words[parentId],
                lower_covers: [...words[parentId].lower_covers, newWord.id]
            };
            return { ...state, words };
        }
        case 'DELETE_WORD': {
            const { id, moveTo } = action.payload;
            // 前述の deleteWord ロジックを reducer 化
            // ...
            return { ...state, words: newWords };
        }
        case 'TOGGLE_OPEN': {
            const set = new Set(state.openSet);
            if (set.has(action.payload)) set.delete(action.payload);
            else set.add(action.payload);
            return { ...state, openSet: Array.from(set) };
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
        openSet: [],
        focusId: null,
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
