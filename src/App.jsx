import { useState, useEffect, useRef, useCallback } from 'react';
import initialData from './data/konomeno-v5.json';
import './App.scss';
import './index.scss';
import { parentList, WordItem } from './TreeView';
import RenderInfo from './DetailFrame';

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

function App() {
  const [leftWidth, setLeftWidth] = useState(50);
  const [dictionaryData, setDictionaryData] = useState(initialData);
  const [word, setWord] = useState(initialData.words[6]);
  const [editedSet, setEditedSet] = useState(new Set([]));
  const [isOpenSet, setIsOpenSet] = useState(new Set([]));

  const focusRef = useRef(null);

  // 変更を加えたとき
  const getDetailsData = ({ word, editedAttrSet, commandList }) => {
    setEditedSet({ ...editedSet, [word.id]: editedAttrSet });
    commandList.forEach(command => {
      if (command === "save") {
        saveData(word);
      } else if (Array.isArray(command) && command[0] === "tree_display") {
        const id = command[1];
      }
    })
  };
  const getTreeData = ({ word, isOpen }) => {
    if (isOpen) {
      setIsOpenSet(new Set([...isOpenSet, word.id]));
    } else {
      const newSet = new Set(isOpenSet);
      newSet.delete(word.id);
      setIsOpenSet(newSet);
    }
  };

  // 保存を押したとき
  const saveData = (word) => {
    const i = word.id;
    const updateWord = (i, word) => {
      setDictionaryData(prevData => ({
        ...prevData,
        words: prevData.words.map((item, index) =>
          index === i ? word : item
        )
      }));
    };
    updateWord(i, word);
    delete editedSet.i;
    setEditedSet(editedSet);
    setDetails(<RenderInfo word={word} dict={dictionaryData} updateData={getDetailsData} />);
  };
  // const onTreeitemFocus = (id) => (el) => {
  //   const newSet = new Set([...isOpenSet, ...parentList(dictionaryData, // id)]);
  //   setIsOpenSet(newSet);
  //   delete editedSet.id;
  //   setEditedSet(editedSet);
  //   console.log(el);
  // 
  //   if (el && el === focusRef.current) {
  //     focusRef.current = el;
  //     el.scrollIntoView({ behavior: "smooth", block: "center" });
  //   }
  // };

  const [details, setDetails] = useState(<RenderInfo word={word} dict={dictionaryData} updateData={getDetailsData} />);

  const treeItemShowDetails = (word) => {
    setDetails(<RenderInfo word={word} dict={dictionaryData} updateData={getDetailsData} />);
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

  const categoryIndices = dictionaryData.words
    .map((word, i) => (word && word.category === "カテゴリ" ? i : -1))
    .filter(i => i !== -1);

  const menuItems = [
    {
      title: "保存",
      onClick: () => {
        editedSet.forEach(i => {
          const word = dictionaryData.words[i];
          getSaveData(word);
        });
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
            {categoryIndices.map(i => (
              <WordItem key={i} word={dictionaryData.words[i]} dict={dictionaryData} showDetails={treeItemShowDetails} editedSet={editedSet} isOpenSet={isOpenSet} updateData={getTreeData}
              />
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
