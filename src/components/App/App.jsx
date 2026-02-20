// src/components/App.jsx
import { useCallback, useEffect } from 'react';
import './App.scss';
import '../../styles/index.scss';

import { WordTree } from '../TreeView/TreeView';
import DetailsFrame from '../DetailFrame/DetailFrame';
import { SearchFrame, EmptyFrame } from '../OtherFrames/OtherFrames';
import { MenuBar } from '../CommonForms';
import { useDictState, useDictDispatch } from '../../store/DictionaryContext';
import { usePageState, usePageDispatch } from '../../store/PageContext';

function PageTab({ tabs, activeTab, setActiveTab }) {
  return (
    <div className="menuBar pageTab">
      {tabs.map((tab, i) => (
        <button key={i} onClick={() => setActiveTab(tab)} className={`tab ${tab === activeTab ? "active" : ""}`}>
          {tab}
        </button>
      ))}
    </div>
  );
}

export default function App() {
  const { words } = useDictState();
  const dictDispatch = useDictDispatch();
  const { leftWidth, pageTabs } = usePageState();
  const pageDispatch = usePageDispatch();

  const pages = [
    { title: '単語', component: <WordTree /> },
    { title: '詳細', component: <DetailsFrame /> },
    { title: '検索', component: <SearchFrame /> }
  ];

  const leftComponent = pages.find(p => p.title === pageTabs.left.active)?.component || <EmptyFrame />;
  const rightComponent = pages.find(p => p.title === pageTabs.right.active)?.component || <EmptyFrame />;

  const setActiveTab = (side) => (tab) => {
    pageDispatch({ type: 'SET_TAB', payload: { side, tab } });
  };

  const openSearchTab = useCallback(() => {
    const side = pageTabs.left.display.includes('検索') ? 'left' : 'right';
    pageDispatch({ type: 'OPEN_TAB', payload: { side, tab: '検索' } });
  }, [pageTabs.left.display, pageDispatch]);

  // 分割バーの操作
  const handleMouseMove = useCallback((e) => {
    const newWidth = (e.clientX / window.innerWidth) * 100;
    pageDispatch({ type: 'SET_LEFT_WIDTH', payload: newWidth });
  }, [pageDispatch]);

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

  // メニューアクション（必要に応じて増やせる）
  const handleDownload = () => {
    const blob = new Blob([JSON.stringify({ words }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'dictionary.json';
    a.click();
  };

  const handleUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          if (data.words) {
            dictDispatch({ type: 'SET_DICTIONARY', payload: { words: data.words } });
          }
        } catch {
          alert('JSONの読み込みに失敗しました'); // eslint-disable-line no-alert
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleSave = () => {
    localStorage.setItem('dictionary', JSON.stringify({ words }));
  };

  const menuItems = [
    { title: '読み込み', onClick: handleUpload },
    { title: '保存', onClick: handleSave },
    { title: 'ダウンロード', onClick: handleDownload },
  ];

  // ショートカットキー登録
  useEffect(() => {
    const handleShortcut = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        openSearchTab();
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [openSearchTab]);

  return (
    <div className="window">
      <MenuBar items={menuItems} />
      <div className="mainWindow">
        <div className="leftContainer" style={{ width: `${leftWidth}%` }}>
          <PageTab
            tabs={pageTabs.left.display}
            activeTab={pageTabs.left.active}
            setActiveTab={setActiveTab('left')}
          />
          <div className="innerLeftContainer">{leftComponent}</div>
        </div>
        <div className="divider" onMouseDown={handleMouseDown}></div>
        <div className="rightContainer" style={{ width: `${100 - leftWidth}%` }}>
          <PageTab
            tabs={pageTabs.right.display}
            activeTab={pageTabs.right.active}
            setActiveTab={setActiveTab('right')}
          />
          <div className="innerRightContainer">{rightComponent}</div>
        </div>
      </div>
    </div>
  );
}
