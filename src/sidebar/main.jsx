/**
 * 侧边栏应用的主入口文件
 * 负责初始化 React 应用并挂载到 DOM
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import Sidebar from './Sidebar'
import '../../style.css'

// 获取应用挂载的根元素
const rootElement = document.getElementById('app');
if (rootElement) {
    // 创建 React 根节点并渲染侧边栏组件
    ReactDOM.createRoot(rootElement).render(
        <Sidebar />,
    )
} else {
    // 如果找不到挂载点，输出错误信息
    console.error('Failed to find #app element');
}
