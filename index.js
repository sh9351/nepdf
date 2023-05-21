const fs = require('fs')
const { join } = require('path')
const axios = require('axios')
const PDFDocument = require('pdfkit')
const { app, Menu, BrowserWindow, ipcMain, shell, dialog } = require('electron')
Menu.setApplicationMenu(null)

axios.interceptors.response.use(null, e =>
    axios(e.config))

app.whenReady().then(() => {
    const win = new BrowserWindow({
        webPreferences: {
            preload: join(__dirname, 'src', 'preload.js')
        }
    })
    win.loadFile('src/index.html')

    ipcMain.on('AuthorPortfolio', () => shell.openExternal('https://sh9351.me'))
    ipcMain.handle('ConvertPDF', (e, EbookURL) => {
        const bookCode = new URL(EbookURL).searchParams.get('bookCode')
        axios(`https://ebook.nebooks.co.kr/nw${bookCode}project.json`).then(async ({ data }) => {
            const path = dialog.showSaveDialogSync({
                defaultPath: `${process.env.USERPROFILE}\\Desktop\\${data.title}.pdf`
            })
            if (!path) return
            const doc = new PDFDocument({ size: [2383.94, 3370.39] })
            const stream = doc.pipe(fs.createWriteStream(path))

            doc.font(join(__dirname, 'src', 'Pretendard.otf')).fontSize(100)
                .text('해당 PDF는 NEPDF로 제작되었어요.', {
                    top: 100,
                    left: 100
                })
                .text('NEPDF의 개발자 임세훈의 포트폴리오를 확인해 보세요.', {
                    top: 200,
                    left: 100,
                    link: 'https://sh9351.me'
                })
                .text('혹은 KTV로 어디서나 실시간 TV를 시청해 보세요.', {
                    top: 200,
                    left: 100,
                    link: 'https://ktv.sh9351.me'
                })
                .text('이 프로그램이 유용하셨다면, 숙제 한번만 빼주세요.', {
                    top: 300,
                    left: 100
                })

            let i = 0
            for (const { background } of data.pages) {
                await axios(background.url.replace('{ASSETS_DIR}', `https://ebook.nebooks.co.kr/nw${bookCode}assets/`), {
                    responseType: 'arraybuffer'
                }).then(({ data: Page }) => {
                    i++
                    doc.addPage({ size: [2383.94, 3370.39] }).image(Page, 0, 0, { width: 2383.94, height: 3370.39 })
                    win.webContents.send('Progress', `${i}/${data.pages.length}`)
                })
            }
            doc.save()
            doc.end()
            stream.on('finish', () => {
                win.webContents.send('Complete', `${i}/${data.pages.length}`)
                shell.openPath(path)
            })
        })
    })
})