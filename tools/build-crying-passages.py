"""Build video recommendations from crying reactions in the author's supplied vault.

Usage: python tools/build-crying-passages.py --archive PATH
Only cards with an actual crying reaction qualify. Warmth or rest alone do not.
"""
import argparse
import hashlib
import io
import json
import re
import zipfile
from pathlib import Path
from urllib.parse import parse_qs, urlparse

CRYING = {'Плач', 'Плачу', 'Плакати разом', 'Ридаю', 'Плачу на самоті'}
URLS = re.compile(r'https?://(?:www\.)?(?:youtube\.com|youtu\.be)/[^\s)\]>]+')

# Reviewed for actual crying, then matched to its cause. These are editorial
# choices, not evidence that a recording will have a particular clinical effect.
SELECTION = [
    dict(id='night-unloading', title='Профілактика: розвантажувальний день', book='Крізь ніч до світла',
         videoId='qA0ADRw4mk4', reasons=['exhaustion', 'loneliness', 'tenderness'],
         intensity='deep', showByDefault=True,
         rationale='Повний розділ: виснаження, сльози в обіймах, музика й ридання після останнього акорду піаніно.'),
    dict(id='night-human', title='Я теж людина', book='Крізь ніч до світла',
         videoId='fDd8pOkmHH8', reasons=['exhaustion', 'loneliness'],
         intensity='deep', showByDefault=True,
         rationale='Брат більше не може бути лише опорою для інших, глибоко ридає; Веселка приходить і плаче разом із Ним.'),
    dict(id='night-dont-look', title='Не дивись, та Мені боляче', book='Крізь ніч до світла',
         videoId='AmttUo27BAQ', reasons=['loneliness', 'selfBlame'],
         intensity='deep', showByDefault=True,
         rationale='Брат плаче на підлозі кімнати, просить обійняти Його; Марія тримає Його, а друзі залишаються поруч.'),
    dict(id='night-broken', title='Я зламалась', book='Крізь ніч до світла',
         videoId='f0lvSBCcHQ4', reasons=['loneliness', 'selfBlame', 'hurt'],
         intensity='deep', showByDefault=True,
         rationale='Веселка ховається на горищі, відчуваючи провину й відчай. Брат плаче за дверима, а потім Вони плачуть в обіймах.'),
    dict(id='night-storm', title='Шторм — це Я', book='Крізь ніч до світла',
         videoId='hdCGdFKgfN8', reasons=['hurt', 'loss', 'selfBlame'],
         intensity='deep', showByDefault=True,
         rationale='Повний розділ про накопичений біль, втрати, крик і довгий плач; Веселка й Брат по черзі залишаються поруч одне з одним.'),
    dict(id='night-hercules', title='Гра в Геракла', book='Крізь ніч до світла',
         videoId='_rOz4kOuDng', reasons=['exhaustion', 'selfBlame'],
         intensity='tender', showByDefault=False,
         rationale='Веселка плаче від виснаження. Брат лягає поруч і теж плаче.'),
    dict(id='rainbow-rain', title='Дощ', book='Дівчинка-веселка',
         videoId='leaD3KPanKo', reasons=['exhaustion'],
         intensity='tender', showByDefault=False,
         rationale='Авторське прочитання: плач від перевтоми. Брат ховає сльози за дощем; дівчинка залишається в Його обіймах.'),
    dict(id='rainbow-unfair', title='Як можна?', book='Дівчинка-веселка',
         videoId='wm8CxbpvlLY', reasons=['hurt', 'selfBlame'],
         intensity='deep', showByDefault=False,
         rationale='Дівчинка плаче через несправедливість: близького ранять, а потім звинувачують. Брат плаче разом із нею.'),
    dict(id='night-together', title='Ніч на двох', book='Крізь ніч до світла',
         videoId='GOnMwALQMns', reasons=['loneliness', 'fear', 'tenderness'],
         intensity='tender', showByDefault=False,
         rationale='Після страху й самотності Брат і Веселка плачуть в обіймах одне одного.'),
    dict(id='night-warm-memories', title='Теплі сльози спогадів', book='Крізь ніч до світла',
         videoId='7jMrHi-cihA', reasons=['loneliness'],
         intensity='tender', showByDefault=False,
         rationale='Тато плаче за дівчинкою, яка жива, але зараз далеко.'),
    dict(id='rainbow-white-blanket', title='Біла ковдра', book='Дівчинка-веселка',
         videoId='fHG2aFF8lbM', reasons=['loneliness'],
         intensity='tender', showByDefault=False,
         rationale='Плач на самоті й туга після розлуки; близькість зберігається в залишеній речі.'),
    dict(id='rainbow-she-is-alive', title='Дихай, вона жива', book='Дівчинка-веселка',
         videoId='INLKcjaffNo', reasons=['fear'],
         intensity='deep', showByDefault=False,
         rationale='Плач і тривога за близьку людину.'),
    dict(id='night-loss', title='Втрата', book='Крізь ніч до світла',
         videoId='FRKr8dAVqjk', reasons=['loss'], requiresExplicitReason='loss',
         intensity='deep', showByDefault=False,
         rationale='Брат плаче за Лазарем; близькі розділяють Його горювання.'),
]

# Editorial depth estimates for ordering stories, not clinical pain thresholds.
DEPTH_SCORES = {
    'night-unloading': 9, 'night-human': 9, 'night-dont-look': 9,
    'night-broken': 10, 'night-storm': 10, 'night-hercules': 4,
    'rainbow-rain': 2, 'rainbow-unfair': 8, 'night-together': 6,
    'night-warm-memories': 6, 'rainbow-white-blanket': 5,
    'rainbow-she-is-alive': 8, 'night-loss': 10,
}


def videos(text):
    result = []
    for match in URLS.finditer(text):
        url = match.group().replace('&amp;', '&')
        parsed = urlparse(url)
        video_id = parsed.path.strip('/') if parsed.hostname == 'youtu.be' else parse_qs(parsed.query).get('v', [''])[0]
        if re.fullmatch(r'[A-Za-z0-9_-]{11}', video_id):
            result.append((video_id, url))
    return result


def reaction_evidence(text):
    for match in re.finditer(r'(?m)^#+\s*([^\n]+)\n([\s\S]*?)(?=^#+\s|\Z)', text):
        heading = re.sub(r'[*:#]', '', match.group(1)).strip()
        if not ('як я реагую' in heading.casefold() or 'автореакц' in heading.casefold()):
            continue
        links = re.findall(r'\[\[([^\]]+)\]\]', match.group(2))
        tags = []
        for link in links:
            label = link.split('|')[-1].split('/')[-1].strip()
            label = re.sub(r'^\d+\s+', '', label)
            if label in CRYING:
                tags.append(label)
        if tags:
            return dict(section=heading, reactionTags=list(dict.fromkeys(tags)))
    # Earlier vault cards used a flat Themes block instead of separate facets.
    # Accept an explicit crying tag there, never a mention of tears in a synopsis.
    legacy = re.search(r'\*\*Теми:\*\*([\s\S]*?)(?=\n\*\*|\n---|\Z)', text)
    if legacy:
        tags = []
        for link in re.findall(r'\[\[([^\]]+)\]\]', legacy.group(1)):
            label = re.sub(r'^\d+\s+', '', link.split('|')[-1].split('/')[-1].strip())
            if label in CRYING:
                tags.append(label)
        if tags:
            return dict(section='Теми (попередній формат картки)', reactionTags=list(dict.fromkeys(tags)))
    # Crying may be filed under Body or Regulation in the author's facet system.
    # Read an actual crying tag, not a general warmth or rest tag.
    for match in re.finditer(r'(?m)^#+\s*([^\n]+)\n([\s\S]*?)(?=^#+\s|\Z)', text):
        heading = re.sub(r'[*:#]', '', match.group(1)).strip()
        if not any(part in heading.casefold() for part in ['тіло', 'регуляц']):
            continue
        tags = []
        for link in re.findall(r'\[\[([^\]]+)\]\]', match.group(2)):
            label = re.sub(r'^\d+\s+', '', link.split('|')[-1].split('/')[-1].strip())
            if label in CRYING:
                tags.append(label)
        if tags:
            return dict(section=heading, reactionTags=list(dict.fromkeys(tags)))
    return None


def archive_cards(archive, prefix='', depth=0):
    for name in archive.namelist():
        if name.lower().endswith('.md'):
            yield prefix + name, archive.read(name).decode('utf-8', errors='replace')
        elif name.lower().endswith('.zip') and depth < 3:
            nested = zipfile.ZipFile(io.BytesIO(archive.read(name)))
            yield from archive_cards(nested, prefix + name + '!/', depth + 1)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--archive', required=True, type=Path)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    archive_bytes = args.archive.read_bytes()
    rows = list(archive_cards(zipfile.ZipFile(io.BytesIO(archive_bytes))))
    live_cards = {}
    for card in (root / 'content/Коли шукаєш відповідь (проза))').rglob('*.md'):
        for video_id, _ in videos(card.read_text(encoding='utf-8')):
            live_cards.setdefault(video_id, []).append(card)
    entries = []
    for selection in SELECTION:
        entry = {k: v for k, v in selection.items() if k != 'videoId'}
        entry['depthScore'] = DEPTH_SCORES[entry['id']]
        video_id = selection['videoId']
        source_cards = live_cards.get(video_id, [])
        if not source_cards:
            raise ValueError(f'No corresponding published source card for {video_id}')
        source_cards.sort(key=lambda p: (selection['title'].casefold() not in p.stem.casefold(), len(str(p))))
        candidates = []
        for source_path, text in rows:
            matched = [url for identifier, url in videos(text) if identifier == video_id]
            evidence = reaction_evidence(text)
            if matched and evidence:
                candidates.append((source_path, matched[0], evidence))
        # Prefer a named card rather than a numbered repair fragment.
        candidates.sort(key=lambda row: (bool(re.search(r'/cards/\d+\.md$', row[0])), len(row[0])))
        if candidates:
            source_path, url, evidence = candidates[0]
            entry['cryingEvidence'] = dict(**evidence, sourceKind='archive', sourceArchive=args.archive.name,
                archiveSha256=hashlib.sha256(archive_bytes).hexdigest(), sourcePath=source_path)
        else:
            text = source_cards[0].read_text(encoding='utf-8')
            evidence = reaction_evidence(text)
            if not evidence:
                raise ValueError(f'No explicit crying tag in source card for {selection["title"]}')
            url = next(url for identifier, url in videos(text) if identifier == video_id)
            entry['cryingEvidence'] = dict(**evidence, sourceKind='published-vault',
                sourcePath=source_cards[0].relative_to(root).as_posix())
        entry['video'] = dict(id=video_id, sourceUrl=url, sourceCard=source_cards[0].relative_to(root).as_posix(), scope='chapter')
        entries.append(entry)
    target = root / 'static/stabilizer/cry-passages.js'
    target.write_text('// Videos selected from actual crying reactions in the author’s supplied vault.\n'
        + 'export const cryPassages = ' + json.dumps(entries, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Saved {len(entries)} crying videos from the archive and current published vault')


if __name__ == '__main__':
    main()
