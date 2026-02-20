import { useDictState, useDictDispatch } from '../store/DictionaryContext';
import { useState } from 'react';
import { isValidWordTag } from '../utils/utils.js';
import React from 'react';

const punctuations = ['，', ',', '、'];
const splitPunc = (text) =>
    text.split(new RegExp(`[${punctuations.join('')}]`))
        .map(x => x.trim()); //.filter(x => x !== "") をつけると編集時に最後に,がつけられない

export function BasicForm({ name, title, value, edited, onChange,
    isReadOnly = false, isList = false, isMultiline = false, buttons = [] }) {
    const handleChange = (e) => {
        const raw = e.target.value;
        const data = isList ? splitPunc(raw) : raw;
        onChange(name, data);
    };
    return (
        <div className="basicForm">
            <div className="formHeader basicHeader">
                <label className={edited ? "edited" : ""}>{title}</label>
                {buttons.map((btn, i) =>
                    <button key={i} onClick={btn.onClick}>{btn.label}</button>
                )}
            </div>
            {isMultiline ? (
                <textarea
                    className="textForm"
                    rows="3"
                    value={value}
                    onChange={handleChange}
                    readOnly={isReadOnly}
                />
            ) : (
                <input
                    className="textForm"
                    type="text"
                    value={value}
                    onChange={handleChange}
                    readOnly={isReadOnly}
                />
            )}
        </div>
    );
}

export function TagWordDetails({ word, onClick }) {
    return (
        <div className={"tagWordDetails" + (word.translations?.length ? "" : " noTranslations")}>
            <div className="paddingBox">
                <div className="innerTagWordDetails" onClick={onClick}>
                    <span className="id">{word.id}</span>
                    <span className="entry">{word.entry}</span>
                    {word.translations?.length > 0 && (
                        <span className="translations">{word.translations}</span>
                    )}
                </div>
            </div>
        </div>
    );
}

// wordId: このフォームが編集対象としている単語のID（isWord=true の covers フィールドで使用）
export function TagForm({ name, title, tags, wordId, onChange, onClick, edited,
    isWord = false, isReadOnly = false,
}) {
    const { words } = useDictState();
    const dispatch = useDictDispatch();
    const [editingIndex, setEditingIndex] = useState(null);

    const tagList = tags;

    // 入力文字列をストア保存形式に変換（isWord の場合は有効なIDなら number に）
    const displayToRaw = (text) => !isWord || !isValidWordTag(words, text) ? text : Number(text);
    const displayToRawList = (textList) => textList.map(t => displayToRaw(t));

    const displayTag = (tag, i) => {
        if (isWord && words[tag] && i !== editingIndex) {
            return words[tag].entry;
        } else {
            return tag;
        }
    };

    const handleBlur = () => {
        if (isWord) {
            const tag = tagList[editingIndex]; // blur 時点のタグ値をそのまま渡す
            dispatch({ type: "UPDATE_COVERS", payload: { id: wordId, field: name, tag } });
        } else {
            const newTags = tagList.filter(t => t !== "");
            onChange(name, displayToRawList(newTags));
        }
        setEditingIndex(null);
    };

    const addTag = () => {
        const newTags = [...tagList, ""];
        onChange(name, displayToRawList(newTags));
    };

    return (
        <div className="tagForm">
            <div className="formHeader tagHeader">
                <p className={edited ? "edited" : ""}>{title}</p>
                {!isReadOnly && <button onClick={addTag}>追加</button>}
            </div>
            <div className="textForm innerTagForm">
                {tagList.map((tag, i) => (
                    <div key={i}>
                        {isWord && words[tag] && (
                            <TagWordDetails word={words[tag]} onClick={() => onClick(tag)} />
                        )}
                        <input
                            key={i}
                            type="text"
                            className={`tagInput ${!(!isWord || isValidWordTag(words, tag)) ? "notValid" : ""}`}
                            value={displayTag(tag, i)}
                            readOnly={isReadOnly}
                            onFocus={() => setEditingIndex(i)}
                            onChange={e => {
                                const newTags = tagList.map((t, j) =>
                                    j === i ? e.target.value : t
                                );
                                onChange(name, displayToRawList(newTags));
                            }}
                            onBlur={handleBlur}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}

export function LargeListForm({ name, title, title_h, title_c, contents, edited, onChange }) {
    const addItem = () => {
        const updated = [...contents, { title: "", text: "" }];
        onChange(name, updated);
    };
    const updateItem = (idx) => (_field, val) => {
        const updated = contents.slice();
        updated[idx] = val;
        onChange(name, updated);
    };

    return (
        <div className="largeListForm">
            <div className="formHeader listHeader">
                <p className={edited ? "edited" : ""}>{title}</p>
                <button onClick={addItem}>追加</button>
            </div>
            <div className="innerLargeListForm">
                {contents.map((content, i) => (
                    <React.Fragment key={i}>
                        <BasicForm
                            name={`${name}_${i}_h`}
                            title={title_h}
                            value={content.title}
                            edited={edited}
                            onChange={(_f, v) => updateItem(i)(name, { ...content, title: v })}
                        />
                        <BasicForm
                            name={`${name}_${i}_c`}
                            title={title_c}
                            value={content.text}
                            isMultiline
                            edited={edited}
                            onChange={(_f, v) => updateItem(i)(name, { ...content, text: v })}
                        />
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
}

export function MenuBar({ items }) {
    return (
        <div className="menuBar">
            {items.map((it, i) => <button key={i} onClick={it.onClick}>{it.title}</button>)}
        </div>
    );
}

// 純粋なUIコンポーネント。ドメインロジックは呼び出し元で行うこと
export function CheckboxForm({ name, title, checked = false, onChange, disabled = false }) {
    const handleChange = (e) => {
        onChange(name, e.target.checked);
    };

    return (
        <div className="checkboxForm">
            <label htmlFor={name} className="formHeader checkboxHeader">
                <span>{title}</span>
                <input
                    type="checkbox"
                    id={name}
                    name={name}
                    checked={checked}
                    onChange={handleChange}
                    disabled={disabled}
                />
            </label>
        </div>
    );
}
