import fs from 'fs';
import path from 'path';

const componentsDir = path.join('src', 'components');
const internalDir = path.join('src', 'internal');
const developerDir = path.join('src', 'developer');
const certificationDir = path.join('src', 'certification');
const experimentalDir = path.join('src', 'experimental');

// Ensure directories exist
[internalDir, developerDir, certificationDir, experimentalDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

const filesToMove = [];

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (['shared', 'ui'].includes(file)) continue; // skip shared
            walkDir(fullPath);
        } else if (fullPath.endsWith('.tsx')) {
            const fileName = path.basename(fullPath);
            if ((fileName.startsWith('Enterprise') || fileName.startsWith('Accounting') || fileName.startsWith('Governance'))
                 && fileName !== 'EnterpriseActionToolbar.tsx' && fileName !== 'EnterpriseButton.tsx') {
                filesToMove.push(fullPath);
            } else if (fileName === 'DeveloperPlatformCenter.tsx') {
                filesToMove.push(fullPath);
            }
        }
    }
}

walkDir(componentsDir);

const fileMoves = [];

for (const oldPath of filesToMove) {
    const fileName = path.basename(oldPath);
    let newDir = '';
    
    if (fileName.startsWith('Governance')) {
        newDir = internalDir;
    } else if (fileName === 'DeveloperPlatformCenter.tsx') {
        newDir = developerDir;
    } else {
        newDir = certificationDir;
    }
    
    const newPath = path.join(newDir, fileName);
    fileMoves.push({ oldPath, newPath, fileName });
}

for (const move of fileMoves) {
    fs.renameSync(move.oldPath, move.newPath);
    console.log(`Moved ${move.oldPath} to ${move.newPath}`);
}

// Now we need to update imports across the codebase.
// Since all components are moved to src/..., we can use absolute imports @/... if configured,
// but let's just use relative imports, or update them.

function updateImportsInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    for (const move of fileMoves) {
        // e.g. import Something from './components/EnterpriseSomething'
        // or import Something from './EnterpriseSomething'
        
        // Let's replace the basename
        const baseNameWithoutExt = move.fileName.replace('.tsx', '');
        
        // Find all imports of this file.
        // Regex to match: import { ... } from '.../EnterpriseSomething';
        const importRegex = new RegExp(`import\\s+(.*?)\\s+from\\s+['"]([^'"]*?\/)?${baseNameWithoutExt}['"];`, 'g');
        
        content = content.replace(importRegex, (match, imports, prefix) => {
            hasChanges = true;
            // Determine relative path from filePath to move.newPath
            const fileDir = path.dirname(filePath);
            const newRelativePath = path.relative(fileDir, move.newPath).replace(/\\/g, '/').replace('.tsx', '');
            const finalPath = newRelativePath.startsWith('.') ? newRelativePath : `./${newRelativePath}`;
            return `import ${imports} from '${finalPath}';`;
        });
    }
    
    if (hasChanges) {
        fs.writeFileSync(filePath, content, 'utf8');
    }
}

function walkAndUpdate(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkAndUpdate(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            updateImportsInFile(fullPath);
        }
    }
}

walkAndUpdate('src');
console.log('Imports updated.');
