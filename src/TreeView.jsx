// import { useEffect, useState } from 'react';
import "./TreeView.scss";

function parentList(dict, id) {
  const parentRec = (id) => {
    const word = dict.words[id];
    if (word.parent == null) {
      return [id];
    }
    return [id, ...parentRec(word.parent)];
  }
  return parentRec(id);
};

function WordItem({ word, dict, showDetails, editedSet, isOpenSet, updateData, focusId }) {
  const isOpen = isOpenSet.has(word.id);
  const { id, entry, children } = word;
  const hasChildren = children.length > 0;

  const upward = (editedSet) => {
    const editedWordSet = new Set(Object.keys(editedSet).map(Number));
    const allParents = [];
    editedWordSet.forEach(id => {
      allParents.push(id, ...parentList(dict, id));
    });
    return new Set(allParents);
  };

  const handleClick = () => {
    // setIsOpen(!isOpen);
    updateData({ word, isOpen: !isOpen });
    showDetails(word);
  };

  return (
    <li>
      <span
        className={`wordItemMain ${isOpen ? "open" : ""} ${hasChildren ? "hasChildren" : ""} ${focusId === word.id ? "focus" : ""} ${upward(editedSet).has(word.id) ? "edited" : ""}`}
        onClick={handleClick}
      >
        <span className="id">{id}</span>
        <span className="entry">{entry}</span>
      </span>
      {isOpen && hasChildren && (
        <ul className="wordItemChildren">
          {children.map(i => (
            <WordItem key={i} word={dict.words[i]} dict={dict} showDetails={showDetails} editedSet={editedSet} isOpenSet={isOpenSet} updateData={updateData} focusId={focusId} />
          ))}
        </ul>
      )}
    </li>
  );
}

function WordTree({ dict, updateData, editedSet, showDetails, isOpenSet, focusId }) {
  const categoryIndices = dict.words
    .map((word, i) => (word && word.category === "カテゴリ" ? i : -1))
    .filter(i => i !== -1);
  return <div className="wordTree">
    <ul>
      {categoryIndices.map(i => (
        <WordItem key={i} word={dict.words[i]} dict={dict} showDetails={showDetails} editedSet={editedSet} isOpenSet={isOpenSet} updateData={updateData} focusId={focusId} />
      ))}
    </ul>
  </div>
}

export { parentList, WordTree };
