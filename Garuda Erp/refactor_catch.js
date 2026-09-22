const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'screens');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js') || f.endsWith('.jsx'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // 1. Add import statement if it doesn't exist and the file uses api or catches errors
  if ((content.includes('catch (error)') || content.includes('catch (err)') || content.includes('catch (e)')) && !content.includes('errorHandler')) {
    const lines = content.split('\n');
    let lastImportIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('import ')) {
        lastImportIdx = i;
      }
    }
    if (lastImportIdx !== -1) {
      lines.splice(lastImportIdx + 1, 0, "import { getErrorMessage } from '../utils/errorHandler';");
      content = lines.join('\n');
      modified = true;
    }
  }

  // 2. Replace the Alert.alert inside catch blocks
  // A catch block typically looks like:
  // catch (error) {
  //   console.error(error);
  //   Alert.alert('Error', 'Something...');
  // }
  
  // We can use a regex to match:
  // catch\s*\((.*?)\)\s*\{([\s\S]*?)Alert\.alert\('Error',\s*['"`](.*?)['"`]\);([\s\S]*?)\}
  // But maybe a simpler string replacement or a more permissive regex.
  
  // Let's replace line by line for Alert.alert('Error', '...') that is likely in a catch.
  // Actually, we can use a regex to replace Alert.alert('Error', '<any string>') only if it's right after console.error or similar inside catch.
  
  // Let's replace the common patterns:
  const catchRegex = /catch\s*\((error|err|e)\)\s*\{([\s\S]*?)Alert\.alert\(\s*'Error',\s*['"`](.*?)['"`]\s*\);/g;
  
  content = content.replace(catchRegex, (match, errVar, beforeAlert, oldMessage) => {
    modified = true;
    return `catch (${errVar}) {${beforeAlert}Alert.alert('Error', getErrorMessage(${errVar}, '${oldMessage}'));`;
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
}
console.log('Refactoring complete.');
