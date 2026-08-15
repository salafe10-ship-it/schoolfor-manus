import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('response', response => {
    if (!response.ok()) {
      console.log('404 URL:', response.url());
    }
  });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER CONSOLE ERROR:', msg.text());
    }
  });
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('Clicking Accounting...');
  try {
      await page.evaluate(() => {
          const els = [...document.querySelectorAll('*')];
          const acct = els.find(e => e.textContent && e.textContent.trim() === 'الحسابات العامة' && e.tagName !== 'SCRIPT');
          if (acct) acct.click();
      });
      await new Promise(r => setTimeout(r, 5000));
  } catch (e) {
      console.log('Could not click Accounting');
  }

  console.log('Clicking Student Affairs...');
  try {
      await page.evaluate(() => {
          const els = [...document.querySelectorAll('*')];
          const student = els.find(e => e.textContent && e.textContent.trim() === 'شؤون الطلاب' && e.tagName !== 'SCRIPT');
          if (student) student.click();
      });
      await new Promise(r => setTimeout(r, 5000));
  } catch (e) {
      console.log('Could not click Student Affairs');
  }
  
  await browser.close();
})();
