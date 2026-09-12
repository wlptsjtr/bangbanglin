# -*- coding: utf-8 -*-
"""帮帮林 桌面启动器 (PyInstaller --windowed)
双击 exe -> 后台用自带 node.exe 启动 server.js -> 打开默认浏览器到用户端。
无控制台窗口, 不闪退; 关闭提示框后后台服务继续运行。"""
import os
import sys
import socket
import time
import subprocess
import webbrowser
import ctypes

BASE = os.path.dirname(os.path.abspath(sys.executable))
NODE = os.path.join(BASE, "node.exe")
SERVER = os.path.join(BASE, "server.js")
PORT = 3210
ADMIN_EMAIL = "2815097621@qq.com"


def port_open(port):
    s = socket.socket()
    s.settimeout(0.4)
    try:
        s.connect(("127.0.0.1", port))
        s.close()
        return True
    except Exception:
        return False


def msg(text, title="帮帮林 BangBangLin", style=0x40):
    try:
        ctypes.windll.user32.MessageBoxW(0, text, title, style)
    except Exception:
        pass


def main():
    try:
        if not port_open(PORT):
            si = subprocess.STARTUPINFO()
            si.dwFlags |= subprocess.STARTF_USESHOWWINDOW
            si.wShowWindow = 0  # SW_HIDE
            subprocess.Popen(
                [NODE, SERVER],
                cwd=BASE,
                startupinfo=si,
                creationflags=subprocess.CREATE_NEW_PROCESS_GROUP,
            )
            time.sleep(2.5)
        webbrowser.open("http://localhost:%d" % PORT)
        msg(
            "帮帮林已启动！\n\n"
            "用户端已在默认浏览器打开： http://localhost:3210\n"
            "管理员账户： %s （密码不对外展示，请妥善保管）\n\n"
            "点击【确定】关闭本提示，后台服务继续运行。\n"
            "停止服务请运行文件夹内的「停止帮帮林.bat」。" % (ADMIN_EMAIL,),
            "帮帮林 BangBangLin",
            0x40,
        )
    except Exception as e:
        msg("启动出错：%s" % str(e), "帮帮林", 0x10)


if __name__ == "__main__":
    main()
