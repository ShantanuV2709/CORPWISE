"""
Script to fix admin.py by adding document count increment
"""

# Read the file
with open('C:\\Users\\Lenovo\\CORPWISE\\backend\\app\\api\\routes\\admin.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find the line with the update_status closing
insert_index = None
for i, line in enumerate(lines):
    if 'pinecone_ids=result["pinecone_ids"]' in line:
        # Find the next line with just whitespace and )
        for j in range(i+1, min(i+5, len(lines))):
            if lines[j].strip() == ')':
                insert_index = j + 1
                break
        break

if insert_index:
    # Insert the document count increment code
    indent = '        '
    new_lines = [
        f'{indent}\n',
        f'{indent}# Increment document count for the company\n',
        f'{indent}if company_id:\n',
        f'{indent}    from app.models.admin_helpers import AdminSubscriptionHelpers\n',
        f'{indent}    await AdminSubscriptionHelpers.increment_document_count(company_id)\n',
    ]
    
    lines = lines[:insert_index] + new_lines + lines[insert_index:]
    
    # Write back
    with open('C:\\Users\\Lenovo\\CORPWISE\\backend\\app\\api\\routes\\admin.py', 'w', encoding='utf-8') as f:
        f.writelines(lines)
    
    print("✅ Fixed! Added document count increment")
else:
    print("❌ Could not find insertion point")
