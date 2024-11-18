// import { useState, useEffect } from 'react';
import './DetailFrame.scss';

function BasicForm({ name, title, value, edited = false, updateData,
  isReadOnly = false, isList = false, isMultiline = false }) {
  //const [text, setText] = useState("");
  const text = value;
  // useEffect(() => {
  //   setText(value);
  // }, [value]);
  const handleChange = (e) => {
    //setText(e.target.value);
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
    <div className="basicForm">
      <label htmlFor={name} className={edited ? "edited" : ""}>{title}</label>
      {editArea}
    </div>
  );
}

function TagWordDetails({ word, onClick }) {

  return (
    <div className='tagWordDetails'>
      <div className='paddingBox'>
        <div
          className='innerTagWordDetails'
          onClick={onClick}
        >
          <span className='id'>{word.id}</span>
          <span className='entry'>{word.entry}</span>
          <span className='translations'>{word.translations}</span>
        </div>
      </div>
    </div>
  );
}

function TagForm({ name, title, tags, updateData, onClick, edited = false,
  isList = true, isWord = false, dict = null }) {
  //const [tagList, setTagList] = useState(isList ? tags : (tags ? [tags] : [])); // 上位語はlistになってないので
  const tagList = isList ? tags : (tags !== null ? [tags] : []);
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  }
  // useEffect(() => {
  //   setTagList(isList ? tags : (tags ? [tags] : []));
  // }, [tags]);

  const handleChange = (e) => {
    const newTag = e.target.textContent;
    const key = Number(e.target.id);
    const newTagList = tagList.map((tag, i) => (i === key ? newTag : tag));
    const newTags = !isList ? (newTagList.length !== 0 ? newTagList[0] : null) : newTagList;
    updateData(name, title, newTags);
  }
  const handleChange_01 = (e) => {
    updateData(name, title, tags); // 編集済み属性をつけるだけ
  }
  const addTag = () => {
    const newTagList = isList ? [...tagList, ""] : (tagList.length === 0 ? [""] : tagList);
    const newTags = !isList ? (newTagList.length !== 0 ? newTagList[0] : null) : newTagList;
    updateData(name, title, newTags);
  }

  return <div className='tagForm' name={name} title={title}>
    <div className='tagHeader'>
      <p className={edited ? "edited" : ""}>{title}</p>
      <button onClick={addTag} >追加</button>
    </div>
    <div className='innerTagForm'>
      {tagList.map((tag, i) => (
        <div key={`tag_${i}`}>
          {isWord && dict && dict.words[tag] ? <TagWordDetails word={dict.words[tag]} onClick={onClick?.(tag)} /> : null}
          <span
            id={i}
            className='tagSpan'
            contentEditable
            suppressContentEditableWarning={true}
            onKeyDown={handleKeyDown}
            onBlur={handleChange}
            onInput={handleChange_01}
          //onContextMenu={handleContextMenu}
          >
            {isWord && dict && dict.words[tag] ? dict.words[tag].entry : tag}
          </span>
        </div>
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
        <button key={i} onClick={item.onClick}>
          {item.title}
        </button>
      ))}
    </div>
  );
}

function RenderInfo({ word, dict, updateData, editedSet }) {
  // const [wordState, setWordState] = useState(word);
  // const [editedSet, setEditedSet] = useState(new Set([]));
  // useEffect(() => {
  //   setWordState(word);
  //   setEditedSet(new Set([]));
  // }, [word]);
  const getData = (name, title, value) => {
    const newWord = { ...word, [name]: value };
    // setWordState(newWord);
    const newSet = new Set([...editedSet, name]);
    updateData({ word: newWord, editedAttrSet: newSet, commandList: [] });
  }

  const handleTagClick = (id) => () => {
    updateData({ word: word, editedAttrSet: editedSet, commandList: [["tree_display", id]] });
  }

  const menuItems = [
    {
      title: "保存",
      onClick: () => {
        updateData({ word: word, editedAttrSet: editedSet, commandList: ["save"] });
      }
    }
  ];

  return (
    <div>
      <MenuBar menuItems={menuItems} />
      <div className='infoContainer'>
        <BasicForm name="id" title="ID" value={word.id} isReadOnly={true} />
        <BasicForm name="entry" title="綴り" value={word.entry} updateData={getData} edited={editedSet.has("entry")} />
        <BasicForm name="translations" title="翻訳" value={word.translations} isList={true} isMultiline={true} updateData={getData} edited={editedSet.has("translations")} />
        <BasicForm name="simple_translations" title="簡易的な翻訳" value={word.simple_translations} isList={true} isMultiline={true} updateData={getData} edited={editedSet.has("simple_translations")} />
        <TagForm name="parent" title="上位語" tags={word.parent} isList={false} isWord={true} dict={dict} onClick={handleTagClick} updateData={getData} edited={editedSet.has("parent")} />
        <TagForm name="children" title="下位語" tags={word.children} isList={true} isWord={true} dict={dict} onClick={handleTagClick} updateData={getData} edited={editedSet.has("children")} />
        <TagForm name="arguments" title="引数" tags={word.arguments} isList={true} isWord={true} dict={dict} onClick={handleTagClick} />
        <TagForm name="tags" title="タグ" tags={word.tags} updateData={getData} edited={editedSet.has("tags")} />
        <LargeListForm name="contents" title="内容" title_h="見出し" title_c="内容" contents={word.contents} />
        <LargeListForm name="variations" title="変化形" title_h="種類" title_c="変化形" contents={word.variations} />
      </div>
    </div>
  );
}

export default RenderInfo;