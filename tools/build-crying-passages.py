"""Extract reviewed passages from the author's supplied books without rewriting them.

Usage: python tools/build-crying-passages.py --rainbow PATH --night-text PATH
The PDF transcript is generated with pdftotext -layout.
"""

import argparse
import json
import re
from pathlib import Path
from urllib.parse import urlparse, parse_qs
from docx import Document


def normalized(value):
    return re.sub(r'\s+', ' ', value).strip()


def pdf_transcript(value):
    result = []
    for page in value.split('\f'):
        for line in page.splitlines():
            clean = line.strip()
            if clean.isdigit():
                continue
            if not clean:
                continue
            # PDF indentation marks dialogue and new paragraphs, not extra words.
            indentation = len(line) - len(line.lstrip())
            if result and 6 <= indentation <= 9:
                result.append('\n\n')
            result.append(clean + ' ')
    return ''.join(result)


def pdf_extract(transcript, start, end):
    # Locate by normalized text while retaining paragraph boundaries for reading.
    flat = normalized(transcript)
    start_at = flat.index(start)
    end_at = flat.index(end, start_at) + len(end)
    exact = flat[start_at:end_at]
    words = list(re.finditer(r'\S+', transcript))
    position = 0
    raw_start = raw_end = None
    for match in words:
        if position == start_at:
            raw_start = match.start()
        last = position + len(match.group())
        if last == end_at:
            raw_end = match.end()
            break
        position = last + 1
    if raw_start is None or raw_end is None:
        raise ValueError('Excerpt boundaries must be complete words')
    paragraphs = [normalized(p) for p in transcript[raw_start:raw_end].split('\n\n') if p.strip()]
    assert normalized(' '.join(paragraphs)) == exact
    return paragraphs


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--rainbow', required=True, type=Path)
    parser.add_argument('--night-text', required=True, type=Path)
    args = parser.parse_args()
    rainbow = [p.text for p in Document(args.rainbow).paragraphs]
    night = pdf_transcript(args.night_text.read_text(encoding='utf-8'))

    def rainbow_extract(first, last):
        return [normalized(p) for p in rainbow[first:last] if p.strip()]

    passages = [
        dict(id='rainbow-fatigue', title='Втома', book='Дівчинка-веселка',
             reasons=['exhaustion'], intensity='quiet', unknownSafe=True,
             description='Тато дуже втомився. Дівчинка помічає це й залишається поруч без зайвих слів.',
             paragraphs=rainbow_extract(178, 187),
             provenance=dict(kind='docx', firstParagraph=178, lastParagraphExclusive=187)),
        dict(id='night-unloading', title='Профілактика: розвантажувальний день', book='Крізь ніч до світла',
             reasons=['exhaustion', 'loneliness'], intensity='tender', unknownSafe=False,
             description='Безліч справ, клубок у горлі й сльози від утоми. Веселка приходить із чаєм і обіймає Брата.',
             paragraphs=pdf_extract(night,
                 'Того ранку Він прокинувся важким.',
                 'її ніжність належала Йому.'),
             provenance=dict(kind='pdf', chapter=44, pages=[103, 104])),
        dict(id='night-sleep-island', title='Острів сну', book='Крізь ніч до світла',
             reasons=['exhaustion'], intensity='quiet', unknownSafe=True,
             description='Після насиченого дня Веселка вкривається пледом на гойдалці, гладить ретривера й засинає.',
             paragraphs=pdf_extract(night,
                 'Коли Вони попрощалися на ніч, Дівчина веселка повернулася на острів Сну',
                 'занурила щоку у м’яку подушку і заснула…'),
             provenance=dict(kind='pdf', chapter=87, pages=[190, 191])),
        dict(id='rainbow-moon-night', title='Ніч під місяцем', book='Дівчинка-веселка',
             reasons=['loneliness', 'tenderness'], intensity='tender', unknownSafe=False,
             description='Дівчинка чує сльози Брата, приносить чай і плед, зігріває Його руки та залишається.',
             paragraphs=rainbow_extract(250, 255),
             provenance=dict(kind='docx', firstParagraph=250, lastParagraphExclusive=255)),
        dict(id='rainbow-tea-visit', title='Привіт, можна зайти?', book='Дівчинка-веселка',
             reasons=['loneliness', 'tenderness'], intensity='quiet', unknownSafe=True,
             description='Звичайний прихід із чаєм і печивом стає взаємною ніжністю. Можна просто побути разом.',
             paragraphs=rainbow_extract(1037, 1057),
             provenance=dict(kind='docx', firstParagraph=1037, lastParagraphExclusive=1057)),
        dict(id='night-enough', title='Я достатній', book='Крізь ніч до світла',
             reasons=['selfBlame', 'loneliness'], intensity='deep', unknownSafe=False,
             description='Брат говорить про давню самотність. Веселка залишається, а Він знаходить підтримку для маленького Себе.',
             contentNote='Глибша сцена про дитячу самотність і страх бути покинутим.',
             paragraphs=pdf_extract(night,
                 'Самотність була Його супутником надто довго',
                 'маленький Ісус відчув, що ці обійми – реальні.'),
             provenance=dict(kind='pdf', chapter=8, pages=[16, 17, 18])),
        dict(id='rainbow-trust', title='Довірся Мені', book='Дівчинка-веселка',
             reasons=['fear', 'selfBlame'], intensity='tender', unknownSafe=False,
             description='Янгол боїться висоти й думає, що підвів Учителя. Брат показує, що невдала спроба не забирає Його любові.',
             paragraphs=rainbow_extract(1325, 1334),
             provenance=dict(kind='docx', firstParagraph=1325, lastParagraphExclusive=1334)),
        dict(id='rainbow-stay-close', title='Ти не втратиш Його', book='Дівчинка-веселка',
             reasons=['fear'], intensity='tender', unknownSafe=False,
             description='Дівчинка боїться втратити зв’язок із Братом. Тато слухає її, обіймає й дає відчути Свою присутність.',
             paragraphs=rainbow_extract(1460, 1472),
             provenance=dict(kind='docx', firstParagraph=1460, lastParagraphExclusive=1472)),
        dict(id='night-loss', title='Втрата', book='Крізь ніч до світла',
             reasons=['loss'], requiresExplicitReason='loss', intensity='deep', unknownSafe=False,
             description='Брат горює за Лазарем. Мама й друзі помічають Його біль і плачуть разом із Ним.',
             contentNote='Смерть близької людини, прощання й горювання.',
             paragraphs=pdf_extract(night,
                 'Того дня світ був жахливо тихим.',
                 'Й від того, що Його теж помітили. І прийняли.'),
             provenance=dict(kind='pdf', chapter=48, pages=[112, 113])),
        dict(id='night-voice', title='Ну й гаразд!', book='Крізь ніч до світла',
             reasons=['hurt'], intensity='tender', unknownSafe=False,
             description='Брат нарешті говорить, що Його теж потрібно чути. Тато слухає без іронії та осуду.',
             paragraphs=pdf_extract(night,
                 '- Я ж постійно допомагаю, завжди тримаю, Батьку, всіх!',
                 'Його голос теж мав значення.'),
             provenance=dict(kind='pdf', chapter=11, pages=[23])),
        dict(id='rainbow-unfair', title='Як можна?', book='Дівчинка-веселка',
             reasons=['hurt', 'selfBlame'], intensity='deep', unknownSafe=False,
             description='Дівчинці боляче від несправедливості й звинувачень. Брат розуміє цей біль і залишається поруч.',
             contentNote='Болючі стосунки, несправедливість і самозвинувачення.',
             paragraphs=rainbow_extract(1689, 1705),
             provenance=dict(kind='docx', firstParagraph=1689, lastParagraphExclusive=1705)),
    ]
    root = Path(__file__).resolve().parents[1]
    cards = {
        'rainbow-fatigue': 'Дівчинка-веселка/1 Готові/8. Втома.md',
        'night-unloading': 'Крізь ніч/Уривки/44. «Профілактика».md',
        'night-sleep-island': 'Крізь ніч/Уривки/87. Острів Сну.md',
        'rainbow-moon-night': 'Дівчинка-веселка/1 Готові/13. Ніч під місяцем.md',
        'rainbow-tea-visit': 'Дівчинка-веселка/1 Готові/50. Привіт, можна зайти.md',
        'night-enough': 'Крізь ніч/Уривки/8. «Я достатній».md',
        'rainbow-trust': 'Дівчинка-веселка/1 Готові/61. Довірся Мені.md',
        'rainbow-stay-close': 'Дівчинка-веселка/1 Готові/68. Ти не втратиш Його.md',
        'night-loss': 'Крізь ніч/Уривки/48. «Втрата».md',
        'night-voice': 'Крізь ніч/Уривки/11. «Ну й гаразд!».md',
        'rainbow-unfair': 'Дівчинка-веселка/1 Готові/78. Як можна.md',
    }
    media_notes = {
        'night-unloading': 'У відео весь розділ: далі є сильні сльози та сцена біля піаніно.',
        'night-voice': 'Відео починається з болючої самотності й сильного плачу; підтримка приходить пізніше.',
    }
    for passage in passages:
        source_card = Path('content/Коли шукаєш відповідь (проза))') / cards[passage['id']]
        text = (root / source_card).read_text(encoding='utf-8')
        match = re.search(r'https?://(?:www\.)?(?:youtube\.com|youtu\.be)/[^\s)\]>]+', text)
        if not match:
            raise ValueError(f'No author-provided video in {source_card}')
        url = match.group().replace('&amp;', '&')
        parsed = urlparse(url)
        video_id = parsed.path.strip('/') if parsed.hostname == 'youtu.be' else parse_qs(parsed.query).get('v', [''])[0]
        if not re.fullmatch(r'[A-Za-z0-9_-]{11}', video_id):
            raise ValueError(f'Invalid YouTube video in {source_card}')
        passage['video'] = dict(id=video_id, sourceUrl=url, sourceCard=source_card.as_posix(), scope='chapter')
        if passage['id'] in media_notes:
            passage['video']['contentNote'] = media_notes[passage['id']]

    target = root / 'static/stabilizer/cry-passages.js'
    output = '// Reviewed excerpts from the author’s supplied books. Do not rewrite quotations.\n'
    output += 'export const cryPassages = ' + json.dumps(passages, ensure_ascii=False, indent=2) + '\n'
    target.write_text(output, encoding='utf-8')
    print('Saved', len(passages), 'source-grounded passages')


if __name__ == '__main__':
    main()
