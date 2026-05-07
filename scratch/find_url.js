const fs = require('fs');
const filePath = 'c:\\Users\\abc\\Desktop\\React\\almiraal-solution\\frontend\\public_html\\assets\\index-BEXwAN_D.js';
const searchStr = 'almiraal-solution';
const content = fs.readFileSync(filePath, 'utf8');
const index = content.indexOf(searchStr);
if (index !== -1) {
  console.log(`Found at index ${index}`);
  console.log('Context:', content.substring(index - 50, index + 100));
} else {
  console.log('Not found');
}
