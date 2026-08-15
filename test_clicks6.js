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
  
  console.log('Clicking Super Admin...');
  try {
      await page.evaluate(() => {
          const els = [...document.querySelectorAll('button')];
          const btn = els.find(e => e.textContent && e.textContent.includes('الإدارة الفوقية (Super Admin)'));
          if (btn) btn.click();
      });
      await new Promise(r => setTimeout(r, 1000));
  } catch(e) {}
  
  console.log('Clicking Login...');
  try {
      await page.evaluate(() => {
          const btn = [...document.querySelectorAll('button')].find(e => e.textContent.includes('الولوج للمنظومة'));
          if(btn) btn.click();
      });
      await new Promise(r => setTimeout(r, 3000));
  } catch(e) {}

  console.log('--- DASHBOARD LOADED ---');

  console.log('Clicking Student Affairs...');
  try {
      await page.evaluate(() => {
          const els = [...document.querySelectorAll('button, div')];
          const student = els.find(e => e.textContent && e.textContent.includes('شؤون الطلاب') && !e.children.length);
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
          const els = [...document.querySelectorAll('button, div')];
          const acct = els.find(e => e.textContent && e.textContent.includes('الحسابات العامة') && !e.children.length);
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
