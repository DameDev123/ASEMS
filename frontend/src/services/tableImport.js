// Reads a CSV or Excel (.xlsx) file in the browser and maps its columns to import fields.

export const MAX_ROWS = 1500;

export const STUDENT_COLUMNS = {
  studentId: ['studentid', 'studentno', 'studentnumber', 'idnumber', 'id', 'username', 'studentidnumber'],
  name: ['name', 'fullname', 'studentname', 'full_name'],
  gender: ['gender', 'sex'],
  phone: ['phone', 'phonenumber', 'mobile', 'tel'],
  academicYear: ['academicyear', 'ay', 'year'],
  yearLevel: ['yearlevel', 'level', 'classyear'],
  section: ['section', 'sec', 'class'],
};

export const INSTRUCTOR_COLUMNS = {
  name: ['name', 'fullname', 'instructorname'],
  email: ['email', 'emailaddress', 'mail'],
  idNumber: ['idnumber', 'employeeid', 'id', 'staffid'],
  gender: ['gender', 'sex'],
  phone: ['phone', 'phonenumber', 'mobile', 'tel'],
  jobTitle: ['jobtitle', 'title', 'position'],
  teachingStartYear: ['teachingstartyear', 'startyear', 'teachingstart', 'yearstarted'],
};

export const STUDENT_REQUIRED = ['studentId', 'name'];
export const INSTRUCTOR_REQUIRED = ['name', 'email'];

export const STUDENT_TEMPLATE =
  'studentId,name,gender,phone,academicYear,yearLevel,section\r\nRU1001,Abebe Kebede,male,,2026,2,A\r\n';
export const INSTRUCTOR_TEMPLATE =
  'name,email,idNumber,gender,phone,jobTitle,teachingStartYear\r\nDr. Lemma Tadesse,lemma@ambo.edu.et,E1001,male,,Instructor,2019\r\n';

const normalizeHeader = (value) => String(value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

// Minimal RFC 4180 CSV parser: quoted fields, escaped quotes, CRLF/LF, BOM.
export function parseCsv(text) {
  const input = String(text ?? '').replace(/^\uFEFF/, '');
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];
    if (quoted) {
      if (ch === '"') {
        if (input[i + 1] === '"') { cell += '"'; i += 1; } else { quoted = false; }
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ',') {
      row.push(cell); cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && input[i + 1] === '\n') i += 1;
      row.push(cell); cell = '';
      rows.push(row); row = [];
    } else {
      cell += ch;
    }
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

export async function readTable(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith('.csv') || name.endsWith('.txt')) {
    return parseCsv(await file.text());
  }
  if (name.endsWith('.xlsx')) {
    const { default: readXlsxFile } = await import('read-excel-file');
    return readXlsxFile(file);
  }
  throw new Error('Unsupported file type. Use a .csv or .xlsx file (save older .xls files as .xlsx).');
}

const cellText = (cell) => {
  if (cell === null || cell === undefined) return '';
  if (cell instanceof Date) return String(cell.getFullYear());
  return String(cell).trim();
};

// Returns { rows, columns, missing, extraHeaders }. rows[i].rowNumber is the spreadsheet row (header = 1).
export function tableToRows(table, columnMap, required) {
  if (!Array.isArray(table) || table.length < 2) {
    return { rows: [], columns: {}, missing: required, extraHeaders: [] };
  }

  const headers = table[0].map(normalizeHeader);
  const columns = {};
  for (const [field, synonyms] of Object.entries(columnMap)) {
    const index = headers.findIndex((header) => header && synonyms.includes(header));
    if (index !== -1) columns[field] = index;
  }

  const used = new Set(Object.values(columns));
  const extraHeaders = table[0]
    .map((header, index) => ({ header: cellText(header), index }))
    .filter(({ header, index }) => header && !used.has(index))
    .map(({ header }) => header);

  const missing = required.filter((field) => columns[field] === undefined);
  if (missing.length) return { rows: [], columns, missing, extraHeaders };

  const rows = [];
  table.slice(1).forEach((cells, offset) => {
    const row = { rowNumber: offset + 2 };
    let hasValue = false;
    for (const [field, index] of Object.entries(columns)) {
      const value = cellText(cells[index]);
      if (value) hasValue = true;
      row[field] = value;
    }
    if (hasValue) rows.push(row);
  });

  return { rows, columns, missing: [], extraHeaders };
}

function csvEscape(value) {
  let text = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`; // spreadsheet formula-injection guard
  return `"${text.replace(/"/g, '""')}"`;
}

export function toCsv(headers, records) {
  const lines = [headers.map((h) => csvEscape(h.label)).join(',')];
  for (const record of records) {
    lines.push(headers.map((h) => csvEscape(record[h.key])).join(','));
  }
  return `\uFEFF${lines.join('\r\n')}\r\n`;
}

export function downloadText(filename, text, type = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}