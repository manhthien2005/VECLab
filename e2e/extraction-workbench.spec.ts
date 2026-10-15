import { expect, test, type Page } from '@playwright/test'
test.use({screenshot:'off',trace:'off'})
async function pane(page:Page,name:string){await expect(page.getByRole('region',{name:'Bàn chiết tách axit–bazơ',exact:true})).toBeVisible();const nav=page.getByRole('navigation',{name:'Khu vực workbench'});if(await nav.isVisible())await nav.getByRole('button',{name,exact:true}).click()}
async function select(page:Page,id:string){await pane(page,'Thao tác');await page.getByLabel('Bình đang thao tác',{exact:true}).selectOption(id)}
async function volume(page:Page,amount:number){await page.getByLabel('Thể tích thao tác (mL)',{exact:true}).fill(String(amount))}
async function transfer(page:Page,from:string,to:string,phase:string,amount:number){await select(page,from);await page.getByLabel('Bình nhận',{exact:true}).selectOption(to);await page.getByLabel('Phần dịch cần chuyển',{exact:true}).selectOption(phase);await volume(page,amount);await page.getByRole('button',{name:`Chuyển ${amount} mL → ${to}`,exact:true}).click()}
async function add(page:Page,id:string,reagent:string,amount:number){await select(page,id);await page.getByLabel('Dung dịch',{exact:true}).selectOption(reagent);await volume(page,amount);await page.getByRole('button',{name:`Thêm ${amount} mL vào ${id}`,exact:true}).click()}
test('extraction full workflow, resume and report use the same persisted values',async({page})=>{
 test.setTimeout(90000)
 await page.goto('/experiments/acid-base-extraction/guide')
 await expect(page.getByRole('heading',{name:'Chiết tách axit–bazơ: lý thuyết & cách làm',exact:true})).toBeVisible()
 await page.getByRole('link',{name:'Bắt đầu thực hành',exact:true}).click()
 await page.getByRole('button',{name:'Bắt đầu chiết tách',exact:true}).click()
 await expect(page).toHaveURL(/attempt=[0-9a-f-]{36}/)
 const url=page.url()
 await transfer(page,'S','F','all',40)
 async function extract(reagent:string,amount:number){await add(page,'F',reagent,amount);for(const name of ['Trộn','Xả áp','Để phân lớp'])await page.getByRole('button',{name,exact:true}).click();await transfer(page,'F','S','aqueous',amount)}
 async function recover(reagent:string,to:string,component:string){await add(page,'S',reagent,30);await page.getByLabel('Bình nhận',{exact:true}).selectOption(to);await page.getByRole('button',{name:'Lọc chất rắn → '+to,exact:true}).click();await select(page,to);await page.getByRole('button',{name:'Làm khô',exact:true}).click();await page.getByRole('button',{name:'Cân mẫu',exact:true}).click();await pane(page,'Sổ đo');await expect(page.getByRole('table',{name:'Các phép đo đã thực hiện'}).getByRole('row').last().locator('td').nth(1)).toHaveText(to);const row=page.getByRole('table',{name:'Các phép đo đã thực hiện'}).getByRole('row').last();const mass=Number((await row.locator('td').last().innerText()).replace(' mg','').replace(',','.'));await pane(page,'Thao tác');await page.getByLabel('Sản phẩm cần khai báo',{exact:true}).selectOption(component);await page.getByLabel('Bình sản phẩm',{exact:true}).selectOption(to);await page.getByLabel('Thu hồi biểu kiến tự tính (%)',{exact:true}).fill(String(mass));await page.getByRole('button',{name:'Lưu sản phẩm '+component,exact:true}).click();await transfer(page,'S','W','all',component==='A'?49.5:59.5)}
 await extract('base',20);await recover('acid','R1','A')
 await page.reload();await select(page,'F');await expect(page.getByRole('button',{name:'Nộp bài',exact:true})).toBeVisible()
 await extract('acid',30);await recover('base','R2','B')
 await transfer(page,'F','R3','organic',40);await select(page,'R3');for(const name of ['Cô dung môi','Làm khô','Cân mẫu'])await page.getByRole('button',{name,exact:true}).click()
 await pane(page,'Sổ đo');await expect(page.getByRole('table',{name:'Các phép đo đã thực hiện'}).getByRole('row').last().locator('td').nth(1)).toHaveText('R3');const finalRow=page.getByRole('table',{name:'Các phép đo đã thực hiện'}).getByRole('row').last();const finalMass=Number((await finalRow.locator('td').last().innerText()).replace(' mg','').replace(',','.'))
 await pane(page,'Thao tác');await page.getByLabel('Sản phẩm cần khai báo',{exact:true}).selectOption('N');await page.getByLabel('Bình sản phẩm',{exact:true}).selectOption('R3');await page.getByLabel('Thu hồi biểu kiến tự tính (%)',{exact:true}).fill(String(finalMass));await page.getByRole('button',{name:'Lưu sản phẩm N',exact:true}).click()
 await page.getByRole('button',{name:'Nộp bài',exact:true}).click();const confirm=page.getByRole('dialog',{name:'Xác nhận nộp bài chiết tách',exact:true});await expect(confirm).toContainText('3/3');await confirm.getByRole('button',{name:'Xác nhận nộp bài',exact:true}).click()
 const report=page.getByRole('dialog',{name:'Báo cáo chiết tách axit–bazơ',exact:true});await expect(report.getByRole('heading',{name:'Đã đạt mục tiêu mẫu chuẩn',exact:true})).toBeVisible();const snapshot=await report.getByRole('table',{name:'Sản phẩm đã khai báo',exact:true}).textContent()
 await page.goto(url);await page.getByRole('button',{name:'Báo cáo',exact:true}).click();await expect(report.getByRole('table',{name:'Sản phẩm đã khai báo',exact:true})).toHaveText(snapshot!)
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true)
})

test('extraction tour uses its own apparatus language and preserves the attempt',async({page})=>{
 await page.goto('/simulate/acid-base-extraction')
 await page.getByRole('button',{name:'Bắt đầu chiết tách',exact:true}).click()
 await pane(page,'Dụng cụ')
 await page.getByRole('button',{name:'Hướng dẫn workbench',exact:true}).click()
 const tour=page.getByRole('dialog',{name:'Làm quen với workbench',exact:true})
 await expect(tour).toBeVisible()
 for(let i=0;i<2;i++)await tour.getByRole('button',{name:'Tiếp theo',exact:true}).click()
 await expect(tour).toContainText('Phễu chiết & các bình mẫu')
 await expect(tour).not.toContainText('độ đục')
 await tour.getByRole('button',{name:'Tôi đã rõ',exact:true}).click()
 await pane(page,'Sổ đo')
 await expect(page.getByText('Bản lưu 0',{exact:true})).toBeVisible()
})
