import React, { useState } from "react";
import "./Basic.scss";

function RightClickMenu({ items, x = 0, y = 0, isMenuVisible = false }) {
  if (!isMenuVisible) return null;

  return (
    <ul className="rightClickMenu"
      style={{
        top: `${y}px`,
        left: `${x}px`,
      }}
    >
      {items.map((item, i) => (
        <li
          key={i}
          onClick={item.onClick}
          className="RCMenuItem"
        >
          {item.title}
        </li>
      ))}
    </ul>
  );
};

function search(dict, id, entry, translations) {
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

export { RightClickMenu, search };