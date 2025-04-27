// src/store/DictionaryContext.jsx
import React, { createContext, useReducer, useContext } from 'react';
import initialData from '../data/konomeno-v5.json';
import { reconcileCovers, hasPath, createBlankWord } from '../utils/utils.js';

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
        // ───────────────────────────
        case 'ADD_WORD': {
            const parentId = action.payload;
            const parent = state.words[parentId];
            if (!parent) return state;

            const newWord = createBlankWord(parentId, parent.category, state.words.length);
            const words = [...state.words, newWord];

            // 親 → 子 (lower_covers) を更新
            words[parentId] = {
                ...parent,
                lower_covers: [...parent.lower_covers, newWord.id]
            };

            return { ...state, words, focusId: newWord.id };
        }

        // ───────────────────────────
        case 'DELETE_WORD': {
            const { id, moveTo } = action.payload;
            const victim = state.words[id];
            if (!victim) return state;

            const words = state.words.slice();

            // 1. 既存リンク解除 (親 ↔ 子)
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

            // 2. 子を moveTo に付け替える or 再帰削除
            if (moveTo != null && moveTo !== '') {
                victim.lower_covers.forEach(cid => {
                    if (hasPath(cid, moveTo, { words })) {
                        // 循環になるのでスキップ
                        return;
                    }
                    words[cid].upper_covers.push(moveTo);
                    words[moveTo].lower_covers.push(cid);
                });
            } else {
                // 再帰的に null
                const rmrf = wid => {
                    words[wid]?.lower_covers.forEach(rmrf);
                    words[wid] = null;
                };
                rmrf(id);
            }

            // 3. 自分を null
            words[id] = null;

            // 4. 新しいフォーカス
            const newFocus = moveTo != null && moveTo !== ''
                ? moveTo
                : (victim.upper_covers[0] ?? 0);

            return { ...state, words, focusId: newFocus };
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
