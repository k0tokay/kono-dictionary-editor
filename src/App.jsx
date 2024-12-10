import { useState, useEffect, useCallback } from 'react';
import initialData from './data/konomeno-v5.json';
import './App.scss';
import './index.scss';
import { parentList, WordTree } from './TreeView';
import { RenderInfo } from './DetailFrame';
import { RightClickMenu } from './Basic';
import { SearchFrame, EmptyFrame, WordDeleteFrame } from './OtherFrames';

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

function PageTab({ tabs, activeTab, setActiveTab }) {
  return (
    <div className="pageTab">
      {tabs.map((tab, i) => (
        <button key={i} onClick={() => setActiveTab(tab)} className={"tab " + (tab === activeTab ? "active" : "")}>
          {tab}
        </button>
      ))}
    </div>
  );
}

function App() {
  const [leftWidth, setLeftWidth] = useState(50);
  const [dictionaryData, setDictionaryData] = useState(initialData);
  const [word, setWord] = useState(initialData.words[6]);
  const [wordList, setWordList] = useState(new Object({}));
  const [editedSet, setEditedSet] = useState(new Object({}));
  const [isOpenSet, setIsOpenSet] = useState(new Set([]));

  // 右クリックメニューの状態
  const [menuState, setMenuState] = useState({
    isMenuVisible: false,
    x: 0,
    y: 0,
    items: [],
  });

  const treeDisplay = (id) => {
    const newSet = new Set([...isOpenSet, ...parentList(dictionaryData, id)]);
    setIsOpenSet(newSet);
    setEditedSet(editedSet);
  }

  // 変更を加えたとき
  const getDetailsData = ({ word, editedAttrSet, commandList }) => {
    setEditedSet({ ...editedSet, [word.id]: editedAttrSet });
    setWord(word);
    const newWordList = { ...wordList };
    newWordList[word.id] = word;
    setWordList(newWordList);
    commandList.forEach(command => {
      if (command === "save") {
        saveData([word]);
      } else if (Array.isArray(command) && command[0] === "tree_display") {
        const id = command[1];
        treeDisplay(id);
        // setWord(dictionaryData.words[id]);
        if (id in wordList) {
          setWord(wordList[id]);
        } else {
          setWord(dictionaryData.words[id]);
        }
      } else if (command === "delete") {
        openDeleteMenu(word.id);
      } else if (command === "add") {
        addWord(word.id);
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
  const saveData = (words) => {
    const newData = structuredClone(dictionaryData); // structuredCloneが必要
    const newSet = { ...editedSet };
    const newWordList = { ...wordList };

    words.forEach((word) => {
      const i = word.id;
      newData.words[i] = word;

      // parentの編集の反映
      const pidOld = dictionaryData.words[i].parent;
      const pidNew = word.parent;
      if (pidOld !== pidNew) {
        newData.words[pidOld].children = newData.words[pidOld].children.filter(id => id !== i);
        newData.words[pidNew].children.push(i);
      }
      delete newSet[i];
      delete newWordList[i];
    });
    setDictionaryData(newData);
    setEditedSet(newSet);
    setWordList(newWordList);
    console.log(newData);
  }
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

  const menuItems = [
    {
      title: "保存",
      onClick: () => {
        // Object.keys(editedSet).forEach(i => {
        //   const word = dictionaryData.words[i];
        //   saveData(word);
        // });
        saveData(Object.entries(wordList).map(([_, word]) => word));
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
  const openDeleteMenu = (id) => {
    if (!pageTabState.left.display.includes("削除") || !pageTabState.right.display.includes("削除")) {
      const newPageTabState = { ...pageTabState };
      newPageTabState.right.display.push("削除");
      setPageTabState(newPageTabState);
    }
    if (pageTabState.left.display.includes("削除")) {
      const newPageTabState = { ...pageTabState };
      newPageTabState.left.active = "削除";
      setPageTabState(newPageTabState);
    } else {
      const newPageTabState = { ...pageTabState };
      newPageTabState.right.active = "削除";
      setPageTabState(newPageTabState);
    }
    setWord(dictionaryData.words[id]);
  };
  const deleteWord = (id, nid) => {
    const newData = {
      ...dictionaryData,
      words: dictionaryData.words.map((item, index) =>
        index === id ? null : item
      )
    };
    const pid = dictionaryData.words[id].parent;
    // cidの新しい親を設定
    if (nid) {
      dictionaryData.words[id].children.forEach(cid => {
        newData.words[cid].parent = nid;
        newData.words[nid].children.push(cid);
      });
    } else {
      const rmrf = (id) => {
        const children = dictionaryData.words[id].children;
        children.forEach(cid => {
          rmrf(cid);
        });
        newData.words[id] = null;
      }
      rmrf(id);
    }
    // pidの子から削除
    newData.words[pid].children = newData.words[pid].children.filter(i => i !== id);
    // agumentsから削除
    for (let i = 0; i < newData.words.length; i++) {
      const word = newData.words[i];
      if (word === null) {
        continue;
      }
      word.arguments = word.arguments.filter(arg => arg !== id);
    }
    setWord(dictionaryData.words[pid]);
    const newWordList = { ...wordList };
    delete newWordList[id];
    setWordList(newWordList);
    setDictionaryData(newData);
  };

  const openSearchTab = () => {
    const newPageTabState = { ...pageTabState };
    if (pageTabState.left.display.includes("検索")) {
      newPageTabState.left.active = "検索";
    } else if (!pageTabState.right.display.includes("検索")) {
      newPageTabState.right.display.push("検索");
      newPageTabState.right.active = "検索";
    } else {
      newPageTabState.right.active = "検索";
    }
    setPageTabState(newPageTabState);
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
      const isReadOnly = e.target.getAttribute("contenteditable") === "false";
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
          ...(isList ? itemsForList : []), isReadOnly ? {} : {
            title: "削除",
            onClick: () => {
              if (isList) {
                newWord[attr] = newWord[attr].filter((_, i) => i !== pos); // tagsがlistでない場合に対応していない
              } else {
                newWord[attr] = null; // あってる？
              }
              setWord(newWord);
              const newWordList = { ...wordList };
              newWordList[word.id] = newWord;
              setWordList(newWordList);
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
              openDeleteMenu(id);
              setMenuState((prev) => ({ ...prev, isMenuVisible: false }));
            }
          }
        ],
      });
    } else if (e.target.classList.contains("tab")) {
      const tab = e.target.textContent;
      const newPageTabState = { ...pageTabState };
      const isLeft = pageTabState.left.display.includes(tab);
      setMenuState({
        isMenuVisible: true,
        x: e.pageX,
        y: e.pageY,
        items: [
          {
            title: isLeft ? "右フレームへ" : "左フレームへ",
            onClick: () => {
              if (isLeft) {
                newPageTabState.left.display = newPageTabState.left.display.filter(t => t !== tab);
                newPageTabState.right.display.push(tab);
                if (pageTabState.left.active === tab) {
                  newPageTabState.left.active = newPageTabState.left.display[0];
                }
                if (pageTabState.right.active === undefined) {
                  newPageTabState.right.active = tab;
                }
              } else {
                newPageTabState.right.display = newPageTabState.right.display.filter(t => t !== tab);
                newPageTabState.left.display.push(tab);
                if (pageTabState.right.active === tab) {
                  newPageTabState.right.active = newPageTabState.right.display[0];
                }
                if (pageTabState.left.active === undefined) {
                  newPageTabState.left.active = tab;
                }
              }
              setPageTabState(newPageTabState);
            }
          }, {
            title: "左へ",
            onClick: () => {
              if (isLeft) {
                const index = newPageTabState.left.display.indexOf(tab);
                newPageTabState.left.display[index] = newPageTabState.left.display[index - 1];
                newPageTabState.left.display[index - 1] = tab;
              } else {
                const index = newPageTabState.right.display.indexOf(tab);
                newPageTabState.right.display[index] = newPageTabState.right.display[index - 1];
                newPageTabState.right.display[index - 1] = tab;
              }
            }
          }, {
            title: "右へ",
            onClick: () => {
              if (isLeft) {
                const index = newPageTabState.left.display.indexOf(tab);
                newPageTabState.left.display[index] = newPageTabState.left.display[index + 1];
                newPageTabState.left.display[index + 1] = tab;
              } else {
                const index = newPageTabState.right.display.indexOf(tab);
                newPageTabState.right.display[index] = newPageTabState.right.display[index + 1];
                newPageTabState.right.display[index + 1] = tab;
              }
            }
          }, {
            title: "閉じる",
            onClick: () => {
              newPageTabState.left.display = newPageTabState.left.display.filter(t => t !== tab);
              newPageTabState.right.display = newPageTabState.right.display.filter(t => t !== tab);
              if (pageTabState.left.active === tab) {
                newPageTabState.left.active = newPageTabState.left.display[0];
              }
              if (pageTabState.right.active === tab) {
                newPageTabState.right.active = newPageTabState.right.display[0];
              }
              setPageTabState(newPageTabState);
            }
          }
        ]
      });
    }
  };

  const handleClick = () => {
    // 右クリックメニューを非表示
    setMenuState((prev) => ({ ...prev, isMenuVisible: false }));
  };

  // ページ一覧
  const pages = [
    {
      title: "単語",
      component: <WordTree dict={dictionaryData} editedSet={editedSet} isOpenSet={isOpenSet} updateData={getTreeData} showDetails={treeItemShowDetails} focusId={word.id} />
    }, {
      title: "詳細",
      component: <RenderInfo word={word.id in wordList ? wordList[word.id] : word} dict={dictionaryData} updateData={getDetailsData} editedSet={word.id in editedSet ? editedSet[word.id] : new Set([])} />
    }, {
      title: "検索",
      component: <SearchFrame dict={dictionaryData} updateData={(word) => { treeDisplay(word.id); setWord(word) }} />
    }, {
      title: "削除",
      component: <WordDeleteFrame word={word} updateData={(nid) => {
        deleteWord(word.id, nid);
        const newPageTabState = { ...pageTabState };
        if (pageTabState.left.display.includes("削除")) {
          newPageTabState.left.display = newPageTabState.left.display.filter(t => t !== "削除");
          newPageTabState.left.active = newPageTabState.left.display[0];
        } else {
          newPageTabState.right.display = newPageTabState.right.display.filter(t => t !== "削除");
          newPageTabState.right.active = newPageTabState.right.display[0];
        }
        setPageTabState(newPageTabState);
      }} />
    }
  ]

  const [pageTabState, setPageTabState] = useState({
    left: {
      display: ["単語"],
      active: "単語",
    },
    right: {
      display: ["詳細", "検索"],
      active: "詳細",
    }
  });
  const leftComponent = (pages.find(page => page.title === pageTabState.left.active)?.component) || <EmptyFrame />;
  const rightComponent = (pages.find(page => page.title === pageTabState.right.active)?.component) || <EmptyFrame />;

  const setActiveTab = (left) => (tab) => {
    const newPageTabState = { ...pageTabState };
    if (left) {
      newPageTabState.left.active = tab;
    } else {
      newPageTabState.right.active = tab;
    }
    setPageTabState(newPageTabState);
  }

  // ショートカットキー
  useEffect(() => {
    const handleShortcut = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveData(Object.entries(wordList).map(([_, word]) => word));
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        openSearchTab();
      }
    };

    window.addEventListener('keydown', handleShortcut);

    // クリーンアップ関数 (アンマウント時にリスナーを削除)
    return () => {
      window.removeEventListener('keydown', handleShortcut);
    };
  }, [wordList]); // wordList に依存 (依存関係を考慮)

  return (
    <div className="window"
      onContextMenu={handleContextMenu}
      onClick={handleClick}
    >
      <MenuBar menuItems={menuItems} />
      <div className="mainWindow">
        <div className="leftContainer" style={{ width: `${leftWidth}%` }}>
          <PageTab tabs={pageTabState.left.display} activeTab={pageTabState.left.active} setActiveTab={setActiveTab(true)} />
          <div className="innerLeftContainer">
            {leftComponent}
          </div>
        </div>
        <div className="divider" onMouseDown={handleMouseDown}></div>
        <div className="rightContainer" style={{ width: `${100 - leftWidth}%` }}>
          <PageTab tabs={pageTabState.right.display} activeTab={pageTabState.right.active} setActiveTab={setActiveTab(false)} />
          <div className="innerRightContainer">
            {rightComponent}
          </div>
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
