import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  
  await page.evaluate(() => {
      const els = [...document.querySelectorAll('button')];
      const btn = els.find(e => e.textContent && e.textContent.includes('الإدارة الفوقية'));
      if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  
  // Fill password field if needed? It's pre-filled usually or any password works.
  // Click the submit button inside the form
  await page.evaluate(() => {
      const form = document.querySelector('form');
      if (form) {
          const btn = form.querySelector('button[type="submit"]');
          if (btn) btn.click();
      }
  });
  await new Promise(r => setTimeout(r, 3000));
  
  const text = await page.evaluate(() => document.body.innerText);
  console.log('--- DASHBOARD? ---');
  console.log(text.substring(0, 1000));

  await browser.close();
})();
