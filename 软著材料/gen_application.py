# -*- coding: utf-8 -*-
"""生成《软著申请表信息填写指南》（Markdown + PDF）。"""
import io
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph,
                                Spacer, Table, TableStyle, PageBreak)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

FONT = r'C:/Windows/Fonts/msyh.ttc'; FONT_B = r'C:/Windows/Fonts/msyhbd.ttc'
pdfmetrics.registerFont(TTFont('CJK', FONT, subfontIndex=0))
pdfmetrics.registerFont(TTFont('CJK-B', FONT_B, subfontIndex=0))
pdfmetrics.registerFontFamily('CJK', normal='CJK', bold='CJK-B', italic='CJK', boldItalic='CJK-B')

NAVY = colors.HexColor('#1F4E79'); GREY = colors.HexColor('#595959'); LIGHT = colors.HexColor('#F2F6FB')
ss = {}
ss['title'] = ParagraphStyle('t', fontName='CJK-B', fontSize=18, leading=24, textColor=NAVY, alignment=1, spaceAfter=4)
ss['sub'] = ParagraphStyle('s', fontName='CJK', fontSize=10, leading=15, textColor=GREY, alignment=1, spaceAfter=10)
ss['h'] = ParagraphStyle('h', fontName='CJK-B', fontSize=13, leading=18, textColor=NAVY, spaceBefore=10, spaceAfter=6)
ss['p'] = ParagraphStyle('p', fontName='CJK', fontSize=10, leading=16, spaceAfter=6)
ss['cell'] = ParagraphStyle('c', fontName='CJK', fontSize=9.5, leading=14, spaceAfter=0)
ss['cellb'] = ParagraphStyle('cb', fontName='CJK-B', fontSize=9.5, leading=14, textColor=colors.white, spaceAfter=0)
ss['cap'] = ParagraphStyle('cap', fontName='CJK', fontSize=9, leading=13, textColor=GREY, alignment=1)

OWNER = "【请填写著作权人真实姓名 / 单位全称】"

rows = [
    ("软件全称", "考研智能规划工作台软件"),
    ("软件简称（选填）", "考研工作台"),
    ("版本号", "V1.0"),
    ("软件分类", "应用软件"),
    ("行业领域", "教育 / 学习辅助类"),
    ("开发完成日期", "2026-08-16"),
    ("发表状态", "未发表（推荐，材料更简；如已上线可填“已发表”）"),
    ("发表日期 / 地点", "（若选已发表）首次上线日期 / 互联网（如 Vercel 静态托管）"),
    ("著作权人", OWNER),
    ("（个人）证件类型 / 号", "身份证 / 【请填写身份证号】"),
    ("（个人）国籍 / 地址", "中国 / 【请填写省份·城市·详细地址】"),
    ("（单位）信用代码 / 法人", "【单位填：统一社会信用代码】 / 【法定代表人】"),
    ("权利取得方式", "原始取得"),
    ("权利范围", "全部权利"),
    ("开发方式", "独立开发"),
    ("硬件环境", "Intel/AMD/ARM 架构个人计算机或移动设备，内存≥2GB，存储≥100MB"),
    ("软件环境", "Windows 7+/macOS 10.12+/Linux/Android/iOS；现代浏览器（Chrome/Edge/Firefox/Safari）；可选 Node.js 18+"),
    ("编程语言", "HTML、CSS、JavaScript（ES5）"),
    ("源程序量", "约 7660 行（单文件 index.html）"),
    ("开发工具", "文本编辑器、浏览器开发者工具"),
    ("是否使用开源代码", "否（自身以 MIT 协议开源，供自用与修改）"),
]

desc = ("本软件是一款面向本科生升学与就业的智能化学习管理工具，围绕“考研”与“就业”两条路线，"
        "提供个性化每日计划、长期备考日历、各科目进度跟踪、真题与题库训练、简历与面试辅助，"
        "以及周/月学习复盘等功能。软件采用纯前端单文件架构（index.html），零依赖、零构建、离线优先，"
        "数据默认保存于浏览器本地；可选接入 Node.js 后端实现云端同步，可选配置大模型 API Key 启用 AI 答疑、"
        "自动出题、拍照识别与对话式计划调整。其技术特点在于个性化动态规划、离线优先与隐私友好、"
        "轻量可审计的单文件交付，以及 AI 能力的优雅降级。")

checklist = [
    "1. 软件著作权登记申请表（在中国版权保护中心官网在线填报后打印，著作权人签字/盖章）。",
    "2. 源程序代码：前 30 页 + 后 30 页（本包《源程序代码_前30页后30页.pdf》）。",
    "3. 软件说明书（用户手册）：本包《软件说明书.pdf》。",
    "4. 著作权人身份证明：个人提交身份证复印件；单位提交营业执照复印件。",
    "5. 委托代理材料（如通过代理机构办理）。",
    "6. 本包《软著申请表信息填写指南》（即本文件）供填报参考。",
]

def build_pdf(path):
    data = [[Paragraph("字段", ss['cellb']), Paragraph("填写说明 / 建议值", ss['cellb'])]]
    for k, v in rows:
        data.append([Paragraph(k, ss['cell']), Paragraph(v, ss['cell'])])
    t = Table(data, colWidths=[150, 300], hAlign='LEFT')
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), NAVY),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#BFBFBF')),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, LIGHT]),
        ('TOPPADDING', (0,0), (-1,-1), 5), ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 6), ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    flow = []
    flow.append(Paragraph("软著申请表信息填写指南", ss['title']))
    flow.append(Paragraph("考研智能规划工作台软件 V1.0", ss['sub']))
    flow.append(Paragraph("一、申请表主要字段", ss['h']))
    flow.append(t)
    flow.append(Paragraph("二、软件功能与技术特点描述（填入申请表对应栏）", ss['h']))
    flow.append(Paragraph(desc, ss['p']))
    flow.append(Paragraph("三、提交材料清单", ss['h']))
    for c in checklist:
        flow.append(Paragraph(c, ss['p']))
    flow.append(Spacer(1, 8))
    flow.append(Paragraph("注：带【】的为需著作权人自行填写的真实信息；其余为建议值，可按实际调整。", ss['cap']))

    def deco(canvas, doc):
        canvas.saveState()
        canvas.setFont('CJK', 8); canvas.setFillColor(GREY)
        canvas.drawString(40, A4[1]-28, "软著申请表信息填写指南 · 考研智能规划工作台软件 V1.0")
        canvas.drawRightString(A4[0]-40, A4[1]-28, "第 %d 页" % doc.page)
        canvas.restoreState()
    doc = BaseDocTemplate(path, pagesize=A4, leftMargin=40, rightMargin=40, topMargin=42, bottomMargin=38,
                          title="软著申请表信息填写指南")
    doc.addPageTemplates([PageTemplate(id='a', frames=[Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id='m')], onPage=deco)])
    doc.build(flow)

def build_md(path):
    md = ["# 软著申请表信息填写指南", "",
          "> 软件名称：**考研智能规划工作台软件**　版本：**V1.0**", "",
          "## 一、申请表主要字段", "", "| 字段 | 填写说明 / 建议值 |", "|---|---|"]
    for k, v in rows:
        md.append("| %s | %s |" % (k, v.replace("|", "／")))
    md += ["", "## 二、软件功能与技术特点描述（填入申请表对应栏）", "", desc, "",
           "## 三、提交材料清单", ""]
    md += checklist
    md += ["", "> 带【】的为需著作权人自行填写的真实信息；其余为建议值，可按实际调整。", ""]
    io.open(path, 'w', encoding='utf-8').write("\n".join(md))

build_pdf(r"C:/Users/ASUS/WorkBuddy/2026-08-04-00-37-04/软著材料/软著申请表信息填写指南.pdf")
build_md(r"C:/Users/ASUS/WorkBuddy/2026-08-04-00-37-04/软著材料/软著申请表信息填写指南.md")
print("application info written (pdf + md)")
