const fs = require('fs')
const yaml = require('js-yaml')
const mysql = require('promise-mysql')
const progress = require('cli-progress')

const path = (typeof(process.argv[2])==undefined)?'.':process.argv[2]
const mysqlsettings = yaml.load(fs.readFileSync('mysqlsettings.yaml'))


const bar = new progress.SingleBar({})
var barmax = 1

mysql.createConnection(mysqlsettings).then((mysqlcon)=>{
  console.log(`Connected to ${mysqlsettings.user}@${mysqlsettings.host}. Database: '${mysqlsettings.database}'.`)

  bar.start(1,0)

  traverseFolder(path,mysqlcon).then(()=>{
    bar.stop()
    console.log('Finished processing files!')
    console.log('Waiting for SQL-queries to finish up...')
    mysqlcon.end(()=>console.log('Done!'))
  })
  .catch((e)=>{
    console.log(e)
    throw e
  })
})


async function traverseFolder(path,mysqlcon) {
  let realpath = fs.realpathSync(path)
  let contents = fs.readdirSync(realpath)
  barmax += contents.length
  bar.setTotal(barmax)
  bar.increment()
  for (let f of contents) {
    let frealpath = fs.realpathSync(realpath+'/'+f)
    let stat = fs.statSync(frealpath)
    if (stat.isDirectory()) {
      await traverseFolder(frealpath,mysqlcon)
    } else {
      await upsertFileToDB(frealpath,stat,mysqlcon)
      bar.increment()
    }
  }
}

async function upsertFileToDB(path,stat,mysqlcon) {
  let prepvals = [path, stat.size, stat.atime, stat.mtime, stat.ctime]
  prepvals.push(...prepvals.slice(1)) // just adds the last 4 vals back to the arr to match the sql statement below

  let sql = `
    INSERT INTO file
      (path, size, atime, mtime, ctime)
    VALUES
      (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      size = ?,
      atime = ?,
      mtime = ?,
      ctime = ?;
    `

  return mysqlcon.query(sql,prepvals)
}