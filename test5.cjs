const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  
  // Set auth state correctly for App.tsx
  await page.evaluate(() => {
    localStorage.setItem('edupro_token', 'mock_token_123');
    localStorage.setItem('edupro_session_school_id', 'school_1');
    localStorage.setItem('edupro_session_role', 'SuperAdmin');
    localStorage.setItem('active_employee_id', 'E101');
  });
  
  // Reload
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  
  const rootHtml = await page.evaluate(() => {
    return document.getElementById('root').innerHTML;
  });
  
  console.log('ROOT HTML LENGTH AFTER LOGIN:', rootHtml.length);
  console.log('ROOT HTML PREVIEW:', rootHtml.substring(0, 500));
  
  // Also check if any React errors in console
  page.on('console', msg => console.log('LOG:', msg.text()));
  
  await browser.close();
})();
