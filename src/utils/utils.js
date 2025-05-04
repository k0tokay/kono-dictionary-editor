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

export function allCoversAreMinimal(dict) {
    const { words } = dict;

    // helper – x–y エッジが冗長か?
    const isRedundant = (x, y, direction) => {
        for (const zWord of words) {
            if (!zWord) continue;
            const z = zWord.id;
            if (z === x || z === y) continue;

            if (direction === 'upper') {
                // y ≥ z ≥ x
                if (hasPath(y, z, dict) && hasPath(z, x, dict)) return true;
            } else {
                // x ≥ z ≥ y
                if (hasPath(x, z, dict) && hasPath(z, y, dict)) return true;
            }
        }
        return false;
    };

    for (const w of words) {
        if (!w) continue;
        const x = w.id;

        // ---- 上位被覆 ----
        for (const y of w.upper_covers || []) {
            if (isRedundant(x, y, 'upper')) {
                alert(
                    `非最短リンク: ${words[x].entry}(${x}) ←→ ${words[y].entry}(${y}) は冗長です`
                );
                return false;
            }
        }

        // ---- 下位被覆 ----
        for (const y of w.lower_covers || []) {
            if (isRedundant(x, y, 'lower')) {
                alert(
                    `非最短リンク: ${words[x].entry}(${x}) ←→ ${words[y].entry}(${y}) は冗長です`
                );
                return false;
            }
        }
    }
    return true;      // すべて即被覆
}


export function repairMinimalCovers(dict) {
    const { words } = dict;

    // x–y エッジが冗長か判定（direction='upper' | 'lower'）
    const isRedundant = (x, y, direction) => {
        for (const zWord of words) {
            if (!zWord) continue;
            const z = zWord.id;
            if (z === x || z === y) continue;
            if (direction === 'upper') {
                // y ≥ z ≥ x
                if (hasPath(y, z, dict) && hasPath(z, x, dict)) return true;
            } else {
                // x ≥ z ≥ y
                if (hasPath(x, z, dict) && hasPath(z, y, dict)) return true;
            }
        }
        return false;
    };

    for (const w of words) {
        if (!w) continue;
        const x = w.id;

        // 1) upper_covers を修正
        {
            const kept = [];
            for (const y of w.upper_covers || []) {
                if (isRedundant(x, y, 'upper')) {
                    // 冗長と判定 → 親側の lower_covers から x を除去
                    words[y].lower_covers = (words[y].lower_covers || [])
                        .filter(id => id !== x);
                } else {
                    kept.push(y);
                }
            }
            // 重複を除いてから代入
            w.upper_covers = Array.from(new Set(kept));

            // 親側の lower_covers も重複排除
            for (const y of w.upper_covers) {
                words[y].lower_covers = Array.from(
                    new Set(words[y].lower_covers || [])
                );
            }
        }

        // 2) lower_covers を修正
        {
            const kept = [];
            for (const y of w.lower_covers || []) {
                if (isRedundant(x, y, 'lower')) {
                    // 冗長と判定 → 子側の upper_covers から x を除去
                    words[y].upper_covers = (words[y].upper_covers || [])
                        .filter(id => id !== x);
                } else {
                    kept.push(y);
                }
            }
            // 重複を除いてから代入
            w.lower_covers = Array.from(new Set(kept));

            // 子側の upper_covers も重複排除
            for (const y of w.lower_covers) {
                words[y].upper_covers = Array.from(
                    new Set(words[y].upper_covers || [])
                );
            }
        }
    }
}
export function removeRedundantEdges(dict) {
    const { words } = dict;
    let changed = false;
    let alerted = false;

    // すべての直接エッジ一覧を取得
    const edges = [];
    for (const w of words) {
        if (!w) continue;
        const x = w.id;
        for (const y of w.lower_covers || []) {
            edges.push({ source: x, target: y });
        }
    }

    // 各エッジを試しに外して、別経路があるか確認
    for (const { source, target } of edges) {
        // 1) 外す
        words[source].lower_covers = words[source].lower_covers.filter(id => id !== target);
        words[target].upper_covers = words[target].upper_covers.filter(id => id !== source);

        // 2) alternative path があるか？
        //    hasPath は「lower_covers をたどって target に到達できるか」
        const alternative = hasPath(source, target, dict);

        if (!alternative) {
            // 代替経路が無ければ「真の cover edge」なので復元
            words[source].lower_covers.push(target);
            words[target].upper_covers.push(source);
        } else {
            // 代替経路があれば冗長エッジ => 削除確定
            if (!alerted) { // 一度だけアラート
                alert(
                    `冗長エッジ削除: ${words[source].entry}(${source}) → ${words[target].entry}(${target})`
                );
                alerted = true;
            }
            changed = true;
        }
    }

    return changed;
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
                Array.from(new Set(newUppers).add(pid)); // 重複を除いて追加
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

export function checkIntegrity(dict) {
    const noCycle = hasNoCycle(dict);
    let minimalOk = false;
    let subseqOk = false;

    if (noCycle) { // 循環がなければ←それでいいのか？
        // 冗長エッジを削除できたか?
        const removed = removeRedundantEdges(dict);
        console.log('removed:', removed);

        // removed===false のとき「最短被覆だった」→ minimalOk=true
        minimalOk = !removed;

        // （音列の部分文字列チェックなどを入れる場合はここで）
        // subseqOk = repairSubseqCovers(dict) など
    }

    return { noCycle, minimalOk, subseqOk };
}

export const isValidWordTag = (words, wordId) => {
    if (wordId === null || wordId === undefined || wordId === "") {
        return false;
    }
    const num = Number(wordId);
    return Number.isInteger(num) && num >= 0 && words[num] !== null;
}