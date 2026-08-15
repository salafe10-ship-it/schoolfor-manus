import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  
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
  
  await page.evaluate(() => {
      const els = [...document.querySelectorAll('button, div')];
      const student = els.find(e => e.textContent && e.textContent.trim() === 'شؤون الطلاب' && !e.children.length);
      if (student) student.click();
  });
  await new Promise(r => setTimeout(r, 3000));

  const tabs = [
    'تسجيل طالب جديد',
    'البحث والاستعلام',
    'الأرشيف والملفات',
    'الأنشطة والسلوك',
    'سجل الإجراءات'
  ];

  for (const tabName of tabs) {
      console.log(`Clicking tab: ${tabName}`);
      await page.evaluate((name) => {
          const els = [...document.querySelectorAll('button')];
          const tab = els.find(e => e.textContent && e.textContent.includes(name));
          if (tab) tab.click();
      }, tabName);
      
      await new Promise(r => setTimeout(r, 1000));
      
      const text = await page.evaluate(() => document.body.innerText);
      if (text.includes('حدث خطأ')) {
          console.log(`ERROR BOUNDARY IN TAB: ${tabName}`);
      } else {
          console.log(`Tab OK: ${tabName}`);
      }
  }

  await browser.close();
})();
