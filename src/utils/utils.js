/**
 * lower_covers 方向に再帰的にたどって
 * start → target の経路があれば true
 */
export function hasPath(start, target, dict, seen = new Set()) {
    if (start === target) return true;
    if (seen.has(start)) return false;
    seen.add(start);
    for (const nxt of dict.words[start].lower_covers) {
        if (hasPath(nxt, target, dict, seen)) return true;
    }
    return false;
}

export function createBlankWord(parentId, parentCategory, nextId) {
    const category = parentCategory === 'カテゴリ' ? parentCategory : parentCategory;
    return {
        id: nextId,
        entry: '',
        translations: [],
        simple_translations: [],
        category,
        upper_covers: [parentId],
        lower_covers: [],
        arguments: [],
        tags: [],
        contents: [],
        variations: [],
        is_function: false
    };
}

/**
 * word.upper_covers / word.lower_covers を見て
 * 双方向リンクを張り直し、かつサイクル検出を行う
 *
 * @param {object} word  編集済みの単語オブジェクト
 * @param {object} dict  辞書データ全体 ( { words: [...] } )
 * @returns {boolean}    サイクルがなければ true、あれば false
 */
export function reconcileCovers(word, dict) {
    // 1) 古いリンクを全部はずす
    ['upper_covers', 'lower_covers'].forEach(key => {
        const opp = key === 'upper_covers' ? 'lower_covers' : 'upper_covers';
        dict.words[word.id][key].forEach(id => {
            dict.words[id][opp] = dict.words[id][opp].filter(x => x !== word.id);
        });
        dict.words[word.id][key] = [];
    });

    // 2) 上位リンクを安全チェック＋追加
    for (const pid of word.upper_covers) {
        if (hasPath(word.id, pid, dict)) {
            alert(`循環検出: ${pid} を上位語に追加できません`);
            return false;
        }
        dict.words[word.id].upper_covers.push(pid);
        dict.words[pid].lower_covers.push(word.id);
    }

    // 3) 下位リンクも同様に
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


export function search(dict, id, entry, translations) {
    if (Number(id) && dict.words[id]) {
        return [dict.words[id]];
    }

    const words = Object.values(dict.words);
    const result = [];

    for (let i = 0; i < words.length; i++) {
        if (words[i] === null) {
            continue;
        }

        const match = (query, item) => {
            if (query === null) {
                return true;
            } else if (typeof query === 'string') {
                try {
                    const regex = new RegExp(query);
                    return regex.test(item);
                } catch (e) {
                    return item === query;
                }
            } else if (query instanceof RegExp) {
                return query.test(item);
            } else {
                return false;
            }
        };

        const entryMatches = match(entry, words[i].entry);

        const translationsMatches = match(translations, words[i].translations);

        if (entryMatches && translationsMatches) {
            result.push(words[i]);
        }
    }
    return result;
}