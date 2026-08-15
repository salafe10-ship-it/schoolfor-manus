import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER CONSOLE ERROR:', msg.text());
    }
  });
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('Clicking Student Affairs...');
  try {
      await page.evaluate(() => {
          const els = [...document.querySelectorAll('button')];
          const student = els.find(e => e.textContent && e.textContent.includes('شؤون الطلاب'));
          if (student) student.click();
      });
      await new Promise(r => setTimeout(r, 3000));
      const text = await page.evaluate(() => document.body.innerText);
      console.log('--- PAGE TEXT AFTER STUDENT AFFAIRS ---');
      console.log(text.substring(0, 500));
  } catch (e) {
      console.log('Could not click Student Affairs');
  }

  console.log('Clicking Accounting...');
  try {
      await page.evaluate(() => {
          const els = [...document.querySelectorAll('button')];
          const acct = els.find(e => e.textContent && e.textContent.includes('الحسابات العامة'));
          if (acct) acct.click();
      });
      await new Promise(r => setTimeout(r, 3000));
      const text = await page.evaluate(() => document.body.innerText);
      console.log('--- PAGE TEXT AFTER ACCOUNTING ---');
      console.log(text.substring(0, 500));
  } catch (e) {
      console.log('Could not click Accounting');
  }
  
  await browser.close();
})();
