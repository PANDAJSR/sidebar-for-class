/**
 * 侧边栏应用的主入口文件
 * 负责初始化 React 应用并挂载到 DOM
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import Sidebar from './Sidebar';
import '../../style.css';

const rootElement: HTMLElement | null = document.getElementById('app');
if (rootElement) {
    ReactDOM.createRoot(rootElement).render(
        <Sidebar />,
    );
} else {
    console.error('Failed to find #app element');
}
