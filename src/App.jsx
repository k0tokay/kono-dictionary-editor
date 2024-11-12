import { useState, useEffect, useCallback } from 'react';
import initialData from './data/konomeno-v5.json';
import './App.scss';
import './index.scss';
import WordItem from './TreeView';
import RenderInfo from './DetailFrame';

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

function App() {
  const [leftWidth, setLeftWidth] = useState(50);
  const [dictionaryData, setDictionaryData] = useState(initialData);
  const [word, setWord] = useState(initialData.words[6]);
  const [editedSet, setEditedSet] = useState(new Set([]));

  const getData = (word) => {
    setEditedSet(new Set([...editedSet, word.id]));
  };

  const getSaveData = (word) => {
    const i = dictionaryData.words.findIndex(w => w && w.id === word.id);
    const updateWord = (i, word) => {
      setDictionaryData(prevData => ({
        ...prevData,
        words: prevData.words.map((item, index) =>
          index === i ? word : item
        )
      }));
    };
    updateWord(i, word);
    editedSet.delete(i);
    setEditedSet(editedSet);
    setDetails(<RenderInfo word={word} dict={dictionaryData} updateData={getData} saveData={getSaveData} />);
  };

  const [details, setDetails] = useState(<RenderInfo word={word} dict={dictionaryData} updateData={getData} saveData={getSaveData} />);

  const treeItemShowDetails = (word) => {
    setDetails(<RenderInfo word={word} dict={dictionaryData} updateData={getData} saveData={getSaveData} />);
  }

  const handleMouseMove = useCallback((e) => {
    const newWidth = (e.clientX / window.innerWidth) * 100;
    setLeftWidth(newWidth);
  }, []);

  const handleMouseUp = useCallback(() => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.userSelect = '';
  }, [handleMouseMove]);

  const handleMouseDown = useCallback(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.userSelect = 'none';
  }, [handleMouseMove, handleMouseUp]);

  const categoryIndeces = dictionaryData.words
    .map((word, i) => (word && word.category === "カテゴリ" ? i : -1))
    .filter(i => i !== -1);

  const menuItems = [
    {
      title: "保存",
      onClick: () => {
        saveData(wordState);
        setEditedSet(new Set([]));
      }
    }, {
      title: "ダウンロード",
      onClick: () => {
        const element = document.createElement('a');
        const file = new Blob([JSON.stringify(dictionaryData)], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = 'dictionary.json';
        document.body.appendChild(element);
        element.click();
      }
    }
  ];

  return (
    <div className="window">
      <MenuBar menuItems={menuItems} />
      <div className="mainWindow">
        <div className="dictTreeContainer" style={{ width: `${leftWidth}%` }}>
          <ul>
            {categoryIndeces.map(i => (
              <WordItem key={i} word={dictionaryData.words[i]} dict={dictionaryData} showDetails={treeItemShowDetails} editedSet={editedSet} />
            ))}
          </ul>
        </div>
        <div className="divider" onMouseDown={handleMouseDown}></div>
        <div className="detailsContainer" style={{ width: `${100 - leftWidth}%` }}>
          {details}
        </div>
      </div>
    </div>
  );
}

export default App;
