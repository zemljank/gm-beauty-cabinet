import fs from 'node:fs';
import ts from 'typescript';

const path = new URL('../src/data/products.ts', import.meta.url);
const source = fs.readFileSync(path, 'utf8');
const ast = ts.createSourceFile('products.ts', source, ts.ScriptTarget.Latest, true);
const records = new Map();
function visit(node) {
  if (ts.isObjectLiteralExpression(node)) {
    const fields = new Map(node.properties.filter(ts.isPropertyAssignment).map(p => [p.name.getText(ast), p.initializer]));
    const id = fields.get('id'), price = fields.get('price');
    if (id && ts.isStringLiteral(id) && price && ts.isNumericLiteral(price)) records.set(id.text, price);
  }
  ts.forEachChild(node, visit);
}
visit(ast);
const [command, file, flag] = process.argv.slice(2);
try {
  if (command === 'export' && file && !flag) {
    fs.writeFileSync(file, 'id;price\n' + [...records].map(([id, price]) => `${id};${price.text}`).join('\n') + '\n', { flag: 'wx' });
    console.log(`Экспортировано ${records.size} товаров в ${file}`);
  } else if (command === 'import' && file && (!flag || flag === '--apply')) {
    const rows = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '').trim().split(/\r?\n/);
    const separator = rows[0] === 'id;price' ? ';' : ',';
    if (rows.shift() !== `id${separator}price`) throw new Error('Нужны столбцы id;price или id,price');
    const seen = new Set();
    const edits = [];
    for (const [index, row] of rows.entries()) {
      const values = row.split(separator).map(value => value.trim());
      const [id, value] = values;
      if (values.length !== 2 || !records.has(id) || seen.has(id)) throw new Error(`Строка ${index + 2}: неизвестный или повторный id либо лишние столбцы`);
      if (!/^\d+(\.\d{1,2})?$/.test(value) || Number(value) <= 0 || Number(value) > 10000000) throw new Error(`Строка ${index + 2}: некорректная цена`);
      seen.add(id);
      const node = records.get(id);
      if (Number(value) !== Number(node.text)) {
        console.log(`${id}: ${node.text} → ${Number(value)} ₽`);
        edits.push({ start: node.getStart(ast), end: node.end, value: String(Number(value)) });
      }
    }
    if (!rows.length) throw new Error('Таблица пустая');
    if (flag === '--apply') {
      let updated = source;
      for (const edit of edits.sort((a, b) => b.start - a.start)) updated = updated.slice(0, edit.start) + edit.value + updated.slice(edit.end);
      fs.writeFileSync(path, updated);
    }
    console.log(`${flag === '--apply' ? 'Применено' : 'Проверено, файл не изменён'}: ${edits.length} новых цен. Пропущенные товары сохраняют цены.`);
  } else throw new Error('Команды: npm run prices -- export prices.csv | import prices.csv [--apply]');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
