import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  
  // Click Super Admin
  await page.evaluate(() => {
      const els = [...document.querySelectorAll('button')];
      const btn = els.find(e => e.textContent && e.textContent.includes('الإدارة الفوقية'));
      if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  
  // Click Login
  await page.evaluate(() => {
      const els = [...document.querySelectorAll('button')];
      const btn = els.find(e => e.textContent && e.textContent.includes('الولوج للمنظومة'));
      if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  
  const text = await page.evaluate(() => document.body.innerText);
  console.log(text.substring(0, 1000));
  
  await browser.close();
})();
