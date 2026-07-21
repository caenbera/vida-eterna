import json
import os

json_file = r"c:\Users\caenb\Projects\Vida Eterna\public\studies.json"

if not os.path.exists(json_file):
    print(f"Error: {json_file} does not exist. Run import_studies.py first.")
    exit(1)

with open(json_file, 'r', encoding='utf-8') as f:
    studies = json.load(f)

print(f"Loaded {len(studies)} studies from JSON.")

errors = []

for idx, study in enumerate(studies):
    s_id = study.get("id", f"INDEX_{idx}")
    print(f"Validating study: {s_id}")
    
    # Required top level keys
    for key in ["id", "title", "subtitle", "icon", "category", "status", "units"]:
        if key not in study:
            errors.append(f"Study '{s_id}' is missing required key '{key}'")
            
    # Validate units
    units = study.get("units", [])
    if not units:
        errors.append(f"Study '{s_id}' has no units defined")
        
    for u_idx, unit in enumerate(units):
        u_id = unit.get("id", f"U_INDEX_{u_idx}")
        # Required unit keys
        if "title" not in unit:
            errors.append(f"Unit '{u_id}' in study '{s_id}' is missing 'title'")
            
        elements = unit.get("elements", [])
        for e_idx, elem in enumerate(elements):
            e_type = elem.get("type")
            if not e_type:
                errors.append(f"Element {e_idx} in Unit '{u_id}' of Study '{s_id}' is missing 'type'")
                continue
                
            if e_type == "paragraph":
                if "content" not in elem:
                    errors.append(f"Paragraph element {e_idx} in Unit '{u_id}' of Study '{s_id}' is missing 'content'")
            elif e_type == "bible-verse":
                for key in ["reference", "text", "context"]:
                    if key not in elem:
                        errors.append(f"Bible-verse element {e_idx} in Unit '{u_id}' of Study '{s_id}' is missing '{key}'")
            elif e_type == "question":
                for key in ["title", "badge", "badgeType", "explanation"]:
                    if key not in elem:
                        errors.append(f"Question element {e_idx} in Unit '{u_id}' of Study '{s_id}' is missing '{key}'")
            elif e_type == "accordion":
                for key in ["title", "content"]:
                    if key not in elem:
                        errors.append(f"Accordion element {e_idx} in Unit '{u_id}' of Study '{s_id}' is missing '{key}'")
            else:
                errors.append(f"Element {e_idx} in Unit '{u_id}' of Study '{s_id}' has unknown type '{e_type}'")

if errors:
    print(f"\nVALIDATION FAILED with {len(errors)} errors:")
    for err in errors[:20]:
        print(f" - {err}")
    if len(errors) > 20:
        print(f" ... and {len(errors) - 20} more errors.")
    exit(1)
else:
    print("\nVALIDATION SUCCESSFUL! All files match the schema.")
    exit(0)
