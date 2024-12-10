import { useState, useEffect } from 'react';
import { search } from './Basic';
import './DetailFrame.scss';

const punctuations = ['，', ',', '、'];
const puncRegex = new RegExp(`[${punctuations.join('')}]`)
const splitPunc = (text) => text.split(puncRegex).map(x => x.trim()).filter(x => x !== "");

function BasicForm({ name, title, value, edited = false, updateData,
  isReadOnly = false, isList = false, isMultiline = false, buttons = [] }) {
  //const [text, setText] = useState("");
  const text = value;
  // useEffect(() => {
  //   setText(value);
  // }, [value]);
  const handleChange = (e) => {
    const value = e.target.value;
    const data = isList ? splitPunc(value) : value;
    updateData(name, title, data);
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
      <div className='basicHeader'>
        <label htmlFor={name} className={edited ? "edited" : ""}>{title}</label>
        {buttons.map((button, index) => (
          <button
            key={index}
            onClick={button.onClick}
            className={button.className || ''} // クラス名が渡されていれば追加
          >
            {button.label}
          </button>
        ))}
      </div>
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
    if (!isWord) {
      const newTags = !isList ? (newTagList.length !== 0 ? newTagList[0] : null) : newTagList;
      updateData(name, title, newTags);
    } else {
      const data = [];
      for (let i = 0; i < newTagList.length; i++) {
        const tag = newTagList[i];
        const num = Number(tag); // 実際はもともとint型だと思う
        if (Number.isInteger(num) && num > 0) {
          if (dict && dict.words[num]) {
            data.push(num);
            newTagList[i] = dict.words[num].entry;
          } else {
            data.push(tag);
          }
        } else {
          const ids = search(dict, null, tag, null).map(x => x.id);
          if (ids.length >= 1) {
            data.push(ids[0]);
          } else {
            data.push(tag);
          }
        }
      }
      const newTags = !isList ? (data.length !== 0 ? data[0] : null) : data;
      updateData(name, title, newTags);
    }
  }
  const isValid = (wordId) => {
    if (!isWord) return true;
    const num = Number(wordId);
    return Number.isInteger(num) && num >= 0 && dict && dict.words[num];
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
            className={'tagSpan' + (isWord && !isValid(tag) ? ' notValid' : '')}
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

function LargeForm({ name, title_h, title_c, content, updateData, isMultiline = true }) {
  const { title, text } = content;
  const getData = (name_hc, title, value) => {
    if (name_hc === `${name}_h`) {
      const newContent = { ...content, title: value };
      updateData(name, title, newContent);
    } else if (name_hc === `${name}_c`) {
      const newContent = { ...content, text: value };
      updateData(name, title, newContent);
    }
  }
  const buttons = [
    {
      label: "上へ",
      onClick: () => { updateData(name, title, content, ["up"]) }
    }, {
      label: "下へ",
      onClick: () => { updateData(name, title, content, ["down"]) }
    }, {
      label: "削除",
      onClick: () => { updateData(name, title, content, ["delete"]) }
    }
  ]
  return (
    <div>
      <BasicForm name={`${name}_h`} title={title_h} value={title} buttons={buttons} updateData={getData} />
      <BasicForm name={`${name}_c`} title={title_c} value={text} isMultiline={isMultiline} updateData={getData} />
    </div>
  );
}

function LargeListForm({ name, title, title_h, title_c, contents, edited = false, updateData, isMultiline = true }) {
  const addList = () => {
    const newContents = [...contents, { title: "", text: "" }];
    updateData(name, title, newContents);
  }
  const getData = (index) => (name, title, value, commandList) => {
    const newContents = [...contents];
    newContents[index] = value;
    if (commandList && commandList.length > 0) {
      for (const command of commandList) {
        if (command === "up") {
          if (index > 0) {
            const tmp = newContents[index - 1];
            newContents[index - 1] = newContents[index];
            newContents[index] = tmp;
          }
        } else if (command === "down") {
          if (index < newContents.length - 1) {
            const tmp = newContents[index + 1];
            newContents[index + 1] = newContents[index];
            newContents[index] = tmp;
          }
        } else if (command === "delete") {
          newContents.splice(index, 1);
        }
      }
    }
    updateData(name, title, newContents);
  }
  return (
    <div className="largeListForm">
      <div className='listHeader'>
        <p className={edited ? "edited" : ""}>{title}</p>
        <button onClick={addList} >追加</button>
      </div>
      <div className='innerLargeListForm'>
        {contents.map((content, i) =>
          <LargeForm key={i} name={name} title_h={title_h} title_c={title_c} content={content} updateData={getData(i)} isMultiline={isMultiline} />
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
  //   setEditedSset(new Set([]));
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
    }, {
      title: "削除",
      onClick: () => {
        updateData({ word: word, editedAttrSet: editedSet, commandList: ["delete"] });
      }
    }
  ];

  // ショートカットキー
  useEffect(() => {
    const handleShortcut = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        updateData({ word: word, editedAttrSet: editedSet, commandList: ["save"] });
      }
    };

    window.addEventListener('keydown', handleShortcut);

    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

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
        <TagForm name="arguments" title="引数" tags={word.arguments} isList={true} isWord={true} dict={dict} onClick={handleTagClick} updateData={getData} edited={editedSet.has("arguments")} />
        <TagForm name="tags" title="タグ" tags={word.tags} updateData={getData} edited={editedSet.has("tags")} />
        <LargeListForm name="contents" title="内容" title_h="見出し" title_c="内容" contents={word.contents} updateData={getData} edited={editedSet.has("contents")} isMultiline={true} />
        <LargeListForm name="variations" title="変化形" title_h="種類" title_c="変化形" contents={word.variations} updateData={getData} edited={editedSet.has("variations")} isMultiline={false} />
      </div>
    </div>
  );
}

export { BasicForm, RenderInfo };