const fs = require('fs')
const { resolve } = require('path')
const srcPath = resolve(__dirname, '../../src')
const libTypes = require('../../config').libs.map(lib => lib.name)

/**
 * @description: 替换模版文件中的变量
 * @param {*} str: 文件内容
 * @param {*} data: 变量对象
 * @return {*}
 */
function transfTemplate(str = '', data = {}) {
  let resultStr = str
  for (const key in data) {
    if (Object.hasOwnProperty.call(data, key)) {
      resultStr = resultStr.replace(new RegExp(`{{${key}}}`, 'g'), data[key])
    }
  }
  return resultStr
}

/**
 * @description: 转大驼峰
 * @param {*} str
 * @return {*} string
 */
function toCamelCase(str = '') {
  let rest = str.substr(1).replace(/-(\w)/g, ($, $1) => $1.toUpperCase())

  return `${str.substr(0, 1).toUpperCase()}${rest}`
}

/**
 * @description: 替换模版文件
 * @param {*} filePaths: 替换的文件路径
 * @param {*} data: 组件 name/type/group
 * @param {*} callback
 * @return {*}
 */
function replaceTemplateFiles(filePaths, data, callback) {
  if (typeof filePaths === 'string') {
    filePaths = [filePaths]
  }
  for (const filePath of filePaths) {
    let fileStr = fs.readFileSync(filePath, 'utf-8')
    // 获取模版文件原始内容

    fileStr = transfTemplate(fileStr, data)
    // 替换模版文件的中的变量

    callback && callback(filePath, fileStr)
    // 将 文件路径/替换变量后的文件内容 抛出去
  }
}

/**
 * @description: 读取 src 下的全部 blocks 和 components 组件
 * @return {*} [{ name: 'date-picker', type: 'blocks' },]
 */
function getLibs() {
  /* 读取 src 下的全部 blocks 和 components 组件 */

  const libTypeDirs = fs.readdirSync(srcPath)
  // 同步读取制定目录下所有文件名称

  return libTypeDirs
    .filter(type => libTypes.includes(type))
    .reduce((libDirs, type) => {
      const libDir = resolve(srcPath, type)

      // 同步获取相关文件状态信息
      const state = fs.lstatSync(libDir)

      if (state.isDirectory()) {
        // 文件是目录
        const targets = fs.readdirSync(libDir)
        // 同步读取制定目录下所有文件名称

        return libDirs.concat(
          targets.map(lib => ({
            name: lib,
            type,
          })),
        )
      }
      return libDirs
    }, [])
}

module.exports = {
  srcPath,
  getLibs,
  toCamelCase,
  transfTemplate,
  replaceTemplateFiles,
}
