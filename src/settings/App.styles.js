/**
 * 应用程序样式定义
 * 使用 Fluent UI 的 makeStyles 创建样式对象
 */

import { makeStyles, shorthands } from "@fluentui/react-components";

export const useStyles = makeStyles({
    // 根容器样式：应用的主容器，使用 flexbox 布局
    root: {
        display: 'flex',
        flexDirection: 'row',
        height: '100vh',
        backgroundColor: 'var(--colorNeutralBackground1)',
        fontFamily: '"Segoe UI Variable Display", "Segoe UI", "Microsoft YaHei", sans-serif',
    },
    // 侧边栏样式：左侧导航栏
    sidebar: {
        width: 'auto',
        minWidth: 'fit-content',
        ...shorthands.padding('8px', '0', '12px', '0'),
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--colorNeutralBackground2)',
        boxShadow: 'inset -1px 0 0 0 var(--colorNeutralStroke2)',
    },
    // 头部样式：侧边栏顶部的应用图标和标题区域
    header: {
        display: 'flex',
        alignItems: 'center',
        paddingLeft: '16px',
        paddingTop: '12px',
        paddingBottom: '12px',
        gap: '12px',
    },
    // 应用图标样式
    appIcon: {
        fontSize: '20px',
        color: 'var(--colorCompoundBrandStroke)',
    },
    // 头部标题样式
    headerTitle: {
        fontSize: '14px',
        fontWeight: '400',
    },
    // 菜单按钮样式
    menuButton: {
        ...shorthands.margin('4px', '4px', '12px', '4px'),
        minWidth: '40px',
        height: '36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'default',
        ...shorthands.borderRadius('4px'),
        fontSize: '18px',
        ':hover': {
            backgroundColor: 'var(--colorNeutralBackground1Hover)',
        }
    },
    // 标签页列表样式：隐藏默认的指示器
    tabList: {
        rowGap: '2px',
        position: 'relative',
        cursor: 'default',
        '& .fui-TabList__indicator': {
            display: 'none !important',
        },
        '& .fui-Tab__indicator': {
            display: 'none !important',
        },
        '& .fui-TabList__indicatorSelected': {
            display: 'none !important',
        },
    },
    // 活动指示器样式：自定义的选中标签页指示条
    activeIndicator: {
        position: 'absolute',
        left: '8px',
        width: '3px',
        height: '20px',
        backgroundColor: 'var(--colorBrandStroke1)',
        ...shorthands.borderRadius('2px'),
        zIndex: 10,
        transitionProperty: 'transform, opacity',
        transitionDuration: '300ms',
        transitionTimingFunction: 'cubic-bezier(0.33, 0, 0.67, 1)',
        pointerEvents: 'none',
        top: '12px', // 初始顶部位置（2px 边距 + 10px 内部偏移）
    },
    // 标签页样式：单个标签页按钮
    tab: {
        height: '40px',
        minHeight: '40px',
        ...shorthands.borderRadius('4px'),
        ...shorthands.margin('2px', '8px'),
        ...shorthands.padding('0px', '12px', '0px', '12px'),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        position: 'relative',
        cursor: 'default',
        backgroundColor: 'transparent',
        transitionProperty: 'background-color, color, transform',
        transitionDuration: '150ms',
        boxSizing: 'border-box',
        ':hover': {
            backgroundColor: 'var(--colorNeutralBackground1Hover)',
        },
        ':active': {
            backgroundColor: 'var(--colorNeutralBackground1Selected)', // 或更浅的色调
            transform: 'scale(0.98)', // 添加微妙的按压效果
        },
        '&::after': {
            display: 'none !important',
        },
        '&::before': {
            display: 'none !important',
        },
        '& .fui-Tab__indicator': {
            display: 'none !important',
        },
    },
    // 选中的标签页样式
    tabSelected: {
        backgroundColor: 'var(--colorNeutralBackground1Selected) !important',
        color: 'var(--colorNeutralForeground1Selected) !important',
        fontWeight: '600',
        '&:hover': {
            backgroundColor: 'var(--colorNeutralBackground1Hover) !important',
        },
        '&:active': {
            backgroundColor: 'var(--colorNeutralBackground1Selected) !important',
            opacity: 0.8,
        }
    },
    // 标签页图标样式
    tabIcon: {
        fontSize: '20px',
        width: '20px',
        height: '20px',
        marginRight: '12px',
        marginLeft: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    // 分隔线样式
    divider: {
        height: '1px',
        backgroundColor: 'var(--colorNeutralStroke2)',
        ...shorthands.margin('12px', '16px'),
    },
    // 主内容区域样式
    main: {
        flexGrow: 1,
        ...shorthands.padding('32px', '24px'),
        overflowY: 'auto',
        overflowX: 'hidden', // 防止水平溢出
        minWidth: 0, // 允许收缩以适应容器
    },
    // 分组样式：设置页面的各个分组
    section: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        maxWidth: '1000px',
    },
    // 卡片样式：设置项的容器
    card: {
        width: '100%',
        boxSizing: 'border-box',
        ...shorthands.padding('16px', '24px'),
        backgroundColor: 'var(--colorNeutralBackground1)',
        ...shorthands.border('1px', 'solid', 'var(--colorNeutralStroke2)'),
        // boxShadow: 'var(--shadow2)',
        ...shorthands.borderRadius('4px'),
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: '20px',
        ':hover': {
            backgroundColor: 'var(--colorNeutralBackground1Hover)',
        }
    },
    // 分组标题样式
    groupTitle: {
        fontSize: '14px',
        fontWeight: '600',
        marginTop: '24px',
        marginBottom: '8px',
        color: 'var(--colorNeutralForeground1)',
    },
    // 分区头部样式
    sectionHeader: {
        marginBottom: '20px',
    },
    // 标题样式
    title: {
        fontSize: '28px',
        fontWeight: '600',
        marginBottom: '8px',
        lineHeight: '1.2',
    },
    // 描述文字样式
    description: {
        color: 'var(--colorNeutralForeground2)',
        fontSize: '14px',
        lineHeight: '1.5',
    },
    // 表单分组样式
    formGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        minWidth: 0, // 允许收缩以适应容器
        width: '100%',
        boxSizing: 'border-box',
    },
    // 开关行样式
    switchRow: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    // 标签样式
    label: {
        fontSize: '14px',
        fontWeight: '500',
    },
    // 底部样式
    footer: {
        marginTop: '40px',
        display: 'flex',
        justifyContent: 'flex-end',
        ...shorthands.padding('0', '0', '40px', '0'),
    },
    // 滑块容器样式
    rangeContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginTop: '4px',
    },
    // 滑块数值显示样式
    rangeValue: {
        minWidth: '48px',
        fontSize: '14px',
        fontWeight: '600',
        color: 'var(--colorBrandForeground1)',
        textAlign: 'right',
    },
    // 帮助文字样式
    helpText: {
        color: 'var(--colorNeutralForeground3)',
        fontSize: '12px',
        marginTop: '4px',
    },
    // 组件设置特定样式
    // 组件设置页面的主容器，不限制最大宽度，且占满高度
    componentSettingsSection: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        maxWidth: 'none',
        height: '100%',
        overflow: 'hidden', // 防止内容溢出
        width: '100%', // 确保占满可用宽度
        minWidth: 0, // 允许收缩以适应容器
        boxSizing: 'border-box',
    },
    // 组件布局样式：左右分栏布局
    componentLayout: {
        display: 'flex',
        flexDirection: 'row',
        gap: '0',
        // height: 'calc(100vh - 140px)', // 移除固定高度
        flexGrow: 1, // 自动填充剩余垂直空间
        minHeight: '0', // 允许内容收缩以支持滚动
        position: 'relative',
        overflow: 'hidden', // 防止内容撑开布局
        width: '100%', // 确保占满容器宽度
        minWidth: 0, // 允许收缩以适应容器
    },
    // 左侧面板样式：预览面板
    leftPanel: {
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        overflow: 'hidden',
        ...shorthands.margin('0', '12px', '0', '0'),
        boxSizing: 'border-box',
        height: '100%',
        flexShrink: 0,
        minWidth: 0, // 允许面板收缩以适应容器
    },
    // 右侧面板样式：属性面板
    rightPanel: {
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        overflow: 'hidden',
        ...shorthands.margin('0', '0', '0', '12px'),
        boxSizing: 'border-box',
        height: '100%',
        flexShrink: 0,
        minWidth: 0, // 允许面板收缩以适应容器
    },
    // 调整器样式：左右面板之间的拖拽调整宽度的分隔条
    resizer: {
        width: '4px',
        backgroundColor: 'var(--colorNeutralStroke1)',
        cursor: 'col-resize',
        position: 'relative',
        transitionProperty: 'background-color, transform',
        transitionDuration: '150ms',
        transitionTimingFunction: 'ease',
        flexShrink: 0,
        flexGrow: 0,
        zIndex: 10,
        ':hover': {
            backgroundColor: 'var(--colorBrandStroke1)',
            transform: 'scaleX(1.5)',
        },
        ':active': {
            backgroundColor: 'var(--colorBrandBackground2Pressed)',
            transform: 'scaleX(1.5)',
        },
        '&::after': {
            content: '""',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '2px',
            height: '24px',
            backgroundColor: 'var(--colorNeutralForeground3)',
            borderRadius: '1px',
            opacity: 0.5,
            transitionProperty: 'opacity, background-color',
            transitionDuration: '150ms',
        },
        ':hover::after': {
            backgroundColor: 'var(--colorNeutralForeground1)',
            opacity: 1,
        },
        ':active::after': {
            backgroundColor: 'var(--colorBrandForeground1)',
            opacity: 1,
        },
    },
    // 预览面板样式：显示组件预览的面板
    previewPanel: {
        flex: 1,
        backgroundColor: 'var(--colorNeutralBackground2)',
        ...shorthands.borderRadius('8px'),
        ...shorthands.border('1px', 'solid', 'var(--colorNeutralStroke1)'),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        ...shorthands.overflow('hidden'),
        height: '100%',
        width: '100%',
    },
    // 属性面板样式：显示组件属性的面板
    propertiesPanel: {
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--colorNeutralBackground2)',
        ...shorthands.borderRadius('8px'),
        ...shorthands.border('1px', 'solid', 'var(--colorNeutralStroke1)'),
        ...shorthands.overflow('hidden'),
        height: '100%',
        width: '100%',
        minWidth: 0, // 允许面板收缩以适应容器
    },
    // 属性内容样式：属性面板的可滚动内容区域
    propertiesContent: {
        ...shorthands.padding('16px'),
        flexGrow: 1,
        ...shorthands.overflow('auto'),
        minWidth: 0, // 允许内容区域收缩以适应容器
        width: '100%', // 确保占满可用宽度
        boxSizing: 'border-box',
    },
    // 属性分组样式
    propertySection: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        marginTop: '16px',
        minWidth: 0, // 允许收缩以适应容器
        width: '100%',
        boxSizing: 'border-box',
    },
    // 预览占位符样式
    previewPlaceholder: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        color: 'var(--colorNeutralForeground4)',
    },
    // 编辑器面板样式
    editorPanel: {
        width: '460px',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--colorNeutralBackground1)',
        ...shorthands.borderRadius('8px'),
        ...shorthands.border('1px', 'solid', 'var(--colorNeutralStroke1)'),
        ...shorthands.overflow('hidden'),
    },
    // 标签页内容样式
    tabContent: {
        ...shorthands.padding('16px'),
        flexGrow: 1,
        ...shorthands.overflow('auto'),
    },
    // 组件列表样式：显示所有组件的列表
    widgetList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        width: '100%',
        ...shorthands.padding('24px'),
        boxSizing: 'border-box',
    },
    // 组件项样式：单个组件的卡片
    widgetItem: {
        backgroundColor: 'var(--colorNeutralBackground1)',
        ...shorthands.border('1px', 'solid', 'var(--colorNeutralStroke1)'),
        ...shorthands.borderRadius('6px'),
        ...shorthands.padding('12px', '16px'),
        boxShadow: 'var(--shadow2)',
        cursor: 'default',
        transitionProperty: 'background-color, border-color, box-shadow, transform',
        transitionDuration: '150ms',
        position: 'relative',
        ':hover': {
            backgroundColor: 'var(--colorNeutralBackground1Hover)',
            ...shorthands.borderColor('var(--colorBrandStroke1)'),
            boxShadow: 'var(--shadow4)',
        },
        ':active': {
            transform: 'scale(0.995)',
        }
    },
    // 选中的组件项样式
    widgetItemSelected: {
        backgroundColor: 'var(--colorNeutralBackground1Hover)',
        ...shorthands.borderColor('var(--colorBrandStroke1)'),
        ...shorthands.borderWidth('2px'),
        boxShadow: 'var(--shadow8)',
    },
    // 拖拽中的组件项样式
    widgetDragging: {
        opacity: 0.4,
        ...shorthands.border('1px', 'dashed', 'var(--colorBrandStroke1)'),
        boxShadow: 'none',
    },
    // 拖拽悬停的组件项样式
    widgetDragOver: {
        position: 'relative',
        '&::before': {
            content: '""',
            position: 'absolute',
            top: '-8px', // 位于 12px 间距的正中间
            left: '0',
            right: '0',
            height: '3px',
            backgroundColor: 'var(--colorBrandStroke1)',
            borderRadius: '2px',
            boxShadow: '0 0 4px var(--colorBrandStroke1)',
            zIndex: 10,
        }
    },
    // 组件放置区域样式
    widgetDropZone: {
        height: '24px',
        marginTop: '-12px',
        width: '100%',
        position: 'relative',
        cursor: 'default',
    },
    // 底部放置区域拖拽悬停样式（指示线在底部）
    widgetDropZoneDragOver: {
        '&::before': {
            content: '""',
            position: 'absolute',
            bottom: '0',
            left: '0',
            right: '0',
            height: '3px',
            backgroundColor: 'var(--colorBrandStroke1)',
            borderRadius: '2px',
            boxShadow: '0 0 4px var(--colorBrandStroke1)',
            zIndex: 10,
        }
    },
    // 组件类型标签样式
    widgetType: {
        fontWeight: '600',
        fontSize: '14px',
        color: 'var(--colorNeutralForeground1)',
        display: 'block',
        marginBottom: '2px',
    },
    // 组件信息样式
    widgetInfo: {
        fontSize: '12px',
        color: 'var(--colorNeutralForeground3)',
    },
    // 属性分组样式
    propertyGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0px',
        marginTop: '0px',
        minWidth: 0, // 允许收缩以适应容器
        width: '100%',
        boxSizing: 'border-box',
    },
    // 属性行样式
    propertyRow: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
    },
    // 属性标签样式
    propertyLabel: {
        fontSize: '14px',
        fontWeight: '600',
    },
    // 面板标题样式
    panelTitle: {
        marginTop: '0px',
        marginBottom: '10px',
    },
    // 分区标题样式
    sectionTitle: {
        fontSize: '16px',
        fontWeight: '600',
        marginTop: '10px',
    },

    // 组件库网格布局
    libraryGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '16px',
        marginTop: '16px',
    },
    // 组件库项目卡片
    libraryItem: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        padding: '16px',
        gap: '16px',
        backgroundColor: 'var(--colorNeutralBackground1)',
        border: '1px solid var(--colorNeutralStroke1)',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.33, 0, 0.67, 1)',
        ':hover': {
            backgroundColor: 'var(--colorNeutralBackground1Hover)',
            borderColor: 'var(--colorBrandStroke1)',
            transform: 'translateY(-2px)',
            boxShadow: 'var(--shadow4)',
        }
    },
    // 组件库图标
    libraryItemIcon: {
        fontSize: '32px',
        color: 'var(--colorBrandForeground1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    // 组件库文本内容
    libraryItemContent: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
    },
    // 组件名称
    libraryItemTitle: {
        fontSize: '14px',
        fontWeight: '600',
        color: 'var(--colorNeutralForeground1)',
    },
    // 组件描述
    libraryItemDesc: {
        fontSize: '12px',
        color: 'var(--colorNeutralForeground3)',
        lineHeight: '1.4',
    },
    // 颜色选择器容器样式
    colorPickerContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginTop: '4px',
    },
    // 颜色输入框样式
    colorInput: {
        width: '48px',
        height: '32px',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        padding: '0',
        backgroundColor: 'transparent',
    },
    // 颜色值显示样式
    colorValue: {
        fontSize: '14px',
        fontWeight: '600',
        color: 'var(--colorBrandForeground1)',
        fontFamily: 'monospace',
    }
});
