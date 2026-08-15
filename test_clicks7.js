import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER CONSOLE ERROR:', msg.text());
    }
  });
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  
  await page.evaluate(() => {
      const els = [...document.querySelectorAll('button')];
      const btn = els.find(e => e.textContent && e.textContent.includes('الإدارة الفوقية'));
      if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  
  await page.evaluate(() => {
      const els = [...document.querySelectorAll('button')];
      const btn = els.find(e => e.textContent && e.textContent.includes('الولوج للمنظومة'));
      if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 3000));

  // Try clicking Student Affairs
  await page.evaluate(() => {
      const els = [...document.querySelectorAll('*')];
      const student = els.find(e => e.textContent && e.textContent.trim() === 'شؤون الطلاب' && e.tagName !== 'SCRIPT');
      if (student) student.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('--- HTML AFTER CLICKING STUDENT AFFAIRS ---');
  let html = await page.evaluate(() => document.body.innerHTML);
  if(html.includes('حدث خطأ')) {
      console.log('FOUND ERROR BOUNDARY!');
      const errorText = await page.evaluate(() => {
          return document.querySelector('.bg-red-50, .text-red-600')?.innerText || 'Unknown Error';
      });
      console.log('Error Text:', errorText);
  } else if (!html.includes('شؤون الطلاب')) {
      console.log('NOT ON DASHBOARD YET!');
  } else {
      console.log('NO ERROR FOUND IN DOM.');
  }

  // Try clicking Accounting
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  
  await page.evaluate(() => {
      const els = [...document.querySelectorAll('button')];
      const btn = els.find(e => e.textContent && e.textContent.includes('الإدارة الفوقية'));
      if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  
  await page.evaluate(() => {
      const els = [...document.querySelectorAll('button')];
      const btn = els.find(e => e.textContent && e.textContent.includes('الولوج للمنظومة'));
      if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 3000));

  await page.evaluate(() => {
      const els = [...document.querySelectorAll('*')];
      const acct = els.find(e => e.textContent && e.textContent.trim() === 'الحسابات العامة' && e.tagName !== 'SCRIPT');
      if (acct) acct.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  html = await page.evaluate(() => document.body.innerHTML);
  if(html.includes('حدث خطأ')) {
      console.log('FOUND ERROR BOUNDARY IN ACCOUNTING!');
      const errorText = await page.evaluate(() => {
          return document.querySelector('.bg-red-50, .text-red-600')?.innerText || 'Unknown Error';
      });
      console.log('Error Text:', errorText);
  } else {
      console.log('NO ERROR FOUND IN ACCOUNTING DOM.');
  }

  await browser.close();
})();
