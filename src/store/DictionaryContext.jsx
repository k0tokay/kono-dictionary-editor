// src/store/DictionaryContext.jsx
import React, { createContext, useReducer, useContext } from 'react';
import initialData from '../data/konomeno-v5.json';
// import { reconcileCovers } from './reconcile';  // 従来の整合性関数

function reconcileCovers(word, dict) {
    // 既存の双方向リンクを一旦すべて外す
    ['upper_covers', 'lower_covers'].forEach(key => {
        const opp = key === 'upper_covers' ? 'lower_covers' : 'upper_covers';
        dict.words[word.id][key].forEach(id => {
            dict.words[id][opp] = dict.words[id][opp].filter(x => x !== word.id);
        });
        dict.words[word.id][key] = [];
    });

    // 新しい上位リンクを張る前にサイクル検査
    for (const pid of word.upper_covers) {
        // もし自→親 の経路が既にあれば、親→自 を追加するとループになる
        if (hasPath(word.id, pid, dict)) {
            alert(`循環検出: ${pid} を上位語に追加できません`);
            return false;
        }
        // 問題なければ双方向リンクをセット
        dict.words[word.id].upper_covers.push(pid);
        dict.words[pid].lower_covers.push(word.id);
    }

    // 同様に下位リンクも張る（通常はこちらは親追加で十分ですが保険として）
    for (const cid of word.lower_covers) {
        if (hasPath(cid, word.id, dict)) {
            alert(`循環検出: ${cid} を下位語に追加できません`);
            return false;
        }
        dict.words[word.id].lower_covers.push(cid);
        dict.words[cid].upper_covers.push(word.id);
    }

    return true;
}

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
