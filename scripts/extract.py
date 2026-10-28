import sys, re, html
from html.parser import HTMLParser

SKIP = {"script", "style", "noscript", "head", "svg"}
BLOCK = {"p", "div", "h1", "h2", "h3", "h4", "h5", "h6", "li", "br", "section", "tr", "a"}

class P(HTMLParser):
    def __init__(self):
        super().__init__()
        self.skip = 0
        self.out = []
        self.imgs = []
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag in SKIP:
            self.skip += 1
        if tag in BLOCK:
            self.out.append("\n")
        if tag in ("h1", "h2", "h3"):
            self.out.append("#" * int(tag[1]) + " ")
        if tag == "img":
            src = a.get("src") or a.get("data-src") or ""
            if src:
                self.imgs.append(src)
    def handle_endtag(self, tag):
        if tag in SKIP and self.skip:
            self.skip -= 1
        if tag in BLOCK:
            self.out.append("\n")
    def handle_data(self, d):
        if not self.skip:
            self.out.append(d)

for path in sys.argv[1:]:
    src = open(path, encoding="utf-8").read()
    p = P()
    p.feed(src)
    text = re.sub(r"[ \t\xa0]+", " ", "".join(p.out))
    text = re.sub(r"\n\s*\n+", "\n\n", text).strip()
    bg = re.findall(r'background-image:\s*url\(([^)]+)\)', src)
    print("=" * 30, path)
    print(text)
    print("--- IMAGES ---")
    for i in dict.fromkeys(p.imgs + [html.unescape(b).strip("'\"") for b in bg]):
        print(i)
