import fs from 'fs';
let code = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

const strToFind = `{ id: 'wave1_certification', label: 'الاعتماد النهائي للمرحلة الأولى', icon: ShieldCheck },`;

const replacement = `{ id: 'wave1_certification', label: 'الاعتماد النهائي للمرحلة الأولى', icon: ShieldCheck },
        { id: 'commercial_release', label: 'شهادة الجودة للإصدار التجاري', icon: Globe },`;

code = code.replace(strToFind, replacement);

if(!code.includes('Globe,')) {
    code = code.replace('LayoutTemplate', 'LayoutTemplate,\n  Globe');
}

fs.writeFileSync('src/components/Sidebar.tsx', code);
