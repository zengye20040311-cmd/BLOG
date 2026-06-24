const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat,
  HeadingLevel, BorderStyle, WidthType, ShadingType,
  PageBreak, PageNumber
} = require("docx");

const C = {
  primary: "1A5276", accent: "2E86C1", success: "1D8348", warning: "B7950B",
  danger: "922B21", purple: "6C3483",
  lightBlue: "D6EAF8", lightGreen: "D5F5E3", lightYellow: "FEF9E7",
  lightRed: "FADBD8", lightPurple: "E8DAEF", lightGray: "F2F3F4",
  medGray: "BDC3C7", darkGray: "2C3E50", white: "FFFFFF",
};

const border = { style: BorderStyle.SINGLE, size: 1, color: C.medGray };
const borders = { top: border, bottom: border, left: border, right: border };
const noBorder = { style: BorderStyle.NONE, size: 0 };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };
const cellMargins = { top: 80, bottom: 80, left: 120, right: 120 };

function heading1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(text)], spacing: { before: 360, after: 200 } });
}
function heading2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)], spacing: { before: 280, after: 160 } });
}
function heading3(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(text)], spacing: { before: 200, after: 120 } });
}
function para(texts, opts = {}) {
  const runs = texts.map(t => typeof t === "string" ? new TextRun({ text: t, size: 22, font: "Arial" }) : new TextRun({ size: 22, font: "Arial", ...t }));
  return new Paragraph({ children: runs, spacing: { after: 120, line: 360 }, ...opts });
}
function bold(text) { return { text, bold: true }; }
function colored(text, color) { return { text, color }; }
function code(text) { return { text, font: "Consolas", size: 20, color: C.danger }; }
function bulletItem(texts, ref = "bullets", level = 0) {
  const runs = texts.map(t => typeof t === "string" ? new TextRun({ text: t, size: 22, font: "Arial" }) : new TextRun({ size: 22, font: "Arial", ...t }));
  return new Paragraph({ numbering: { reference: ref, level }, children: runs, spacing: { after: 80, line: 340 } });
}
function numberItem(texts, ref = "numbers") {
  return bulletItem(texts, ref, 0);
}

function headerCell(text, width) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders, margins: cellMargins,
    shading: { fill: C.primary, type: ShadingType.CLEAR },
    verticalAlign: "center",
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: C.white, size: 20, font: "Arial" })], alignment: AlignmentType.CENTER })],
  });
}
function dataCell(texts, width, fill) {
  const runs = texts.map(t => typeof t === "string" ? new TextRun({ text: t, size: 20, font: "Arial" }) : new TextRun({ size: 20, font: "Arial", ...t }));
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders, margins: cellMargins,
    shading: fill ? { fill, type: ShadingType.CLEAR } : undefined,
    verticalAlign: "center",
    children: [new Paragraph({ children: runs, spacing: { after: 40 } })],
  });
}

function infoBox(title, bodyTexts, accentColor, bgColor) {
  const leftBorder = { style: BorderStyle.SINGLE, size: 12, color: accentColor };
  const thinBorder = { style: BorderStyle.SINGLE, size: 1, color: bgColor };
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [new TableRow({
      children: [new TableCell({
        width: { size: 9360, type: WidthType.DXA },
        borders: { left: leftBorder, top: thinBorder, bottom: thinBorder, right: thinBorder },
        margins: { top: 120, bottom: 120, left: 200, right: 200 },
        shading: { fill: bgColor, type: ShadingType.CLEAR },
        children: [
          new Paragraph({ children: [new TextRun({ text: title, bold: true, size: 22, font: "Arial", color: accentColor })], spacing: { after: 80 } }),
          ...bodyTexts.map(t => para(typeof t === "string" ? [t] : t)),
        ],
      })],
    })],
  });
}

function spacer(h = 200) { return new Paragraph({ spacing: { before: h } }); }

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, font: "Arial", color: C.primary },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Arial", color: C.accent },
        paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Arial", color: C.darkGray },
        paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2 } },
    ],
  },
  numbering: {
    config: [
      { reference: "bullets", levels: [
        { level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
        { level: 1, format: LevelFormat.BULLET, text: "\u25E6", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1440, hanging: 360 } } } },
      ]},
      { reference: "numbers", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbersA", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbersB", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbersC", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbersD", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ],
  },
  sections: [
    // ==================== COVER ====================
    {
      properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
      children: [
        spacer(2400),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "\u4E2A\u4EBA\u6280\u672F\u535A\u5BA2", size: 56, bold: true, font: "Arial", color: C.primary })], spacing: { after: 80 } }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "\u8BBE\u8BA1\u4E0E\u5B9E\u65BD\u65B9\u6848", size: 56, bold: true, font: "Arial", color: C.primary })], spacing: { after: 400 } }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "\u2014\u2014 \u77E5\u8BC6\u56FE\u8C31\u9996\u9875 + DeepSeek AI \u96C6\u6210 + \u6280\u672F\u5185\u5BB9\u4F53\u7CFB \u2014\u2014", size: 24, color: C.accent, font: "Arial" })], spacing: { after: 600 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          border: { top: { style: BorderStyle.SINGLE, size: 2, color: C.accent, space: 12 } },
          children: [
            new TextRun({ text: "\u6280\u672F\u6808\uFF1A", bold: true, size: 22, color: C.darkGray, font: "Arial" }),
            new TextRun({ text: "VitePress + D3.js + DeepSeek API + Vercel", size: 22, color: C.darkGray, font: "Arial" }),
          ],
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "\u5B9A\u4F4D\uFF1A\u6280\u672F\u6587\u7AE0 + \u9879\u76EE\u5C55\u793A + \u5B66\u4E60\u7B14\u8BB0 + AI \u667A\u80FD\u5BFC\u822A", size: 22, color: C.darkGray, font: "Arial" })], spacing: { after: 100 } }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "2026 \u5E74 6 \u6708", size: 22, color: C.medGray, font: "Arial" })], spacing: { before: 400 } }),
      ],
    },

    // ==================== MAIN ====================
    {
      properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "\u4E2A\u4EBA\u6280\u672F\u535A\u5BA2\u8BBE\u8BA1\u65B9\u6848", size: 18, color: C.medGray, font: "Arial", italics: true })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "\u2014 ", size: 18, color: C.medGray }), new TextRun({ children: [PageNumber.CURRENT], size: 18, color: C.medGray }), new TextRun({ text: " \u2014", size: 18, color: C.medGray })] })] }) },
      children: [

        // ============ PART 1 ============
        heading1("\u4E00\u3001\u535A\u5BA2\u5B9A\u4F4D\u4E0E\u76EE\u6807"),

        heading2("1.1 \u535A\u5BA2\u7684\u6838\u5FC3\u76EE\u6807"),
        para(["\u8FD9\u4E0D\u662F\u4E00\u4E2A\u666E\u901A\u7684\u6280\u672F\u535A\u5BA2\uFF0C\u800C\u662F\u4E00\u4E2A\u300C\u4E2A\u4EBA\u77E5\u8BC6\u4F53\u7CFB\u7684\u53EF\u89C6\u5316\u5C55\u793A\u300D\uFF0C\u670D\u52A1\u4E8E\u4E24\u4E2A\u6838\u5FC3\u76EE\u6807\uFF1A"]),
        numberItem([bold("\u5B9E\u4E60\u7533\u8BF7\uFF1A"), "\u8BA9\u9762\u8BD5\u5B98\u4E00\u773C\u770B\u51FA\u4F60\u7684\u77E5\u8BC6\u6DF1\u5EA6\u3001\u5DE5\u7A0B\u80FD\u529B\u548C\u601D\u8003\u8FC7\u7A0B\u3002\u535A\u5BA2\u672C\u8EAB\u5C31\u662F\u4E00\u4E2A\u5C55\u793A\u9879\u76EE\u2014\u2014\u6709\u77E5\u8BC6\u56FE\u8C31\u3001\u6709 AI \u96C6\u6210\u3001\u6709\u5B8C\u6574\u7684\u5DE5\u7A0B\u5B9E\u73B0\u3002"], "numbers"),
        numberItem([bold("\u4E2A\u4EBA\u77E5\u8BC6\u7BA1\u7406\uFF1A"), "\u628A\u5B66\u4E60\u8FC7\u7A0B\u7CFB\u7EDF\u5316\u3001\u53EF\u89C6\u5316\uFF0C\u5F62\u6210\u53EF\u79EF\u7D2F\u3001\u53EF\u56DE\u987E\u7684\u77E5\u8BC6\u4F53\u7CFB\u3002"], "numbers"),

        heading2("1.2 \u535A\u5BA2\u7684\u5DEE\u5F02\u5316\u7279\u70B9"),
        infoBox("\u4E09\u4E2A\u4E0E\u4F17\u4E0D\u540C\u7684\u8BBE\u8BA1\u51B3\u7B56", [
          [bold("\u77E5\u8BC6\u56FE\u8C31\u9996\u9875\uFF1A"), "\u4E0D\u662F\u4F20\u7EDF\u7684\u6587\u7AE0\u5217\u8868\uFF0C\u800C\u662F\u4E00\u4E2A\u53EF\u4EA4\u4E92\u7684\u529B\u5BFC\u5411\u65E0\u5411\u56FE\u3002\u6BCF\u4E2A\u8282\u70B9\u662F\u4E00\u4E2A\u77E5\u8BC6\u4E3B\u9898\uFF0C\u8FB9\u8868\u793A\u4E3B\u9898\u4E4B\u95F4\u7684\u5173\u8054\u3002\u70B9\u51FB\u8282\u70B9\u8FDB\u5165\u8BE5\u4E3B\u9898\u7684\u6587\u7AE0\u5217\u8868\u3002"],
          [bold("DeepSeek AI \u96C6\u6210\uFF1A"), "\u535A\u5BA2\u5185\u7F6E\u667A\u80FD\u52A9\u624B\uFF0C\u80FD\u6839\u636E\u7528\u6237\u95EE\u9898\u63A8\u8350\u76F8\u5173\u6587\u7AE0\uFF0C\u5728\u6587\u7AE0\u9875\u9762\u505A\u57FA\u4E8E\u5185\u5BB9\u7684\u95EE\u7B54\u3002\u8FD9\u672C\u8EAB\u5C31\u662F\u4E00\u4E2A\u5C0F\u578B\u7684 RAG + Agent \u7CFB\u7EDF\u3002"],
          [bold("\u5185\u5BB9\u5206\u5C42\uFF1A"), "\u6280\u672F\u6587\u7AE0\uFF08\u539F\u521B\u601D\u8003\uFF09\u548C\u5B66\u4E60\u7B14\u8BB0\uFF08\u8BFE\u7A0B/\u8BBA\u6587/\u5F00\u6E90\uFF09\u660E\u786E\u5206\u5F00\uFF0C\u9762\u8BD5\u5B98\u4E00\u773C\u80FD\u770B\u51FA\u54EA\u4E9B\u662F\u4F60\u7684\u539F\u521B\u601D\u8003\u3002"],
        ], C.accent, C.lightBlue),

        // ============ PART 2 ============
        heading1("\u4E8C\u3001\u6280\u672F\u6808\u9009\u62E9"),

        heading2("2.1 \u4E3A\u4EC0\u4E48\u9009 VitePress \u800C\u4E0D\u662F Hugo"),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [2000, 3680, 3680],
          rows: [
            new TableRow({ children: [headerCell("\u7EF4\u5EA6", 2000), headerCell("Hugo", 3680), headerCell("VitePress\uFF08\u63A8\u8350\uFF09", 3680)] }),
            new TableRow({ children: [dataCell(["\u6A21\u677F\u8BED\u8A00"], 2000), dataCell(["Go template\uFF0C\u8BED\u6CD5\u53E4\u602A\uFF0C\u8C03\u8BD5\u56F0\u96BE"], 3680), dataCell(["Vue 3 \u7EC4\u4EF6\uFF0C\u73B0\u4EE3\u3001\u7075\u6D3B"], 3680)] }),
            new TableRow({ children: [dataCell(["\u4EA4\u4E92\u7EC4\u4EF6"], 2000, C.lightYellow), dataCell(["\u624B\u5199\u539F\u751F JS \u5D4C\u5165\u6A21\u677F\uFF0C\u590D\u6742"], 3680, C.lightYellow), dataCell(["Markdown \u91CC\u76F4\u63A5\u5199 <Component />\uFF0C\u7B80\u5355"], 3680, C.lightYellow)] }),
            new TableRow({ children: [dataCell(["\u77E5\u8BC6\u56FE\u8C31"], 2000), dataCell(["\u9700\u8981\u5927\u91CF hack"], 3680), dataCell(["D3.js Vue \u7EC4\u4EF6\uFF0C\u539F\u751F\u652F\u6301"], 3680)] }),
            new TableRow({ children: [dataCell(["API \u8C03\u7528"], 2000, C.lightYellow), dataCell(["\u9700\u8981\u989D\u5916\u642D\u5EFA JS \u73AF\u5883"], 3680, C.lightYellow), dataCell(["Vue \u7EC4\u4EF6\u91CC\u76F4\u63A5 fetch"], 3680, C.lightYellow)] }),
            new TableRow({ children: [dataCell(["\u6784\u5EFA\u901F\u5EA6"], 2000), dataCell(["\u975E\u5E38\u5FEB\uFF08Go \u7F16\u8BD1\uFF09"], 3680), dataCell(["\u5F88\u5FEB\uFF08Vite \u70ED\u66F4\u65B0\uFF09"], 3680)] }),
            new TableRow({ children: [dataCell(["\u5B66\u4E60\u6210\u672C"], 2000, C.lightGreen), dataCell(["\u4E2D\u7B49\uFF08Go template \u72EC\u7279\uFF09"], 3680, C.lightGreen), dataCell([colored("\u4F4E\uFF08Vue \u751F\u6001\u6210\u719F\uFF09", C.success)], 3680, C.lightGreen)] }),
          ],
        }),

        spacer(120),
        heading2("2.2 \u5B8C\u6574\u6280\u672F\u6808"),
        bulletItem([bold("VitePress\uFF1A"), "\u9759\u6001\u7AD9\u70B9\u751F\u6210\u5668\uFF0CMarkdown \u5199\u6587\u7AE0\uFF0CVue \u7EC4\u4EF6\u505A\u4EA4\u4E92"]),
        bulletItem([bold("D3.js\uFF1A"), "\u9996\u9875\u77E5\u8BC6\u56FE\u8C31\u7684\u529B\u5BFC\u5411\u5E03\u5C40\uFF0C\u8282\u70B9\u62D6\u62FD\u3001\u70B9\u51FB\u3001\u60AC\u505C\u4EA4\u4E92"]),
        bulletItem([bold("DeepSeek API\uFF1A"), "\u667A\u80FD\u5BFC\u822A\u3001\u6587\u7AE0\u95EE\u7B54\u3001\u77E5\u8BC6\u56FE\u8C31\u4EA4\u4E92\u7684\u540E\u7AEF AI"]),
        bulletItem([bold("Vercel\uFF1A"), "\u4E00\u952E\u90E8\u7F72\uFF0C\u81EA\u5B9A\u4E49\u57DF\u540D\uFF0CCDN \u5168\u7403\u52A0\u901F"]),
        bulletItem([bold("Tailwind CSS\uFF08\u53EF\u9009\uFF09\uFF1A"), "\u5FEB\u901F\u6837\u5F0F\u5F00\u53D1\uFF0CVitePress \u539F\u751F\u652F\u6301"]),

        // ============ PART 3 ============
        heading1("\u4E09\u3001\u7AD9\u70B9\u7ED3\u6784\u4E0E\u9875\u9762\u8BBE\u8BA1"),

        heading2("3.1 \u9875\u9762\u4E00\uFF1A\u9996\u9875\u2014\u2014\u77E5\u8BC6\u56FE\u8C31\uFF08\u6838\u5FC3\u4EAE\u70B9\uFF09"),

        heading3("\u8BBE\u8BA1\u7406\u5FF5"),
        para(["\u9996\u9875\u4E0D\u662F\u6587\u7AE0\u5217\u8868\uFF0C\u800C\u662F\u4E00\u4E2A\u53EF\u4EA4\u4E92\u7684\u529B\u5BFC\u5411\u65E0\u5411\u56FE\u3002\u6BCF\u4E2A\u8282\u70B9\u662F\u4E00\u4E2A\u77E5\u8BC6\u4E3B\u9898\uFF08\u5982 PPO\u3001Memory\u3001RAG\uFF09\uFF0C\u8282\u70B9\u4E4B\u95F4\u7684\u8FB9\u8868\u793A\u4E3B\u9898\u5173\u8054\u3002\u7528\u6237\u53EF\u4EE5\u901A\u8FC7\u62D6\u62FD\u3001\u70B9\u51FB\u3001\u641C\u7D22\u6765\u63A2\u7D22\u77E5\u8BC6\u4F53\u7CFB\u3002"]),

        heading3("\u8282\u70B9\u8BBE\u8BA1"),
        bulletItem([bold("\u8282\u70B9\u5927\u5C0F\uFF1A"), "\u6309\u8BE5\u4E3B\u9898\u4E0B\u7684\u6587\u7AE0\u6570\u91CF\u7F29\u653E\uFF0C\u6587\u7AE0\u8D8A\u591A\u8282\u70B9\u8D8A\u5927"]),
        bulletItem([bold("\u8282\u70B9\u989C\u8272\uFF1A"), "\u6309\u4E3B\u9898\u5206\u7C7B\u7740\u8272\u2014\u2014\u7D2B\u8272 = RL\uFF0C\u7EFF\u8272 = Agent\uFF0C\u84DD\u8272 = LLM\uFF0C\u6A59\u8272 = \u9879\u76EE\uFF0C\u7070\u8272 = Infra"]),
        bulletItem([bold("\u8282\u70B9\u6587\u672C\uFF1A"), "\u663E\u793A\u4E3B\u9898\u540D\u79F0\uFF0C\u5982\u201CPPO\u201D\u201CMemory\u201D\u201CRLHF\u201D"]),

        heading3("\u8FB9\u7684\u751F\u6210\u903B\u8F91"),
        para(["\u8FB9\u4E0D\u9700\u8981\u624B\u52A8\u7EF4\u62A4\u3002\u6BCF\u7BC7\u6587\u7AE0\u7684 frontmatter \u91CC\u5199\u597D tags\uFF0C\u6784\u5EFA\u65F6\u81EA\u52A8\u626B\u63CF\u6240\u6709\u6587\u7AE0\uFF0C\u751F\u6210\u56FE\u8C31\u6570\u636E\uFF1A"]),
        bulletItem(["\u4E24\u7BC7\u6587\u7AE0\u5171\u4EAB\u540C\u4E00\u4E2A tag \u2192 \u8FD9\u4E24\u4E2A tag \u4E4B\u95F4\u6709\u4E00\u6761\u8FB9"]),
        bulletItem(["\u5171\u4EAB\u6B21\u6570\u8D8A\u591A \u2192 \u8FB9\u8D8A\u7C97\uFF08\u5173\u8054\u5F3A\u5EA6\u8D8A\u9AD8\uFF09"]),
        bulletItem(["\u65B0\u5199\u4E00\u7BC7\u6587\u7AE0 \u2192 \u56FE\u8C31\u81EA\u52A8\u66F4\u65B0\uFF0C\u8282\u70B9\u53EF\u80FD\u53D8\u5927\u3001\u65B0\u8FB9\u53EF\u80FD\u51FA\u73B0"]),

        heading3("\u4EA4\u4E92\u884C\u4E3A"),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [2400, 3480, 3480],
          rows: [
            new TableRow({ children: [headerCell("\u64CD\u4F5C", 2400), headerCell("\u884C\u4E3A", 3480), headerCell("\u6280\u672F\u5B9E\u73B0", 3480)] }),
            new TableRow({ children: [dataCell(["\u60AC\u505C\u8282\u70B9"], 2400), dataCell(["\u663E\u793A\u4E3B\u9898\u63CF\u8FF0\u3001\u6587\u7AE0\u6570"], 3480), dataCell(["D3 mouseover \u4E8B\u4EF6 + tooltip"], 3480)] }),
            new TableRow({ children: [dataCell(["\u70B9\u51FB\u8282\u70B9"], 2400, C.lightBlue), dataCell(["\u8DF3\u8F6C\u5230\u8BE5\u6807\u7B7E\u7684\u6587\u7AE0\u5217\u8868\u9875"], 3480, C.lightBlue), dataCell(["Vue Router \u5BFC\u822A"], 3480, C.lightBlue)] }),
            new TableRow({ children: [dataCell(["\u62D6\u62FD\u8282\u70B9"], 2400), dataCell(["\u529B\u5BFC\u5411\u6A21\u62DF\u5B9E\u65F6\u54CD\u5E94"], 3480), dataCell(["D3 forceSimulation + drag"], 3480)] }),
            new TableRow({ children: [dataCell(["\u641C\u7D22\u6846\u8F93\u5165"], 2400, C.lightBlue), dataCell(["\u9AD8\u4EAE\u5339\u914D\u8282\u70B9\uFF0C\u6DE1\u5316\u5176\u4ED6\u8282\u70B9"], 3480, C.lightBlue), dataCell(["\u7B5B\u9009 + opacity \u52A8\u753B"], 3480, C.lightBlue)] }),
          ],
        }),

        heading3("\u6280\u672F\u5B9E\u73B0\u8981\u70B9"),
        para(["\u7528 D3.js \u7684 ", code("forceSimulation"), " \u505A\u529B\u5BFC\u5411\u5E03\u5C40\uFF0C\u5305\u542B\u4EE5\u4E0B\u529B\uFF1A"]),
        bulletItem([code("forceManyBody"), "\uFF1A\u8282\u70B9\u4E4B\u95F4\u7684\u65A5\u529B\uFF0C\u9632\u6B62\u91CD\u53E0"]),
        bulletItem([code("forceLink"), "\uFF1A\u6709\u8FB9\u7684\u8282\u70B9\u4E4B\u95F4\u7684\u5F15\u529B\uFF0C\u4FDD\u6301\u5408\u7406\u8DDD\u79BB"]),
        bulletItem([code("forceCenter"), "\uFF1A\u5C06\u56FE\u8C31\u5C45\u4E2D\u663E\u793A"]),
        bulletItem([code("forceCollide"), "\uFF1A\u9632\u6B62\u8282\u70B9\u91CD\u53E0"]),

        spacer(120),
        heading2("3.2 \u9875\u9762\u4E8C\uFF1A\u6280\u672F\u6587\u7AE0\uFF08\u6838\u5FC3\u5185\u5BB9\uFF09"),

        heading3("Frontmatter \u5143\u6570\u636E\u89C4\u8303"),
        para(["\u6BCF\u7BC7\u6587\u7AE0\u5FC5\u987B\u5305\u542B\u4EE5\u4E0B\u5143\u6570\u636E\uFF0C\u8FD9\u4E9B\u6570\u636E\u4E5F\u662F\u77E5\u8BC6\u56FE\u8C31\u7684\u6570\u636E\u6E90\uFF1A"]),
        infoBox("Frontmatter \u793A\u4F8B", [
          [code("---")],
          [code("title: PPO \u6DF1\u5165\u7406\u89E3\uFF1A\u4ECE\u7B56\u7565\u68AF\u5EA6\u5230\u88C1\u526A\u4F18\u5316")],
          [code("date: 2026-08-15")],
          [code("tags: [RL, PPO, Policy-Gradient, PyTorch]")],
          [code("category: reinforcement-learning")],
          [code("difficulty: intermediate")],
          [code("github: https://github.com/xxx/ppo-impl")],
          [code("summary: \u4ECE\u6570\u5B66\u63A8\u5BFC\u5230\u5B8C\u6574\u4EE3\u7801\u5B9E\u73B0\uFF0C\u7406\u89E3 PPO \u7684\u8BBE\u8BA1\u51B3\u7B56")],
          [code("---")],
        ], C.danger, C.lightRed),

        heading3("\u6587\u7AE0\u6B63\u6587\u7ED3\u6784\uFF08\u6BCF\u7BC7\u90FD\u9075\u5B88\uFF09"),
        numberItem([bold("\u95EE\u9898\u5B9A\u4E49\uFF1A"), "\u4E3A\u4EC0\u4E48\u9700\u8981\u8FD9\u4E2A\u6280\u672F\uFF1F\u5B83\u89E3\u51B3\u4E86\u4EC0\u4E48\u95EE\u9898\uFF1F"], "numbersA"),
        numberItem([bold("\u6838\u5FC3\u539F\u7406\uFF1A"), "\u6570\u5B66\u63A8\u5BFC\uFF08\u5982\u9700\uFF09+ \u76F4\u89C9\u89E3\u91CA + \u56FE\u793A"], "numbersA"),
        numberItem([bold("\u4EE3\u7801\u5B9E\u73B0\uFF1A"), "\u5173\u952E\u4EE3\u7801\u7247\u6BB5 + GitHub \u4ED3\u5E93\u94FE\u63A5"], "numbersA"),
        numberItem([bold("\u5B9E\u9A8C\u7ED3\u679C\uFF1A"), "\u8BAD\u7EC3\u66F2\u7EBF\u3001\u5BF9\u6BD4\u56FE\u8868\u3001\u5173\u952E\u6570\u636E"], "numbersA"),
        numberItem([bold("\u8E29\u5751\u8BB0\u5F55\uFF1A"), "\u771F\u5B9E\u9047\u5230\u7684\u95EE\u9898\u548C\u89E3\u51B3\u65B9\u6848"], "numbersA"),
        numberItem([bold("\u53C2\u8003\u6587\u732E\uFF1A"), "\u8BBA\u6587\u3001\u535A\u5BA2\u3001\u5F00\u6E90\u9879\u76EE\u94FE\u63A5"], "numbersA"),

        spacer(60),
        infoBox("\u5199\u4F5C\u539F\u5219", [
          "\u4E0D\u5199\u300C\u8BFE\u7A0B\u7B14\u8BB0\u300D\u578B\u535A\u5BA2\uFF0C\u5199\u300C\u6211\u600E\u6837\u7406\u89E3\u8FD9\u4E2A\u95EE\u9898\u300D\u578B\u535A\u5BA2\u3002\u524D\u8005\u662F\u590D\u8FF0\uFF0C\u540E\u8005\u662F\u601D\u8003\u3002",
          "\u6BCF\u7BC7\u90FD\u9644\u5E26 GitHub \u4EE3\u7801\u94FE\u63A5\uFF0C\u8BA9\u9762\u8BD5\u5B98\u80FD\u76F4\u63A5\u770B\u4EE3\u7801\u3002",
          "\u6BCF\u7BC7\u6587\u7AE0\u5FC5\u987B\u6709\u300C\u53CD\u601D\u300D\u7684\u90E8\u5206\u2014\u2014\u8FD9\u4E2A\u65B9\u6CD5\u7684\u5C40\u9650\u6027\u662F\u4EC0\u4E48\uFF1F\u5982\u679C\u91CD\u65B0\u505A\u4F1A\u600E\u4E48\u6539\uFF1F",
        ], C.success, C.lightGreen),

        heading2("3.3 \u9875\u9762\u4E09\uFF1A\u5B66\u4E60\u7B14\u8BB0\uFF08\u4E0E\u6280\u672F\u6587\u7AE0\u5206\u5F00\uFF09"),
        para([bold("\u4E3A\u4EC0\u4E48\u5206\u5F00\uFF1A"), "\u6280\u672F\u6587\u7AE0\u662F\u4F60\u7684\u539F\u521B\u601D\u8003\u548C\u5B9E\u9A8C\uFF0C\u9762\u8BD5\u65F6\u53EF\u4EE5\u6DF1\u5165\u8BA8\u8BBA\u3002\u5B66\u4E60\u7B14\u8BB0\u662F\u8BFE\u7A0B/\u8BBA\u6587/\u5F00\u6E90\u7684\u9605\u8BFB\u8BB0\u5F55\uFF0C\u4EE5\u7406\u89E3\u548C\u603B\u7ED3\u4E3A\u4E3B\u3002\u5206\u5F00\u653E\u8BA9\u9762\u8BD5\u5B98\u4E00\u773C\u770B\u51FA\u54EA\u4E9B\u662F\u4F60\u7684\u539F\u521B\u3002"]),

        heading3("\u4E09\u7C7B\u5B66\u4E60\u7B14\u8BB0"),
        bulletItem([bold("\u8BFE\u7A0B\u7B14\u8BB0\uFF1A"), "\u674E\u5B8F\u6BC5 RL\u3001CS285 \u7B49\u8BFE\u7A0B\u3002\u6BCF\u8282\u8BFE\u4E00\u7BC7\uFF0C\u9644\u5E26\u8FDB\u5EA6\u6761\u663E\u793A\u5B66\u4E60\u8FDB\u5EA6\u3002"]),
        bulletItem([bold("\u8BBA\u6587\u9605\u8BFB\uFF1A"), "RLHF\u3001DPO\u3001GenericAgent \u7B49\u8BBA\u6587\u3002\u7ED3\u6784\u5316\u6A21\u677F\uFF1A\u95EE\u9898 \u2192 \u65B9\u6CD5 \u2192 \u7ED3\u679C \u2192 \u5C40\u9650 \u2192 \u6211\u7684\u7406\u89E3\u3002"]),
        bulletItem([bold("\u5F00\u6E90\u9879\u76EE\u6E90\u7801\u89E3\u8BFB\uFF1A"), "trl\u3001OpenRLHF\u3001LangChain \u7B49\u3002\u6838\u5FC3\u4EE3\u7801\u8DEF\u5F84\u89E3\u8BFB + \u67B6\u6784\u56FE\u3002"]),

        heading2("3.4 \u9875\u9762\u56DB\uFF1A\u9879\u76EE\u5C55\u793A"),
        para(["\u5361\u7247\u5F0F\u5E03\u5C40\uFF0C\u6BCF\u4E2A\u9879\u76EE\u4E00\u5F20\u5361\u7247\uFF0C\u5305\u542B\uFF1A"]),
        bulletItem(["\u9879\u76EE\u540D + \u4E00\u53E5\u8BDD\u63CF\u8FF0"]),
        bulletItem(["\u6280\u672F\u6808\u6807\u7B7E\uFF08\u5982 GenericAgent + LangChain + Chroma\uFF09"]),
        bulletItem(["\u67B6\u6784\u56FE\uFF08\u53EF\u590D\u7528\u77E5\u8BC6\u56FE\u8C31\u7684\u5C40\u90E8\u56FE\uFF0C\u53EA\u663E\u793A\u8BE5\u9879\u76EE\u6D89\u53CA\u7684\u8282\u70B9\uFF09"]),
        bulletItem(["\u6838\u5FC3\u521B\u65B0\u70B9\uFF082-3 \u53E5\u8BDD\uFF09"]),
        bulletItem(["GitHub \u94FE\u63A5 + Demo \u89C6\u9891\u5D4C\u5165"]),
        bulletItem(["\u76F8\u5173\u535A\u5BA2\u6587\u7AE0\u94FE\u63A5"]),

        heading2("3.5 \u9875\u9762\u4E94\uFF1A\u5173\u4E8E\u6211"),
        bulletItem(["\u4E00\u6BB5\u81EA\u6211\u4ECB\u7ECD\uFF083-5 \u53E5\u8BDD\uFF09"]),
        bulletItem(["\u6280\u80FD\u96F7\u8FBE\u56FE\uFF08RL / Agent / Python / C++ / LLM\u7B49\u7EF4\u5EA6\uFF09"]),
        bulletItem(["\u6559\u80B2\u7ECF\u5386\u65F6\u95F4\u7EBF\uFF08\u672C\u79D1 \u2192 \u7855\u58EB\uFF09"]),
        bulletItem(["\u79D1\u7814\u9879\u76EE\u7B80\u4ECB"]),
        bulletItem(["GitHub / \u90AE\u7BB1\u8054\u7CFB\u65B9\u5F0F"]),

        // ============ PART 4 ============
        new Paragraph({ children: [new PageBreak()] }),
        heading1("\u56DB\u3001DeepSeek AI \u96C6\u6210\u65B9\u6848"),

        para(["\u8FD9\u662F\u535A\u5BA2\u7684\u91CD\u8981\u521B\u65B0\u70B9\u3002\u5206\u4E09\u4E2A\u529F\u80FD\u5C42\u6B21\u5B9E\u73B0\uFF0C\u4ECE\u7B80\u5355\u5230\u590D\u6742\uFF1A"]),

        heading2("4.1 \u529F\u80FD\u4E00\uFF1A\u667A\u80FD\u5BFC\u822A\uFF08\u7B80\u5355\uFF0C1 \u5929\u5B9E\u73B0\uFF09"),
        para([bold("\u529F\u80FD\u63CF\u8FF0\uFF1A"), "\u9875\u9762\u53F3\u4E0B\u89D2\u4E00\u4E2A\u6D6E\u52A8\u804A\u5929\u7A97\u53E3\u3002\u7528\u6237\u8F93\u5165\u300C\u6211\u60F3\u4E86\u89E3 PPO\u300D\uFF0CAI \u8FD4\u56DE\u76F8\u5173\u6587\u7AE0\u63A8\u8350\u3002"]),
        para([bold("\u5B9E\u73B0\u65B9\u5F0F\uFF1A"), "\u628A\u6240\u6709\u6587\u7AE0\u7684 title + summary + tags \u62FC\u63A5\u6210\u4E00\u4E2A JSON\uFF0C\u4F5C\u4E3A system prompt \u4F20\u7ED9 DeepSeek API\u3002\u7528\u6237\u7684\u95EE\u9898\u4F5C\u4E3A user message\uFF0C\u8BA9 AI \u63A8\u8350\u6700\u76F8\u5173\u7684\u6587\u7AE0\u3002"]),
        para([bold("\u6280\u672F\u7EC6\u8282\uFF1A"), "\u6587\u7AE0\u5143\u6570\u636E\u5728\u6784\u5EFA\u65F6\u751F\u6210\u4E3A\u9759\u6001 JSON \u6587\u4EF6\uFF0C\u524D\u7AEF\u52A0\u8F7D\u540E\u4F20\u7ED9 API\u3002\u4E0D\u9700\u8981\u540E\u7AEF\u670D\u52A1\u5668\u3002"]),

        heading2("4.2 \u529F\u80FD\u4E8C\uFF1A\u6587\u7AE0\u95EE\u7B54\uFF08\u4E2D\u7B49\uFF0C3 \u5929\u5B9E\u73B0\uFF09"),
        para([bold("\u529F\u80FD\u63CF\u8FF0\uFF1A"), "\u7528\u6237\u5728\u67D0\u7BC7\u6587\u7AE0\u9875\u9762\u91CC\u95EE\u300C\u8FD9\u6BB5\u4EE3\u7801\u7684 clip \u53C2\u6570\u662F\u4EC0\u4E48\u610F\u601D\u300D\uFF0CAI \u57FA\u4E8E\u5F53\u524D\u6587\u7AE0\u5185\u5BB9\u56DE\u7B54\u3002"]),
        para([bold("\u5B9E\u73B0\u65B9\u5F0F\uFF1A"), "\u628A\u5F53\u524D\u6587\u7AE0\u7684 Markdown \u5185\u5BB9\u4F5C\u4E3A context \u4F20\u7ED9 DeepSeek API\uFF0C\u7528\u6237\u95EE\u9898\u4F5C\u4E3A query\u3002\u5B9E\u8D28\u4E0A\u662F\u4E00\u4E2A\u6587\u7AE0\u7EA7\u7684 RAG \u7CFB\u7EDF\u3002"]),
        para([bold("\u6280\u672F\u7EC6\u8282\uFF1A"), "\u9700\u8981\u5904\u7406\u6587\u7AE0\u957F\u5EA6\u8D85\u8FC7 context window \u7684\u60C5\u51B5\u2014\u2014\u957F\u6587\u7AE0\u5148\u5206\u5757\uFF0C\u7528 embedding \u627E\u6700\u76F8\u5173\u7684\u5757\u518D\u4F20\u7ED9 API\u3002"]),

        heading2("4.3 \u529F\u80FD\u4E09\uFF1A\u77E5\u8BC6\u56FE\u8C31\u4EA4\u4E92\uFF08\u8FDB\u9636\uFF0C1 \u5468\u5B9E\u73B0\uFF09"),
        para([bold("\u529F\u80FD\u63CF\u8FF0\uFF1A"), "\u7528\u6237\u5728\u9996\u9875\u77E5\u8BC6\u56FE\u8C31\u4E0A\u70B9\u51FB\u8282\u70B9\u540E\uFF0CAI \u81EA\u52A8\u751F\u6210\u8BE5\u4E3B\u9898\u7684\u300C\u77E5\u8BC6\u6982\u89C8\u300D\uFF1A\u6D89\u53CA\u54EA\u4E9B\u6587\u7AE0\u3001\u5173\u952E\u6982\u5FF5\u3001\u5B66\u4E60\u8DEF\u5F84\u5EFA\u8BAE\u3002"]),
        para([bold("\u5B9E\u73B0\u65B9\u5F0F\uFF1A"), "\u628A\u56FE\u8C31\u6570\u636E\uFF08\u8282\u70B9 + \u8FB9 + \u6587\u7AE0\u5217\u8868\uFF09\u4F20\u7ED9 DeepSeek\uFF0C\u8BA9\u5B83\u751F\u6210\u7ED3\u6784\u5316\u7684\u4E3B\u9898\u6982\u89C8\u3002\u53EF\u4EE5\u7F13\u5B58\u7ED3\u679C\uFF0C\u4E0D\u9700\u8981\u6BCF\u6B21\u91CD\u65B0\u8BF7\u6C42\u3002"]),

        spacer(120),
        infoBox("\u9762\u8BD5\u65F6\u600E\u4E48\u8BB2\u8FD9\u4E2A AI \u96C6\u6210", [
          "\u300C\u6211\u7684\u535A\u5BA2\u4E0D\u53EA\u662F\u9759\u6001\u5185\u5BB9\uFF0C\u8FD8\u96C6\u6210\u4E86 DeepSeek \u4F5C\u4E3A\u667A\u80FD\u5BFC\u822A\u3002\u5B83\u80FD\u6839\u636E\u7528\u6237\u7684\u95EE\u9898\u63A8\u8350\u76F8\u5173\u6587\u7AE0\uFF0C\u5728\u6587\u7AE0\u9875\u9762\u5185\u505A\u57FA\u4E8E\u5185\u5BB9\u7684\u95EE\u7B54\uFF0C\u751A\u81F3\u80FD\u6839\u636E\u77E5\u8BC6\u56FE\u8C31\u751F\u6210\u5B66\u4E60\u8DEF\u5F84\u5EFA\u8BAE\u3002\u8FD9\u4E2A\u5B9E\u73B0\u672C\u8EAB\u5C31\u662F\u4E00\u4E2A\u5C0F\u578B\u7684 RAG + Agent \u7CFB\u7EDF\u3002\u300D",
        ], C.purple, C.lightPurple),

        // ============ PART 5 ============
        heading1("\u4E94\u3001\u5185\u5BB9\u89C4\u5212\uFF0812 \u7BC7\u6587\u7AE0\uFF09"),

        heading2("5.1 \u5F3A\u5316\u5B66\u4E60\u7CFB\u5217\uFF084 \u7BC7\uFF09"),
        numberItem([bold("\u300ADQN \u539F\u7406\u4E0E PyTorch \u5B9E\u73B0\u300B\uFF1A"), "\u4ECE MDP \u5230 DQN \u7684\u5B8C\u6574\u63A8\u5BFC\uFF0C\u9644\u5B8C\u6574\u4EE3\u7801\u548C CartPole \u8BAD\u7EC3\u66F2\u7EBF"], "numbersB"),
        numberItem([bold("\u300APPO \u6DF1\u5165\u7406\u89E3\uFF1A\u4ECE\u7B56\u7565\u68AF\u5EA6\u5230\u88C1\u526A\u4F18\u5316\u300B\uFF1A"), "\u6570\u5B66\u63A8\u5BFC + LunarLander \u5B9E\u9A8C + \u8D85\u53C2\u6570\u5206\u6790"], "numbersB"),
        numberItem([bold("\u300AActor-Critic \u67B6\u6784\u5168\u666F\u300B\uFF1A"), "A2C\u3001A3C\u3001SAC \u7684\u5BF9\u6BD4\u5206\u6790\u548C\u9009\u62E9\u6307\u5357"], "numbersB"),
        numberItem([bold("\u300ARL \u7684 5 \u4E2A\u5E38\u89C1\u9677\u9631\u548C\u5B9E\u6218\u7ECF\u9A8C\u300B\uFF1A"), "\u5956\u52B1\u8BBE\u8BA1\u3001\u8D85\u53C2\u6570\u3001\u8BAD\u7EC3\u4E0D\u7A33\u5B9A\u7B49\u5B9E\u8DF5\u603B\u7ED3"], "numbersB"),

        heading2("5.2 LLM + RL \u7CFB\u5217\uFF084 \u7BC7\uFF09"),
        numberItem([bold("\u300ARLHF \u5B8C\u6574\u89E3\u6790\uFF1ASFT \u2192 RM \u2192 PPO\u300B\uFF1A"), "\u6BCF\u4E2A\u6B65\u9AA4\u7684\u539F\u7406\u3001\u4EE3\u7801\u3001\u5751\u70B9"], "numbersC"),
        numberItem([bold("\u300ADPO vs RLHF \u5B9E\u6D4B\u5BF9\u6BD4\u300B\uFF1A"), "\u540C\u4E00\u5C0F\u6A21\u578B\u4E0A\u7684\u5BF9\u6BD4\u5B9E\u9A8C\u6570\u636E"], "numbersC"),
        numberItem([bold("\u300AChain-of-Thought \u4E0E RL \u7684\u7ED3\u5408\u300B\uFF1A"), "\u8BA9\u6A21\u578B\u5B66\u4F1A\u300C\u601D\u8003\u300D\u7684\u539F\u7406\u548C\u5B9E\u73B0"], "numbersC"),
        numberItem([bold("\u300A\u5728\u5C0F\u6A21\u578B\u4E0A\u505A RLHF\u300B\uFF1A"), "\u8D44\u6E90\u53D7\u9650\u65F6\u7684\u5B9E\u6218\u7B56\u7565"], "numbersC"),

        heading2("5.3 Agent \u5DE5\u7A0B\u7CFB\u5217\uFF084 \u7BC7\uFF09"),
        numberItem([bold("\u300AAgent Memory \u7CFB\u7EDF\u8BBE\u8BA1\uFF1A\u4ECE\u67E5\u5B57\u5178\u5230\u56DE\u5FC6\u300B\uFF1A"), "RAG vs Memory \u7684\u672C\u8D28\u533A\u522B\u548C 4 \u5C42\u8BBE\u8BA1"], "numbersD"),
        numberItem([bold("\u300AGenericAgent \u67B6\u6784\u6DF1\u5EA6\u89E3\u8BFB\u300B\uFF1A"), "Skill \u8FDB\u5316\u3001Memory \u5206\u5C42\u3001Agent Loop \u7684\u8BBE\u8BA1\u51B3\u7B56"], "numbersD"),
        numberItem([bold("\u300A\u7528 RL \u4F18\u5316 Agent \u7684 Skill \u9009\u62E9\u7B56\u7565\u300B\uFF1A"), "\u79D1\u7814 + \u5DE5\u7A0B\u878D\u5408\u9879\u76EE\u7684\u6280\u672F\u62A5\u544A"], "numbersD"),
        numberItem([bold("\u300A\u4ECE\u79D1\u7814\u5230\u5DE5\u7A0B\uFF1A\u6211\u7684 AI Agent \u5B9E\u4E60\u51C6\u5907\u4E4B\u8DEF\u300B\uFF1A"), "\u5168\u7A0B\u53CD\u601D\u548C\u603B\u7ED3"], "numbersD"),

        // ============ PART 6 ============
        heading1("\u516D\u3001\u76EE\u5F55\u7ED3\u6784"),

        para(["\u4EE5\u4E0B\u662F\u535A\u5BA2\u9879\u76EE\u7684\u5B8C\u6574\u76EE\u5F55\u7ED3\u6784\uFF1A"]),

        infoBox("\u9879\u76EE\u76EE\u5F55", [
          [code("blog/")],
          [code("  .vitepress/")],
          [code("    config.ts                    # VitePress \u914D\u7F6E")],
          [code("    theme/")],
          [code("      index.ts                   # \u81EA\u5B9A\u4E49\u4E3B\u9898\u5165\u53E3")],
          [code("      KnowledgeGraph.vue          # \u77E5\u8BC6\u56FE\u8C31\u7EC4\u4EF6\uFF08D3.js\uFF09")],
          [code("      AIChatWidget.vue            # DeepSeek \u804A\u5929\u7A97\u53E3\u7EC4\u4EF6")],
          [code("      ProjectCard.vue             # \u9879\u76EE\u5361\u7247\u7EC4\u4EF6")],
          [code("      SkillRadar.vue              # \u6280\u80FD\u96F7\u8FBE\u56FE\u7EC4\u4EF6")],
          [code("  articles/                        # \u6280\u672F\u6587\u7AE0\uFF08\u539F\u521B\uFF09")],
          [code("    rl/")],
          [code("      dqn-implementation.md")],
          [code("      ppo-deep-dive.md")],
          [code("    agent/")],
          [code("      memory-system-design.md")],
          [code("      genericagent-analysis.md")],
          [code("    llm/")],
          [code("      rlhf-explained.md")],
          [code("      dpo-vs-rlhf.md")],
          [code("  notes/                           # \u5B66\u4E60\u7B14\u8BB0")],
          [code("    courses/")],
          [code("    papers/")],
          [code("    opensource/")],
          [code("  projects/                        # \u9879\u76EE\u5C55\u793A")],
          [code("    knowledge-agent.md")],
          [code("    rl-skill-agent.md")],
          [code("  public/")],
          [code("    graph-data.json                # \u56FE\u8C31\u6570\u636E\uFF08\u6784\u5EFA\u751F\u6210\uFF09")],
          [code("    articles-meta.json             # \u6587\u7AE0\u5143\u6570\u636E\uFF08AI \u5BFC\u822A\u7528\uFF09")],
          [code("  about.md")],
          [code("  index.md                         # \u9996\u9875\uFF08\u5D4C\u5165\u56FE\u8C31\u7EC4\u4EF6\uFF09")],
          [code("  package.json")],
        ], C.darkGray, C.lightGray),

        // ============ PART 7 ============
        new Paragraph({ children: [new PageBreak()] }),
        heading1("\u4E03\u3001\u5B9E\u65BD\u65F6\u95F4\u7EBF"),

        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [1600, 4200, 3560],
          rows: [
            new TableRow({ children: [headerCell("\u65F6\u95F4", 1600), headerCell("\u4EFB\u52A1", 4200), headerCell("\u4EA7\u51FA", 3560)] }),
            new TableRow({ children: [
              dataCell([bold("\u7B2C 1 \u5468")], 1600, C.lightGreen),
              dataCell(["\u642D\u5EFA VitePress \u9AA8\u67B6 + \u914D\u7F6E\u81EA\u5B9A\u4E49\u4E3B\u9898 + \u5199\u7B2C\u4E00\u7BC7\u6587\u7AE0 + \u90E8\u7F72\u5230 Vercel"], 4200, C.lightGreen),
              dataCell(["\u535A\u5BA2\u4E0A\u7EBF\uFF0C\u6709 1 \u7BC7\u6587\u7AE0"], 3560, C.lightGreen),
            ]}),
            new TableRow({ children: [
              dataCell([bold("\u7B2C 2 \u5468")], 1600, C.lightBlue),
              dataCell(["\u5B9E\u73B0 KnowledgeGraph.vue \u7EC4\u4EF6\uFF08D3.js \u529B\u5BFC\u5411\u56FE\uFF09+ \u56FE\u8C31\u6570\u636E\u81EA\u52A8\u751F\u6210\u811A\u672C + \u9879\u76EE\u5C55\u793A\u9875"], 4200, C.lightBlue),
              dataCell(["\u77E5\u8BC6\u56FE\u8C31\u53EF\u4EA4\u4E92"], 3560, C.lightBlue),
            ]}),
            new TableRow({ children: [
              dataCell([bold("\u7B2C 3 \u5468")], 1600, C.lightPurple),
              dataCell(["\u63A5\u5165 DeepSeek API\uFF08\u529F\u80FD 1 \u667A\u80FD\u5BFC\u822A\uFF09+ AIChatWidget.vue + About \u9875\u9762\uFF08\u6280\u80FD\u96F7\u8FBE\u56FE\uFF09"], 4200, C.lightPurple),
              dataCell(["AI \u52A9\u624B\u53EF\u7528"], 3560, C.lightPurple),
            ]}),
            new TableRow({ children: [
              dataCell([bold("\u6301\u7EED")], 1600, C.lightYellow),
              dataCell(["\u6BCF\u5B66\u5B8C\u4E00\u4E2A\u4E3B\u9898\u5199\u4E00\u7BC7\u6587\u7AE0\uFF0C\u56FE\u8C31\u81EA\u52A8\u66F4\u65B0\u3002\u76EE\u6807\uFF1A\u6295\u9012\u524D\u7A4D\u7D2F 12 \u7BC7"], 4200, C.lightYellow),
              dataCell(["\u6BCF\u5468 1-2 \u7BC7\u65B0\u6587\u7AE0"], 3560, C.lightYellow),
            ]}),
          ],
        }),

        spacer(200),
        heading1("\u516B\u3001\u6838\u5FC3\u539F\u5219"),

        infoBox("\u8BB0\u4F4F\u8FD9\u4E09\u6761", [
          [bold("1. \u5185\u5BB9\u8FDC\u6BD4\u6280\u672F\u6808\u91CD\u8981\u3002"), "\u4E00\u4E2A\u9ED8\u8BA4\u4E3B\u9898\u4F46\u6709 12 \u7BC7\u9AD8\u8D28\u91CF\u6587\u7AE0\u7684\u535A\u5BA2\uFF0C\u8FDC\u6BD4\u6709\u9177\u70AB\u77E5\u8BC6\u56FE\u8C31\u4F46\u53EA\u6709 2 \u7BC7\u6587\u7AE0\u7684\u535A\u5BA2\u6709\u8BF4\u670D\u529B\u3002\u56FE\u8C31\u662F\u9526\u4E0A\u6DFB\u82B1\uFF0C\u5185\u5BB9\u624D\u662F\u6838\u5FC3\u3002"],
          [bold("2. \u6BCF\u7BC7\u6587\u7AE0\u90FD\u8981\u6709 GitHub \u94FE\u63A5\u3002"), "\u9762\u8BD5\u5B98\u770B\u5B8C\u535A\u5BA2\u80FD\u76F4\u63A5\u70B9\u8FDB\u4EE3\u7801\u4ED3\u5E93\u770B\u5B9E\u73B0\uFF0C\u8FD9\u662F\u5C55\u793A\u5DE5\u7A0B\u80FD\u529B\u7684\u6700\u76F4\u63A5\u65B9\u5F0F\u3002"],
          [bold("3. \u535A\u5BA2\u672C\u8EAB\u5C31\u662F\u4E00\u4E2A\u9879\u76EE\u3002"), "\u77E5\u8BC6\u56FE\u8C31 + AI \u96C6\u6210 + \u81EA\u52A8\u5316\u6570\u636E\u751F\u6210\uFF0C\u8FD9\u4E2A\u535A\u5BA2\u672C\u8EAB\u5C31\u80FD\u4F5C\u4E3A\u4E00\u4E2A\u5DE5\u7A0B\u9879\u76EE\u5728\u9762\u8BD5\u91CC\u5C55\u793A\u3002"],
        ], C.success, C.lightGreen),

      ],
    },
  ],
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("blog_design_plan.docx", buffer);
  console.log("Blog design plan created successfully");
});