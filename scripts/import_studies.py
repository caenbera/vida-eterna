import os
import re
import json

source_dir = r"C:\Users\caenb\OneDrive\Desktop\Carlos\Religion\Estudios Biblicos"
output_file = r"c:\Users\caenb\Projects\Vida Eterna\public\studies.json"

# Ensure output directory exists
os.makedirs(os.path.dirname(output_file), exist_ok=True)

def extract_balanced_div(html, start_pos):
    pos = start_pos
    open_tags = 0
    while pos < len(html):
        next_open = html.find('<div', pos)
        next_close = html.find('</div>', pos)
        
        if next_open == -1 and next_close == -1:
            break
            
        if next_open != -1 and (next_close == -1 or next_open < next_close):
            open_tags += 1
            pos = next_open + 4
        else:
            open_tags -= 1
            pos = next_close + 6
            if open_tags == 0:
                return html[start_pos:pos]
    return None

def clean_html(text):
    if not text:
        return ""
    # Clean leading/trailing spaces
    text = text.strip()
    return text

def parse_bible_verse(verse_html):
    # Extract reference
    ref_match = re.search(r'<strong>(.*?)</strong>', verse_html, re.I | re.S)
    ref = ref_match.group(1).strip() if ref_match else ""
    
    # Extract reference context
    ctx_match = re.search(r'<span class=["\']reference["\']>(.*?)</span>', verse_html, re.I | re.S)
    context = ctx_match.group(1).strip() if ctx_match else ""
    
    # Extract verse text: remove strong and reference tags
    verse_text = verse_html
    verse_text = re.sub(r'<strong>.*?</strong>', '', verse_text, flags=re.I | re.S)
    verse_text = re.sub(r'<span class=["\']reference["\']\b[^>]*>.*?</span>', '', verse_text, flags=re.I | re.S)
    
    # Clean up outer tags
    verse_text = re.sub(r'^<div\s+class=["\']bible-verse["\']\b[^>]*>', '', verse_text, flags=re.I | re.S)
    verse_text = re.sub(r'</div>$', '', verse_text.strip(), flags=re.I | re.S)
    verse_text = re.sub(r'^<br\s*/?>', '', verse_text.strip(), flags=re.I | re.S)
    
    return {
        "type": "bible-verse",
        "reference": clean_html(ref),
        "text": clean_html(verse_text),
        "context": clean_html(context)
    }

def parse_question_block(q_html):
    # Extract Title and Badge
    title_html = ""
    badge = ""
    badge_type = ""
    
    title_match = re.search(r'<div class=["\']question-title["\']>(.*?)</div>', q_html, re.I | re.S)
    if title_match:
        t_content = title_match.group(1)
        # Extract badge
        badge_match = re.search(r'<span class=["\']level-badge (.*?)["\']>(.*?)</span>', t_content, re.I | re.S)
        if badge_match:
            badge_type = badge_match.group(1).strip()
            badge = badge_match.group(2).strip()
            # Remove badge from title
            t_content = re.sub(r'<span class=["\']level-badge.*?</span>', '', t_content, flags=re.I | re.S)
        
        # Clean up icons or extra spaces in title
        title_html = re.sub(r'^[❓📐\s]+', '', t_content.strip()).strip()
        
    # Extract Explanation
    explanation = ""
    exp_match = re.search(r'<div class=["\']answer-section["\']>(.*?)</div>', q_html, re.I | re.S)
    if exp_match:
        explanation = exp_match.group(1)
        explanation = re.sub(r'^<strong>📖\s*(La Explicación:|Punto de Vista Explicado:)\s*</strong>', '', explanation.strip(), flags=re.I | re.S).strip()
        
    # Extract Connection
    connection = ""
    conn_match = re.search(r'<div class=["\']connection-box["\']>(.*?)</div>', q_html, re.I | re.S)
    if conn_match:
        connection = conn_match.group(1)
        connection = re.sub(r'^<strong>🔗\s*Análisis de Conexión:\s*</strong>', '', connection.strip(), flags=re.I | re.S).strip()

    # Extract Child Explanation and Reflections
    child_explanation = ""
    reflection_adult = ""
    reflection_child = ""
    
    # Check for Child accordion
    accordion_match = re.search(r'<div class=["\']accordion["\']>(.*?)</div>\s*</div>', q_html, re.I | re.S)
    if accordion_match:
        acc_inner = accordion_match.group(1)
        # Extract content
        content_match = re.search(r'<div class=["\']accordion-content["\']>(.*?)</div>', q_html, re.I | re.S)
        if content_match:
            acc_content = content_match.group(1)
            # Find kids description
            kids_match = re.search(r'<h4>👦\s*Para Niños:</h4>(.*?)<button', acc_content, re.I | re.S)
            if kids_match:
                child_explanation = kids_match.group(1).strip()
            else:
                # If no save note button, grab full text of paragraph
                kids_match_alt = re.search(r'<h4>👦\s*Para Niños:</h4>(.*)', acc_content, re.I | re.S)
                if kids_match_alt:
                    child_explanation = kids_match_alt.group(1).strip()
                    
    # Check for reflection-box
    refl_match = re.search(r'<div class=["\']reflection-box["\']>(.*?)</div>', q_html, re.I | re.S)
    if refl_match:
        refl_content = refl_match.group(1)
        # Parse adult and child reflections
        # Format: <strong>Adulto:</strong> Text <br> <strong>Niño:</strong> Text
        adult_match = re.search(r'<strong>Adulto(?:s)?:</strong>(.*?)($|<br>|<strong>Niño)', refl_content, re.I | re.S)
        if adult_match:
            reflection_adult = adult_match.group(1).replace('<strong>', '').replace('</strong>', '').strip()
        child_match = re.search(r'<strong>Niño(?:s)?:</strong>(.*?)($|<br>|<strong>Adulto)', refl_content, re.I | re.S)
        if child_match:
            reflection_child = child_match.group(1).replace('<strong>', '').replace('</strong>', '').strip()

    return {
        "type": "question",
        "title": clean_html(title_html),
        "badge": clean_html(badge),
        "badgeType": clean_html(badge_type),
        "explanation": clean_html(explanation),
        "childExplanation": clean_html(child_explanation),
        "reflectionAdult": clean_html(reflection_adult),
        "reflectionChild": clean_html(reflection_child),
        "connection": clean_html(connection)
    }

def parse_accordion_block(acc_html):
    header_match = re.search(r'<div class=["\']accordion-header["\'][^>]*>(.*?)</div>', acc_html, re.I | re.S)
    header = header_match.group(1).strip() if header_match else "Sección Expandible"
    # Remove icon prefix
    header = re.sub(r'^[📚🎨\s]+', '', header).strip()
    
    content_match = re.search(r'<div class=["\']accordion-content["\']>(.*?)</div>', acc_html, re.I | re.S)
    content = content_match.group(1).strip() if content_match else ""
    # Remove save reflection button if present
    content = re.sub(r'<button class=["\']save-note-btn["\b[^>]*>.*?</button>', '', content, flags=re.I | re.S).strip()
    
    return {
        "type": "accordion",
        "title": clean_html(header),
        "content": clean_html(content)
    }

def parse_html_file(file_name, file_path):
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        html = f.read()
        
    study_id = file_name.replace('.html', '').lower()
    
    # Extract Metadata
    title_match = re.search(r'<title>(.*?)</title>', html, re.I)
    title = title_match.group(1).strip() if title_match else file_name.replace('.html', '')
    
    h1_match = re.search(r'<header>.*?<h1>(.*?)</h1>', html, re.S | re.I)
    h1 = h1_match.group(1).strip() if h1_match else title
    
    subtitle_match = re.search(r'<header>.*?<p>(.*?)</p>', html, re.S | re.I)
    subtitle = subtitle_match.group(1).strip() if subtitle_match else ""
    
    # Categorization based on file name or tags
    category = "deidad"
    icon = "fa-book"
    
    if "consolador" in study_id:
        category = "deidad"
        icon = "fa-dove"
    elif "hijo" in study_id or "identidad" in study_id:
        category = "deidad"
        icon = "fa-crown"
    elif "sodoma" in study_id:
        category = "profecia"
        icon = "fa-fire"
    elif "justicia" in study_id:
        category = "salvacion"
        icon = "fa-balance-scale"
    elif "divinidad" in study_id:
        category = "deidad"
        icon = "fa-infinity"
        
    study = {
        "id": study_id,
        "title": h1,
        "subtitle": subtitle,
        "icon": icon,
        "category": category,
        "status": "publicado",
        "units": []
    }
    
    # Find all units
    card_headers = re.findall(r'<div\s+id=["\'](.*?)["\']\s+class=["\']study-card\b[^"\']*["\']>', html, re.I)
    splits = re.split(r'<div\s+id=["\'].*?["\']\s+class=["\']study-card\b[^"\']*["\']>', html, flags=re.I)
    
    for idx, card_id in enumerate(card_headers):
        if idx + 1 < len(splits):
            card_content = splits[idx + 1]
            
            # Clean up the unit content to find where study-card closes
            # Since there could be a footer or other code, we find the first closing </div> that balances this card.
            # We can use our balanced div function but wrap it in an artificial parent div.
            wrapper = f'<div id="{card_id}" class="study-card">{card_content}'
            full_card = extract_balanced_div(wrapper, 0)
            if not full_card:
                full_card = wrapper
                
            unit = {
                "id": card_id,
                "title": "",
                "logicBase": "",
                "thesis": "",
                "whyMatters": "",
                "elements": []
            }
            
            # Extract Unit Title
            h2_match = re.search(r'<h2>(.*?)</h2>', full_card, re.S | re.I)
            if h2_match:
                # Remove any print button inside h2
                unit_title = re.sub(r'<button.*?</button>', '', h2_match.group(1), flags=re.S | re.I)
                unit["title"] = re.sub(r'🏛️|📝|🌱|🌿|🍇|📜|📌|📐|[\d\.]+', '', unit_title).strip()
            else:
                unit["title"] = f"Unidad {idx+1}"
                
            # Extract Logic Base
            lb_match = re.search(r'<div\s+class=["\']logic-base["\']>(.*?)</div>', full_card, re.S | re.I)
            if lb_match:
                unit["logicBase"] = re.sub(r'^<strong>Base Lógica:</strong>', '', lb_match.group(1).strip(), flags=re.I).strip()
                
            # Extract Thesis Box
            tb_match = re.search(r'<div\s+class=["\']thesis-box["\']>(.*?)</div>', full_card, re.S | re.I)
            if tb_match:
                unit["thesis"] = tb_match.group(1).strip()
                
            # Extract Why Matters
            wm_match = re.search(r'<div\s+class=["\']why-matters["\']>(.*?)</div>', full_card, re.S | re.I)
            if wm_match:
                unit["whyMatters"] = re.sub(r'^<strong>¿Por qué esto (es fundamental|cambia todo)\?</strong><br>', '', wm_match.group(1).strip(), flags=re.I).strip()
                
            # Extract Elements in Order
            # We will search for start positions of question-blocks, bible-verses, and accordions, and paragraphs.
            blocks = []
            
            # Find Question Blocks
            for q_match in re.finditer(r'<div\s+class=["\']question-block["\']>', full_card, re.I):
                start = q_match.start()
                q_div = extract_balanced_div(full_card, start)
                if q_div:
                    blocks.append({
                        "start": start,
                        "end": start + len(q_div),
                        "type": "question",
                        "html": q_div
                    })
                    
            # Find Bible Verses (that are NOT inside question blocks)
            for v_match in re.finditer(r'<div\s+class=["\']bible-verse["\']>', full_card, re.I):
                start = v_match.start()
                v_div = extract_balanced_div(full_card, start)
                if v_div:
                    # Check if nested inside an already found block
                    is_nested = any(b["start"] <= start <= b["end"] for b in blocks)
                    if not is_nested:
                        blocks.append({
                            "start": start,
                            "end": start + len(v_div),
                            "type": "bible-verse",
                            "html": v_div
                        })
                        
            # Find Accordions (that are NOT inside question blocks)
            for a_match in re.finditer(r'<div\s+class=["\']accordion["\']>', full_card, re.I):
                start = a_match.start()
                a_div = extract_balanced_div(full_card, start)
                if a_div:
                    is_nested = any(b["start"] <= start <= b["end"] for b in blocks)
                    if not is_nested:
                        blocks.append({
                            "start": start,
                            "end": start + len(a_div),
                            "type": "accordion",
                            "html": a_div
                        })
                        
            # Find Paragraphs <p> (that are NOT inside any blocks)
            for p_match in re.finditer(r'<p\b[^>]*>(.*?)</p>', full_card, re.I | re.S):
                start = p_match.start()
                p_text = p_match.group(1).strip()
                if p_text:
                    is_nested = any(b["start"] <= start <= b["end"] for b in blocks)
                    if not is_nested:
                        # Exclude print buttons or empty/nav paragraphs
                        if "print-btn" not in p_text and "showUnit" not in p_text:
                            blocks.append({
                                "start": start,
                                "end": p_match.end(),
                                "type": "paragraph",
                                "text": p_text
                            })
                            
            # Sort blocks by start position to maintain reading flow
            blocks.sort(key=lambda x: x["start"])
            
            # Parse each block
            for b in blocks:
                if b["type"] == "paragraph":
                    unit["elements"].append({
                        "type": "paragraph",
                        "content": b["text"]
                    })
                elif b["type"] == "bible-verse":
                    unit["elements"].append(parse_bible_verse(b["html"]))
                elif b["type"] == "question":
                    unit["elements"].append(parse_question_block(b["html"]))
                elif b["type"] == "accordion":
                    unit["elements"].append(parse_accordion_block(b["html"]))
                    
            study["units"].append(unit)
            
    return study

# Run main parsing loop
all_studies = []
for file_name in os.listdir(source_dir):
    if file_name.endswith('.html') and file_name not in ['template.html', 'Landing-Page2.html']:
        file_path = os.path.join(source_dir, file_name)
        try:
            print(f"Parsing {file_name}...")
            parsed = parse_html_file(file_name, file_path)
            all_studies.append(parsed)
            print(f"Successfully parsed {file_name} with {len(parsed['units'])} units.")
        except Exception as e:
            print(f"ERROR parsing {file_name}: {e}")

# Write output JSON
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(all_studies, f, indent=2, ensure_ascii=False)

print(f"\nCompleted! Written {len(all_studies)} studies to {output_file}")
