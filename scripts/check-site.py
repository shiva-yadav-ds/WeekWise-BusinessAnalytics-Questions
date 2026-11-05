"""Check static links, week coverage and PDF completeness without dependencies."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import json,re
ROOT=Path(__file__).resolve().parents[1]
class Page(HTMLParser):
    def __init__(self):
        super().__init__();self.links=[];self.ids=[];self.weeks=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        self.links.extend(a[k] for k in ('href','src') if a.get(k))
        if 'id' in a:self.ids.append(a['id'])
        if 'data-week-id' in a:self.weeks.append(int(a['data-week-id']))
for p in [ROOT/'index.html',*sorted(ROOT.glob('week-*.html'))]:
    text=p.read_text();page=Page();page.feed(text)
    assert not re.search(r'MLT|Mlt|Machine Learning Techniques',text),p
    assert len(page.ids)==len(set(page.ids)),(p,'duplicate IDs')
    for link in page.links:
        u=urlsplit(link)
        if u.scheme or u.netloc:continue
        target=p.parent/unquote(u.path) if u.path else p
        assert target.is_file(),(p,link)
        if u.fragment and target.suffix=='.html':
            q=Page();q.feed(target.read_text());assert u.fragment in q.ids,(p,link)
    if p.name=='index.html':assert page.weeks==list(range(1,13))
config=json.loads((ROOT/'seo-config.json').read_text())
assert [w['id'] for w in config['weeks']]==list(range(1,13))
assert sum(w['count'] for w in config['weeks'])==377
for w in config['weeks']:
    p=ROOT/f'output/pdf/Business_Analytics_week_{w["id"]}_QP.pdf'
    assert p.read_bytes().startswith(b'%PDF-'),p
print('PASS: 13 pages, all local links/anchors, 12 PDFs, 377-question counts.')
