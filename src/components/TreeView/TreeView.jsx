import React from 'react';
import { useDictState, useDictDispatch } from '../../store/DictionaryContext';
import './TreeView.scss';

/** 再帰で「自分→祖先」をたどる関数 */
export function ancestorList(dict, id, seen = new Set()) {
  if (seen.has(id)) return [];
  seen.add(id);
  const word = dict.words[id];
  const parents = word.upper_covers || [];
  // 自分 + すべての祖先
  return [id, ...parents.flatMap(pid => ancestorList(dict, pid, seen))];
}

/** 単一ノード */
function WordItem({ id }) {
  const { words, openSet, focusId, editedSet } = useDictState();
  const dispatch = useDictDispatch();
  const word = words[id];
  const children = word.lower_covers || [];
  const isOpen = openSet.includes(id);
  const hasChildren = children.length > 0;

  // editedSet が Context にない場合は空 Set で
  const editedIds = editedSet || new Set();
  // 編集のあった単語の祖先すべてを集める
  const highlights = new Set();
  editedIds.forEach(eid =>
    ancestorList(words, eid).forEach(aid => highlights.add(aid))
  );

  const handleClick = () => {
    dispatch({ type: 'TOGGLE_OPEN', payload: id });
    dispatch({ type: 'SET_FOCUS', payload: id });
  };

  return (
    <li>
      <span
        className={[
          'wordItemMain',
          isOpen && 'open',
          hasChildren && 'hasChildren',
          focusId === id && 'focus',
          highlights.has(id) && 'edited'
        ].filter(Boolean).join(' ')}
        onClick={handleClick}
      >
        <span className="id">{id}</span>
        <span className="entry">{word.entry}</span>
      </span>

      {isOpen && hasChildren && (
        <ul className="wordItemChildren">
          {children.map(childId =>
            <WordItem key={childId} id={childId} />
          )}
        </ul>
      )}
    </li>
  );
}

/** カテゴリルート配下を表示 */
export function WordTree() {
  const { words } = useDictState();

  // 「カテゴリ」ラベルをルートとみなすノードID一覧
  const roots = words
    .map((w, i) => (w && w.category === 'カテゴリ' ? i : -1))
    .filter(i => i !== -1);

  return (
    <div className="wordTree">
      <ul>
        {roots.map(id => <WordItem key={id} id={id} />)}
      </ul>
    </div>
  );
}
