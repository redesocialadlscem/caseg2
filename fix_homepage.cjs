const fs = require('fs');
const path = 'src/client/pages/HomePage.tsx';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(
  "onClick={() => navigate(/courses/${course.id})}",
  'onClick={() => navigate(`/courses/${course.id}`)}'
);
fs.writeFileSync(path, content, 'utf8');
console.log('Fixed!');
