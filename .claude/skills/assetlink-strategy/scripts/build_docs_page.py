#!/usr/bin/env python3
"""Build a private AssetLink document page from Markdown.

Usage: python3 build_docs_page.py OUTPUT.html [--downloads DIR/BASENAME] doc.md [more.md ...]
One document (the normal case) gives a page of its own, titled from its first "# " heading.
Several documents give one page with a tab per document.
--downloads adds Word / PDF / Markdown buttons (make the files with export_formats.py first).
The Word file is embedded in the page, because .docx can't be published as a page file.
Publish BASENAME.pdf and BASENAME.md through the Artifact tool's `files` and declare
`capabilities: {downloads: true}`.
Publish OUTPUT.html with the Artifact tool; the page URLs are listed in the repo's CLAUDE.md.
"""
import html
import os
import re
import sys

import markdown

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from md2view import separate_lists  # noqa: E402

ARGS = sys.argv[1:]
DL = None
if "--downloads" in ARGS:
    i = ARGS.index("--downloads")
    DL_PATH = ARGS[i + 1]
    DL = os.path.basename(DL_PATH)
    del ARGS[i:i + 2]
OUT = ARGS[0]
DOCS = []
for path in ARGS[1:]:
    first = open(path, encoding="utf-8").readline().lstrip("# ").strip()
    first = re.sub(r"^AssetLink\s+", "", first)  # tab label: drop the brand prefix
    doc_id = re.sub(r"[^a-z0-9]+", "", os.path.splitext(os.path.basename(path))[0].lower())[:24]
    DOCS.append((doc_id, first, path))
TAGS={"LIVE":"live","GATED":"gated","PROOF NEEDED":"proof","HYPOTHESIS":"hyp","SEP-26 UPDATE":"upd",
      "DECISION NEEDED":"dec","DECISION":"dec","INTERNAL":"int","Sourced":"live","Internal doc":"int","Sourced + internal":"live"}
def render(doc_id, md):
    lines=md.splitlines()
    title=lines[0].lstrip("# ").strip(); body_md="\n".join(lines[1:])
    h=markdown.markdown(separate_lists(body_md),extensions=["tables","sane_lists","toc"],
                        extension_configs={"toc":{"slugify":lambda v,s: doc_id+"-"+re.sub(r"[^a-z0-9]+","-",v.lower()).strip("-")}})
    h=h.replace("<table>",'<div class="tw"><table>').replace("</table>","</table></div>")
    def tag(m):
        t=m.group(1); key=next((k for k in TAGS if t.startswith(k)),None)
        return f'<span class="tag t-{TAGS[key]}">{html.escape(t)}</span>' if key else m.group(0)
    h=re.sub(r"\[([A-Z][A-Za-z0-9 +:\-–,]{2,40}?)\]",tag,h)
    h=h.replace("<strong><span","<span").replace("</span></strong>","</span>")
    toc=re.findall(r'<h2 id="([^"]+)">(.*?)</h2>',h)
    nav="".join(f'<li><a href="#{i}">{re.sub("<[^>]+>","",t)}</a></li>' for i,t in toc)
    return title,h,nav
secs=[];tabs=[]
for i,(did,label,f) in enumerate(DOCS):
    title,h,nav=render(did,open(f,encoding="utf-8").read())
    tabs.append(f'<button class="tab" role="tab" id="tab-{did}" aria-controls="{did}" data-doc="{did}" aria-selected="{"true" if i==0 else "false"}">{label}</button>')
    secs.append(f'''<section class="doc" id="{did}" role="tabpanel" aria-labelledby="tab-{did}"{"" if i==0 else " hidden"}>
<header class="dochead"><p class="eyebrow">AssetLink</p><h1>{html.escape(title)}</h1></header>
<div class="cols"><nav class="toc" aria-label="Sections"><p class="toclabel">Sections</p><ol>{nav}</ol></nav>
<article class="prose">{h}</article></div></section>''')
DL_BAR = ""
DL_SCRIPT = ""
if DL:
    DL_BAR = ('<div class="dl" id="dl" hidden><span class="dllabel">Download</span>'
              '<button type="button" class="dlbtn" data-ext="docx">Word</button>'
              '<button type="button" class="dlbtn" data-ext="pdf">PDF</button>'
              '<button type="button" class="dlbtn" data-ext="md">Markdown</button>'
              '<span class="dlmsg" id="dlmsg" role="status"></span></div>')
    import base64
    DOCX_B64 = base64.b64encode(open(DL_PATH + ".docx", "rb").read()).decode()
    DL_SCRIPT = """<script type="text/plain" id="docx-data">""" + DOCX_B64 + """</script>
<script>
(function(){
  var base = %s;
  function docxBlob(){
    var b64 = document.getElementById('docx-data').textContent.trim(), bin = atob(b64), n = bin.length, u = new Uint8Array(n);
    for (var i = 0; i < n; i++) u[i] = bin.charCodeAt(i);
    return new Blob([u]);
  }
  var bar = document.getElementById('dl'), msg = document.getElementById('dlmsg');
  if (!window.claude || !window.claude.use) return;
  window.claude.use('downloads').then(function(dl){
    if (!dl) return;
    bar.hidden = false;
    [].slice.call(bar.querySelectorAll('.dlbtn')).forEach(function(b){
      b.addEventListener('click', function(){
        var ext = b.dataset.ext; msg.textContent = '';
        b.disabled = true;
        (ext === 'docx' ? Promise.resolve(docxBlob()) : fetch(base + '.' + ext).then(function(r){ if(!r.ok) throw new Error('missing'); return r.blob(); }))
          .then(function(blob){ return dl.save({filename: base + '.' + ext, data: blob}); })
          .then(function(){ msg.textContent = 'Saved.'; })
          .catch(function(e){
            var c = e && e.code;
            if (c === 'declined') msg.textContent = '';
            else if (c === 'rate_limited') msg.textContent = 'A save is already open. Try again in a moment.';
            else msg.textContent = 'That file couldn\\'t be saved here.';
          })
          .then(function(){ b.disabled = false; });
      });
    });
  });
})();
</script>
""" % repr(DL)
if len(DOCS) == 1:
    PAGE_TITLE = "AssetLink " + re.sub(r"\s*\((v\d+)\)", r" \1", DOCS[0][1]).split(":")[0].strip()
    tabs = []  # a single document needs no tab bar
else:
    PAGE_TITLE = "AssetLink Strategy Docs"
page=f'''<title>{html.escape(PAGE_TITLE)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@87,600;87,700&family=Source+Sans+3:ital,wght@0,400;0,600;0,700;1,400&family=IBM+Plex+Mono:wght@500&display=swap">
<style>
/* Layout: sticky document switcher, then a two-column reading layout (section list + prose) that stacks on phones */
:root{{
  --bg:#f6f7f9; --surface:#ffffff; --fg:#1b2230; --muted:#5a6477; --line:#dbe0e8; --accent:#1d4e6b; --accent-soft:#e3edf3;
  --live-bg:#e2f2e8; --live-fg:#1f6b3d; --gated-bg:#fbe9e4; --gated-fg:#9a3a22; --proof-bg:#fdf1d8; --proof-fg:#86560b;
  --hyp-bg:#ecebf8; --hyp-fg:#4b4394; --upd-bg:#e1eef8; --upd-fg:#1d5a86; --neutral-bg:#eceff3; --neutral-fg:#3e4757;
  --display:"Archivo","Arial Narrow",Arial,sans-serif; --body:"Source Sans 3","Segoe UI",Arial,sans-serif; --mono:"IBM Plex Mono",ui-monospace,Menlo,monospace;
}}
@media (prefers-color-scheme: dark){{:root:not([data-theme="light"]){{
  --bg:#12161c; --surface:#181d25; --fg:#e4e8ef; --muted:#9aa4b5; --line:#2a313d; --accent:#7fb6d8; --accent-soft:#1c2a36;
  --live-bg:#173323; --live-fg:#8fd6a8; --gated-bg:#3a1f18; --gated-fg:#f0a58f; --proof-bg:#382a10; --proof-fg:#f0c878;
  --hyp-bg:#25233f; --hyp-fg:#b8b1f0; --upd-bg:#172b3b; --upd-fg:#8cc3ea; --neutral-bg:#232a35; --neutral-fg:#c3cad6; color-scheme:dark;}}}}
:root[data-theme="dark"]{{
  --bg:#12161c; --surface:#181d25; --fg:#e4e8ef; --muted:#9aa4b5; --line:#2a313d; --accent:#7fb6d8; --accent-soft:#1c2a36;
  --live-bg:#173323; --live-fg:#8fd6a8; --gated-bg:#3a1f18; --gated-fg:#f0a58f; --proof-bg:#382a10; --proof-fg:#f0c878;
  --hyp-bg:#25233f; --hyp-fg:#b8b1f0; --upd-bg:#172b3b; --upd-fg:#8cc3ea; --neutral-bg:#232a35; --neutral-fg:#c3cad6; color-scheme:dark;}}
*{{box-sizing:border-box}}
body{{background:var(--bg);color:var(--fg);font:16px/1.6 var(--body)}}
.bar{{position:sticky;top:env(safe-area-inset-top,0px);z-index:5;background:var(--bg);border-bottom:1px solid var(--line)}}
.barin{{max-width:1180px;margin:0 auto;padding:10px 16px;display:flex;flex-wrap:wrap;gap:8px 16px;align-items:center;justify-content:space-between}}
.dl{{display:flex;flex-wrap:wrap;align-items:center;gap:6px}}
.dl[hidden]{{display:none}}
.dllabel{{font:500 11px/1 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-right:2px}}
.dlbtn{{font:600 13px/1 var(--body);padding:8px 12px;border-radius:6px;border:1px solid var(--line);background:var(--surface);color:var(--fg);cursor:pointer}}
.dlbtn:hover{{border-color:var(--accent);color:var(--accent)}}
.dlbtn:focus-visible{{outline:2px solid var(--accent);outline-offset:2px}}
.dlbtn:disabled{{opacity:.6;cursor:progress}}
.dlmsg{{font-size:13px;color:var(--muted);min-width:0}}
.brand{{font:700 15px/1 var(--display);font-stretch:87%;letter-spacing:.06em;text-transform:uppercase;color:var(--accent)}}
.tabs{{display:flex;flex-wrap:wrap;gap:6px}}
.tab{{font:600 14px/1 var(--body);padding:9px 14px;border-radius:999px;border:1px solid var(--line);background:var(--surface);color:var(--fg);cursor:pointer}}
.tab[aria-selected="true"]{{background:var(--accent);border-color:var(--accent);color:var(--surface)}}
.tab:focus-visible,.toc a:focus-visible,.prose a:focus-visible{{outline:2px solid var(--accent);outline-offset:2px}}
.wrap{{max-width:1180px;margin:0 auto;padding-inline:16px;padding-block:28px 72px}}
.dochead{{margin-bottom:24px}}
.eyebrow{{margin:0 0 6px;font:500 12px/1.4 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}}
h1{{margin:0;font:700 clamp(28px,4vw,40px)/1.15 var(--display);font-stretch:87%;text-wrap:balance}}
.cols{{display:grid;grid-template-columns:240px minmax(0,1fr);gap:40px;align-items:start}}
.toc{{position:sticky;top:calc(env(safe-area-inset-top,0px) + 72px);max-height:calc(100vh - 100px);overflow:auto;font-size:14px}}
.toclabel{{margin:0 0 8px;font:500 11px/1 var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}}
.toc ol{{list-style:none;margin:0;padding:0;display:grid;gap:2px;border-left:1px solid var(--line)}}
.toc a{{display:block;padding:5px 10px;color:var(--muted);text-decoration:none;line-height:1.35}}
.toc a:hover{{color:var(--accent);background:var(--accent-soft)}}
.prose{{min-width:0;background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:8px clamp(18px,4vw,44px) 32px}}
.prose h2{{font:700 23px/1.25 var(--display);font-stretch:87%;margin:34px 0 10px;padding-top:14px;border-top:1px solid var(--line);color:var(--accent);text-wrap:balance;scroll-margin-top:84px}}
.prose h2:first-of-type{{border-top:0}}
.prose h3{{font:700 17px/1.3 var(--display);margin:26px 0 6px;text-wrap:balance;scroll-margin-top:84px}}
.prose p,.prose li{{max-width:72ch}}
.prose li{{margin:3px 0}}
.prose a{{color:var(--accent)}}
.prose hr{{border:0;margin:8px 0}}
.prose blockquote{{margin:16px 0;padding:12px 18px;background:var(--accent-soft);border-radius:8px;max-width:78ch}}
.prose blockquote p{{margin:4px 0}}
.prose code{{font:500 .88em var(--mono);background:var(--neutral-bg);padding:1px 5px;border-radius:4px}}
.tw{{overflow-x:auto;margin:14px 0 18px;border:1px solid var(--line);border-radius:8px}}
table{{border-collapse:collapse;width:100%;font-size:14.5px;font-variant-numeric:tabular-nums}}
th,td{{padding:9px 12px;text-align:left;vertical-align:top;border-bottom:1px solid var(--line)}}
th{{background:var(--neutral-bg);font-weight:700;white-space:nowrap}}
tr:last-child td{{border-bottom:0}}
.tag{{display:inline-block;font:500 11px/1.5 var(--mono);letter-spacing:.03em;padding:0 6px;border-radius:4px;white-space:nowrap;vertical-align:1px}}
.t-live{{background:var(--live-bg);color:var(--live-fg)}} .t-gated{{background:var(--gated-bg);color:var(--gated-fg)}}
.t-proof{{background:var(--proof-bg);color:var(--proof-fg)}} .t-hyp{{background:var(--hyp-bg);color:var(--hyp-fg)}}
.t-upd{{background:var(--upd-bg);color:var(--upd-fg)}} .t-dec,.t-int{{background:var(--neutral-bg);color:var(--neutral-fg)}}
@media (max-width:860px){{.cols{{grid-template-columns:minmax(0,1fr);gap:16px}} .toc{{position:static;max-height:none}} .toc ol{{grid-template-columns:repeat(auto-fill,minmax(180px,1fr))}}}}
@media (prefers-reduced-motion:no-preference){{html{{scroll-behavior:smooth}}}}
</style>
<div class="bar"><div class="barin"><span class="brand">AssetLink Strategy</span>{('<div class="tabs" role="tablist" aria-label="Documents">' + "".join(tabs) + '</div>') if tabs else ""}{DL_BAR}</div></div>
<main class="wrap">{"".join(secs)}</main>
{DL_SCRIPT}<script>
(function(){{
  var tabs=[].slice.call(document.querySelectorAll('.tab'));
  function show(id,push){{
    tabs.forEach(function(t){{var on=t.dataset.doc===id;t.setAttribute('aria-selected',on?'true':'false');document.getElementById(t.dataset.doc).hidden=!on;}});
    if(push){{try{{history.replaceState(null,'','#'+id);}}catch(e){{}}}}
    window.scrollTo(0,0);
  }}
  tabs.forEach(function(t){{t.addEventListener('click',function(){{show(t.dataset.doc,true);}});}});
  var h=(location.hash||'').slice(1);
  if(h){{var d=h.split('-')[0];if(document.getElementById(d)&&tabs.some(function(t){{return t.dataset.doc===d;}}))show(d,false);var el=document.getElementById(h);if(el&&el!==document.getElementById(d))el.scrollIntoView();}}
}})();
</script>'''
open(OUT,"w",encoding="utf-8").write(page)
print(len(page), "tags:", len(re.findall('class="tag ',page)))
