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
  
  console.log('Clicking "بوابة دخول المدارس"...');
  try {
      await page.evaluate(() => {
          const els = [...document.querySelectorAll('h3')];
          const btn = els.find(e => e.textContent && e.textContent.includes('بوابة دخول المدارس'));
          if (btn && btn.parentElement) btn.parentElement.click();
      });
      await new Promise(r => setTimeout(r, 2000));
  } catch(e) {}
  
  console.log('Entering login details if any...');
  try {
      await page.evaluate(() => {
          const btn = [...document.querySelectorAll('button')].find(e => e.textContent.includes('تسجيل الدخول الآمن'));
          if(btn) btn.click();
      });
      await new Promise(r => setTimeout(r, 2000));
  } catch(e) {}

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
  
  await browser.close();
})();
