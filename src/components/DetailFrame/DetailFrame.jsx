// src/components/DetailFrame/DetailFrame.jsx
import React from 'react';
import { useDictState, useDictDispatch } from '../../store/DictionaryContext';
import { search } from '../../utils/utils.js';
import { BasicForm, TagForm, LargeListForm, MenuBar } from '../CommonForms';
import './DetailFrame.scss';

// ──────────────────────────────────────────
// DetailFrame 本体
// ──────────────────────────────────────────

export default function DetailFrame() {
  const { words, focusId, editedSet } = useDictState();
  const dispatch = useDictDispatch();
  const word = words[focusId];
  const dict = { words };

  // フィールド更新
  const handleChange = (field, value) => {
    dispatch({ type: 'UPDATE_FIELD', payload: { id: focusId, field, value } });
  };

  // 追加／削除はすべて context reducer へ
  const handleAdd = () => {
    dispatch({ type: 'ADD_WORD', payload: focusId });
    dispatch({ type: 'OPEN_WORD', payload: focusId });
  };
  const handleDelete = () => dispatch({ type: 'DELETE_WORD', payload: { id: focusId, moveTo: null } });

  // 詳細メニューバー
  const menuItems = [
    { title: '追加', onClick: handleAdd },
    { title: '削除', onClick: handleDelete }
  ];

  return (
    <div className="renderInfo">
      <MenuBar items={menuItems} />
      <div className="infoContainer">
        <BasicForm name="id" title="ID" value={word.id} isReadOnly />
        <BasicForm name="entry" title="綴り" value={word.entry} edited={editedSet.has('entry')} onChange={handleChange} />
        <BasicForm
          name="translations"
          title="翻訳"
          value={word.translations}
          edited={editedSet.has('translations')}
          isList
          isMultiline
          onChange={handleChange}
        />
        <BasicForm
          name="simple_translations"
          title="簡易的な翻訳"
          value={word.simple_translations}
          edited={editedSet.has('simple_translations')}
          isList
          isMultiline
          onChange={handleChange}
        />
        <TagForm
          name="upper_covers"
          title="上位語"
          tags={word.upper_covers}
          edited={editedSet.has('upper_covers')}
          isWord
          dict={dict}
          onChange={handleChange}
          onClick={(id) => dispatch({ type: 'SET_FOCUS', payload: id })}
        />
        <TagForm
          name="lower_covers"
          title="下位語"
          tags={word.lower_covers}
          edited={editedSet.has('lower_covers')}
          isWord
          dict={dict}
          onChange={handleChange}
          onClick={(id) => dispatch({ type: 'SET_FOCUS', payload: id })}
        />
        <TagForm
          name="arguments"
          title="引数"
          tags={word.arguments}
          edited={editedSet.has('arguments')}
          isWord
          dict={dict}
          onChange={handleChange}
          onClick={(id) => dispatch({ type: 'SET_FOCUS', payload: id })}
        />
        <TagForm
          name="tags"
          title="タグ"
          tags={word.tags}
          edited={editedSet.has('tags')}
          onChange={handleChange}
        />
        <LargeListForm
          name="contents"
          title="内容"
          title_h="見出し"
          title_c="内容"
          contents={word.contents}
          edited={editedSet.has('contents')}
          onChange={handleChange}
        />
        <LargeListForm
          name="variations"
          title="変化形"
          title_h="種類"
          title_c="変化形"
          contents={word.variations}
          edited={editedSet.has('variations')}
          onChange={handleChange}
        />
      </div>
    </div>
  );
}
