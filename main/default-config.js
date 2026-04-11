/**
 * 默认配置文件
 * 打包时内置到 exe 中，首次运行时自动释放
 */
const DEFAULT_CONFIG = {
    "transforms": {
        "display": 0,
        "height": 64,
        "posy": 472,
        "animation_speed": 1,
        "size": 130,
        "auto_hide": true,
        "expand_mode": "drag",
        "click_expand_style": "bar",
        "panel": {
            "opacity": 0.9,
            "height": 450,
            "width": 300
        }
    },
    "widgets": [
        {
            "type": "drag_to_launch",
            "name": "发送到 LocalSend",
            "targets": "C:\\Program Files\\LocalSend\\localsend_app.exe {{source}}",
            "show_all_time": false
        },
        {
            "type": "launcher",
            "targets": [
                {
                    "name": "文件资源管理器",
                    "target": "explorer.exe",
                    "args": []
                },
                {
                    "name": "记事本",
                    "target": "notepad.exe",
                    "args": []
                }
            ],
            "layout": "grid_no_text",
            "width": 227
        },
        {
            "type": "launcher",
            "targets": [
                {
                    "name": "CI_test",
                    "target": "classisland://app/test",
                    "args": []
                },
                {
                    "name": "CI换课",
                    "target": "classisland://app/class-swap",
                    "args": []
                },
                {
                    "name": "SecRandom随机点名",
                    "target": "secrandom://pumping",
                    "args": []
                }
            ],
            "layout": "grid"
        },
        {
            "type": "volume_slider",
            "range": [0, 100]
        },
        {
            "type": "toolbar",
            "tools": ["timer", "screenshot", "touch_keyboard"]
        },
        {
            "type": "toolbar",
            "tools": ["show_desktop", "taskview", "close_front_window"]
        },
        {
            "type": "iccce_control",
            "functions": ["randone", "rand", "timer", "whiteboard", "show"],
            "show_only_when_running": true,
            "show_only_when_collapsed": false
        }
    ],
    "automatic": [],
    "helper_tools": {
        "auto_kill_similar": false,
        "auto_kill_timer": false,
        "icc_compatibility": true
    },
    "timer": {
        "auto_hide_seconds": 5,
        "enable_animations": "partial",
        "enable_sound": true
    }
};

module.exports = { DEFAULT_CONFIG };
