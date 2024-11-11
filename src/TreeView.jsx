import { useEffect, useState } from 'react';
import "./TreeView.scss";
import RenderInfo from "./DetailFrame";

function WordItem({ word, dict, showDetails, editedSet }) {
  const [isOpen, setIsOpen] = useState(false);
  const { id, entry, children } = word;
  const hasChildren = children.length > 0;

  const parentList = (id) => {
    const parentRec = (id) => {
      const word = dict.words[id];
      if (word.parent == null) {
        return [id];
      }
      return [id, ...parentRec(word.parent)];
    }
    return parentRec(id);
  };

  const upward = (editedList) => {
    const allParents = [];
    editedList.forEach(id => {
      allParents.push(id, ...parentList(id));
    });
    return new Set(allParents);
  };

  const handleClick = () => {
    setIsOpen(!isOpen);
    showDetails(word);
  };

  return (
    <li>
      <span
        className={`wordItemMain ${isOpen ? "open" : ""} ${hasChildren ? "hasChildren" : ""} ${upward(editedSet).has(word.id) ? "edited" : undefined}`}
        onClick={handleClick}
      >
        <span className="id">{id}</span>
        <span className="entry">{entry}</span>
      </span>
      {isOpen && hasChildren && (
        <ul className="wordItemChildren">
          {children.map(i => (
            <WordItem key={i} word={dict.words[i]} dict={dict} showDetails={showDetails} editedSet={editedSet} />
          ))}
        </ul>
      )}
    </li>
  );
}

export default WordItem;