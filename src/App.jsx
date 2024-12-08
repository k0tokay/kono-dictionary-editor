import { useState, useEffect, useCallback } from 'react';
import initialData from './data/konomeno-v5.json';
import './App.scss';
import './index.scss';
import { parentList, WordItem } from './TreeView';
import RenderInfo from './DetailFrame';
import { RightClickMenu } from './Basic';

const rec = (n, f) => {
  if (n === 0) {
    return x => x;
  } else {
    return x => f(rec(n - 1, f)(x));
  }
};

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
  const [editedSet, setEditedSet] = useState(new Object({}));
  const [isOpenSet, setIsOpenSet] = useState(new Set([]));

  // 右クリックメニューの状態
  const [menuState, setMenuState] = useState({
    isMenuVisible: false,
    x: 0,
    y: 0,
    items: [],
  });

  // 変更を加えたとき
  const getDetailsData = ({ word, editedAttrSet, commandList }) => {
    setEditedSet({ ...editedSet, [word.id]: editedAttrSet });

    setWord(word);
    commandList.forEach(command => {
      if (command === "save") {
        saveData(word);
      } else if (Array.isArray(command) && command[0] === "tree_display") {
        const id = command[1];
        const newSet = new Set([...isOpenSet, ...parentList(dictionaryData, id)]);
        setIsOpenSet(newSet);
        setEditedSet(editedSet);
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
    const newData = {
      ...dictionaryData,
      words: dictionaryData.words.map((item, index) =>
        index === i ? word : item
      )
    };

    // parentの編集の反映
    const pidOld = dictionaryData.words[i].parent;
    const pidNew = word.parent;
    if (pidOld !== pidNew) {
      newData.words[pidOld].children = newData.words[pidOld].children.filter(id => id !== i);
      newData.words[pidNew].children.push(i);
    }

    setDictionaryData(newData);
    const newSet = { ...editedSet };
    delete newSet[i];
    setEditedSet(newSet);
  };
  const treeItemShowDetails = setWord;

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
        Object.keys(editedSet).forEach(i => {
          const word = dictionaryData.words[i];
          saveData(word);
        });
        // setEditedSet(new Object({}));
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

  // 単語の追加や削除
  const addWord = (id) => {
    const p_category = dictionaryData.words[id].category;
    const category = p_category === "カテゴリ" ? dictionaryData.words[id] : p_category;
    const newWord = {
      id: dictionaryData.words.length,
      entry: "",
      translations: "",
      simple_translations: [],
      category: category,
      parent: id,
      children: [],
      arguments: [],
      tags: [],
      contents: [],
      variations: []
    };
    const newData = {
      ...dictionaryData,
      words: [...dictionaryData.words, newWord]
    };
    newData.words[id].children.push(newWord.id);
    setDictionaryData(newData);
    setWord(newWord);
  };

  // 右クリックメニューの表示
  const handleContextMenu = (e) => {
    e.preventDefault();
    const pos = Number(e.target.id);
    if (e.target.classList.contains('tagSpan')) {
      const tagForm = rec(3, x => x.parentElement)(e.target)
      const attr = tagForm.getAttribute("name");
      const newWord = { ...word };
      const isList = Array.isArray(newWord[attr]);
      const itemsForList = [
        {
          title: "左へ",
          onClick: () => {
            const newTag = newWord[attr][pos - 1];
            newWord[attr][pos - 1] = newWord[attr][pos];
            newWord[attr][pos] = newTag;
            setWord(newWord);
            setMenuState((prev) => ({ ...prev, isMenuVisible: false }));
          },
        }, {
          title: "右へ",
          onClick: () => {
            const newTag = newWord[attr][pos + 1];
            newWord[attr][pos + 1] = newWord[attr][pos];
            newWord[attr][pos] = newTag;
            setWord(newWord);
            setMenuState((prev) => ({ ...prev, isMenuVisible: false }));
          },
        }
      ];
      setMenuState({
        isMenuVisible: true,
        x: e.pageX,
        y: e.pageY,
        items: [
          ...(isList ? itemsForList : []), {
            title: "削除",
            onClick: () => {
              if (isList) {
                newWord[attr] = newWord[attr].filter((_, i) => i !== pos); // tagsがlistでない場合に対応していない
              } else {
                newWord[attr] = null; // あってる？
              }
              setWord(newWord);
              setMenuState((prev) => ({ ...prev, isMenuVisible: false }));
            },
          },
        ],
      });
    } else if (e.target.classList.contains('entry')) {
      const idElement = e.target.previousElementSibling;
      const id = idElement ? Number(idElement.textContent) : null;
      setMenuState({
        isMenuVisible: true,
        x: e.pageX,
        y: e.pageY,
        items: [
          {
            title: "追加",
            onClick: () => {
              addWord(id);
              setMenuState((prev) => ({ ...prev, isMenuVisible: false }));
            },
          }, {
            title: "削除",
            onClick: () => {

            }
          }
        ],
      });
    }
  };

  const handleClick = () => {
    // 右クリックメニューを非表示
    setMenuState((prev) => ({ ...prev, isMenuVisible: false }));
  };

  return (
    <div className="window"
      onContextMenu={handleContextMenu}
      onClick={handleClick}
    >
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
          <RenderInfo word={word} dict={dictionaryData} updateData={getDetailsData} editedSet={word.id in editedSet ? editedSet[word.id] : new Set([])} />
        </div>
      </div>
      <RightClickMenu
        items={menuState.items}
        x={menuState.x}
        y={menuState.y}
        isMenuVisible={menuState.isMenuVisible}
      />
    </div>
  );
}

export default App;
