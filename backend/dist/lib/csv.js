export function parseCsvLine(line) {
    const values = [];
    let current = "";
    let inQuotes = false;
    for (let index = 0; index < line.length; index += 1) {
        const char = line[index];
        const nextChar = line[index + 1];
        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                current += '"';
                index += 1;
            }
            else {
                inQuotes = !inQuotes;
            }
            continue;
        }
        if (char === "," && !inQuotes) {
            values.push(current);
            current = "";
            continue;
        }
        current += char;
    }
    values.push(current);
    return values;
}
export function parseCsv(content) {
    const rows = [];
    let current = "";
    let inQuotes = false;
    for (let index = 0; index < content.length; index += 1) {
        const char = content[index];
        const nextChar = content[index + 1];
        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                current += '"';
                index += 1;
            }
            else {
                inQuotes = !inQuotes;
            }
            continue;
        }
        if ((char === "\n" || char === "\r") && !inQuotes) {
            if (char === "\r" && nextChar === "\n") {
                index += 1;
            }
            if (current.length > 0) {
                rows.push(parseCsvLine(current));
                current = "";
            }
            continue;
        }
        current += char;
    }
    if (current.length > 0) {
        rows.push(parseCsvLine(current));
    }
    return rows;
}
