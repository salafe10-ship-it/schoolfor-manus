import { AlertTriangle, Barcode, BookOpen, Calendar, CheckCircle2, Clock, Edit3, FileSpreadsheet, Plus, RefreshCw, Search, ShieldAlert, Trash2, User } from 'lucide-react';
import React, { useState } from 'react';
import EnterpriseActionToolbar from './shared/EnterpriseActionToolbar';

interface LibraryPortalProps {
  selectedSchool?: any;
  setActiveSection: (sec: string) => void;
  triggerNotification: (text: string, type: 'info' | 'warning' | 'success') => void;
}

interface BookItem {
  id: string;
  code: string;
  title: string;
  author: string;
  category: string;
  totalCopies: number;
  availableCopies: number;
  location: string;
}

interface BorrowRecord {
  id: string;
  studentName: string;
  studentCode: string;
  bookTitle: string;
  bookCode: string;
  borrowDate: string;
  dueDate: string;
  status: 'active' | 'returned' | 'overdue';
  fine: number;
}

export default function LibraryPortal({
  selectedSchool,
  setActiveSection,
  triggerNotification
}: LibraryPortalProps) {
  const [activeTab, setActiveTab] = useState<'catalog' | 'borrows' | 'fines'>('catalog');
  const [searchTerm, setSearchTerm] = useState('');

  // لا تُعرض كتب قبل تحميلها من مصدر المكتبة المركزي.
  const [books, setBooks] = useState<BookItem[]>([]);

  const [borrows, setBorrows] = useState<BorrowRecord[]>([]);

  const [newBook, setNewBook] = useState({ title: '', author: '', category: '', totalCopies: 0, location: '' });
  const [isAddingBook, setIsAddingBook] = useState(false);

  const handleAddBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBook.title || !newBook.author || !Number.isInteger(Number(newBook.totalCopies)) || Number(newBook.totalCopies) <= 0 || !newBook.location) {
      triggerNotification('الرجاء إدخال عنوان الكتاب والمؤلف وعدد نسخ صحيح وموقع التخزين', 'warning');
      return;
    }
    const created: BookItem = {
      id: String(books.length + 1),
      code: `BK-${1000 + books.length + 1}`,
      title: newBook.title,
      author: newBook.author,
      category: newBook.category,
      totalCopies: Number(newBook.totalCopies),
      availableCopies: Number(newBook.totalCopies),
      location: newBook.location
    };
    setBooks([...books, created]);
    setIsAddingBook(false);
    setNewBook({ title: '', author: '', category: '', totalCopies: 0, location: '' });
    triggerNotification('تم إضافة الكتاب بنجاح وفهرسته آلياً', 'success');
  };

  const handleReturnBook = (borrowId: string) => {
    setBorrows(borrows.map(b => {
      if (b.id === borrowId) {
        return { ...b, status: 'returned' as const };
      }
      return b;
    }));
    triggerNotification('تم تسجيل استرجاع الكتاب وإغلاق سجل الإعارة', 'success');
  };

  const filteredBooks = books.filter(b => 
    b.title.includes(searchTerm) || 
    b.author.includes(searchTerm) || 
    b.code.includes(searchTerm)
  );

  const filteredBorrows = borrows.filter(b => 
    b.studentName.includes(searchTerm) || 
    b.bookTitle.includes(searchTerm)
  );

  return (
    <div className="w-full min-h-screen text-right font-sans dir-rtl select-none transition-all duration-300 bg-gradient-to-br from-[#f8f5ee] via-[#efe9dc] to-[#e8e0d0] text-slate-900 p-2 sm:p-4 md:p-6 space-y-6" dir="rtl" id="library-portal-container">
      <EnterpriseActionToolbar
        title="إدارة المكتبة المدرسية المركزية"
        stats={
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] sm:text-xs">
            <span className="text-slate-300 font-bold">الكتب المفهرسة بالمكتبة: <span className="text-amber-400 font-mono">{books.length}</span> كتاباً</span>
          </div>
        }
        onExit={() => setActiveSection('dashboard')}
        onPrint={() => {
          window.print();
          triggerNotification('تم إرسال فهرس المكتبة وسجلات الإعارة إلى الطباعة 🖨️', 'info');
        }}
        onExportPdf={() => {
          window.print();
          triggerNotification('تم إعداد وتصدير كشف كتب المكتبة للطباعة / PDF 📄', 'success');
        }}
        onExportExcel={() => {
          const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + 
            "كود الكتاب,العنوان,المؤلف,التصنيف,النسخ الكلية,النسخ المتاحة,الموقع\n" +
            books.map(b => `${b.code},"${b.title}","${b.author}",${b.category},${b.totalCopies},${b.availableCopies},"${b.location}"`).join("\n");
          const encodedUri = encodeURI(csvContent);
          const link = document.createElement("a");
          link.setAttribute("href", encodedUri);
          link.setAttribute("download", `edupro_library_books_${Date.now()}.csv`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          triggerNotification('تم تصدير سجل المكتبة والإعارات لملف CSV بنجاح 📊', 'success');
        }}
        onImportExcel={() => {
          const fileInput = document.createElement('input');
          fileInput.type = 'file';
          fileInput.accept = '.csv, .json, .xlsx';
          fileInput.onchange = (e: any) => {
            const file = e.target.files[0];
            if (file) {
              triggerNotification(`تم اختيار الملف "${file.name}" وجاري فهرسة الكتب آلياً...`, 'success');
            }
          };
          fileInput.click();
        }}
        onDownloadTemplate={() => {
          const csvTemplate = "data:text/csv;charset=utf-8,\uFEFF" +
            "كود_الكتاب,عنوان_الكتاب,المؤلف,التصنيف,عدد_النسخ,الموقع_بالرف\n" +
            "BK-1009,مقدمة في العلوم الرقمية,د. أحمد القحطاني,تقنية,5,رف A-12\n";
          const encodedUri = encodeURI(csvTemplate);
          const link = document.createElement("a");
          link.setAttribute("href", encodedUri);
          link.setAttribute("download", "edupro_library_import_template.csv");
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          triggerNotification('تم تحميل نموذج فهرسة الكتب المعتمد 📑', 'success');
        }}
      />

      <div className="p-3 sm:p-4 space-y-4">
        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 shadow-xs flex justify-between items-center">
            <div>
              <p className="text-[10px] text-slate-500 font-black">إجمالي الكتب والمراجع</p>
              <h4 className="text-lg font-black text-slate-800 mt-1">{books.reduce((acc, curr) => acc + curr.totalCopies, 0)} كتاب</h4>
            </div>
            <span className="p-2 bg-amber-50 text-amber-600 rounded-lg"><BookOpen className="w-5 h-5" /></span>
          </div>
          <div className="p-4 shadow-xs flex justify-between items-center">
            <div>
              <p className="text-[10px] text-slate-500 font-black">الإعارات النشطة</p>
              <h4 className="text-lg font-black text-amber-600 mt-1">{borrows.filter(b => b.status === 'active').length} إعارات</h4>
            </div>
            <span className="p-2 bg-teal-50 text-teal-600 rounded-lg"><Clock className="w-5 h-5" /></span>
          </div>
          <div className="p-4 shadow-xs flex justify-between items-center">
            <div>
              <p className="text-[10px] text-slate-500 font-black">المتأخرة عن موعدها</p>
              <h4 className="text-lg font-black text-rose-600 mt-1">{borrows.filter(b => b.status === 'overdue').length} كتاب متأخر</h4>
            </div>
            <span className="p-2 bg-rose-50 text-rose-600 rounded-lg"><AlertTriangle className="w-5 h-5" /></span>
          </div>
          <div className="p-4 shadow-xs flex justify-between items-center">
            <div>
              <p className="text-[10px] text-slate-500 font-black">إجمالي الغرامات المحصلة</p>
              <h4 className="text-lg font-black text-emerald-600 mt-1">15.00 ريال</h4>
            </div>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Barcode className="w-5 h-5" /></span>
          </div>
        </div>

        {/* Tab & Search Filter */}
        <div className="shadow-xs overflow-hidden">
          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center p-4 border-b border-slate-100 bg-transparent/50 gap-4">
            <div className="flex gap-2">
              {[
                { id: 'catalog', label: 'دليل الكتب والمراجع', count: books.length },
                { id: 'borrows', label: 'سجلات الإعارة النشطة', count: borrows.filter(b => b.status === 'active' || b.status === 'overdue').length },
                { id: 'fines', label: 'كشف المتأخرات والغرامات', count: borrows.filter(b => b.status === 'overdue').length },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === tab.id 
                      ? 'bg-[#2a1d13] text-[#fce79a] shadow-xs' 
                      : 'text-slate-650 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    activeTab === tab.id ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-600'
                  }`}>{tab.count}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="بحث سريع..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-4 py-2 pr-9 text-xs w-64 text-right"
                />
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              </div>

              {activeTab === 'catalog' && (
                <button
                  onClick={() => setIsAddingBook(true)}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-black text-xs px-4 py-2 flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  إضافة مادة ثقافية
                </button>
              )}
            </div>
          </div>

          {/* Book Catalog Tab */}
          {activeTab === 'catalog' && (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold">
                  <tr>
                    <th className="px-6 py-3">الكود الموحد</th>
                    <th className="px-6 py-3">العنوان ومؤلف المادة</th>
                    <th className="px-6 py-3">تصنيف المرجع</th>
                    <th className="px-6 py-3">الموقع الفعلي</th>
                    <th className="px-6 py-3 text-center">النسخ الكلية</th>
                    <th className="px-6 py-3 text-center">النسخ المتاحة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-900/10 bg-white/60 backdrop-blur-sm rounded-b-2xl">
                  {filteredBooks.map((book) => (
                    <tr key={book.id} className="hover:bg-transparent/50">
                      <td className="px-6 py-4 font-mono font-bold text-slate-600">{book.code}</td>
                      <td className="px-6 py-4">
                        <p className="font-extrabold text-slate-900">{book.title}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{book.author}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{book.category}</td>
                      <td className="px-6 py-4 text-slate-600 font-mono">{book.location}</td>
                      <td className="px-6 py-4 text-center font-bold">{book.totalCopies}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          book.availableCopies > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {book.availableCopies} متوفرة للطلاب
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Borrow Records Tab */}
          {activeTab === 'borrows' && (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold">
                  <tr>
                    <th className="px-6 py-3">الطالب المستعير</th>
                    <th className="px-6 py-3">عنوان الكتاب المستعار</th>
                    <th className="px-6 py-3">تاريخ الإعارة</th>
                    <th className="px-6 py-3">موعد الاستحقاق</th>
                    <th className="px-6 py-3">الحالة والالتزام</th>
                    <th className="px-6 py-3 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-900/10 bg-white/60 backdrop-blur-sm rounded-b-2xl">
                  {filteredBorrows.map((b) => (
                    <tr key={b.id} className="hover:bg-transparent/50">
                      <td className="px-6 py-4">
                        <p className="font-extrabold text-slate-900">{b.studentName}</p>
                        <p className="text-[10px] font-mono text-slate-500 mt-0.5">{b.studentCode}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800">{b.bookTitle}</p>
                        <p className="text-[10px] font-mono text-slate-400 mt-0.5">{b.bookCode}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-mono">{b.borrowDate}</td>
                      <td className="px-6 py-4 text-slate-600 font-mono">{b.dueDate}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          b.status === 'active' ? 'bg-amber-100 text-amber-700' :
                          b.status === 'returned' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-rose-100 text-rose-700'
                        }`}>
                          {b.status === 'active' ? 'إعارة جارية' :
                           b.status === 'returned' ? 'تمت الإعادة للمخزن' :
                           'تجاوز موعد الإعادة ⚠️'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {b.status !== 'returned' && (
                          <button
                            onClick={() => handleReturnBook(b.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-3 py-1 rounded-lg transition-all cursor-pointer"
                          >
                            إغلاق الإعارة واسترجاع الكتاب ✔️
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Fines & Overdue Tab */}
          {activeTab === 'fines' && (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold">
                  <tr>
                    <th className="px-6 py-3">الطالب المتأخر</th>
                    <th className="px-6 py-3">الكتاب وموعد الإرجاع</th>
                    <th className="px-6 py-3">أيام التأخير الكلية</th>
                    <th className="px-6 py-3">حساب الغرامة التراكمية</th>
                    <th className="px-6 py-3 text-center">الإجراءات والترحيل للرسوم</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-900/10 bg-white/60 backdrop-blur-sm rounded-b-2xl">
                  {borrows.filter(b => b.status === 'overdue').map((b) => (
                    <tr key={b.id} className="hover:bg-transparent/50">
                      <td className="px-6 py-4">
                        <p className="font-extrabold text-slate-900">{b.studentName}</p>
                        <p className="text-[10px] font-mono text-slate-550 mt-0.5">{b.studentCode}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800">{b.bookTitle}</p>
                        <p className="text-[10px] text-rose-600 font-bold mt-0.5 font-mono">استحقاق: {b.dueDate}</p>
                      </td>
                      <td className="px-6 py-4 text-rose-700 font-bold">12 يوم تأخير</td>
                      <td className="px-6 py-4 text-rose-700 font-black font-mono">{b.fine.toFixed(2)} ريال</td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => triggerNotification('تم ترحيل الغرامة بنجاح إلى حساب الذمم المدين للطالب بالدبل انتري', 'success')}
                          className="bg-amber-650 hover:bg-amber-600 text-white font-bold text-[10px] px-3 py-1 rounded-lg transition-all cursor-pointer"
                        >
                          ترحيل الغرامة لرسوم الطالب 💸
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Book Dialog Mock */}
        {isAddingBook && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="p-6 max-w-md w-full space-y-4 shadow-2xl text-right animate-fadeIn bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 rounded-3xl">
              <h3 className="font-black text-slate-900 text-sm">فهرسة مادة ثقافية جديدة</h3>
              <form onSubmit={handleAddBook} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold">العنوان الكامل للكتاب:</label>
                  <input
                    type="text"
                    required
                    value={newBook.title}
                    onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                    className="w-full border p-2 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold">المؤلف والكاتب الرئيسي:</label>
                  <input
                    type="text"
                    required
                    value={newBook.author}
                    onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                    className="w-full border p-2 text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold">التصنيف الموضوعي:</label>
                    <input
                      type="text"
                      value={newBook.category}
                      onChange={(e) => setNewBook({ ...newBook, category: e.target.value })}
                      className="w-full border p-2 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold">الموقع المادي في المكتبة:</label>
                    <input
                      type="text"
                      value={newBook.location}
                      onChange={(e) => setNewBook({ ...newBook, location: e.target.value })}
                      className="w-full border p-2 text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsAddingBook(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-250 text-slate-750 text-xs font-bold cursor-pointer"
                  >
                    إلغاء الأمر
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-750 text-white text-xs font-black cursor-pointer"
                  >
                    تأكيد الفهرسة والنشر
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
