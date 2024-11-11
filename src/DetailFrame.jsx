import { useState, useEffect } from 'react';
import './DetailFrame.scss';

function BasicForm({ name, title, value, edited = false, updateData = (...args) => { },
  isReadOnly = false, isList = false, isMultiline = false }) {
  const [text, setText] = useState("");
  useEffect(() => {
    setText(value);
  }, [value, edited]);
  const handleChange = (e) => {
    setText(e.target.value);
    updateData(name, title, e.target.value);
  }

  const editArea = isMultiline ? (
    <textarea
      name={name}
      id={name}
      rows="3"
      value={text}
      onChange={handleChange}
      readOnly={isReadOnly}
    ></textarea>
  ) : (
    <input
      type="text"
      id={name}
      name={name}
      value={text}
      onChange={handleChange}
      readOnly={isReadOnly}
      required
    />
  );

  return (
    <div className={["basicForm", edited ? "edited" : undefined].join(" ")}>
      <label htmlFor={name}>{title}</label>
      {editArea}
    </div>
  );
}


function TagForm({ name, title, tags, updateData = (...args) => { },
  isList = true, isWord = false, dict = null }) {
  const tagList_tmp = isList ? tags : (tags ? [tags] : []);
  const tagList = tagList_tmp.map(tag => (isWord && dict ? dict.words[tag].entry : tag));
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  }
  return <div className='tagForm'>
    <p>{title}</p>
    <div className='innerTagForm'>
      {tagList.map((tag, i) => (
        <span
          className='tagSpan'
          key={i}
          contentEditable
          suppressContentEditableWarning={true}
          onKeyDown={handleKeyDown}
        >
          {tag}
        </span>
      ))}
    </div>
  </div>
}

function LargeForm({ name, title_h, title_c, content }) {
  const { title, text } = content;
  return (
    <div>
      <BasicForm name={`${name}_h`} title={title_h} value={title} />
      <BasicForm name={`${name}_c`} title={title_c} value={text} isMultiline={true} />
    </div>
  );
}

function LargeListForm({ name, title, title_h, title_c, contents }) {
  return (
    <div className="largeListForm">
      <p>{title}</p>
      <div className='innerLargeListForm'>
        {contents.map(content =>
          <LargeForm name={name} title_h={title_h} title_c={title_c} content={content} />
        )}
      </div>
    </div>
  );
}

function MenuBar({ menuItems }) {
  return (
    <div className="menuBar">
      {menuItems.map((item, i) => (
        <button key={i} onClick={item.onClick} className="menuButton">
          {item.title}
        </button>
      ))}
    </div>
  );
}

function RenderInfo({ word, dict = null, updateData = (...args) => { }, saveData = (...args) => { } }) {
  const [wordState, setWordState] = useState(word);
  const [editedSet, setEditedSet] = useState(new Set([]));
  useEffect(() => {
    setWordState(word);
    setEditedSet(new Set([]));
  }, [word]);
  const getData = (name, title, value) => {
    const newWord = { ...wordState, [name]: value };
    setWordState(newWord);
    updateData(newWord);
    setEditedSet(new Set([...editedSet, name]));
  }

  const menuItems = [
    {
      title: "保存",
      onClick: () => {
        saveData(wordState);
        setEditedSet(new Set([]));
      }
    }
  ];

  return (
    <div>
      <MenuBar menuItems={menuItems} />
      <div className='infoContainer'>
        <BasicForm name="id" title="ID" value={wordState.id} isReadOnly={true} />
        <BasicForm name="entry" title="綴り" value={wordState.entry} updateData={getData} edited={editedSet.has("entry")} />
        <BasicForm name="translations" title="翻訳" value={wordState.translations} isList={true} isMultiline={true} updateData={getData} edited={editedSet.has("translations")} />
        <BasicForm name="simple_translations" title="簡易的な翻訳" value={wordState.simple_translations} isList={true} isMultiline={true} updateData={getData} edited={editedSet.has("simple_translations")} />
        <TagForm name="parent" title="上位語" tags={wordState.parent} isList={false} isWord={true} dict={dict} />
        <TagForm name="children" title="下位語" tags={wordState.children} isList={true} isWord={true} dict={dict} />
        <TagForm name="arguments" title="引数" tags={wordState.arguments} isList={true} isWord={true} dict={dict} />
        <TagForm name="tags" title="タグ" tags={wordState.tags} />
        <LargeListForm name="contents" title="内容" title_h="見出し" title_c="内容" contents={wordState.contents} />
        <LargeListForm name="variations" title="変化形" title_h="種類" title_c="変化形" contents={wordState.variations} />
      </div>
    </div>
  );
}

export default RenderInfo;