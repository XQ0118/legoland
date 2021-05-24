const fs = require('fs-extra')
const chalk = require('chalk')
const { resolve } = require('path')
const inquirer = require('inquirer')
const { libs } = require('../config')
const { srcPath, toCamelCase, replaceTemplateFiles } = require('./shared')

const tmpPath = '../templates'
const templatesDirPath = resolve(__dirname, tmpPath)
const templateList = fs.readdirSync(templatesDirPath)
const REPLACE_FILES = ['README.md', './src/index.vue']
inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'))

inquirer
  .prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Input project name',
      default: 'gt-example',
      validate(name) {
        if (!name.trim()) return false

        const libTypeDirs = fs.readdirSync(srcPath)

        for (const type of libTypeDirs) {
          const hasLib = fs.existsSync(resolve(srcPath, type, name))
          // 判断输入的组件 name 是否存在
          if (hasLib) {
            return `"src/${type}/${name}" is already exist`
          }
        }
        return true
      },
    },
    {
      type: 'list',
      name: 'templateType',
      message: 'Select type of project',
      choices: libs.map(item => item.name),
    },
    // {
    //   type: 'autocomplete',
    //   name: 'libGroup',
    //   message: 'Select group of project',
    //   default: 'form',
    //   source: (answersSoFar, input) => {
    //     if (input) {
    //       const res = ['form', 'chart', 'basic'].filter(v => v.includes(input))
    //       return res.length ? res : [input]
    //     } else {
    //       return ['form', 'chart', 'basic']
    //     }
    //   },
    // },
    {
      type: 'list',
      name: 'templateName',
      message: 'Select template of project',
      choices: templateList,
    },
  ])
  .then(res => {
    /*
    res: {
      name: 'gt-example1',
      templateType: 'components',
      templateName: 'vue-js'
    } */
    addTemplate(res)
    // init main.js / install global components
    require('./init')
  })

/**
 * @description: 根据模版添加新组件
 * @param {*} name
 * @param {*} libGroup
 * @param {*} templateName
 * @param {*} templateType
 * @return {*} 创建组件文件夹
 */
function addTemplate({ name, libGroup, templateName, templateType }) {
  const libName = toCamelCase(name)
  // 添加的组件名
  const templatesPath = resolve(templatesDirPath, templateName)
  // 模版路径
  const libPath = resolve(srcPath, templateType, name)
  // 放入的组件路径：放入 src 下的某种文件夹（blocks/components）中

  console.log(chalk.yellow(`Create "${name}" from template ${templateName}...`))

  fs.copySync(templatesPath, libPath)
  // 先 根据模版类型 => 复制模板文件

  const tmpConfigPath = resolve(libPath, 'template.config.js')

  console.log(chalk.yellow('Replacing variable...'))

  let templateFiles = Array.from(REPLACE_FILES)
  // REPLACE_FILES 替换的文件数组
  const hasTmpConfig = fs.existsSync(tmpConfigPath)
  // 是否有模板配置文件
  if (hasTmpConfig) {
    // has
    const env = require(tmpConfigPath) || {}
    if (env.templateFiles) {
      templateFiles = env.templateFiles
    }
    fs.removeSync(tmpConfigPath)
  }

  // 替换模板文件
  replaceTemplateFiles(
    templateFiles.map(p => resolve(libPath, p)),
    // 拼接要替换的文件路径数组
    {
      LIB_NAME: libName,
      LIB_TYPE: templateType,
      LIB_GROUP: libGroup,
    },
    (filePath, fileStr) => fs.writeFileSync(filePath, fileStr, 'utf-8'),
    // 获取到文件路径和替换变量后的文件内容，写文件
  )
}
