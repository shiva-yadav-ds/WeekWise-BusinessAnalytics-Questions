#!/usr/bin/env python3
"""Build crawlable study pages and metadata without a runtime/build dependency."""
import argparse
import html
import json
import re
from pathlib import Path
from urllib.parse import urlsplit
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
CONFIG = json.loads((ROOT / 'seo-config.json').read_text())
BASE = ''
WEEKS = CONFIG['weeks']
esc = html.escape


def schema_script(graph):
    value = json.dumps({'@context': 'https://schema.org', '@graph': graph}, ensure_ascii=False, indent=2)
    return '<script type="application/ld+json">\n' + value.replace('<', '\\u003c') + '\n</script>'


def head(title, description, path, graph, kind='website'):
    canonical = BASE + path
    image = BASE + 'assets/ba-social.svg'
    return f'''  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{esc(title)}</title>
  <meta name="description" content="{esc(description, quote=True)}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <meta name="author" content="Shiva Yadav">
  <meta name="theme-color" content="#2563eb">
  <link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
  <meta property="og:type" content="{kind}">
  <meta property="og:locale" content="en_IN">
  <meta property="og:site_name" content="IITM BA Question Portal">
  <meta property="og:title" content="{esc(title, quote=True)}">
  <meta property="og:description" content="{esc(description, quote=True)}">
  <meta property="og:image" content="{esc(image, quote=True)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="IITM BA Week Wise Questions — Business Analytics, Weeks 1–12">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{esc(title, quote=True)}">
  <meta name="twitter:description" content="{esc(description, quote=True)}">
  <meta name="twitter:image" content="{esc(image, quote=True)}">
  <meta name="twitter:image:alt" content="IITM BA Week Wise Questions — Business Analytics, Weeks 1–12">
  <link rel="stylesheet" href="styles.css">
  {schema_script(graph)}'''


def replace_block(document, name, value):
    pattern = rf'(<!-- SEO:{name}:START -->).*?(<!-- SEO:{name}:END -->)'
    updated, n = re.subn(pattern, lambda m: m[1] + '\n' + value + '\n        ' + m[2], document, flags=re.S)
    if n != 1:
        raise ValueError(f'Expected one {name} block, found {n}')
    return updated


def week_link(w):
    return f'<a href="week-{w["id"]}.html">Week {w["id"]}: {esc(w["topic"])}</a>'


items = []
for w in WEEKS:
    i = w['id']
    if not w['count'] or not (ROOT / f'output/pdf/Business_Analytics_week_{i}_QP.pdf').is_file():
        raise ValueError(f'Missing Week {i} PDF')
    items.append({'@type': 'ListItem', 'position': i, 'name': f'IITM BA Week {i}: {w["topic"]}', 'url': BASE + f'week-{i}.html'})

home_title = 'IITM BA Week Wise Questions & PYQs | IIT Madras BS'
home_desc = 'Practice IITM Business Analytics (BA) with week wise questions and PYQ PDFs for Weeks 1–12. Includes answer keys for IIT Madras BS Data Science revision.'
home_graph = [
    {'@type': 'WebSite', '@id': BASE + '#website', 'url': BASE, 'name': 'IITM BA Week Wise Questions', 'alternateName': 'Business Analytics Question Portal', 'inLanguage': 'en'},
    {'@type': 'CollectionPage', '@id': BASE + '#collection', 'url': BASE, 'name': home_title, 'description': home_desc, 'isPartOf': {'@id': BASE + '#website'}, 'mainEntity': {'@type': 'ItemList', 'numberOfItems': len(items), 'itemListElement': items}}
]

cards = []
for w in WEEKS:
    i = w['id']
    cards.append(f'''            <a class="week-card" data-week-id="{i}" href="week-{i}.html" aria-label="IITM BA Week {i} questions: {esc(w['topic'], quote=True)}">
              <span class="week-card-left"><span class="week-index">{i:02}</span><span class="week-label">Week-{i}</span></span>
              <span class="week-card-right"><span class="card-format-tag">PDF</span><span class="week-open-arrow" aria-hidden="true">→</span></span>
            </a>''')

home = (ROOT / 'index.html').read_text()
for name, value in [('HEAD', head(home_title, home_desc, '', home_graph)), ('CARDS', '\n'.join(cards))]:
    home = replace_block(home, name, value)
(ROOT / 'index.html').write_text(home)

for w in WEEKS:
    i = w['id']
    path = f'week-{i}.html'
    title = f'IITM BA Week {i} Questions | {w["topic"]}'
    desc = f'Practice IITM BA Week {i}: {w["topic"]}. Browse {w["count"]} numbered questions with answer keys, topic guidance and a downloadable Business Analytics PDF.'
    graph = [
        {'@type': 'LearningResource', '@id': BASE + path + '#resource', 'url': BASE + path, 'name': title, 'description': desc, 'inLanguage': 'en', 'learningResourceType': 'Question bank', 'educationalUse': 'Practice and revision', 'isAccessibleForFree': True, 'about': [{'@type': 'Thing', 'name': t} for t in w['topics']], 'author': {'@type': 'Person', 'name': 'Shiva Yadav'}, 'audience': {'@type': 'EducationalAudience', 'educationalRole': 'student'}, 'encoding': {'@type': 'MediaObject', 'contentUrl': BASE + f'output/pdf/Business_Analytics_week_{i}_QP.pdf', 'encodingFormat': 'application/pdf'}},
        {'@type': 'BreadcrumbList', 'itemListElement': [{'@type': 'ListItem', 'position': 1, 'name': 'IITM BA Week Wise Questions', 'item': BASE}, {'@type': 'ListItem', 'position': 2, 'name': f'Week {i}: {w["topic"]}', 'item': BASE + path}]}
    ]
    topics = ''.join(f'<li>{esc(t)}</li>' for t in w['topics'])
    guide = ''.join(f'<li>{esc(t)}</li>' for t in w['guide'])
    navigation = ' · '.join(week_link(v) for v in WEEKS)
    prev = f'<a href="week-{i-1}.html">← Week {i-1}</a>' if i > 1 else '<a href="index.html">← All weeks</a>'
    next_ = f'<a href="week-{i+1}.html">Week {i+1} →</a>' if i < 12 else '<a href="index.html">All weeks →</a>'
    document = f'''<!DOCTYPE html>
<html lang="en">
<head>
{head(title, desc, path, graph, 'article')}
</head>
<body>
  <a class="skip-link" href="#week-content">Skip to week questions</a>
  <header class="top-header">
    <div class="brand-section"><span class="brand-badge">IIT Madras</span><div class="brand-title">BA <span>Question Portal</span></div></div>
    <a class="btn-minimal" href="index.html">All Weeks</a>
  </header>
  <main id="week-content" class="week-page">
    <nav class="breadcrumbs" aria-label="Breadcrumb"><a href="index.html">IITM BA questions</a> / Week {i}</nav>
    <div class="gallery-header">
      <div class="gallery-eyebrow">Business Analytics · IIT Madras BS</div>
      <h1 class="gallery-title">IITM BA Week {i} Questions</h1>
      <p class="gallery-subtitle">{esc(w['topic'])}</p>
      <p class="resource-meta">{w['count']} questions · PDF with answer keys · Free to read and download</p>
    </div>
    <section class="study-section" aria-labelledby="question-heading">
      <h2 id="question-heading">Week {i} question PDF</h2>
      <p>{esc(w['summary'])}</p>
      <div class="resource-actions">
        <a class="btn-primary" href="index.html?week={i}">Read Week {i} questions</a>
        <a class="btn-minimal" href="output/pdf/Business_Analytics_week_{i}_QP.pdf" download>Download Week {i} PDF</a>
        <a class="btn-minimal" href="output/pdf/Business_Analytics_week_{i}_QP.pdf" target="_blank" rel="noopener">Open PDF in new tab</a>
      </div>
      <p>The complete question statements, options, numerical data and any supporting graphs or tables are in the PDF. Shared comprehension data is included with the relevant questions. Answer keys are included for checking your attempt; these are not full worked solutions.</p>
    </section>
    <section class="study-section" aria-labelledby="topics-heading">
      <h2 id="topics-heading">Topics covered in this collection</h2>
      <ul class="revision-list">{topics}</ul>
    </section>
    <section class="study-section" aria-labelledby="revision-heading">
      <h2 id="revision-heading">How to approach these questions</h2>
      <ul class="revision-list">{guide}</ul>
      <p>Attempt the questions using the assumptions and notation stated in each problem. For short-answer questions, round only at the final step to the requested precision. Check the provided key after solving and revisit the relevant concept when an answer differs.</p>
    </section>
    <nav class="week-pagination" aria-label="Adjacent weeks">{prev}<a href="index.html">All 12 weeks</a>{next_}</nav>
    <nav class="study-section" aria-label="All week topic guides"><h2>More BA week wise questions</h2><p>{navigation}</p></nav>
    <footer class="gallery-footer">
      <p class="footer-disclaimer-text">Curated by <a href="https://shiva-yadav-ds.vercel.app/" rel="noopener">Shiva (25f1000035)</a>. Unofficial student-created resource for study and revision. Not affiliated with IIT Madras.</p>
    </footer>
  </main>
</body>
</html>
'''
    (ROOT / path).write_text(document)

print('Generated Business Analytics homepage and 12 week pages.')
