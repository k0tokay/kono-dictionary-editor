import { use } from 'react';
import { useDictState, useDictDispatch } from '../store/DictionaryContext';
import { checkIntegrity } from '../utils/utils.js';

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

export function TagForm({ name, title, tags, onChange, onClick, edited,
    isList = true, isWord = false, dict = null, isReadOnly = false }) {
    const dispatch = useDictDispatch();
    const state = useDictState();
    const tagList = isList ? tags : (tags != null ? [tags] : []);
    const handleBlur = (e) => {
        const i = Number(e.target.id);
        const newTag = e.target.textContent;
        const newTags = tagList.map((t, j) => (j === i && isValid(newTag)) ? newTag : t).filter(t => t !== "");
        onChange(name, isList ? newTags : newTags[0] || null);
    };

    const addTag = () => {
        const newTags = [...tagList, ""];
        onChange(name, isList ? newTags : newTags[0]);
    };

    const isValid = (wordId) => {
        if (!isWord) return true;
        const num = Number(wordId);
        return Number.isInteger(num) && num >= 0 && dict && dict.words[num];
    }

    return (
        <div className="tagForm">
            <div className="formHeader tagHeader">
                <p className={edited ? "edited" : ""}>{title}</p>
                {!isReadOnly && <button onClick={addTag}>追加</button>}
            </div>
            <div className="textForm innerTagForm">
                {tagList.map((tag, i) => (
                    <div key={i}>
                        {isWord && dict?.words[tag] && (
                            <TagWordDetails word={dict.words[tag]} onClick={() => onClick(tag)} />
                        )}
                        <span
                            id={i}
                            className={'tagSpan' + (isWord && !isValid(tag) ? ' notValid' : '')}
                            contentEditable={!isReadOnly}
                            suppressContentEditableWarning
                            onBlur={handleBlur}
                        >
                            {isWord && dict?.words[tag] ? dict.words[tag].entry : tag}
                        </span>
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
    const updateItem = (idx) => (field, val) => {
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
                            onChange={(f, v) => updateItem(i)(name, { ...content, title: v })}
                        />
                        <BasicForm
                            name={`${name}_${i}_c`}
                            title={title_c}
                            value={content.text}
                            isMultiline
                            edited={edited}
                            onChange={(f, v) => updateItem(i)(name, { ...content, text: v })}
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