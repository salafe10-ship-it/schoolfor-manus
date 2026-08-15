import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('Clicking School Manager...');
  await page.evaluate(() => {
      const els = [...document.querySelectorAll('button')];
      const btn = els.find(e => e.textContent && e.textContent.includes('مدرسة النور الأهلية - مدير'));
      if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  
  // Click the submit button inside the form
  await page.evaluate(() => {
      const form = document.querySelector('form');
      if (form) {
          const btn = form.querySelector('button[type="submit"]');
          if (btn) btn.click();
      }
  });
  await new Promise(r => setTimeout(r, 3000));
  
  console.log('Clicking Student Affairs...');
  let studentErr = false;
  try {
      await page.evaluate(() => {
          const els = [...document.querySelectorAll('button, div')];
          const student = els.find(e => e.textContent && e.textContent.trim() === 'شؤون الطلاب' && !e.children.length);
          if (student) student.click();
      });
      await new Promise(r => setTimeout(r, 2000));
      const text = await page.evaluate(() => document.body.innerText);
      if (text.includes('حدث خطأ')) {
          studentErr = true;
          console.log('STUDENT AFFAIRS ERROR BOUNDARY FOUND!');
      }
  } catch (e) {}

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('Clicking School Manager again...');
  await page.evaluate(() => {
      const els = [...document.querySelectorAll('button')];
      const btn = els.find(e => e.textContent && e.textContent.includes('مدرسة النور الأهلية - مدير'));
      if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.evaluate(() => {
      const form = document.querySelector('form');
      if (form) {
          const btn = form.querySelector('button[type="submit"]');
          if (btn) btn.click();
      }
  });
  await new Promise(r => setTimeout(r, 3000));

  console.log('Clicking Accounting...');
  try {
      await page.evaluate(() => {
          const els = [...document.querySelectorAll('button, div')];
          const acct = els.find(e => e.textContent && e.textContent.trim() === 'الحسابات العامة' && !e.children.length);
          if (acct) acct.click();
      });
      await new Promise(r => setTimeout(r, 2000));
      const text = await page.evaluate(() => document.body.innerText);
      if (text.includes('حدث خطأ')) {
          console.log('ACCOUNTING ERROR BOUNDARY FOUND!');
      } else {
          console.log('ACCOUNTING OK');
      }
  } catch (e) {}

  if (!studentErr) console.log('STUDENT AFFAIRS OK');

  await browser.close();
})();
