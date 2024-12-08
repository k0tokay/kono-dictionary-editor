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
  if (id !== null) {
    return [dict.words[id]];
  }

  const words = Object.values(dict.words);
  const result = [];

  for (let i = 0; i < words.length; i++) {
    if (words[i] === null) {
      continue;
    }

    const entryMatches =
      entry === null ||
      (entry instanceof RegExp ? entry.test(words[i].entry) : words[i].entry === entry);

    const translationsMatches =
      translations === null ||
      (translations instanceof RegExp ? translations.test(words[i].translations) : words[i].translations === translations);

    if (entryMatches && translationsMatches) {
      result.push(words[i]);
    }
  }
  return result;
}

export { RightClickMenu, search };