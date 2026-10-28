import sys, re
from html.parser import HTMLParser
SKIP = {"script", "style", "noscript", "head", "svg"}
class P(HTMLParser):
    def __init__(s): super().__init__(); s.skip=0; s.out=[]; s.n=0
    def handle_starttag(s, t, a):
        a = dict(a)
        if t in SKIP: s.skip += 1
        if t == "img" and "googleusercontent" in (a.get("src") or ""):
            s.n += 1; s.out.append(f"\n<<IMG {s.n}>>\n")
        if t in ("p","div","li","h1","h2","h3"): s.out.append("\n")
    def handle_endtag(s, t):
        if t in SKIP and s.skip: s.skip -= 1
    def handle_data(s, d):
        if not s.skip and d.strip(): s.out.append(d.strip()[:70] + " ")
for path in sys.argv[1:]:
    p = P(); p.feed(open(path, encoding="utf-8").read())
    txt = re.sub(r"\n\s*\n+", "\n", "".join(p.out))
    print("=====", path)
    start = txt.find("CONTACTER \nMore")
    print(txt[txt.find("\n", txt.rfind("CONTACTER", 0, len(txt)//3)):txt.find("Google Sites")])
