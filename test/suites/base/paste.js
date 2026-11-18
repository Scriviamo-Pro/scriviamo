// Pasting from Microsoft Word and Google Docs: structure kept, clutter dropped.
"use strict"
{
  const section = "Paste cleanup"

  const word = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta name=Generator content="Microsoft Word 15"><style>p.MsoNormal{margin:0}</style></head><body lang=EN-US>
<p class=MsoTitle><span style='font-family:"Calibri Light",sans-serif;font-size:28.0pt'>Quarterly plan<o:p></o:p></span></p>
<p class=MsoNormal><span style='font-family:"Calibri",sans-serif;color:black'>Plain text with <b>bold</b>, <i>italic</i> and <span style='color:#C00000'>red</span> words.<o:p></o:p></span></p>
<p class=MsoListParagraphCxSpFirst style='text-indent:-.25in;mso-list:l0 level1 lfo1'><![if !supportLists]><span style='font-family:Symbol;mso-fareast-font-family:Symbol'><span style='mso-list:Ignore'>·<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp; </span></span></span><![endif]>First point<o:p></o:p></p>
<p class=MsoListParagraphCxSpMiddle style='margin-left:1.0in;text-indent:-.25in;mso-list:l0 level2 lfo1'><span style='mso-list:Ignore'>o<span>&nbsp;&nbsp;</span></span>Nested point<o:p></o:p></p>
<p class=MsoListParagraphCxSpLast style='text-indent:-.25in;mso-list:l0 level1 lfo1'><span style='mso-list:Ignore'>·<span>&nbsp;&nbsp;</span></span>Second point<o:p></o:p></p>
<p class=MsoListParagraphCxSpFirst style='text-indent:-.25in;mso-list:l1 level1 lfo2'><span style='mso-list:Ignore'>1.<span>&nbsp;&nbsp;</span></span>Step one<o:p></o:p></p>
<p class=MsoListParagraphCxSpLast style='text-indent:-.25in;mso-list:l1 level1 lfo2'><span style='mso-list:Ignore'>2.<span>&nbsp;&nbsp;</span></span>Step two<o:p></o:p></p>
<p class=MsoNormal><img src="file:///C:/Users/ada/AppData/Local/Temp/msohtmlclip1/01/clip_image001.png"><o:p></o:p></p>
</body></html>`

  const googleDocs = `<meta charset="utf-8"><b style="font-weight:normal;" id="docs-internal-guid-1a2b3c4d-7fff-1234-5678-9abcdef01234"><h1 dir="ltr" style="line-height:1.38;margin-top:20pt;margin-bottom:6pt;"><span style="font-size:20pt;font-family:Arial,sans-serif;color:#000000;background-color:transparent;font-weight:400;">Launch notes</span></h1><p dir="ltr" style="line-height:1.38;margin-top:0pt;margin-bottom:0pt;"><span style="font-size:11pt;font-family:Arial,sans-serif;color:#000000;background-color:transparent;font-weight:400;">Normal, </span><span style="font-size:11pt;font-family:Arial,sans-serif;color:#000000;background-color:transparent;font-weight:700;">bold</span><span style="font-size:11pt;font-family:Arial,sans-serif;color:#000000;background-color:#ffff00;font-weight:400;"> highlighted</span></p><ul style="margin-top:0;margin-bottom:0;"><li dir="ltr" style="list-style-type:disc;font-size:11pt;font-family:Arial,sans-serif;"><p dir="ltr" style="line-height:1.38;margin-top:0pt;margin-bottom:0pt;" role="presentation"><span style="font-size:11pt;font-family:Arial,sans-serif;color:#000000;font-weight:400;">Alpha</span></p></li><li dir="ltr" style="list-style-type:disc;"><p dir="ltr" role="presentation"><span style="font-size:11pt;color:#000000;font-weight:400;">Beta</span></p></li></ul></b><br class="Apple-interchange-newline">`

  test(section, "pastes from Word and Google Docs are recognized", t => {
    t.equal(PE.PasteCleanup.source(word), "word", "Word's HTML")
    t.equal(PE.PasteCleanup.source(googleDocs), "googledocs", "Google Docs' HTML")
    t.equal(PE.PasteCleanup.source("<p>Hello <b>there</b></p>"), null, "Other HTML")
    t.equal(PE.PasteCleanup.clean("<p style=\"font-family:Arial\">Kept as it is</p>"), "<p style=\"font-family:Arial\">Kept as it is</p>", "Other HTML is left alone")
  })

  test(section, "Word's title, formatting and lists come through without its clutter", t => {
    let editor = t.editor()
    let nodes = editor.importer.import(PE.PasteCleanup.clean(word))
    let types = nodes.map(node => node.type).join(",")
    t.equal(types, "heading,text,list,list", "The blocks")
    t.equal(nodes[0].text, "Quarterly plan", "The title")
    let paragraph = nodes[1]
    let styles = paragraph.content.runs().map(run => `${run.text}:${run.style.bold ? "b" : ""}${run.style.italic ? "i" : ""}${run.style.fontName}${run.style.fontSize}`)
    t.assert(styles.some(item => item.startsWith("bold:b")) && styles.some(item => item.startsWith("italic:i")), `Bold and italic were lost: ${styles.join(" | ")}`)
    t.assert(paragraph.content.runs().every(run => run.style.fontName == "" || run.style.fontName == PE.TextStyle.defaults.fontName), "Word's fonts were kept.")
    let red = paragraph.content.runs().find(run => run.text == "red")
    t.assert(red && !PE.Colors.isEmpty(red.style.textColor), "The red text lost its color.")
    let html = new PE.Editor(document.createElement("div"))
    html.addNode(nodes[2])
    html.addNode(nodes[3])
    let exported = html.toHTML()
    t.assert(exported.includes("<ul") && exported.includes("Nested point") && exported.includes("<ol"), `The lists: ${exported}`)
    t.assert(!/·|&nbsp;&nbsp;|mso-/.test(exported), "Word's typed bullets or styles were kept.")
    t.assert(!PE.PasteCleanup.clean(word).includes("file:///"), "A picture on the copier's computer was kept.")
  })

  test(section, "Google Docs' wrapper doesn't make everything bold", t => {
    let editor = t.editor()
    let nodes = editor.importer.import(PE.PasteCleanup.clean(googleDocs))
    t.equal(nodes.map(node => node.type).join(","), "heading,text,list", "The blocks")
    let runs = nodes[1].content.runs()
    t.equal(runs.filter(run => run.style.bold).map(run => run.text.trim()).join("|"), "bold", "The bold text")
    t.assert(runs.some(run => run.text.includes("highlighted") && !PE.Colors.isEmpty(run.style.backgroundColor)), "The highlight was lost.")
    t.assert(runs.every(run => run.style.fontSize == 0 || run.style.fontSize == PE.TextStyle.defaults.fontSize), "Google Docs' sizes were kept.")
    t.equal(nodes[2].text, "Alpha\nBeta", "The list's items")
  })
}
