# -*- coding: utf-8 -*-
"""生成帮帮林（Windows 桌面版）软著申请材料：
   1) 软件说明书.pdf
   2) 源程序代码_前30页后30页.pdf
读取真实源文件：server.js / index.html / admin.html / launcher.py
"""
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph,
                                Spacer, Table, TableStyle, PageBreak, Preformatted)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

ROOT = os.path.dirname(os.path.abspath(__file__))
FONT_DIR = "C:/Windows/Fonts"
SRC_DIR = os.path.abspath(os.path.join(ROOT, ".."))

pdfmetrics.registerFont(TTFont('YaHei', os.path.join(FONT_DIR, 'msyh.ttc'), subfontIndex=0))
pdfmetrics.registerFont(TTFont('YaHei-B', os.path.join(FONT_DIR, 'msyhbd.ttc'), subfontIndex=0))
pdfmetrics.registerFontFamily('YaHei', normal='YaHei', bold='YaHei-B', italic='YaHei', boldItalic='YaHei-B')

SOFT = "帮帮林智能学习与生涯规划系统"
VER = "V1.0（Windows 桌面版）"
OWNER = "【著作权人：请填写姓名或单位全称】"
DATE = "2026 年 8 月"

ss = getSampleStyleSheet()
NAVY = colors.HexColor('#1F3A5F')
BLUE = colors.HexColor('#2C5282')
_H1 = ParagraphStyle('H1', parent=ss['Heading1'], fontName='YaHei-B', fontSize=15, spaceBefore=6, spaceAfter=8, textColor=NAVY)
_H2 = ParagraphStyle('H2', parent=ss['Heading2'], fontName='YaHei-B', fontSize=12, spaceBefore=10, spaceAfter=5, textColor=BLUE)
_P  = ParagraphStyle('P', parent=ss['BodyText'], fontName='YaHei', fontSize=10, leading=17, spaceAfter=6)
_B  = ParagraphStyle('B', parent=_P, leftIndent=12, spaceAfter=3)
CODE = ParagraphStyle('CODE', parent=ss['Code'], fontName='YaHei', fontSize=7.5, leading=10)
_CAP = ParagraphStyle('CAP', parent=_P, alignment=1, fontSize=9, textColor=colors.grey)
_TITLE = ParagraphStyle('TITLE', parent=ss['Title'], fontName='YaHei-B', fontSize=20, spaceAfter=4)
_SUB = ParagraphStyle('SUB', parent=_P, alignment=1, fontSize=12, textColor=BLUE)


def H1(t): return Paragraph(t, _H1)
def H2(t): return Paragraph(t, _H2)
def P(t): return Paragraph(t, _P)
def B(t): return Paragraph(t, _B)
def CAP(t): return Paragraph(t, _CAP)
def TITLE(t): return Paragraph(t, _TITLE)
def SUB(t): return Paragraph(t, _SUB)

flow = []


def make_table(header, rows, widths):
    data = [[Paragraph('<b>%s</b>' % h, _P) for h in header]] + \
           [[Paragraph(str(c), _P) for c in r] for r in rows]
    t = Table(data, colWidths=widths, hAlign='LEFT')
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), NAVY),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'YaHei-B'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#AAB7C4')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F2F5F9')]),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    return t


def arch_diagram():
    txt = (
        "┌──────────────────────────┐        ┌──────────────────────────┐\n"
        "│   帮帮林.exe（桌面程序）   │        │    默认浏览器 / 内嵌视图   │\n"
        "│  (PyInstaller 打包)       │        │                          │\n"
        "│  ┌────────────────────┐   │  HTTP  │  ┌────────────────────┐  │\n"
        "│  │  node.exe (内置)    │   │◄──────►│  │  index.html 用户端  │  │\n"
        "│  │  server.js 本地服务 │   │ 3210   │  │  admin.html 管理端  │  │\n"
        "│  │  3210 用户 / 3211   │   │        │  │  (3211/admin, token)│  │\n"
        "│  └────────────────────┘   │        │  └────────────────────┘  │\n"
        "│  ./server-data/*.json     │        │  匿名报考数据上报 / 统计  │\n"
        "└──────────────────────────┘        └──────────────────────────┘"
    )
    return Preformatted(txt, ParagraphStyle('arch', parent=CODE, fontSize=7, leading=9))


# ============ 软件说明书 ============
flow.append(TITLE("软件说明书"))
flow.append(SUB("%s %s" % (SOFT, VER)))
flow.append(Spacer(1, 6))
flow.append(make_table(["项目", "内容"], [
    ["软件全称", SOFT],
    ["版本号", "V1.0"],
    ["著作权人", OWNER],
    ["开发完成日期", DATE],
    ["运行形态", "Windows 桌面可执行程序（.exe），双击即用，无需安装"],
    ["编程语言", "前端：HTML5 / CSS3 / 原生 JavaScript(ES5)；后端：Node.js(零依赖)；启动器：Python"],
], [110, 380]))
flow.append(Spacer(1, 10))

flow.append(H1("第 1 章　软件概述"))
flow.append(H2("1.1　开发背景"))
flow.append(P("帮帮林面向准备硕士研究生入学考试（考研）的本科生，以及希望在求学期间同步规划就业（实习、简历、面试、求职）的学生。它把“每日学习规划、长期备考里程碑、就业准备、AI 答疑、数据洞察”整合到一个轻量桌面软件中，并通过对其他用户匿名报考信息的汇聚，提供“考试人数概况”参考。"))
flow.append(H2("1.2　设计原则"))
flow.append(B("离线优先、隐私友好：核心数据默认留在本地。"))
flow.append(B("统一入口：全应用只有一个登录界面，管理员与普通用户据此分流。"))
flow.append(B("联网增强：匿名收集报考信息用于统计；可联网拉取考研真题与校招岗位，并对比官方信息查误。"))
flow.append(PageBreak())

flow.append(H1("第 2 章　运行环境与安装启动"))
flow.append(H2("2.1　运行环境"))
flow.append(make_table(["类别", "要求"], [
    ["硬件", "x86/x64 个人计算机；内存 ≥ 2 GB；可用存储 ≥ 200 MB（含内置 Node 运行时）。"],
    ["系统", "Windows 7 及以上（已在 Windows 11 验证）。"],
    ["依赖", "无需预装任何环境——Node.js 运行时已随 exe 内置打包。"],
    ["网络", "注册/登录、报考统计、真题岗位拉取需联网；纯本地浏览可离线。"],
], [90, 400]))
flow.append(H2("2.2　安装与启动"))
flow.append(P("本软件为绿色免安装形态：整个“帮帮林”文件夹即为完整程序。"))
flow.append(B("双击文件夹内的 帮帮林.exe：后台自动以内置 node.exe 启动 server.js 本地服务，并在默认浏览器打开用户端 http://localhost:3210。"))
flow.append(B("停止服务：双击 停止帮帮林.bat，或在弹窗点“确定”后于任务管理器结束 node 进程。"))
flow.append(B("文件夹可整体复制到其他 Windows 电脑直接使用（保持 exe 与 node.exe / server.js / index.html 等同级）。"))
flow.append(PageBreak())

flow.append(H1("第 3 章　总体架构与技术栈"))
flow.append(H2("3.1　系统架构"))
flow.append(P("软件采用“桌面可执行程序 + 内置本地服务 + 网页前端”的轻量架构。帮帮林.exe 由 PyInstaller 打包，内部集成 Node.js 运行时（node.exe）并拉起本地服务 server.js；前端 index.html（用户端）与 admin.html（管理端）以网页形式在浏览器中渲染，通过 HTTP 与本地服务通信。服务同时监听两个端口：3210（用户端）与 3211（管理端 /admin）。"))
flow.append(arch_diagram())
flow.append(CAP("图 3-1　系统总体架构示意图"))
flow.append(H2("3.2　技术栈"))
flow.append(B("标记与样式：HTML5、CSS3（Flex/Grid 布局、CSS 变量主题）。"))
flow.append(B("逻辑：原生 JavaScript（ES5），无前端框架、无打包工具。"))
flow.append(B("图形：Canvas（图表）、SVG（图标与示意图）。"))
flow.append(B("后端：Node.js 内置模块（http / fs），零第三方依赖，双端口同进程。"))
flow.append(B("打包：Python + PyInstaller 将启动器与内置 Node 运行时打包为 Windows 可执行文件。"))
flow.append(H2("3.3　文件与目录说明"))
flow.append(make_table(["文件 / 目录", "说明"], [
    ["帮帮林.exe", "桌面主程序（PyInstaller 打包，内含启动器与 Node 运行时）。"],
    ["node.exe", "内置 Node.js 运行时（随 exe 一并分发）。"],
    ["server.js", "本地服务：账号、双端口路由、匿名数据收集与统计、管理端 API。"],
    ["index.html", "用户端主程序（含全部 HTML/CSS/JS）。"],
    ["admin.html", "管理端控制台（KPI、用户、报考统计、真题/岗位库、查误）。"],
    ["launcher.py", "桌面启动器源码（PyInstaller 打包入口）。"],
    ["server-data/", "运行数据（users / anon / exams / jobs / reports 的 JSON）。"],
    ["README.md / LICENSE", "使用说明与开源协议文件。"],
], [150, 340]))
flow.append(PageBreak())

flow.append(H1("第 4 章　功能模块"))
flow.append(H2("4.1　用户端（index.html，端口 3210）"))
flow.append(make_table(["模块分组", "主要页面 / 功能"], [
    ["基础与导航", "首页（含“考试人数概况”）、我的档案、每日计划、长期规划日历"],
    ["考研学习", "英语学习、数学（高数）、专业课、考研政治"],
    ["健康与实践", "智能健身、实习投递"],
    ["就业准备", "生涯规划、简历分析、面试练习、技能证书、求职日历"],
    ["回顾与设置", "周复盘、月复盘、设置、隐私与知情同意"],
    ["智能增强", "AI 答疑 / 出题 / 对话式计划（WebLLM 本地或在线 API，附信息来源与免责）"],
], [110, 390]))
flow.append(H2("4.2　管理端（admin.html，端口 3211/admin）"))
flow.append(B("仅管理员账户可进入；凭登录后下发的 token 访问。"))
flow.append(B("KPI 概览：用户数、报考统计、数据健康度。"))
flow.append(B("用户列表：查看注册用户与权限标识。"))
flow.append(B("报考统计：按目标院校 / 统考代码 / 考研年份聚合的“考试人数概况”。"))
flow.append(B("真题库 / 岗位库：联网拉取，可对照官方链接（sourceUrl / officialCheckUrl）标注疑似错误。"))
flow.append(B("一键联网刷新：拉取最新真题与校招岗位。"))
flow.append(PageBreak())

flow.append(H1("第 5 章　统一登录与权限模型"))
flow.append(P("全应用只有一个登录界面。用户输入邮箱与密码后："))
flow.append(B("管理员账户（2815097621@qq.com）登录成功 → 出现「进入客户端 / 进入管理端」二选一；选择管理端后携带会话 token 跳转 3211/admin。"))
flow.append(B("普通账户登录成功 → 直接进入客户端，无需再选端口。"))
flow.append(B("管理端页面若无合法 token，将提示并自动跳回用户端登录，强制统一入口。"))
flow.append(P("密码仅保存于服务端配置与客户端必要校验逻辑中，不在任何界面明文展示。"))
flow.append(H1("第 6 章　数据存储与安全"))
flow.append(B("匿名收集：仅收集报考统计字段（目标院校 / 专业代码 / 考研年份 / 路线），不收集姓名、手机号、身份证。"))
flow.append(B("本地持久化：用户档案存于浏览器 localStorage；服务端数据存于 ./server-data/*.json。"))
flow.append(B("隐私知情同意：用户端登录前展示隐私与知情同意，勾选后方可上报。"))
flow.append(B("管理端查误：真题 / 岗位优先展示官方链接，便于管理员定期巡检标注错误。"))
flow.append(H1("第 7 章　技术特点与创新点"))
flow.append(B("双端口同进程的零依赖本地服务，配合桌面 exe 实现“双击即用”。"))
flow.append(B("统一登录分流，管理员与普通用户体验一致、权限隔离清晰。"))
flow.append(B("匿名数据汇聚形成“考试人数概况”，为考生提供群体参考。"))
flow.append(B("AI 能力优雅降级：WebLLM 本地 → 在线 API → 离线规则引擎。"))
flow.append(PageBreak())

flow.append(H1("第 8 章　操作流程示例"))
flow.append(H2("8.1　管理员使用流程"))
flow.append(B("1) 双击 帮帮林.exe，浏览器打开 http://localhost:3210。"))
flow.append(B("2) 以管理员账户登录，在二选一界面点击「进入管理端」。"))
flow.append(B("3) 在管理端查看报考统计、巡检真题 / 岗位库、一键联网刷新。"))
flow.append(H2("8.2　普通用户使用流程"))
flow.append(B("1) 双击 帮帮林.exe 打开用户端。"))
flow.append(B("2) 注册 / 登录账户，填写我的档案（目标院校、专业代码、考研年份）。"))
flow.append(B("3) 浏览首页“考试人数概况”，使用每日计划与 AI 答疑等功能。"))
flow.append(Spacer(1, 10))
flow.append(CAP("—— 软件说明书结束 ——"))


# ============ 源程序代码（前30页 + 后30页）============
def build_source_pages():
    files = [
        ("server.js", os.path.join(SRC_DIR, "server.js")),
        ("launcher.py", os.path.join(SRC_DIR, "launcher.py")),
        ("admin.html", os.path.join(SRC_DIR, "admin.html")),
        ("index.html", os.path.join(SRC_DIR, "index.html")),
    ]
    lines = []
    for fname, fpath in files:
        if not os.path.exists(fpath):
            continue
        with open(fpath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        lines.append("/* ===== FILE: %s ===== */" % fname)
        for ln in content.split('\n'):
            lines.append(ln.rstrip('\r'))
        lines.append("")
    # 每页 50 行
    PER = 50
    pages = [lines[i:i + PER] for i in range(0, len(lines), PER)]
    total = len(pages)
    sel = []
    if total <= 60:
        sel = list(range(total))
    else:
        sel = list(range(30)) + list(range(total - 30, total))
    out = []
    for idx, pno in enumerate(sel):
        header = "【%s  V1.0】  源程序代码  第 %d 页 / 共 %d 页" % (SOFT, idx + 1, len(sel))
        body = "\n".join(pages[pno])
        out.append(Preformatted(header + "\n" + body, CODE))
        out.append(PageBreak())
    return out, total, len(sel)


def on_page(canvas, doc):
    canvas.saveState()
    canvas.setFont('YaHei', 8)
    canvas.setFillColor(colors.grey)
    canvas.drawString(18 * mm, 10 * mm, "%s %s" % (SOFT, VER))
    canvas.drawRightString(A4[0] - 18 * mm, 10 * mm, "第 %d 页" % doc.page)
    canvas.restoreState()


def build_manual():
    out = os.path.join(ROOT, "软件说明书.pdf")
    doc = BaseDocTemplate(out, pagesize=A4,
                          leftMargin=18 * mm, rightMargin=18 * mm,
                          topMargin=16 * mm, bottomMargin=16 * mm)
    frame = Frame(doc.leftMargin, doc.bottomMargin,
                  doc.width, doc.height, id='main')
    doc.addPageTemplates([PageTemplate(id='main', frames=[frame], onPage=on_page)])
    doc.build(flow)
    print("软件说明书.pdf 生成完成 ->", out)


def build_source():
    out = os.path.join(ROOT, "源程序代码_前30页后30页.pdf")
    spages, total, shown = build_source_pages()
    doc = BaseDocTemplate(out, pagesize=A4,
                          leftMargin=14 * mm, rightMargin=14 * mm,
                          topMargin=14 * mm, bottomMargin=14 * mm)
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id='src')
    doc.addPageTemplates([PageTemplate(id='src', frames=[frame], onPage=on_page)])
    doc.build(spages)
    print("源程序代码_前30页后30页.pdf 生成完成 ->", out, "(源共 %d 页, 提交 %d 页)" % (total, shown))


if __name__ == "__main__":
    build_manual()
    build_source()
