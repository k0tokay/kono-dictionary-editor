import { useState, useEffect } from 'react';
import { search } from './Basic';
import { BasicForm } from './DetailFrame';
import './OtherFrames.scss';

function SearchesultTag({ word, updateData }) {
  // tagWordDetailsと似ている
  return <div
    className='searchResultTag'
    onClick={() => updateData(word)}
  >
    <span className='id'>{word.id}</span>
    <span className='entry'>{word.entry}</span>
    <span className='translations'>{word.translations}</span>
  </div >
}

function SearchFrame({ dict, updateData }) {
  // 検索内容は上に送らないのでuseStateで管理する
  const [id, setId] = useState("");
  const [entry, setEntry] = useState("");
  const [translations, setTranslations] = useState("");

  const notEmpty = id != "" || entry != "" || translations != "";
  const result = notEmpty ? search(dict, id ? id : null, entry ? entry : null, translations ? translations : null) : [];

  return (
    <div className="searchFrameContainer">
      <div className="searchFormContainer">
        <BasicForm name={"id"} title={"ID"} value={id} updateData={(name, title, value) => setId(value)} />
        <BasicForm name={"entry"} title={"綴り"} value={entry} updateData={(name, title, value) => setEntry(value)} />
        <BasicForm name={"translations"} title={"翻訳"} value={translations} updateData={(name, title, value) => setTranslations(value)} isMultiline={true} />
      </div>
      <div className="searchResultContainer">
        <span className='formHeader'>検索結果</span>
        <div className="textForm searchResult">
          {result.map((word, i) => (
            <SearchesultTag key={i} word={word} updateData={updateData} />
          ))}
        </div>
      </div>
    </div >
  );
}

function EmptyFrame() {
  return (
    <div className="emptyFrame">
      ∅
    </div>
  );
}

function WordDeleteFrame({ word, updateData }) {
  const [newParent, setNewParent] = useState("");
  return (
    <div className="wordDeleteFrameContainer">
      <BasicForm name={"id"} title={"ID"} value={word.id} isReadOnly={true} />
      <BasicForm name={"entry"} title={"綴り"} value={word.entry} isReadOnly={true} />
      <BasicForm name={"translations"} title={"翻訳"} value={word.translations} isReadOnly={true} isMultiline={true} />
      <BasicForm name={"newParent"} title={"子の新しい親"} value={newParent} updateData={(name, title, value) => setNewParent(value)} />
      <div className="buttonContainer">
        <button onClick={() => updateData(newParent)}>削除</button>
      </div>
    </div>
  );
}

export { SearchFrame, EmptyFrame, WordDeleteFrame };
