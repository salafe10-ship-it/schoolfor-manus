import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  
  console.log("Wait for page to render...");
  await new Promise(r => setTimeout(r, 3000));
  
  const html = await page.content();
  if (html.includes("الجودة الماسية والشاشات")) {
     console.log("Found button in HTML! Clicking...");
     await page.evaluate(() => {
        const els = Array.from(document.querySelectorAll('*'));
        const el = els.find(e => e.textContent && e.textContent.includes('الجودة الماسية والشاشات'));
        if (el) el.click();
     });
     
     await new Promise(r => setTimeout(r, 2000));
  } else {
     console.log("Button 'الجودة الماسية والشاشات' not found on page.");
     // Try alternative text
  }
  
  console.log("Looking for expected elements after wait...");
  const htmlAfter = await page.content();
  if (htmlAfter.includes("مركز مراقبة أداء النظام وسلامته") || htmlAfter.includes("system_health")) {
     console.log("System Health loaded successfully.");
  } else {
     console.log("System Health did NOT load.");
     const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 500));
     console.log("Body text starts with: ", bodyText);
  }

  await browser.close();
})();
