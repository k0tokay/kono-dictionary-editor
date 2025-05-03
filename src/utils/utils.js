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

/** 再帰で「自分→祖先」をたどる関数 */
export function ancestorList(words, id, seen = new Set()) {
    if (seen.has(id)) return [];
    seen.add(id);
    const word = words[id];
    const parents = word.upper_covers || [];
    // 自分 + すべての祖先
    return [id, ...parents.flatMap(pid => ancestorList(words, pid, seen))];
}

/**
 * dict.words[start] → ... → dict.words[target] の経路があるか
 */
export function hasPath(start, target, dict, seen = new Set()) {
    if (start === target) return true;
    if (seen.has(start)) return false;
    seen.add(start);
    for (const nxt of dict.words[start]?.lower_covers || []) {
        if (hasPath(nxt, target, dict, seen)) return true;
    }
    return false;
}

/**
 * 周回がないか全要素チェック
 * @returns true: 循環なし, false: 循環あり (見つけたら即 false)
 */
export function hasNoCycle(dict) {
    const { words } = dict;

    function dfs(start, cur, visited) {
        if (visited.has(cur)) return true;
        visited.add(cur);
        for (const nxt of words[cur]?.lower_covers || []) {
            if (nxt === start) {
                // 循環検出
                alert(`循環検出: ${words[start].entry}(${start}) と ${words[cur].entry}(${cur}) の間にループがあります`);
                return false;
            }
            if (!dfs(start, nxt, visited)) {
                return false;
            }
        }
        return true;
    }

    for (let i = 0; i < words.length; i++) {
        if (words[i] && !dfs(i, i, new Set())) {
            return false;
        }
    }
    return true;
}

/**
 * 「被覆エッジ」がすべて Hasse 図の最短エッジかチェック
 * x.upper_covers に y が含まれるとき、間に z がいないか調べる
 * @returns true: 全て最短, false: 冗長リンクあり
 */
export function allCoversAreMinimal(dict) {
    const { words } = dict;
    for (const xWord of words) {
        if (!xWord) continue;
        const x = xWord.id;
        for (const y of xWord.upper_covers || []) {
            // x ≤ y が即被覆（親子リンク）なら、間に z がないか
            for (const zWord of words) {
                if (!zWord) continue;
                const z = zWord.id;
                if (z === x || z === y) continue;
                // x ≤ z ≤ y を満たす中間要素がいたら冗長
                if (hasPath(z, x, dict) && hasPath(y, z, dict)) {
                    alert(
                        `非最短リンク検出: ` +
                        `${xWord.entry}(${x}) — ${words[y].entry}(${y}) の間に ` +
                        `${zWord.entry}(${z}) が挟まれています`
                    );
                    return false;
                }
            }
        }
    }
    return true;
}


/**
 * 冗長な被覆リンクを除去して最短化する
 */
export function repairMinimalCovers(dict) {
    const { words } = dict;
    for (const xWord of words) {
        if (!xWord) continue;
        const x = xWord.id;
        const goodParents = [];
        for (const y of xWord.upper_covers || []) {
            let isRedundant = false;
            for (const zWord of words) {
                if (!zWord) continue;
                const z = zWord.id;
                if (z === x || z === y) continue;
                if (hasPath(z, x, dict) && hasPath(y, z, dict)) {
                    isRedundant = true;
                    break;
                }
            }
            if (isRedundant) {
                // 冗長と判定された親 y から、自 x を除去
                words[y].lower_covers = words[y].lower_covers.filter(id => id !== x);
            } else {
                goodParents.push(y);
            }
        }
        xWord.upper_covers = goodParents;
    }
}

/**
 * 音列カテゴリの順序関係をチェック
 * @returns true: 全て正しい部分列関係, false: 誤ったリンクあり
 */
export function repairSubseqCovers(dict) {
    let allValid = true;
    const { words } = dict;

    for (const w of words) {
        if (!w || w.category !== '音列') continue;
        const s = w.entry;
        // 親一覧 (upper_covers) 側を検査
        const newUppers = [];
        for (const pid of w.upper_covers || []) {
            const p = words[pid];
            if (p && s.includes(p.entry)) {
                newUppers.push(pid);
            } else {
                allValid = false;
                // 親側の下位リンクからも除去
                if (p) p.lower_covers = p.lower_covers.filter(id => id !== w.id);
            }
        }
        w.upper_covers = newUppers;
    }

    return allValid;
}

/**
 * 全体整合性チェック + 必要に応じて自動修正
 * → 循環検出 → 被覆の最短化 → 音列部分列関係の修正
 *
 * @param {{ words: Array } } dict
 * @returns {{ noCycle: boolean, minimalOk: boolean, subseqOk: boolean }}
 */
export function checkIntegrity(dict) {
    const noCycle = hasNoCycle(dict);
    let minimalOk = false;
    let subseqOk = false;

    if (noCycle) {
        minimalOk = allCoversAreMinimal(dict);
        if (!minimalOk) {
            repairMinimalCovers(dict);
        }

        // subseqOk = repairSubseqCovers(dict);
    }

    return { noCycle, minimalOk, subseqOk };
}
