import re

with open('src/modules/accounting/presentation/JournalEntriesTab.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("if (!)", "if (!copiedJvLine)")
text = text.replace("const handleExportJv = (format: string, jvToExport: any = ) => {", "const handleExportJv = (format: string, jvToExport: any = activeJvState) => {")

text = re.sub(r"const handleCopyJvLine = \(line: any\) => \{\n\s*\(\{\ \.\.\.line, id: undefined \}\);", r"const handleCopyJvLine = (line: any) => {\n    setCopiedJvLine({ ...line, id: undefined });", text)

with open('src/modules/accounting/presentation/JournalEntriesTab.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("done jv syntax")
