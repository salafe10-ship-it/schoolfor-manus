import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const strToFind = `          {activeSection === 'wave1_certification' && (
            <EnterpriseWave1FinalCertification />
          )}`;

const replacement = `          {activeSection === 'wave1_certification' && (
            <EnterpriseWave1FinalCertification />
          )}

          {activeSection === 'commercial_release' && (
            <EnterpriseCommercialReleaseQualityCertification />
          )}`;

code = code.replace(strToFind, replacement);
fs.writeFileSync('src/App.tsx', code);
