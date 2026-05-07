const fs = require('fs');
const filePath = 'c:\\Users\\abc\\Desktop\\React\\almiraal-solution\\frontend\\public_html\\assets\\index-BEXwAN_D.js';
const searchStr = 'https://almiraal-solution.vercel.app';
const replaceStr = 'http://localhost:5000';
let content = fs.readFileSync(filePath, 'utf8');
if (content.includes(searchStr)) {
  content = content.replace(new RegExp(searchStr, 'g'), replaceStr);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully updated the backend URL in frontend assets.');
} else {
  console.log('URL not found in the file.');
}
